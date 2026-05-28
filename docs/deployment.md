# Deployment

This doc covers the current AWS dev deployment path.

## Current Status

The costly AWS app stack is currently destroyed. Local Docker Postgres is the active development database. Cognito is deployed by itself for local auth testing.

## Deploy Cognito Only

This creates the Cognito user pool, Hosted UI domain, and frontend app client without VPC, RDS, ECR, ECS, or load balancer resources.

```sh
make aws-login
make aws-whoami
make dev-init
make dev-auth-plan
make dev-auth-apply
```

Use this helper to write Terraform Cognito outputs into local backend/frontend auth env vars:

```sh
make dev-auth-env
```

The helper updates `apps/backend/.env` and `apps/frontend/.env.local`.

To keep Cognito but remove the app stack later, apply the same auth-only mode again:

```sh
make dev-auth-apply
```

To deploy to AWS dev again:

1. Authenticate to AWS.
2. Recreate Terraform dev resources with the default app stack enabled.
3. Build and push the backend image to ECR.
4. Run AWS database migrations through the one-off ECS migration task.
5. Optionally enable scheduled jobs.
6. Optionally enable the public backend service.

## Authenticate

```sh
make aws-login
make aws-whoami
```

## Recreate AWS Dev

Initialize Terraform if needed:

```sh
make dev-init
```

Preview changes:

```sh
make dev-plan
```

Apply:

```sh
terraform -chdir=infra/envs/dev apply
```

Terraform creates Cognito auth resources in both full and auth-only modes:

- User pool
- Hosted UI domain
- Public frontend app client using authorization code flow with PKCE
- `admin` user group for backend admin access

Useful outputs:

```sh
terraform -chdir=infra/envs/dev output cognito_issuer
terraform -chdir=infra/envs/dev output cognito_frontend_client_id
terraform -chdir=infra/envs/dev output cognito_hosted_ui_domain
```

## Build And Push Backend Image

Build the local backend image:

```sh
make backend-docker-build
```

Log in to ECR:

```sh
make backend-ecr-login
```

Push the image:

```sh
make backend-ecr-push
```

Terraform creates this ECR repository when AWS dev exists:

```text
173748329850.dkr.ecr.us-east-2.amazonaws.com/tele-dev-backend
```

## Run AWS Migrations

AWS RDS is private, so migrations should run from inside AWS.

Run the one-off migration task:

```sh
make backend-migrate-aws
```

This starts a short-lived Fargate task in the dev VPC, waits for it to stop, and exits non-zero if the migration container fails.

The migration task runs:

```sh
npm run db:deploy
```

The deploy script is `apps/backend/scripts/prisma-deploy.mjs`. It builds a concrete `DATABASE_URL` from the AWS-injected `DB_SECRET_JSON`, `DB_HOST`, `DB_PORT`, and `DB_NAME`.

## Enable Scheduled Jobs

Scheduled jobs run as short-lived ECS Fargate tasks. They are separate from the public backend service, but they still require the AWS dev app/data layer because the tasks connect to private RDS.

Preview the jobs layer:

```sh
make dev-jobs-plan
```

Apply it:

```sh
make dev-jobs-apply
```

This keeps `backend_service_enabled=false` and enables:

- ECS task definition for unpaid-order expiry
- EventBridge Scheduler schedule
- IAM role allowing Scheduler to run the ECS task

The schedule runs:

```sh
npm run orders:expire
```

Run the AWS job manually:

```sh
make orders-expire-aws
```

Useful outputs:

```sh
terraform -chdir=infra/envs/dev output orders_expiry_task_definition_arn
terraform -chdir=infra/envs/dev output orders_expiry_schedule_name
```

The default schedule is `rate(15 minutes)`. To disable the remote schedule while keeping the resources, set:

```hcl
orders_expiry_enabled = false
```

If the AWS dev database contains unpaid Stripe Checkout orders, configure `stripe_api_key_secret_arn` with a Secrets Manager secret ARN containing the Stripe secret key. The job needs that key to expire open Stripe Checkout Sessions before canceling local orders.

## Stripe

Backend Stripe integration needs:

```text
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
```

Frontend Stripe Elements needs:

```text
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Use test keys for local/dev testing and live keys only for production. The backend API key should start with `sk_`, the webhook secret should start with `whsec_`, and the frontend publishable key should start with `pk_`.

Stripe checkout uses Checkout Sessions with Checkout Elements. Configure deployed webhook endpoints to send:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.dispute.created`
- `charge.dispute.updated`
- `charge.dispute.closed`

PaymentIntent events can stay enabled for backwards compatibility with older local payment rows, but new checkout payments are reconciled from Checkout Session events. See [Payments](payments.md) for the full payment, webhook, sync, dispute, and refund behavior.

For local webhook testing, use the Stripe CLI to forward events to:

```text
http://127.0.0.1:3000/webhooks/stripe
```

Use the webhook signing secret printed by the CLI as `STRIPE_WEBHOOK_SECRET`.

## Email

Delivered-shipment emails use notification records plus Amazon SES.

Local/default behavior records notification events without sending:

```text
EMAIL_PROVIDER=none
```

To send through SES:

```text
EMAIL_PROVIDER=ses
EMAIL_FROM=no-reply@example.com
AWS_REGION=us-east-2
APP_BASE_URL=http://localhost:3001
```

For deployed ECS backend tasks, Terraform passes `email_provider`, `email_from`, and `app_base_url` into the backend task. When `email_provider = "ses"`, Terraform also grants the backend task SES send permissions. Set `ses_identity_arn` to restrict sending to a specific SES identity, or leave it empty in dev.

SES setup requirements:

- Verify the sender email or domain.
- In SES sandbox, verify recipient emails too.
- Request SES production access before sending to arbitrary customers.

Retry pending or failed notifications with:

```sh
npm run notifications:retry
```

See [Notifications](notifications.md) for notification event behavior and email content rules.

## Enable The Public Backend Service

The public backend service is disabled by default:

```hcl
backend_service_enabled = false
```

Preview enabling it:

```sh
terraform -chdir=infra/envs/dev plan -var backend_service_enabled=true
```

To persist it, edit `infra/envs/dev/terraform.tfvars`:

```hcl
backend_service_enabled = true
```

Then apply:

```sh
terraform -chdir=infra/envs/dev apply
```

Get the backend URL:

```sh
terraform -chdir=infra/envs/dev output backend_load_balancer_dns_name
```

Health check path:

```text
/health
```

## Frontend

The frontend image is local-only for now.

Build it locally:

```sh
make frontend-docker-build
```

Point the frontend at a deployed backend with:

```text
NEXT_PUBLIC_API_URL=http://backend-load-balancer-dns-name
```

Cognito login needs these build-time public env vars:

```text
NEXT_PUBLIC_COGNITO_DOMAIN=https://your-domain.auth.us-east-2.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_REGION=us-east-2
```

There is no Terraform-managed frontend hosting yet.

## Tear Down AWS Dev

Destroy dev resources when not using AWS:

```sh
terraform -chdir=infra/envs/dev destroy
```

The bootstrap state bucket remains because it stores Terraform state.

# Deployment

This doc covers the current AWS dev deployment path.

## Current Status

The AWS dev stack is currently deployed under `health-dev`. It includes Cognito, private RDS Postgres, ECR, the ECS cluster, backend/frontend image repositories, public HTTPS backend/frontend ECS services behind ALBs, and the scheduled Stripe Checkout reconciliation job.

Current public endpoints:

- Frontend: `https://dev.condensedhealth.com`
- Backend API: `https://api-dev.condensedhealth.com`

The current public service and domain settings are:

```hcl
backend_service_enabled       = true
frontend_service_enabled      = true
frontend_domain               = "dev.condensedhealth.com"
backend_domain                = "api-dev.condensedhealth.com"
validate_domain_certificates  = true
```

Local development is still the main iteration path. AWS dev is the integration environment for ECS images, RDS migrations, ALB routing, AWS-injected secrets, scheduled tasks, Stripe webhooks pointed at public URLs, and public smoke tests.

HTTPS/custom domains are centralized in Terraform with `frontend_domain`, `backend_domain`, and `validate_domain_certificates`. Cognito Hosted UI login is enabled for deployed frontend builds because the frontend has a valid HTTPS callback URL.

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

To deploy or update AWS dev:

1. Authenticate to AWS.
2. Apply Terraform dev resources. The current `terraform.tfvars` keeps the app/data stack, scheduled jobs, public backend/frontend services, and HTTPS domains enabled.
3. Run `make backend-deploy-aws` for backend or database changes.
4. Run `make frontend-deploy-aws` for frontend changes.
5. Verify the public endpoints and scheduled job when relevant.

## Local Vs AWS

Use local development for normal iteration:

```sh
make local-dev-restart
```

For frontend/design changes that need real AWS dev API, Cognito, and Stripe settings without waiting for ECS:

```sh
npm run frontend:dev:aws
```

This runs only the local Next.js dev server with hot reload and points it at `https://api-dev.condensedhealth.com`.

Use AWS deployment for integration checks:

- backend container startup and runtime environment
- Prisma migrations against AWS RDS
- ECR image push/pull
- ECS service rollout
- ALB routing and health checks
- Secrets Manager injected environment
- EventBridge Scheduler tasks
- public Stripe webhook endpoints

Do not use AWS as the fast feedback loop. Build and check locally first, then deploy when a change is ready for integration.

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

## Deploy Backend

The normal backend deploy command is:

```sh
make backend-deploy-aws
```

This command:

- Builds `apps/backend/Dockerfile`
- Logs in to ECR
- Pushes the backend image tag
- Runs the one-off AWS migration task
- Forces a new ECS backend deployment
- Waits for the service to become stable
- Checks the deployed `/health` endpoint

By default it uses `AWS_PROFILE=dev`, `AWS_REGION=us-east-2`, `BACKEND_IMAGE=health/backend`, and `BACKEND_TAG=latest`.

Useful variants:

```sh
BACKEND_TAG=latest make backend-deploy-aws
scripts/deploy-aws-backend.sh --apply-terraform
scripts/deploy-aws-backend.sh --skip-migrations
scripts/deploy-aws-backend.sh --skip-health
```

`--apply-terraform` runs `terraform apply -auto-approve` before building and pushing the image. Use it when infrastructure or task definition changes are part of the deploy.

## Deploy Frontend

The normal frontend deploy command is:

```sh
make frontend-deploy-aws
```

This command:

- Bootstraps the frontend ECR repository when needed
- Builds `apps/frontend/Dockerfile`
- Bakes in the deployed backend API URL
- Logs in to ECR
- Pushes the frontend image tag
- Applies frontend ECS/ALB Terraform resources when needed
- Forces a new ECS frontend deployment
- Waits for the service to become stable
- Checks the deployed frontend URL

By default it uses `AWS_PROFILE=dev`, `AWS_REGION=us-east-2`, `FRONTEND_IMAGE=health/frontend`, and `FRONTEND_TAG=latest`.

Useful variants:

```sh
FRONTEND_TAG=latest make frontend-deploy-aws
scripts/deploy-aws-frontend.sh --apply-terraform
scripts/deploy-aws-frontend.sh --skip-health
```

The deploy script uses Terraform's `backend_public_url` output. Current AWS dev frontend builds use `https://api-dev.condensedhealth.com`. If a future environment does not have a validated backend domain yet, the script falls back to the backend ALB HTTP URL.

Cognito config is enabled automatically because Terraform's current `frontend_public_url` is `https://dev.condensedhealth.com`. You can override that with `FRONTEND_ENABLE_COGNITO=1` or `FRONTEND_ENABLE_COGNITO=0` for unusual testing.

`--apply-terraform` runs `terraform apply -auto-approve` before reading build-time URLs and building the image. The script also auto-applies the frontend ECR/log-group bootstrap and the frontend ECS/ALB resources when those outputs are missing.

## HTTPS Domains

Custom domains are configured in `infra/envs/dev/terraform.tfvars`:

```hcl
frontend_domain              = "dev.condensedhealth.com"
backend_domain               = "api-dev.condensedhealth.com"
validate_domain_certificates = true
```

Use hostnames only, without `https://` or paths.

Current Cloudflare app records are DNS-only CNAMEs to the ALBs:

```text
dev.condensedhealth.com     CNAME  health-dev-frontend-595891449.us-east-2.elb.amazonaws.com
api-dev.condensedhealth.com CNAME  health-dev-backend-1482878695.us-east-2.elb.amazonaws.com
```

ACM validation records are also CNAMEs in Cloudflare and must stay DNS-only.

For a new domain, first set `frontend_domain` and `backend_domain` and keep validation disabled:

```hcl
validate_domain_certificates = false
```

Apply to create ACM certificate requests and print DNS validation records:

```sh
terraform -chdir=infra/envs/dev apply
terraform -chdir=infra/envs/dev output frontend_acm_validation_records
terraform -chdir=infra/envs/dev output backend_acm_validation_records
```

Add those CNAME records in Cloudflare as DNS-only records. After ACM can validate them, set:

```hcl
validate_domain_certificates = true
```

Apply again:

```sh
terraform -chdir=infra/envs/dev apply
```

When validation is enabled, Terraform adds HTTPS listeners on port `443` and changes HTTP listeners on port `80` to redirect to HTTPS.

Then add Cloudflare DNS records for the app itself:

```text
dev.example.com     CNAME  <frontend ALB DNS name>
api-dev.example.com CNAME  <backend ALB DNS name>
```

Start with Cloudflare DNS-only. After direct AWS HTTPS works, decide whether to enable Cloudflare proxying.

Finally redeploy images so runtime/build config uses the domain URLs:

```sh
make backend-deploy-aws
make frontend-deploy-aws
```

Changing domains later is the same flow: edit `frontend_domain` and `backend_domain`, apply to get new validation records, update Cloudflare, apply again with validation enabled, and redeploy.

## Build And Push Backend Image

These lower-level commands are useful when debugging a deploy step manually.

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
173748329850.dkr.ecr.us-east-2.amazonaws.com/health-dev-backend
```

## Build And Push Frontend Image

These lower-level commands are useful when debugging a deploy step manually.

Build the local frontend image:

```sh
make frontend-docker-build
```

Log in to ECR:

```sh
make frontend-ecr-login
```

Push the image:

```sh
make frontend-ecr-push
```

Terraform creates this ECR repository when AWS dev exists:

```text
173748329850.dkr.ecr.us-east-2.amazonaws.com/health-dev-frontend
```

For normal deployed frontend builds, prefer `make frontend-deploy-aws` because it passes the deployed backend URL as a Docker build argument and prevents local `.env*` files from being baked into the image.

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

## Reset AWS Dev Data

Use these only for the disposable AWS dev environment. They run as one-off ECS tasks so they can reach private RDS without opening the database to the internet.

Reset one signup account for reuse:

```sh
make dev-auth-reset-user EMAIL=user@example.com
```

This clears the matching app user's `externalAuthId` in RDS, then deletes the Cognito user. The next signup with that email gets a new Cognito identity and relinks to the app user by email.

Reset all AWS dev app data while keeping infrastructure running:

```sh
make dev-db-reset-data CONFIRM=health-dev
```

This truncates app tables in RDS and leaves Cognito, RDS, ECS, ALBs, ACM certificates, ECR, and Terraform state intact. It does not delete Cognito users.

Seed the demo catalog:

```sh
make dev-db-seed
```

The seed creates a broader health-style catalog across hair, skin, sexual wellness, weight management, GLP-1, hormone health, testosterone, women's health, men's health, heart health, digestive health, allergy, smoking cessation, mental wellness, labs, health checks, supplements, daily care, and drinkware. It keeps `dev-mug` available because the checkout smoke test uses it.

Reset and seed together:

```sh
make dev-db-reset-seed CONFIRM=health-dev
```

## Scheduled Jobs

Scheduled jobs run as short-lived ECS Fargate tasks. They are currently enabled in AWS dev. They are separate from the public backend/frontend services, but they still require the AWS dev app/data layer because the tasks connect to private RDS.

Preview the jobs layer:

```sh
make dev-jobs-plan
```

Apply it:

```sh
make dev-jobs-apply
```

The jobs layer creates:

- ECS task definition for Stripe Checkout reconciliation
- EventBridge Scheduler schedule
- IAM role allowing Scheduler to run the ECS task

The local script command is:

```sh
npm run orders:expire
```

The AWS scheduled task runs the compiled production script directly:

```sh
node apps/backend/dist/scripts/expire-unpaid-orders.js
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

If the AWS dev database contains unpaid Stripe Checkout orders, configure `stripe_api_key_secret_arn` with a Secrets Manager secret ARN containing the Stripe secret key. The job needs that key to retrieve stale open Checkout Sessions and mirror Stripe's state locally; it does not force-expire open Stripe sessions.

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

For AWS dev, sync Stripe test values from `.env.test` into AWS Secrets Manager and Terraform:

```sh
make dev-stripe-secrets-sync
make dev-stripe-webhook-sync
terraform -chdir=infra/envs/dev apply
make backend-deploy-aws
make frontend-deploy-aws
```

The sync command creates or updates `health-dev-stripe-api-key` and `health-dev-stripe-webhook-secret` in Secrets Manager, writes their ARNs into `infra/envs/dev/terraform.tfvars`, and updates `apps/frontend/.env.local` with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for the frontend image build. It does not store secret key values in Terraform.

`make dev-stripe-webhook-sync` creates a Stripe test webhook endpoint for `https://api-dev.condensedhealth.com/webhooks/stripe`, stores the returned signing secret in `health-dev-stripe-webhook-secret`, and updates ignored local env files with the new `STRIPE_WEBHOOK_SECRET`. Force a new backend ECS deployment after changing that secret value so the running task picks it up.

Stripe checkout uses Checkout Sessions with Checkout Elements. Configure deployed webhook endpoints to send:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.dispute.created`
- `charge.dispute.updated`
- `charge.dispute.closed`

PaymentIntent events can stay enabled for backwards compatibility with older local payment rows, but new checkout payments are reconciled from Checkout Session events. See [Payments](../architecture/payments.md) for the full payment, webhook, sync, dispute, and refund behavior.

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

See [Notifications](../architecture/notifications.md) for notification event behavior and email content rules.

## Public Backend Service

The public backend service is controlled in `infra/envs/dev/terraform.tfvars`:

```hcl
backend_service_enabled = true
```

Preview changes:

```sh
terraform -chdir=infra/envs/dev plan
```

Apply changes:

```sh
terraform -chdir=infra/envs/dev apply
```

To disable the public backend service later, edit `infra/envs/dev/terraform.tfvars`:

```hcl
backend_service_enabled = false
```

Get the backend URL:

```sh
terraform -chdir=infra/envs/dev output backend_public_url
```

Health check path:

```text
/health
```

## Public Frontend Service

The public frontend service is controlled in `infra/envs/dev/terraform.tfvars`:

```hcl
frontend_service_enabled = true
```

Preview changes:

```sh
terraform -chdir=infra/envs/dev plan
```

Apply changes:

```sh
terraform -chdir=infra/envs/dev apply
```

To disable the public frontend service later, edit `infra/envs/dev/terraform.tfvars`:

```hcl
frontend_service_enabled = false
```

Get the frontend URL:

```sh
terraform -chdir=infra/envs/dev output frontend_public_url
```

Health check path:

```text
/
```

## Taking Public Services Down

When AWS public URLs are not actively needed, disable the public runtime services to reduce ongoing ALB and Fargate cost:

```hcl
backend_service_enabled  = false
frontend_service_enabled = false
```

Then apply:

```sh
terraform -chdir=infra/envs/dev apply
```

This removes the public backend/frontend ECS services and ALBs. It keeps Cognito, RDS, ECR repositories/images, scheduled jobs, and Terraform state. To bring public services back, set both flags to `true`, apply Terraform, then run:

```sh
make backend-deploy-aws
make frontend-deploy-aws
```

## Manual Frontend Configuration

Prefer the helper for local frontend iteration against AWS dev:

```sh
npm run frontend:dev:aws
```

To wire the values manually, point a locally running frontend at a deployed backend with:

```text
NEXT_PUBLIC_API_URL=https://api-dev.condensedhealth.com
```

Cognito login for local development needs these public env vars:

```text
NEXT_PUBLIC_COGNITO_DOMAIN=https://your-domain.auth.us-east-2.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_REGION=us-east-2
```

Cognito login in the deployed AWS dev frontend is enabled through `https://dev.condensedhealth.com`, which is registered in Cognito callback and logout URLs. If the domain changes, update Terraform, validate the new ACM certificates, and redeploy the frontend image so the build-time Cognito and API URLs are refreshed.

## Tear Down AWS Dev

Destroy dev resources when not using AWS:

```sh
terraform -chdir=infra/envs/dev destroy
```

The bootstrap state bucket remains because it stores Terraform state.

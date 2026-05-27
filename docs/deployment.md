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
5. Optionally enable the public backend service.

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

The webhook secret should start with `whsec_`. The frontend publishable key should start with `pk_`.

For local webhook testing, use the Stripe CLI to forward events to:

```text
http://127.0.0.1:3000/webhooks/stripe
```

Use the webhook signing secret printed by the CLI as `STRIPE_WEBHOOK_SECRET`.

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

# Runbooks

These are common operational flows for the current project state.

## Start Local Dev

```sh
make local-dev
```

Restart local app processes after env changes:

```sh
make local-dev-restart
```

The local dev command stays attached. Press `Ctrl+C` to stop the backend, frontend, and Stripe listener.

Open:

- Backend: `http://127.0.0.1:3000/health`
- Shop: `http://localhost:3001`
- Admin: `http://localhost:3001/admin`

The public shop nav does not link to admin. Admin users open `/admin` directly.

## Check Local Health

```sh
docker compose ps
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3000/ready
```

## Check AWS Dev Health

Current AWS dev URLs are:

- Backend: `https://api-dev.condensedhealth.com`
- Frontend: `https://dev.condensedhealth.com`

```sh
BACKEND_URL="$(terraform -chdir=infra/envs/dev output -raw backend_public_url)"
FRONTEND_URL="$(terraform -chdir=infra/envs/dev output -raw frontend_public_url)"
curl -s "$BACKEND_URL/health"
curl -s "$BACKEND_URL/ready"
curl -s -I "$FRONTEND_URL"
aws ecs describe-services --cluster health-dev --services health-dev-backend --region us-east-2 --profile dev
aws ecs describe-services --cluster health-dev --services health-dev-frontend --region us-east-2 --profile dev
```

These public URL outputs exist only when the matching public service is enabled.

The expected backend health and readiness response is:

```json
{"ok":true}
```

The expected frontend status is `HTTP 200`.

## Test Stripe Webhooks Locally

Put Stripe test keys in `.env.test`, then sync them:

```sh
make dev-test-env
```

Start or restart local dev:

```sh
make local-dev-restart
```

The local dev script asks Stripe CLI for the local `whsec_...` signing secret, writes it to `.env` and `apps/backend/.env`, starts the backend with that secret, and forwards events to `http://127.0.0.1:3000/webhooks/stripe`. Checkout payments use Checkout Session webhooks such as `checkout.session.completed`; the Stripe CLI forwards those during local testing.

See [Payments](../architecture/payments.md) for test cards, admin Stripe sync, dispute behavior, and the current refund caveat.

## Sync Stripe To AWS Dev

Use `.env.test` as the source for AWS dev Stripe test credentials:

```sh
make dev-stripe-secrets-sync
make dev-stripe-webhook-sync
terraform -chdir=infra/envs/dev apply
make backend-deploy-aws
make frontend-deploy-aws
```

This creates or updates AWS Secrets Manager secrets for `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET`, stores only their ARNs in Terraform, and updates `apps/frontend/.env.local` with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` so the deployed frontend build can load Stripe Checkout Elements.

`make dev-stripe-webhook-sync` creates the Stripe test webhook endpoint for `https://api-dev.condensedhealth.com/webhooks/stripe` and replaces the AWS dev webhook signing secret with the endpoint's signing secret. Redeploy or force-roll the backend after running it.

## Run Stripe Checkout Smoke Test

With Postgres, backend, frontend, and `stripe listen` running, run:

```sh
npm run test:stripe-checkout
```

This opens the local shop in installed Chrome, creates a dev mug order, fills Stripe's test card, submits payment, and polls the backend order API until `paymentStatus` is `PAID`.

The command restocks `dev-mug` to 25 units before running so repeated smoke tests do not fail from local inventory depletion.

## AWS Dev Smoke Test

Run the non-destructive wiring check:

```sh
make dev-smoke-check
```

The destructive reset-and-prepare path is only for disposable AWS dev data:

```sh
make dev-reset-smoke-prepare CONFIRM=delete-dev-app-data
```

This deletes AWS dev orders, payments, carts, addresses, notes, shipments, and notifications before reseeding catalog data. It also syncs Stripe test credentials from `.env.test`, ensures the Stripe test webhook endpoint points at `https://api-dev.condensedhealth.com/webhooks/stripe`, applies Terraform, rolls the backend to pick up current Secrets Manager values, and deploys the frontend.

The check verifies:

- backend `/health` and `/ready`
- frontend `/cart`
- seeded demo catalog data, including `dev-mug` for checkout smoke tests
- backend/frontend ECS service stability
- backend and scheduled task Stripe secret injection
- Cognito deployed callback/logout URLs
- Stripe test webhook endpoint status and URL

Manual browser smoke flow:

1. Open `https://dev.condensedhealth.com`.
2. Sign up or sign in with a dev email.
3. Add `Dev Mug` to the cart.
4. Pay with Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC, and any ZIP.
5. Confirm the order page updates to paid after Stripe redirects back.
6. Promote the dev user if needed:

```sh
make dev-auth-add-admin EMAIL=user@example.com
```

Sign out and sign back in after promotion so Cognito issues a fresh token with the `admin` group, then open `https://dev.condensedhealth.com/admin` and confirm the paid order is visible.

If a payment is stuck unpaid:

1. Check for webhook POSTs:

```sh
aws logs tail /ecs/health-dev-backend --since 15m --region us-east-2 --profile dev
```

2. Confirm the Stripe webhook endpoint:

```sh
make dev-smoke-check
```

3. Resend the relevant Stripe event to the AWS dev endpoint from the Stripe Dashboard or CLI.

## Reconcile Stripe Checkout Attempts

Run the local Stripe Checkout reconciliation job:

```sh
npm run orders:expire
```

or:

```sh
make orders-expire
```

Defaults:

- `ORDER_EXPIRY_MINUTES=15`
- `ORDER_EXPIRY_BATCH_SIZE=50`

The job scans old open local Stripe Checkout attempts, retrieves each Checkout Session from Stripe, and mirrors Stripe's current state locally. It does not force-expire open Stripe sessions. When Stripe reports a session as expired and no other open/completed attempt remains, the job marks the local payment/order expired, cancels the order, and releases inventory once by setting `orders.inventoryReleasedAt`.

For AWS dev, the scheduled ECS task is currently enabled. To preview or apply job changes:

```sh
make dev-jobs-plan
make dev-jobs-apply
```

Run the AWS job once without waiting for the schedule:

```sh
make orders-expire-aws
```

The AWS schedule is controlled by `deploy_jobs_stack`, `orders_expiry_enabled`, and `orders_expiry_schedule_expression` in Terraform. The scheduled job is separate from the public backend/frontend services, but it requires the AWS app/data layer so the task can reach private RDS. The deployed ECS task runs the compiled script with `node apps/backend/dist/scripts/expire-unpaid-orders.js`.

## Retry Notifications

Retry pending or failed notification events:

```sh
npm run notifications:retry
```

or:

```sh
make notifications-retry
```

By default this checks 50 events. Override with:

```sh
NOTIFICATION_RETRY_BATCH_SIZE=100 npm run notifications:retry
```

If `EMAIL_PROVIDER=none`, retry leaves events pending. Set `EMAIL_PROVIDER=ses` and `EMAIL_FROM` to send through SES.

## Reset Local Database

This removes local Postgres data.

```sh
docker compose down -v
docker compose up -d postgres
npm run db:migrate
```

## Regenerate Prisma Client

```sh
npm run db:generate
```

## Check Migration Status

From the backend workspace:

```sh
cd apps/backend
npx prisma migrate status --schema prisma/schema.prisma
```

## Build Everything Locally

```sh
npm run backend:check
npm run backend:build
npm run frontend:check
npm run frontend:build
```

## Build Local Docker Images

```sh
make backend-docker-build
make frontend-docker-build
```

## Recreate AWS Dev

```sh
make aws-login
make aws-whoami
make dev-init
make dev-plan
terraform -chdir=infra/envs/dev apply
```

## Deploy AWS Backend

Use this after backend code, Prisma schema, migrations, backend Dockerfile, or backend task behavior changes:

```sh
make backend-deploy-aws
```

The command builds and pushes the backend image, runs AWS RDS migrations, forces a new ECS backend deployment, waits for stability, and checks `/health`.

Useful variants:

```sh
scripts/deploy-aws-backend.sh --apply-terraform
scripts/deploy-aws-backend.sh --skip-migrations
scripts/deploy-aws-backend.sh --skip-health
```

## Deploy AWS Frontend

Use this after frontend code, frontend Dockerfile, or deployed frontend build-time env behavior changes:

```sh
make frontend-deploy-aws
```

The command builds and pushes the frontend image, applies frontend ECS/ALB Terraform resources when needed, forces a new ECS frontend deployment, waits for stability, and checks the public frontend URL.

Useful variants:

```sh
scripts/deploy-aws-frontend.sh --apply-terraform
scripts/deploy-aws-frontend.sh --skip-health
```

The deploy script reads Terraform's `frontend_public_url` and `backend_public_url` outputs. Current AWS dev uses HTTPS for both, so the frontend build includes Cognito config automatically.

For a domain change, update `frontend_domain` and `backend_domain`, apply once with `validate_domain_certificates=false` to get ACM validation records, add those CNAMEs in Cloudflare, set `validate_domain_certificates=true`, apply again, then redeploy backend and frontend images.

## Deploy Cognito Only

Use this for local auth development without recreating RDS/ECS. See [Auth](../architecture/auth.md) for the full auth model.

```sh
make aws-login
make aws-whoami
make dev-init
make dev-auth-plan
make dev-auth-apply
make dev-auth-env
```

Restart backend and frontend dev servers after `make dev-auth-env`.

## Auth Tasks

Signup recovery, deleting throwaway users, and granting admin access are covered in [Auth](../architecture/auth.md).

Reset one dev signup account without taking AWS resources down:

```sh
make dev-auth-reset-user EMAIL=user@example.com
```

This clears the matching AWS RDS `users.externalAuthId` value first, then deletes the matching Cognito user. It leaves the app user row and related app data in place so the next signup with the same email can relink cleanly.

## Reset AWS Dev App Data

Reset AWS dev app data in RDS while keeping AWS infrastructure, Cognito, ACM certificates, ALBs, ECR, and ECS resources running:

```sh
make dev-db-reset-data CONFIRM=health-dev
```

This truncates app tables only. It does not destroy Terraform resources and does not delete Cognito users.

Seed the AWS dev catalog with the demo product set:

```sh
make dev-db-seed
```

The seed creates a broader health-style catalog across hair, skin, sexual wellness, weight management, GLP-1, hormone health, testosterone, women's health, men's health, heart health, digestive health, allergy, smoking cessation, mental wellness, labs, health checks, supplements, daily care, and drinkware. It keeps `dev-mug` available because the checkout smoke test uses it.

Reset and seed in one step:

```sh
make dev-db-reset-seed CONFIRM=health-dev
```

## Push Backend Image To AWS

```sh
make backend-docker-build
make backend-ecr-login
make backend-ecr-push
```

## Push Frontend Image To AWS

These lower-level commands are useful when debugging the frontend deploy script:

```sh
make frontend-docker-build
make frontend-ecr-login
make frontend-ecr-push
```

## Run AWS RDS Migrations

AWS RDS is private. Use the one-off ECS migration task:

```sh
make backend-migrate-aws
```

## Inspect AWS Outputs

```sh
terraform -chdir=infra/envs/dev output
```

Useful output names:

- `backend_ecr_repository_url`
- `frontend_ecr_repository_url`
- `cognito_frontend_client_id`
- `cognito_hosted_ui_domain`
- `cognito_issuer`
- `ecs_cluster_name`
- `backend_migration_task_definition_arn`
- `backend_load_balancer_dns_name`
- `frontend_load_balancer_dns_name`
- `postgres_endpoint`
- `postgres_port`

## Check Backend ECR Image

```sh
aws ecr describe-images --repository-name health-dev-backend --image-ids imageTag=latest --region us-east-2 --profile dev
```

## Check Frontend ECR Image

```sh
aws ecr describe-images --repository-name health-dev-frontend --image-ids imageTag=latest --region us-east-2 --profile dev
```

## Take Public AWS Services Down

When public URLs are not needed, disable the public backend and frontend services to avoid always-on ALB/Fargate cost:

```hcl
backend_service_enabled  = false
frontend_service_enabled = false
```

Then apply:

```sh
terraform -chdir=infra/envs/dev apply
```

This keeps Cognito, RDS, ECR, scheduled jobs, and Terraform state. To bring public services back, set both flags to `true`, apply Terraform, then run:

```sh
make backend-deploy-aws
make frontend-deploy-aws
```

## Destroy AWS Dev

```sh
terraform -chdir=infra/envs/dev destroy
```

The Terraform bootstrap state bucket is retained.

## If AWS Commands Fail With SSO Errors

Refresh SSO:

```sh
make aws-login
```

Then retry the AWS or Terraform command.

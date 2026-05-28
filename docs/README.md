# Docs

This directory holds the working documentation for `tele`.

## Start Here

- [Getting Started](getting-started.md): run Postgres, backend, and frontend locally.
- [Frontend](frontend.md): Next.js app structure, shop flow, admin UI, auth, Stripe Elements, and UI conventions.
- [Backend](backend.md): request flow, module conventions, and current backend modules.
- [API](api.md): route reference and request shapes.
- [Auth](auth.md): Cognito login, local auth setup, user linking, and admin group access.
- [Payments](payments.md): Stripe checkout, webhooks, admin sync, disputes, refunds, and test cards.
- [Fulfillment](fulfillment.md): shipment creation, tracking updates, fulfillment guardrails, and tracking links.
- [Notifications](notifications.md): customer notification records and planned SES email sending.
- [Flows](flows.md): catalog, cart, checkout, order, payment, and shipment business flows.
- [Database](database.md): Prisma models, relationships, and migration notes.

## Operations

- [Infrastructure](infrastructure.md): AWS account, Terraform state, VPC, RDS, ECR, ECS, and cost notes.
- [Deployment](deployment.md): build images, recreate AWS dev, run migrations, and enable the backend service.
- [Runbooks](runbooks.md): common step-by-step commands for local and AWS operations.

## Current Environment

Local development is active. Cognito is deployed for local auth testing. Costly AWS app resources in `infra/envs/dev` are destroyed to avoid cost; bootstrap state storage remains.

# Docs

This directory holds the working documentation for `tele`.

## Start Here

- [Local Development](local-dev.md): run Postgres, backend, and frontend locally.
- [Backend Architecture](backend-architecture.md): request flow, module conventions, and current backend modules.
- [Backend API](backend-api.md): route reference and request shapes.
- [Ecommerce Flows](ecommerce-flows.md): catalog, cart, checkout, order, payment, and shipment business flows.
- [Database Schema](database-schema.md): Prisma models, relationships, and migration notes.

## Operations

- [Infrastructure](infrastructure.md): AWS account, Terraform state, VPC, RDS, ECR, ECS, and cost notes.
- [Deployment](deployment.md): build images, recreate AWS dev, run migrations, and enable the backend service.
- [Runbooks](runbooks.md): common step-by-step commands for local and AWS operations.

## Current Environment

Local development is active. Cognito is deployed for local auth testing. Costly AWS app resources in `infra/envs/dev` are destroyed to avoid cost; bootstrap state storage remains.

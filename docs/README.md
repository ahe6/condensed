# Docs

This directory holds the working documentation for `tele`.

## Start Here

- [Local Development](local-dev.md): run Postgres, backend, and frontend locally.
- [Backend API](backend-api.md): route reference and request shapes.
- [Backend Flows](backend-flows.md): module conventions and ecommerce flow design.
- [Database Schema](database-schema.md): Prisma models, relationships, and migration notes.

## Operations

- [Infrastructure](infrastructure.md): AWS account, Terraform state, VPC, RDS, ECR, ECS, and cost notes.
- [Deployment](deployment.md): build images, recreate AWS dev, run migrations, and enable the backend service.
- [Runbooks](runbooks.md): common step-by-step commands for local and AWS operations.

## Current Environment

Local development is active. AWS dev resources in `infra/envs/dev` are currently destroyed to avoid cost; bootstrap state storage remains.

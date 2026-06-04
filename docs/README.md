# Docs

This directory holds the working documentation for `health`.

## Start Here

- [Local Development](start/local-development.md): run Postgres, backend, and frontend locally.
- [AWS Dev](start/aws-dev.md): deployed dev URLs, smoke checks, and the local frontend against AWS workflow.
- [Production](start/production.md): production readiness notes and the pieces that must be split from dev.

## Architecture

- [Frontend](architecture/frontend.md): Next.js app structure, shop flow, admin UI, auth, Stripe Elements, and UI conventions.
- [Backend](architecture/backend.md): request flow, module conventions, and current backend modules.
- [Auth](architecture/auth.md): Cognito login, local auth setup, user linking, and admin group access.
- [Payments](architecture/payments.md): Stripe checkout, webhooks, admin sync, disputes, refunds, and test cards.
- [Fulfillment](architecture/fulfillment.md): shipment creation, tracking updates, fulfillment guardrails, and tracking links.
- [Notifications](architecture/notifications.md): customer notification records and planned SES email sending.
- [Database](architecture/database.md): Prisma models, relationships, and migration notes.
- [Infrastructure](architecture/infrastructure.md): AWS account, Terraform state, VPC, RDS, ECR, ECS, and cost notes.

## Reference

- [API](reference/api.md): route reference and request shapes.
- [Flows](reference/flows.md): catalog, cart, checkout, order, payment, and shipment business flows.

## Operations

- [Deployment](runbooks/deploy.md): deploy backend and frontend images, run migrations, manage public AWS services, and verify AWS dev.
- [Runbooks](runbooks/README.md): common step-by-step commands for local and AWS operations.

## Current Environment

Local development remains the fastest dev loop. The AWS dev stack is currently deployed under `health-dev`, including Cognito, RDS, ECR, backend and frontend ECS services, public HTTPS ALBs, and the scheduled Stripe Checkout reconciliation job. Bootstrap state storage remains in the original retained state bucket.

Current AWS dev URLs:

- Frontend: `https://dev.condensedhealth.com`
- Backend API: `https://api-dev.condensedhealth.com`

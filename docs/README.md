# Docs

This directory holds the working documentation for `health`.

Use [Docs Conventions](CONVENTIONS.md) when adding or moving documentation.

## Start Here

- [Local Development](start/local-development.md): run Postgres, backend, and frontend locally.
- [AWS Dev](start/aws-dev.md): deployed dev URLs, smoke checks, and the local frontend against AWS workflow.
- [Production](start/production.md): production readiness notes and the pieces that must be split from dev.

## Architecture

- [Frontend](architecture/frontend.md): Next.js app structure, shop flow, admin UI, auth, Stripe Elements, and UI conventions.
- [Frontend Care And Commerce](architecture/frontend-care-commerce.md): frontend-first target architecture for commerce, care, and Patient Portal layers.
- [Admin](architecture/admin.md): admin workspace, order operations, payment/fulfillment/catalog actions, and guardrails.
- [Backend Conventions](architecture/backend-conventions.md): request flow, module conventions, server hooks, admin flow, transactions, and external events.
- [Backend Flows](architecture/backend-flows.md): backend module collaboration across auth, checkout, admin, Stripe, fulfillment, and notifications.
- [Backend Modules](architecture/backend-modules.md): current backend module ownership, route inventory, and main service functions.
- [Users](architecture/users.md): user records, saved addresses, and default address behavior.
- [Carts](architecture/carts.md): anonymous/user carts, cart ownership, item operations, and totals.
- [Checkout](architecture/checkout.md): cart-to-order conversion, inventory decrement, and Stripe checkout handoff.
- [Catalog](architecture/catalog.md): public catalog and admin product/category/variant/image/inventory behavior.
- [Orders](architecture/orders.md): customer order lookup, admin order search, notes, timeline, and cancellation behavior.
- [Auth](architecture/auth.md): Cognito login, local auth setup, user linking, and admin group access.
- [Payments](architecture/payments.md): Stripe checkout, webhooks, admin sync, disputes, refunds, and test cards.
- [Fulfillment](architecture/fulfillment.md): shipment creation, tracking updates, fulfillment guardrails, and tracking links.
- [Notifications](architecture/notifications.md): customer notification records, SES email sending, and retry behavior.
- [Database](architecture/database.md): Prisma models, relationships, and migration notes.
- [Infrastructure](architecture/infrastructure.md): AWS account, Terraform state, VPC, RDS, ECR, ECS, and cost notes.

## Reference

- [API](reference/api.md): route reference and request shapes.
- [Flows](reference/flows.md): catalog, cart, checkout, order, payment, and shipment business flows.

## Operations

- [Deployment](runbooks/deploy.md): deploy backend and frontend images, run migrations, manage public AWS services, and verify AWS dev.
- [Runbooks](runbooks/README.md): common step-by-step commands for local and AWS operations.
- [Docs Conventions](CONVENTIONS.md): where each kind of documentation belongs and how to verify changes.
- [Docs TODO](TODO.md): documentation audits and follow-up cleanup.

## Current Environment

Local development remains the fastest dev loop. The AWS dev stack is currently deployed under `health-dev`, including Cognito, RDS, ECR, backend and frontend ECS services, public HTTPS ALBs, and the scheduled Stripe Checkout reconciliation job. Bootstrap state storage remains in the original retained state bucket.

Current AWS dev URLs:

- Frontend: `https://dev.condensedhealth.com`
- Backend API: `https://api-dev.condensedhealth.com`

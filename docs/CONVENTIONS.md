# Docs Conventions

Use this when adding or moving docs so each doc has one job.

## Where Content Belongs

- `docs/start/*`: how to start working in an environment.
- `docs/architecture/backend.md`: backend request flow, module shape, server hooks, admin/auth flow, transaction patterns, and external event patterns.
- `docs/architecture/backend-modules.md`: module ownership, route inventory, and main service functions.
- `docs/architecture/catalog.md`: catalog behavior and admin catalog operations.
- `docs/architecture/orders.md`: order and admin-order behavior.
- `docs/architecture/payments.md`: Stripe and local payment behavior.
- `docs/architecture/fulfillment.md`: shipment and fulfillment behavior.
- `docs/architecture/notifications.md`: notification events, SES, and retry behavior.
- `docs/architecture/database.md`: Prisma models, migrations, and database design decisions.
- `docs/architecture/infrastructure.md`: AWS resource shape, Terraform state, network, RDS, ECR, ECS, and cost notes.
- `docs/reference/api.md`: exact endpoint contracts, request shapes, response shapes, query params, and status behavior.
- `docs/reference/flows.md`: end-to-end business flows across modules.
- `docs/runbooks/*`: step-by-step commands for operations, deployment, resets, smoke checks, and debugging.

## Rules

- Do not duplicate exact route request/response shapes outside `reference/api.md`.
- Do not put deployment commands inside architecture docs; link to runbooks.
- Keep `backend.md` as an overview, not module inventory.
- Keep `backend-modules.md` as inventory. Split a module into its own architecture doc only when it needs behavior, rules, or workflow detail beyond route and service lists.
- Functional docs can mention routes, but should link to [API](reference/api.md) for exact contracts.
- When code changes add, remove, or rename routes, update [Backend Modules](architecture/backend-modules.md) and [API](reference/api.md).
- When schema changes, update [Database](architecture/database.md).
- When AWS, environment, deployment, reset, or smoke-test commands change, update [Deployment](runbooks/deploy.md) or [Runbooks](runbooks/README.md).

## Verification

Before committing doc changes:

- Run the Markdown link check used in prior docs commits.
- Run `git diff --check`.
- Run code checks when docs claim behavior from code.

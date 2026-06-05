# Docs Conventions

Use this when adding or moving docs so each doc has one job.

## Where Content Belongs

- `docs/start/*`: how to start working in an environment.
- `docs/architecture/backend-modules.md`: backend module inventory. Use it to find the owner doc for module-specific behavior.
- `docs/architecture/backend-conventions.md`: backend implementation conventions and cross-cutting request patterns.
- `docs/architecture/backend-flows.md`: backend module collaboration across major application flows.
- `docs/architecture/*`: system design, module behavior, and implementation notes that are not exact endpoint contracts.
- `docs/architecture/database.md`: Prisma models, migrations, and database design decisions.
- `docs/architecture/infrastructure.md`: AWS resource shape, Terraform state, network, RDS, ECR, ECS, and cost notes.
- `docs/reference/api.md`: exact endpoint contracts, request shapes, response shapes, query params, and status behavior.
- `docs/reference/flows.md`: high-level product and business flows.
- `docs/runbooks/*`: step-by-step commands for operations, deployment, resets, smoke checks, and debugging.

## Rules

- Do not duplicate exact route request/response shapes outside `reference/api.md`.
- Do not put deployment commands inside architecture docs; link to runbooks.
- Keep `backend-conventions.md` focused on implementation conventions, not module inventory.
- Keep `backend-modules.md` as inventory. Module-specific behavior belongs in the module's architecture doc when one exists.
- Functional docs can mention routes, but should link to [API](reference/api.md) for exact contracts.
- When code changes add, remove, or rename routes, update [Backend Modules](architecture/backend-modules.md) and [API](reference/api.md).
- When schema changes, update [Database](architecture/database.md).
- When AWS, environment, deployment, reset, or smoke-test commands change, update [Deployment](runbooks/deploy.md) or [Runbooks](runbooks/README.md).

## Verification

Before committing doc changes:

- Run the Markdown link check used in prior docs commits.
- Run `git diff --check`.
- Run code checks when docs claim behavior from code.

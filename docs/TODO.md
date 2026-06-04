# Docs TODO

## Verification

- Verify [Database](architecture/database.md) against `apps/backend/prisma/schema.prisma`, all migrations in `apps/backend/prisma/migrations`, and the functional docs that reference database behavior.
- Verify [Payments](architecture/payments.md), [Fulfillment](architecture/fulfillment.md), [Notifications](architecture/notifications.md), and [Flows](reference/flows.md) against the current backend services after the next backend behavior pass.

## Coverage

- Audit [Backend](architecture/backend.md) against every route file in `apps/backend/src/modules` whenever backend modules change.
- Decide whether admin catalog CRUD should stay summarized in [Backend](architecture/backend.md) or move to a dedicated catalog/admin doc if it grows beyond route inventory plus service responsibilities.
- Add a short docs convention that says where to document code organization, exact route contracts, business flows, data model details, and operational runbooks.

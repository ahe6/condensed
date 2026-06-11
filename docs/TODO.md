# Docs TODO

## Coverage

- Audit [Backend Modules](architecture/backend-modules.md) against every route file in `apps/backend/src/modules` whenever backend modules change.

## Backend QA

- After the current frontend conversion/design pass, test the newer payment and expiration flows end to end. Cover Stripe Checkout session expiration versus 24-hour order reservation expiration, unpaid-order payment recovery, repeated `Pay Now` attempts, reservation-expired order cancellation/inventory release, webhook listener behavior, scheduled reconciliation output, admin sync, dispute handling, and local-only refund marking.

## Analytics
- At some point we have to add analytics.

## Dashboard
- Figure out what the dashboard will do. There will probably be a admin/support backend where we do stuff manually with some ai help to give recommendations for stuff and respond to the users concerns and questions and progress.

## Content
- Content like the mayo clinic health library. And content on more specific issues and like q&a style stuff from user questions answered by clinican or ai thats indexable.
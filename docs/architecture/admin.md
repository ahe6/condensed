# Admin

This doc maps the admin workspace and operator guardrails. Module internals stay in [Auth](auth.md), [Orders](orders.md), [Payments](payments.md), [Fulfillment](fulfillment.md), [Catalog](catalog.md), and [Notifications](notifications.md). Frontend implementation details stay in [Frontend](frontend.md).

Last verified against the frontend admin page and backend admin routes on 2026-06-05.

## Access

Admin access has two layers:

- Frontend route: `apps/frontend/app/admin/page.tsx`
- Backend guard: every `/admin/*` route requires a Cognito ID token with the `admin` group

The public shop does not link to `/admin`; admins open that route directly.

Admin identity comes from Cognito. The backend uses `getAdminIdentity` for admin note attribution when Cognito provides an email.

## Workspace

The admin page is a single-page workspace with two tabs:

- Orders
- Catalog

The expanded order row is the main order work surface. It includes:

- Order timestamps, customer, line items, and shipment summary
- Notes composer and note list
- Payments and payment actions
- Fulfillment line item allocation and shipment actions
- Notification records created by delivered shipment events
- Chronological timeline built from order events, notes, payment events, shipment events, tracking changes, and notification events

The expanded catalog row is the main product work surface. It includes product fields, category chips, variant editing, inventory controls, and image links.

Detailed payment and shipment audit history is folded behind per-record `History` controls. Notes stay visible on expanded orders. The activity and actions accordion starts collapsed per order so admins can scan orders first, then open the operational workspace when needed.

## Order Operations

Admins can:

- Search/filter/sort/page admin orders through SQL-backed `GET /admin/orders`.
- Search across order fields, customer names, line items, SKUs, statuses, note bodies, and note authors.
- Filter by payment status, fulfillment status, event date range, and page size.
- Sort by created, edited, placed, shipped, delivered, or total.
- Expand one order row inline.
- Add internal admin-only notes.
- Show a combined order timeline.
- Cancel orders through explicit cancellation behavior.

Admin notes are internal. They are included in admin order responses but not customer order detail or customer order history.

## Payment Operations

Admins can:

- Create manual payments.
- Mark payments authorized, paid, failed, or refunded.
- Sync Stripe payment status for Stripe payments.
- Review Stripe metadata, attempts, and payment status history.

Stripe webhooks and admin sync are the trusted payment-state paths. Browser payment state should not be treated as authoritative.

The current admin refund action is local/manual only. It does not create a Stripe refund. See [Payments](payments.md#refunds).

## Fulfillment Operations

Admins can:

- Create shipments with remaining line item quantities prefilled.
- Save carrier and tracking edits.
- Mark shipments shipped, delivered, or returned.
- Open public carrier tracking links for UPS, USPS, FedEx, and DHL.
- Review delivered-shipment notification records in the expanded order notification section and combined timeline.

Shipment creation, shipped status, and delivered status require the order payment status to be `PAID` or `AUTHORIZED`. Return is allowed for existing shipments so admins can clean up orders that were already shipped before a later payment issue.

## Catalog Operations

Admins can:

- Search/filter admin products.
- Create products and categories.
- Edit product name, slug, description, and status.
- Publish or archive products.
- Assign and remove product categories.
- Add product images.
- Add and edit product variants, prices, currencies, and inventory.

Product status controls public catalog visibility. Variant inventory edits are direct admin changes; checkout still performs transactional stock decrement checks before creating orders.

## Guardrails

- Customer-facing order reads must stay owner-scoped.
- Admin notes and admin timeline details must stay out of customer order responses.
- Fulfillment should not proceed unless payment is `PAID` or `AUTHORIZED`.
- Cancellation releases inventory only through the idempotent unpaid-order release path.
- Stripe is the source of truth for Checkout Session expiration and payment confirmation.
- Manual refund is local-only until Stripe Refund API integration exists.
- Tracking links are derived locally; the app does not call carrier APIs.

## Related Docs

- [Auth](auth.md): Cognito admin group and identity checks
- [Orders](orders.md): admin order search, notes, timeline, cancellation, and inventory release
- [Payments](payments.md): Stripe Checkout, webhooks, admin sync, disputes, refunds, and test cards
- [Fulfillment](fulfillment.md): shipment allocation, tracking, payment guardrails, and delivered notifications
- [Catalog](catalog.md): admin product/category/variant/image/inventory behavior
- [Notifications](notifications.md): delivered shipment notification records and email retry
- [Frontend](frontend.md): Next.js app structure and admin page implementation

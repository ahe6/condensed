# Fulfillment

This doc covers order shipment handling, tracking updates, and fulfillment history. Route details live in [API](api.md), table details live in [Database](database.md), and end-to-end process context lives in [Flows](flows.md).

## Current Model

Fulfillment is tracked at the order level.

- `shipments` stores the current shipment state for an order.
- `shipment_status_events` stores append-only shipment status history.
- `shipment_tracking_events` stores append-only carrier and tracking number history.
- The parent order stores the current `fulfillmentStatus`.

Shipment rows are not tied to individual order items yet. Add shipment line items before supporting partial or split fulfillment in production workflows.

## Admin Workflow

```text
admin opens an order
admin creates a shipment
admin saves carrier and tracking number when a label exists
admin marks the shipment shipped, delivered, or returned
backend updates shipment and order fulfillment status
backend records status and tracking events
frontend shows the activity in the order timeline
```

The admin UI lets operators:

- Create shipment placeholders.
- Select carrier from a dropdown.
- Save or overwrite tracking numbers.
- Open public carrier tracking links.
- Mark shipments shipped, delivered, or returned.
- Review folded shipment status and tracking history.

Tracking values can be overwritten because bad label entry is common during manual operations. The current `shipments` row stays simple, and old values remain auditable through `shipment_tracking_events`.

## Routes

```text
POST  /admin/orders/:id/shipments
PATCH /admin/shipments/:id/tracking
POST  /admin/shipments/:id/ship
POST  /admin/shipments/:id/deliver
POST  /admin/shipments/:id/return
```

`POST /admin/orders/:id/shipments` creates a shipment placeholder. Carrier and tracking number are optional.

`PATCH /admin/shipments/:id/tracking` updates carrier, tracking number, or both. At least one field is required.

Status actions update the shipment and parent order in one transaction:

- `ship`: shipment becomes `SHIPPED`, `shippedAt` is set, and order fulfillment becomes `FULFILLED`.
- `deliver`: shipment becomes `DELIVERED`, `deliveredAt` is set, and order fulfillment remains `FULFILLED`.
- `return`: shipment becomes `RETURNED`, and order fulfillment becomes `RETURNED`.

## Payment Guardrails

Shipment creation, shipped status, and delivered status require the parent order payment status to be `PAID` or `AUTHORIZED`.

Orders with `UNPAID`, `FAILED`, `DISPUTED`, or `REFUNDED` payment status should not be fulfilled.

Return is allowed on existing shipments so admin can clean up orders that were already shipped before a later payment issue.

## Tracking Links

The frontend derives tracking links locally from carrier and tracking number. Supported carrier names:

- UPS
- USPS
- FedEx
- DHL

This is link-out only. The app does not call carrier APIs or sync live carrier status.

## Timeline

Expanded admin orders show fulfillment activity in the combined order timeline:

- Shipment created
- Shipment shipped
- Shipment delivered
- Shipment returned
- Carrier or tracking number changed

Detailed shipment status and tracking events remain available behind folded `History` controls on each shipment row.

## Known Limits

- No shipment line items yet.
- No partial fulfillment math yet.
- No carrier API integration yet.
- No label purchase flow yet.
- No webhook or polling integration for live carrier delivery updates yet.

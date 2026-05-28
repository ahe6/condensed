# Fulfillment

This doc covers order shipment handling, tracking updates, and fulfillment history. Route details live in [API](api.md), notification behavior lives in [Notifications](notifications.md), table details live in [Database](database.md), and end-to-end process context lives in [Flows](flows.md).

## Current Model

Fulfillment is tracked with shipment packages and shipment line items.

- `shipments` stores the current shipment state for an order.
- `shipment_items` stores which order item quantities belong to each shipment.
- `shipment_status_events` stores append-only shipment status history.
- `shipment_tracking_events` stores append-only carrier and tracking number history.
- The parent order stores the current `fulfillmentStatus`.

This supports split shipments and partial fulfillment. The parent order status is recalculated from shipment item quantities when shipments move to shipped, delivered, or returned.

## Admin Workflow

```text
admin opens an order
admin creates a shipment
admin chooses order item quantities for that shipment
admin saves carrier and tracking number when a label exists
admin marks the shipment shipped, delivered, or returned
backend recalculates order fulfillment status
backend records status and tracking events
backend queues a delivered notification event when a shipment is delivered
frontend shows the activity in the order timeline
```

The admin UI lets operators:

- Create shipment placeholders.
- Allocate order item quantities to a shipment.
- Select carrier from a dropdown.
- Save or overwrite tracking numbers.
- Open public carrier tracking links.
- Mark shipments shipped, delivered, or returned.
- Review folded shipment status and tracking history.
- Review queued notification events.

Tracking values can be overwritten because bad label entry is common during manual operations. The current `shipments` row stays simple, and old values remain auditable through `shipment_tracking_events`.

## Routes

```text
POST  /admin/orders/:id/shipments
PATCH /admin/shipments/:id/tracking
POST  /admin/shipments/:id/ship
POST  /admin/shipments/:id/deliver
POST  /admin/shipments/:id/return
```

`POST /admin/orders/:id/shipments` creates a shipment placeholder. Carrier, tracking number, and line items are optional. When line items are omitted, the backend assigns all remaining unallocated order item quantities to the shipment.

`PATCH /admin/shipments/:id/tracking` updates carrier, tracking number, or both. At least one field is required.

Status actions update the shipment and parent order in one transaction:

- `ship`: shipment becomes `SHIPPED`, `shippedAt` is set, and order fulfillment is recalculated.
- `deliver`: shipment becomes `DELIVERED`, `deliveredAt` is set, and order fulfillment is recalculated.
- `return`: shipment becomes `RETURNED`, and order fulfillment is recalculated.

When `deliver` runs, the backend also creates a `SHIPMENT_DELIVERED` notification event for the order email. The event is idempotent per shipment, so repeated delivered actions do not create duplicate notification records.

## Fulfillment Math

Shipment creation validates that requested line item quantities belong to the order and do not exceed remaining unallocated quantity.

Order fulfillment status is based on shipped or delivered shipment item quantity:

- `UNFULFILLED`: no quantity has shipped.
- `PARTIAL`: shipped quantity is greater than zero and less than the order total quantity.
- `FULFILLED`: shipped quantity is greater than or equal to the order total quantity.
- `RETURNED`: returned shipment item quantity covers the full order quantity.

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

Delivered notification records appear in the expanded admin notification section and the combined timeline.

## Known Limits

- No carrier API integration yet.
- No label purchase flow yet.
- No SES email sending yet; delivered notifications are recorded as pending events only.
- No webhook or polling integration for live carrier delivery updates yet.
- Return handling is still shipment-level, not a full return merchandise authorization flow.

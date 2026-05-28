# Notifications

This doc covers customer notification records and the planned email-sending path. Fulfillment behavior lives in [Fulfillment](fulfillment.md), table details live in [Database](database.md), and AWS deployment details live in [Deployment](deployment.md).

## Current Model

Notifications are stored as intent/audit records in `notification_events`.

Current type:

- `SHIPMENT_DELIVERED`

Current statuses:

- `PENDING`: notification should be sent later
- `SENT`: provider accepted the message
- `FAILED`: send attempt failed
- `SKIPPED`: intentionally not sent

Important fields:

- `orderId`
- `shipmentId`
- `type`
- `recipientEmail`
- `status`
- `provider`
- `providerMessageId`
- `errorMessage`
- `sentAt`
- `metadata`

## Delivered Shipment Flow

```text
admin marks shipment delivered
backend updates shipment status and deliveredAt
backend recalculates order fulfillment status
backend creates or updates notification_events row
admin UI shows the notification event
```

The delivered notification is idempotent per shipment:

```text
unique(shipmentId, type)
```

That prevents duplicate delivered notification records if an admin presses Delivered more than once.

## Admin Visibility

Admin order responses include `notificationEvents`.

The admin frontend shows notification records in:

- The expanded order notification section
- The combined order timeline

## Email Sending Plan

The next step is to send pending notifications through Amazon SES.

Expected backend behavior:

```text
create notification event
send email through SES
mark event SENT with providerMessageId
or mark event FAILED with errorMessage
```

Expected config:

```text
EMAIL_PROVIDER=ses
EMAIL_FROM=no-reply@example.com
AWS_REGION=us-east-2
```

SES setup requirements:

- Verify sender email or sending domain.
- In SES sandbox, verify recipient emails too.
- Request SES production access before sending to arbitrary customers.

## Retry Plan

Later, add a retry command:

```sh
npm run notifications:retry
```

It should find retryable `FAILED` or stale `PENDING` notification events, send them, and update their status. This can run manually in local dev or through a scheduled AWS job later.

## Email Content Rules

Keep customer emails minimal.

Good:

```text
Your order was delivered.

View your order:
https://app.example.com/orders/ORDER_NUMBER
```

Avoid putting sensitive customer, health, or payment details directly in email content. Link back to the authenticated order page for details.

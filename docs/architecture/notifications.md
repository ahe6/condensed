# Notifications

This doc covers customer notification records and email sending. Fulfillment behavior lives in [Fulfillment](fulfillment.md), table details live in [Database](database.md), and AWS deployment details live in [Deployment](../runbooks/deploy.md).

Last verified against the backend notification service on 2026-06-04.

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
backend sends through SES when email is configured
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

## Email Sending

Pending notifications can be sent through Amazon SES.

Backend behavior:

```text
create notification event
if EMAIL_PROVIDER=ses, send email through SES
mark event SENT with providerMessageId
or mark event FAILED with errorMessage
if EMAIL_PROVIDER=none, keep event PENDING
if EMAIL_FROM is missing for SES, mark event FAILED
```

Config:

```text
EMAIL_PROVIDER=ses
EMAIL_FROM=no-reply@example.com
AWS_REGION=us-east-2
APP_BASE_URL=http://localhost:3001
```

SES setup requirements:

- Verify sender email or sending domain.
- In SES sandbox, verify recipient emails too.
- Request SES production access before sending to arbitrary customers.

`APP_BASE_URL` is used to build authenticated order links in customer emails.

## Retry

Retry pending or failed notification events with:

```sh
npm run notifications:retry
```

or:

```sh
make notifications-retry
```

The command finds `FAILED` and `PENDING` notification events, sends them when email is configured, and updates their status. Configure batch size with:

```text
NOTIFICATION_RETRY_BATCH_SIZE=50
```

This can run manually in local dev. AWS scheduling can be added later if notification retry needs to run continuously.

## Email Content Rules

Keep customer emails minimal.

Good:

```text
Your order was delivered.

View your order:
https://app.example.com/orders/ORDER_NUMBER
```

Avoid putting sensitive customer, health, or payment details directly in email content. Link back to the authenticated order page for details.

# Checkout

This doc covers the `checkout` backend module. Cart behavior lives in [Carts](carts.md), payment behavior lives in [Payments](payments.md), order behavior lives in [Orders](orders.md), and route contracts live in [API](../reference/api.md).

Last verified against backend checkout routes and services on 2026-06-07.

## Responsibilities

The `checkout` module owns the cart-to-order boundary:

- validate cart access
- validate cart has items
- validate all cart items share one currency
- validate products are active
- validate checkout authorization for assessment-required products
- validate inventory is still available
- decrement inventory
- create the order
- snapshot addresses and line items
- clear the cart
- optionally create a Stripe Checkout Session after order creation

Routes:

- `POST /checkout`
- `POST /checkout/stripe`

Both routes require the current signed-in user.

## Order Creation

Checkout runs order creation in a Prisma transaction.

Inside the transaction, the backend:

1. loads the cart and variants
2. rejects empty carts
3. rejects cart access by the wrong user
4. rejects mixed currencies
5. rejects inactive products
6. rejects assessment-required products without an active checkout authorization for the signed-in user
7. checks current inventory
8. decrements variant inventory with guarded updates
9. creates the order as `PLACED`
10. snapshots shipping and billing addresses
11. snapshots product name, variant title, SKU, unit price, quantity, and line total
12. clears cart items
13. marks used checkout authorizations as `USED`

Order numbers use the `HEALTH-...` prefix.

## Stripe Checkout

`POST /checkout/stripe` performs normal order creation first. After the order exists, it builds an order-detail return URL and calls `createStripeCheckoutSession` from the `payments` module.

The response includes both:

- `order`
- `checkoutSession`

This lets the frontend render Stripe Checkout Elements for the newly created order.

## Key Functions

- `checkoutCart(input, options)`: single transaction that validates cart ownership, rejects empty carts, rejects inactive products and mixed currencies, requires checkout authorization for assessment-required products, decrements inventory with `updateMany` guards, creates the placed order with a 24-hour `reservationExpiresAt` deadline, creates addresses/items, clears the cart, and marks used checkout authorizations. This is the inventory reservation point for customer checkout.
- `POST /checkout/stripe`: route-level flow that calls `checkoutCart` first, then calls `createStripeCheckoutSession` from the payments module for the newly created order. If Stripe session creation fails after the order transaction commits, the order exists with reserved inventory and needs normal unpaid-order reconciliation/cancellation handling.

## Inventory And Expiry

Checkout decrements inventory when the order is created, before Stripe payment completes.

If the customer does not complete Stripe Checkout, the order reservation expires after 24 hours. The scheduled/manual reconciliation flow still checks old open Stripe Checkout attempts against Stripe, but Stripe session expiration only closes the local payment attempt. The app-owned order reservation deadline is what prevents unpaid orders from holding inventory forever. Reservation expiration and manual cancellation use `orders.inventoryReleasedAt` to avoid double release.

## Relationship To Other Modules

- `carts` owns mutable cart operations before checkout.
- `checkout` owns the transition from mutable cart to durable order.
- `checkout-authorizations` owns the short-lived approval records consumed by cart and checkout.
- `payments` owns Stripe Checkout Session creation and payment reconciliation.
- `orders` owns later order lookup, cancellation, and expiry inventory release.

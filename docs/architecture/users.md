# Users

This doc covers the `users` backend module. Auth identity behavior lives in [Auth](auth.md), route contracts live in [API](../reference/api.md), and user/address tables live in [Database](database.md).

Last verified against backend user routes and services on 2026-06-05.

## Responsibilities

The `users` module owns:

- basic user listing and creation
- saved customer addresses
- address ownership checks
- default shipping and billing address handling

Routes:

- `GET /users`
- `POST /users`
- `GET /me/addresses`
- `POST /me/addresses`
- `PATCH /me/addresses/:id`
- `DELETE /me/addresses/:id`

## Saved Addresses

Saved address routes use the current Cognito user from the `auth` module. A signed-in user can only list, create, update, or delete their own saved addresses.

Address records can be marked as default shipping or default billing.

When creating the first saved address for a user, the backend makes it the default shipping and billing address unless the request explicitly says otherwise.

When an address is created or updated with `isDefaultShipping=true`, the backend clears the previous default shipping address for that user in the same transaction. `isDefaultBilling=true` does the same for billing.

## Relationship To Checkout

Checkout snapshots address fields into `order_addresses` instead of linking orders to saved `addresses`. This means later address edits do not rewrite historical orders.

The current checkout API accepts address fields directly. The frontend may use saved addresses to populate those fields, but the order snapshot is still owned by checkout.

## Notes

`GET /users` and `POST /users` are basic backend user routes and are not under the `/admin/*` pre-handler. Cognito signup and local user linking are handled by [Auth](auth.md).

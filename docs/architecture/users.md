# Users

This doc covers the `users` backend module. Auth identity behavior lives in [Auth](auth.md), route contracts live in [API](../reference/api.md), and user/address tables live in [Database](database.md).

Last verified against backend user routes and services on 2026-06-07.

## Responsibilities

The `users` module owns:

- basic user listing and creation
- saved customer addresses
- address ownership checks
- default shipping and billing address handling

Routes:

- `GET /admin/users`
- `POST /admin/users`
- `GET /me/addresses`
- `POST /me/addresses`
- `PATCH /me/addresses/:id`
- `DELETE /me/addresses/:id`

`/admin/users` routes are operational/dev-admin routes and use the shared `/admin/*` Cognito admin-group guard.

## Saved Addresses

Saved address routes use the current Cognito user from the `auth` module. A signed-in user can only list, create, update, or delete their own saved addresses.

Address records can be marked as default shipping or default billing.

When creating the first saved address for a user, the backend makes it the default shipping and billing address unless the request explicitly says otherwise.

When an address is created or updated with `isDefaultShipping=true`, the backend clears the previous default shipping address for that user in the same transaction. `isDefaultBilling=true` does the same for billing.

## Key Functions

- `createUserAddress(userId, input)`: creates an address in a transaction and automatically makes the first address the default shipping and billing address unless the input overrides that behavior.
- `updateUserAddress(userId, addressId, input)`: first proves the address belongs to the user, then clears any previous default shipping or billing address when the update makes this address default.
- `deleteUserAddress(userId, addressId)`: first proves ownership, then deletes the address. It does not currently promote a replacement default address.

## Relationship To Checkout

Checkout snapshots address fields into `order_addresses` instead of linking orders to saved `addresses`. This means later address edits do not rewrite historical orders.

The current checkout API accepts address fields directly. The frontend may use saved addresses to populate those fields, but the order snapshot is still owned by checkout.

## Notes

Cognito signup and local user linking are handled by [Auth](auth.md). Public customer code should use `/me` and `/me/addresses`, not direct user creation routes.

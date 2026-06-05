# Carts

This doc covers the `carts` backend module. Product/variant behavior lives in [Catalog](catalog.md), checkout behavior lives in [Checkout](checkout.md), and route contracts live in [API](../reference/api.md).

Last verified against backend cart routes and services on 2026-06-05.

## Responsibilities

The `carts` module owns:

- anonymous carts
- signed-in customer carts
- adopting or merging a browser-local cart into a signed-in user's cart
- cart ownership checks
- cart item add/update/remove/clear behavior
- cart totals returned to the frontend

Routes:

- `GET /me/cart`
- `POST /me/cart`
- `POST /carts`
- `GET /carts/:id`
- `POST /carts/:id/items`
- `PATCH /carts/:id/items/:itemId`
- `DELETE /carts/:id/items/:itemId`
- `DELETE /carts/:id/items`

## Anonymous And User Carts

Anonymous carts are identified by cart ID in the browser. They have `userId=null`.

Signed-in clients should call `POST /me/cart` at startup. If the request includes a browser-local `cartId`, the backend tries to adopt or merge that cart into the signed-in user's cart.

If the user does not already have a different cart, the browser-local cart is assigned to the user. If the user already has a cart, items from the browser-local cart are merged into the user's existing cart and the source cart is deleted.

## Ownership

User-owned carts can only be read or mutated by that user. If a cart has a `userId` and the caller is anonymous or a different user, the backend returns a cart access error.

Anonymous carts can be read or mutated by ID until they are adopted by a signed-in user.

## Cart Items

Cart items reference `product_variants`, not products.

Adding an item increments the existing row when the same variant is already in the cart. Updating an item sets the quantity directly. Removing an item deletes that row. Clearing a cart deletes all rows for the cart.

The backend rejects inactive products, invalid variants, and requested quantities above current variant inventory.

## Totals

Cart totals are calculated from current variant prices every time the cart is returned.

Returned totals include:

- `itemCount`
- `subtotal`
- `total`

Cart totals are previews. Checkout recalculates and snapshots authoritative order totals.

## Key Functions

- `getOrCreateUserCart(userId, input)`: loads the latest user cart, creates one when needed, or adopts/merges the provided browser-local cart ID into the signed-in user's cart.
- `addCartItem(cartId, input, actorUserId)` / `updateCartItemQuantity(...)`: enforce cart ownership when the cart has a user, require the product to be active, and reject quantities above current inventory.
- `clearCart(cartId, actorUserId)`: deletes cart items only after the same cart access check used by item operations.
- `adoptCartForUser(userId, cartId)`: private helper that validates source cart access, validates merged quantities against current inventory, merges duplicate variants into the user's existing cart when present, and deletes the source cart after a successful merge.

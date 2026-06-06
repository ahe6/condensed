# Catalog

This doc covers public catalog behavior and admin catalog management. Route contracts live in [API](../reference/api.md), module inventory lives in [Backend Modules](backend-modules.md), and table details live in [Database](database.md).

Last verified against backend catalog routes and services on 2026-06-05.

## Model

Catalog data is split across:

- `products`: merchandised product pages
- `product_variants`: purchasable SKUs with price, currency, and inventory
- `product_images`: display images for products
- `categories`: navigation taxonomy
- `product_categories`: product/category join table

Cart items and order items reference variants. Products are for display, grouping, status, and purchase mode.

## Public Catalog

Public product routes expose only active products:

- `GET /products`
- `GET /products/:slug`

The category route returns all categories ordered by name:

- `GET /categories`

Product list/detail responses include variants, images, and category joins so the frontend can render product cards, product detail, and variant selection without separate calls.

Public product browsing should treat variants as the purchasable unit. A product without a usable active variant is not enough to sell on its own.

`purchaseMode` controls whether the frontend should show direct add-to-cart controls or an assessment-first CTA. The backend still owns the rule: carts and checkout only allow `DIRECT` products.

## Admin Catalog

Admin catalog routes are protected by the global `/admin/*` Cognito admin pre-handler.

Admin routes:

- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/publish`
- `POST /admin/products/:id/archive`
- `POST /admin/products/:id/categories`
- `DELETE /admin/products/:id/categories/:categoryId`
- `POST /admin/products/:id/images`
- `POST /admin/products/:id/variants`
- `PATCH /admin/variants/:id`
- `PATCH /admin/variants/:id/inventory`
- `POST /admin/categories`

Admin product list returns every product status, including `DRAFT` and `ARCHIVED`, so operators can stage or recover catalog records.

## Product Status

Product status controls public visibility:

- `DRAFT`: editable staging state; hidden from public product list/detail
- `ACTIVE`: visible to public product routes
- `ARCHIVED`: retained for history/admin visibility; hidden from public product routes

The backend uses explicit publish/archive routes instead of generic status patching.

## Purchase Mode

Product purchase mode controls checkout eligibility:

- `DIRECT`: variants can be added to carts and checked out.
- `ASSESSMENT_REQUIRED`: public product data can be displayed, but variants cannot be added to carts or checked out.

This is enforced in the cart and checkout services, not only in the frontend. The frontend uses the same `purchaseMode` field to route care-program products into `/intake/[slug]`.

## Inventory

Variant inventory is stored on `product_variants.inventoryQuantity`.

Cart updates reject quantities above current inventory. Checkout revalidates inventory inside the order-creation transaction before decrementing inventory. Admin inventory edits use `PATCH /admin/variants/:id/inventory`.

There is no inventory movement ledger yet. The current record is the variant's live sellable quantity.

## Key Functions

- `listProducts()` / `getProductBySlug(slug)`: public catalog reads only return `ACTIVE` products.
- `listAdminProducts()`: admin catalog reads include draft, active, and archived products.
- `setProductStatus(productId, status)`: controls public visibility through product status. It does not change cart contents or already-created orders.
- `setVariantInventory(variantId, input)`: directly sets inventory for a variant. Checkout still performs transactional stock decrement checks before creating orders.

## Relationships To Other Flows

Catalog services are upstream of cart and checkout:

- carts reject inactive products and invalid variants
- carts reject variants whose product `purchaseMode` is `ASSESSMENT_REQUIRED`
- checkout snapshots product/variant names, SKU, unit price, and quantity into order items
- checkout revalidates product status, purchase mode, and inventory before creating orders
- order history remains readable if product names, variants, or images change later

Catalog data should stay operationally simple until product options, inventory movement history, or supplier/vendor workflows become real requirements.

# Catalog

This doc covers public catalog behavior and admin catalog management. Route contracts live in [API](../reference/api.md), module inventory lives in [Backend Modules](backend-modules.md), and table details live in [Database](database.md).

Last verified against backend catalog routes, cart checks, and checkout checks on 2026-06-07.

## Model

Catalog data is split across:

- `products`: merchandised product pages
- `product_variants`: purchasable SKUs with price, currency, and inventory
- `product_images`: display images for products
- `categories`: navigation taxonomy
- `product_categories`: product/category join table
- `assessment_templates` and `assessment_questions`: intake definitions for assessment-required products
- `assessment_submissions` and `assessment_answers`: submitted intake data for assessment-required products
- `assessment_recommendations`: ranked product recommendations from goal intakes
- `checkout_authorizations`: approved assessment decisions that unlock cart/checkout for a signed-in user

Cart items and order items reference variants. Products are for display, grouping, status, and purchase mode.

## Public Catalog

Public product routes expose only active products:

- `GET /products`
- `GET /products/:slug`
- `GET /products/:slug/assessment`
- `POST /products/:slug/assessment/submissions`
- `GET /goals/:goalKey/assessment`
- `POST /goals/:goalKey/assessment/submissions`

The category route returns all categories ordered by name:

- `GET /categories`

Product list/detail responses include variants, images, and category joins so the frontend can render product cards, product detail, and variant selection without separate calls.

Public product browsing should treat variants as the purchasable unit. A product without a usable active variant is not enough to sell on its own.

`purchaseMode` controls whether the frontend should show direct add-to-cart controls or an assessment-first CTA. The backend still owns the rule: carts and checkout allow `DIRECT` products, and only allow `ASSESSMENT_REQUIRED` products when the signed-in user has an active checkout authorization.

`GET /products/:slug/assessment` returns the latest active assessment definition for active products with `purchaseMode=ASSESSMENT_REQUIRED`. `POST /products/:slug/assessment/submissions` validates answers against that active definition, records the automated decision, and creates a checkout authorization for approved submissions. Direct-purchase products do not have public assessment definitions.

Goal assessment routes return goal-intake definitions and save goal-linked submissions that create ranked product recommendations. Recommendations can point at direct or assessment-required products; they do not bypass product purchase mode.

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
- `ASSESSMENT_REQUIRED`: public product data can be displayed, but variants require a signed-in user with an active checkout authorization before cart add or checkout.

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
- carts reject assessment-required variants unless the signed-in user has an active checkout authorization
- checkout snapshots product/variant names, SKU, unit price, and quantity into order items
- checkout revalidates product status, purchase mode, checkout authorization, and inventory before creating orders
- order history remains readable if product names, variants, or images change later

Catalog data should stay operationally simple until product options, inventory movement history, or supplier/vendor workflows become real requirements.

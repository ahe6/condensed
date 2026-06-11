# Frontend Care And Commerce Architecture

This is the frontend-first target architecture for separating transactional ecommerce from healthcare guidance. It is intentionally a UI and product-architecture plan first. Do not treat the backend schema names here as implemented until the backend docs and migrations say so.

## Intent

The app should not make the product catalog carry every job.

There are two customer entry modes:

- **Commerce layer**: for customers who already know what they want.
- **Care layer**: for customers who start from a goal, symptom, condition, lab question, medical history, or clinician-reviewed care path.

Both layers can converge on the same underlying offerings. The difference is the customer mental model and the information needed before checkout.

## Current Frontend Baseline

Implemented today:

- `/`: outcome-first storefront landing page.
- `/shop`: image-led outcome/program storefront for goal-driven entry.
- `/catalog`: full product list with direct checkout or assessment-first CTAs.
- `/products/[slug]`: product detail for direct-purchase products.
- `/goals/[goalKey]`: goal intake and recommendation flow.
- `/intake/[slug]`: product-specific assessment flow.
- `/my-health`: Patient Portal route and default signed-in healthcare dashboard shell.
- `/cart`, `/orders`, `/account`, `/addresses`: ecommerce/account support routes.

This gives the first pieces of both layers. `/my-health` is the route behind the customer-facing **Patient Portal** nav item; `/account` is profile/settings rather than the primary dashboard.

## Commerce Layer

Commerce owns product discovery for known intent and transaction mechanics, but healthcare programs should still start from outcomes rather than a visible multi-item cart.

Candidate routes:

- `/shop`
- `/shop/catalog`
- `/shop/products/[slug]`
- `/cart`
- `/orders`
- `/orders/[orderNumber]`

Frontend responsibilities:

- Outcome/program browsing
- Product browsing for direct items and utility catalog use
- Product detail pages
- Direct add-to-cart flows
- Cart management
- Checkout and payment recovery
- Order history and shipment status
- Direct-product inventory and variant display

The current `/catalog`, `/products/[slug]`, `/cart`, and `/orders` routes are mostly commerce-layer routes.

## Care Layer

Care owns health context, clinician-in-the-loop flows, and longitudinal customer state.

Candidate routes:

- `/care`
- `/care/goals/[goalKey]`
- `/care/conditions/[conditionKey]`
- `/care/intake/[slug]`
- `/care/history`
- `/care/labs`
- `/care/results`
- `/care/reviews`
- `/care/plans`

Frontend responsibilities:

- Goal, symptom, and condition entry
- Product-specific and goal-specific assessments
- Medical history collection
- Lab order/result surfaces
- Clinician review status
- Care plan and treatment state
- Eligibility/recommendation explanations
- Follow-up questions and review notes later

The current `/goals/[goalKey]` and `/intake/[slug]` routes are early care-layer routes.

## Shared Customer Shell

The customer-facing nav should eventually express the layers directly:

```text
Shop | Get Care | Patient Portal
```

Suggested meaning:

- **Shop**: direct commerce entry.
- **Get Care**: guided goal, symptom, condition, lab, and clinician-review entry.
- **Patient Portal**: signed-in dashboard for active care, history, lab results, care plans, reviews, orders, and account state.

Cart remains a checkout route at `/cart`, but it is treated as a commerce utility for direct-purchase items and recovery links rather than a primary centered navigation mode or the main healthcare-program mental model.

The shell can stay one Next.js app. The split is conceptual and route-level, not a separate frontend deployment.

Generic successful Cognito sign-in should land on the **Patient Portal** at `/my-health`. Flows with in-progress work, such as checkout, admin, orders, addresses, and assessments, should pass an explicit return path so users land back where the work started.

## Patient Portal Dashboard

Avoid one generic dashboard that tries to make labs, hair loss, and weight care look identical.

Use a shared account shell with domain-specific panels:

- Active care plans
- Assessment/review status
- Medical history completeness
- Lab orders and results
- Conditions/goals being tracked
- Recommended next steps
- Orders and payment status
- Addresses/account details

Examples:

- A labs customer needs result status, result summaries, and follow-up recommendations.
- A hair-loss customer needs treatment status, refill/order state, follow-up questions, and clinician review.
- A weight-care customer may need labs, clinician review, medication/order state, and progress check-ins.

## Offering Convergence

The same backend product/offering can appear differently depending on layer:

- Commerce framing: `GLP-1 Weight Care Consult`
- Care framing: `I want help losing weight`
- Patient Portal framing: `Weight care plan: awaiting review`, `Labs due`, or `Medication ordered`

Frontend should use layer-specific copy and UI, even when the final checkout item is the same.

## Future Backend Concepts

These are not implemented by this frontend pass. They are likely backend/data concepts needed as care grows:

- Patient profile
- Medical history entries
- Conditions
- Goals
- Lab orders
- Lab results
- Clinical reviews
- Care plans
- Care plan items
- Clinician notes
- Encounters or case files
- Messages or review comments

Keep current frontend prototypes static or API-compatible with the existing assessment/product/order endpoints until these backend concepts are designed.

## Migration Strategy

1. Keep existing functional routes working.
2. Add new care/commerce navigation and landing surfaces.
3. Let new routes initially wrap or link to existing routes.
4. Move route implementation only when the new structure is stable.
5. Update docs and redirects when old routes become aliases.

Near-term safe steps:

- Keep `/catalog` working, but use `/shop` as the outcome/program storefront.
- Keep `/goals/[goalKey]` and `/intake/[slug]` working, but introduce `/care` as the guided entry.
- Keep `/my-health` as the Patient Portal dashboard shell using existing orders, assessments, and account data where available.
- Avoid DB schema changes until the care dashboard and clinician/labs UX is clearer.

# Assessments

Assessment definitions are backend-owned templates used by care-program intake pages.

Last verified against backend assessment routes and services on 2026-06-06.

## Scope

The current implementation stores and serves assessment definitions only. It does not persist user submissions, create provider review records, create prescriptions, or unlock checkout.

## Routes

Public route:

```text
GET /products/:slug/assessment
```

The route returns the latest active assessment template for an active product whose `purchaseMode` is `ASSESSMENT_REQUIRED`.

Direct-purchase products return `404` for this route.

## Model

Assessment data is split across:

- `assessment_templates`: versioned templates tied to a product
- `assessment_questions`: ordered questions tied to a template

Question types:

- `SINGLE_SELECT`
- `MULTI_SELECT`
- `TEXT`
- `NUMBER`
- `BOOLEAN`

Question options are stored as JSON for now. This keeps early template iteration simple while the intake and review workflow is still forming.

## Key Functions

- `getActiveAssessmentForProductSlug(slug)`: returns the latest active assessment template for an active assessment-required product, with questions ordered by `sortOrder`.

## Relationships

The frontend intake route loads the product first, then loads this assessment template when `product.purchaseMode` is `ASSESSMENT_REQUIRED`.

Cart and checkout services still reject assessment-required products. Completing the current intake prototype does not make a product checkout-eligible.

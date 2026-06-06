# Assessments

Assessment definitions are backend-owned templates used by care-program intake pages. Submitted intake answers are persisted for later review work.

Last verified against backend assessment routes and services on 2026-06-06.

## Scope

The current implementation stores assessment definitions and submitted answers. It does not create provider review records, create prescriptions, or unlock checkout.

## Routes

Public route:

```text
GET /products/:slug/assessment
POST /products/:slug/assessment/submissions
```

`GET /products/:slug/assessment` returns the latest active assessment template for an active product whose `purchaseMode` is `ASSESSMENT_REQUIRED`.

`POST /products/:slug/assessment/submissions` requires a Cognito bearer token. It validates submitted answers against the same active template, creates an `assessment_submissions` row linked to the current local user, and creates one `assessment_answers` row per template question.

Anonymous submission requests return `401`. Direct-purchase products return `404` for these routes.

## Model

Assessment data is split across:

- `assessment_templates`: versioned templates tied to a product
- `assessment_questions`: ordered questions tied to a template
- `assessment_submissions`: submitted intake instance tied to the active template, product, user, and email
- `assessment_answers`: JSON answer values tied to a submission and question

Question types:

- `SINGLE_SELECT`
- `MULTI_SELECT`
- `TEXT`
- `NUMBER`
- `BOOLEAN`

Question options are stored as JSON for now. This keeps early template iteration simple while the intake and review workflow is still forming.

Answer values are stored as JSON so text, number, boolean, single-select, and multi-select answers can share one table.

## Key Functions

- `getActiveAssessmentForProductSlug(slug)`: returns the latest active assessment template for an active assessment-required product, with questions ordered by `sortOrder`.
- `submitAssessmentForProductSlug(slug, input, options)`: validates submitted answers against the active template and persists the submission plus answers.

## Relationships

The frontend intake route loads the product first, then loads this assessment template when `product.purchaseMode` is `ASSESSMENT_REQUIRED`. Required selects start blank so an untouched form cannot be submitted. If the customer is not signed in after answering, the page stores a local draft, sends the customer through Cognito, returns to the same intake URL, and then submits the saved answers. On submit, the page posts the answer map to `POST /products/:slug/assessment/submissions` and shows the returned submission state.

Cart and checkout services still reject assessment-required products. Completing the current intake flow does not make a product checkout-eligible.

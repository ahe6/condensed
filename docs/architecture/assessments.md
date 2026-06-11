# Assessments

Assessment definitions are backend-owned templates used by care-program and goal-intake pages. Submitted answers are persisted, evaluated by backend policy code, and either generate recommendations or unlock checkout when approved.

Last verified against backend assessment routes and services on 2026-06-07.

## Scope

The current implementation stores product and goal intake definitions, validates submitted answers, records automated decisions, creates ranked product recommendations for goal intakes, and creates a short-lived checkout authorization for approved product intakes. It does not create provider review records, create prescriptions, or run product-specific clinical policies yet.

## Routes

Public route:

```text
GET /products/:slug/assessment
POST /products/:slug/assessment/submissions
GET /goals/:goalKey/assessment
POST /goals/:goalKey/assessment/submissions
GET /admin/assessment-submissions
```

`GET /products/:slug/assessment` returns the latest active assessment template for an active product whose `purchaseMode` is `ASSESSMENT_REQUIRED`.

`POST /products/:slug/assessment/submissions` requires a Cognito bearer token. It validates submitted answers against the same active template, evaluates the product-intake policy, creates an `assessment_submissions` row linked to the current local user, and creates one `assessment_answers` row per template question. Approved submissions also create a `checkout_authorizations` row for that user and product.

`GET /goals/:goalKey/assessment` returns the latest active goal-intake template for a goal key such as `weight-loss`, `hair-loss`, or `wellness-labs`.

`POST /goals/:goalKey/assessment/submissions` requires a Cognito bearer token. It validates answers, saves a goal-linked `assessment_submissions` row, saves answers, and creates ranked `assessment_recommendations` rows. Goal submissions do not create checkout authorizations.

`GET /admin/assessment-submissions` requires admin access and returns recent product and goal submissions with answers, recommendations, checkout authorizations, linked user, product, and template context.

Anonymous submission requests return `401`. Direct-purchase products return `404` for these routes.

## Model

Assessment data is split across:

- `assessment_templates`: versioned templates tied to a product or, later, a goal intake
- `assessment_questions`: ordered questions tied to a template
- `assessment_submissions`: submitted intake instance tied to the active template, product, user, and email
- `assessment_answers`: JSON answer values tied to a submission and question
- `assessment_recommendations`: ranked products generated from a goal intake submission
- `checkout_authorizations`: short-lived approval token that lets one signed-in user add/check out an assessment-required product

Question types:

- `SINGLE_SELECT`
- `MULTI_SELECT`
- `TEXT`
- `NUMBER`
- `BOOLEAN`

Question options are stored as JSON for now. This keeps early template iteration simple while the intake and review workflow is still forming.

Answer values are stored as JSON so text, number, boolean, single-select, and multi-select answers can share one table.

## Decisions

Assessment questions and templates are database-owned so intake content can change without code changes. Eligibility rules are code-owned so approval logic is versioned, reviewed, and deployed like any other business rule.

Current product-intake decisions use `product-intake-basic-v1`:

- `timeframe=researching` returns `REVIEW_REQUIRED` with reason `customer_researching`.
- All other valid submissions return `APPROVED` with reason `basic_eligible`.

Approved submissions create an active checkout authorization that expires after 14 days. Review-required and rejected submissions do not unlock cart or checkout.

Current goal-intake recommendations use `goal-intake-recommendations-v1`. Goal policy maps a `goalKey` plus normalized answers to ranked active product recommendations. These recommendations are merchandising/navigation guidance only; the customer must still complete the chosen product's product-intake assessment before checkout can unlock for assessment-required products.

## Key Functions

- `getActiveAssessmentForProductSlug(slug)`: returns the latest active assessment template for an active assessment-required product, with questions ordered by `sortOrder`.
- `getActiveAssessmentForGoalKey(goalKey)`: returns the latest active goal-intake template for the provided goal key, with questions ordered by `sortOrder`.
- `submitAssessmentForProductSlug(slug, input, options)`: validates submitted answers against the active template, records the policy decision and answers, and creates a checkout authorization when the decision is approved.
- `submitAssessmentForGoalKey(goalKey, input, options)`: validates goal-intake answers, saves the submission, and creates ranked product recommendations.
- `listAdminAssessmentSubmissions()`: returns recent assessment submissions with review context for the admin Review tab.
- `evaluateProductIntakeAssessment(answers)`: code-owned product-intake policy entry point. It returns the decision status, reason, policy ID, and policy version saved on the submission.
- `evaluateGoalIntakeRecommendations(goalKey, answers)`: code-owned recommendation policy entry point. It returns ranked product slugs, reason codes, reason text, policy ID, and policy version.

## Relationships

The frontend intake route loads the product first, then loads this assessment template when `product.purchaseMode` is `ASSESSMENT_REQUIRED`. It renders one question at a time with progress controls. Required selects start blank so an untouched form cannot be submitted. If the customer is not signed in after answering, the page stores a local draft, sends the customer through Cognito, returns to the same intake URL, and then submits the saved answers.

On submit, the page posts the answer map to `POST /products/:slug/assessment/submissions` and shows the returned decision. Approved customers can continue to cart immediately; the cart add succeeds because the backend finds the active checkout authorization. Review-required and rejected customers do not get checkout access.

Cart and checkout services enforce the same rule server-side. An assessment-required variant is only allowed when the signed-in user has an active checkout authorization for the product or exact variant.

Goal intake is a higher-level discovery flow. It saves answers and recommendations, but it does not put products in cart, create orders, or grant checkout access.

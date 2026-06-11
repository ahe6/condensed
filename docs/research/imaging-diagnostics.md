# Imaging diagnostics reference

Source date: 2026-06-09

This is a working reference for adding imaging to the `Labs & Imaging` surface. It is not a clinical protocol. Imaging products should route through review/intake before scheduling because modality choice, urgency, safety, eligibility, radiation, contrast, and follow-up vary by person and indication.

## Sources checked

- RadiologyInfo: [Cardiac CT for Calcium Scoring](https://www.radiologyinfo.org/en/info/ct_calscoring)
- RadiologyInfo: [Lung Cancer Screening](https://www.radiologyinfo.org/en/info/screening-lung)
- RadiologyInfo: [MRI Safety](https://www.radiologyinfo.org/en/info/safety-mr)
- RadiologyInfo: [Bone Densitometry / DEXA](https://www.radiologyinfo.org/en/info/dexa)
- RadiologyInfo: [General Ultrasound](https://www.radiologyinfo.org/en/info/genus)
- FDA: [MRI safety and implants](https://www.fda.gov/radiation-emitting-products/mri-magnetic-resonance-imaging/mri-safety)

## Initial site categories

### CT imaging

Seeded products:

- Heart CT Calcium Score Review
- Low-Dose Lung CT Screening Review

Notes:

- CT uses ionizing radiation, so it should not be presented like a casual wellness test.
- Coronary artery calcium scoring is a cardiovascular risk tool, not a general chest CT.
- Low-dose lung CT screening needs eligibility review, especially smoking history, age, symptoms, and prior imaging.
- CT workflows need a radiology partner, ordering flow, result delivery, and follow-up plan.

### MRI

Seeded products:

- Brain MRI Review
- Spine MRI Review
- Joint MRI Review
- Abdomen & Pelvis MRI Review

Notes:

- MRI should be review-first because metal implants, devices, pregnancy context, kidney function, contrast, claustrophobia, and urgency can change the plan.
- Whole-body MRI should not be a first product. It creates a high incidental-finding burden and needs stronger clinical positioning.
- MRI category pages should help users choose the body area and reason for imaging before any scheduling step.

### Ultrasound

Seeded products:

- Thyroid Ultrasound Review
- Abdominal Ultrasound Review
- Pelvic Ultrasound Review
- Vascular Ultrasound Review

Notes:

- Ultrasound can be a strong consumer-facing category because it avoids ionizing radiation and maps to common focused questions.
- Pelvic and vascular ultrasound need careful symptom and urgency triage.
- Thyroid ultrasound pairs naturally with hormone/thyroid lab flows.

### DEXA

Seeded products:

- DEXA Bone Density Review
- DEXA Body Composition Review

Notes:

- Bone density fits menopause, hormone health, fracture risk, and long-term prevention.
- Body composition fits metabolic health and fitness, but copy should distinguish it from diagnostic bone density testing.
- DEXA uses low-dose X-ray technology, so keep radiation language accurate.

### Breast imaging

Seeded product:

- Screening Mammogram Review

Notes:

- Needs age, symptoms, risk, history, and prior imaging review.
- Do not mix screening mammogram, diagnostic mammogram, breast ultrasound, and breast MRI without routing logic.
- Symptomatic breast concerns should not be handled as a simple self-serve product card.

### X-ray

Seeded product:

- X-ray Imaging Review

Notes:

- Lower priority than CT/MRI/ultrasound/DEXA for our first diagnostic page.
- Useful later for orthopedic or focused symptom flows.
- Needs clear review around injury timing, urgent symptoms, and whether imaging is appropriate.

## Product model choice

Current seed uses normal catalog products with:

- `purchaseMode: ASSESSMENT_REQUIRED`
- one `Review request` variant at `0.00`
- `imaging` plus one modality category
- a generic product-intake assessment template for each imaging product

This keeps imaging visible in the site while avoiding direct cart checkout. Later, we should replace the generic assessment with imaging-specific questions:

- body area and side
- symptom or screening reason
- urgency/red flags
- prior imaging and results
- pregnancy status where relevant
- implant/device/metal history for MRI
- contrast allergy and kidney disease context when relevant
- preferred imaging location and scheduling constraints
- provider/radiologist follow-up preference

## UX recommendation

Use `Labs & Imaging` as the top nav label and page title. Keep the page split by diagnostic type:

- Lab panels
- CT
- MRI
- Ultrasound
- DEXA
- Breast imaging
- X-ray

The first action should be `Start review`, not `Buy now`, for imaging. Lab products can continue to link to product detail/direct purchase where appropriate.

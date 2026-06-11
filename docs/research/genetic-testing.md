# Genetic testing reference

Source date: 2026-06-09

This is a working reference for the `/genetic-testing` page and seeded genetics products. It is not a clinical protocol. Most clinical genetic tests should route through review, consent, and result interpretation because test scope, family history, secondary findings, privacy, and confirmatory follow-up matter.

## Sources checked

- MedlinePlus Genetics: [What are the different types of genetic tests?](https://medlineplus.gov/genetics/understanding/testing/types/)
- MedlinePlus: [Genetic Testing](https://medlineplus.gov/genetictesting.html)
- MedlinePlus Genetics: [What kinds of direct-to-consumer genetic tests are available?](https://medlineplus.gov/genetics/understanding/dtcgenetictesting/dtctesttypes/)
- FDA: [Direct-to-Consumer Tests](https://www.fda.gov/medical-devices/in-vitro-diagnostics/direct-consumer-tests)
- FDA: [Pharmacogenetic tests and genetic tests for heritable markers guidance](https://www.fda.gov/files/medical%20devices/published/Pharmacogenetic-Tests-and-Genetic-Tests-for-Heritable-Markers---Guidance-for-Industry-and-FDA-Staff.pdf)
- ACMG: [Secondary findings in clinical exome and genome sequencing, 2021 update](https://www.nature.com/articles/s41436-021-01171-4)

## Initial site categories

### Whole genome sequencing

Seeded products:

- 30x Whole Genome Sequencing Review
- 15x Whole Genome Sequencing Review

Notes:

- WGS looks broadly across the genome. A 30x label usually refers to average sequencing depth, but coverage is not the same thing as clinical completeness.
- WGS can raise secondary finding, privacy, data-storage, reanalysis, and family-member implications.
- Copy should avoid implying that WGS detects every genetic condition or replaces clinician-directed testing.

### Whole exome sequencing

Seeded products:

- Whole Exome Sequencing Review
- Rare Disease Genetics Review

Notes:

- WES focuses on protein-coding regions rather than the whole genome.
- Often useful when targeted testing has not answered a clear diagnostic question, but it still has limitations.
- Trio testing, parental samples, prior records, and phenotype detail can matter.

### Genetic panels

Seeded products:

- Targeted Gene Panel Review
- Rare Disease Genetics Review
- Hereditary Cancer Risk Panel Review
- Cardiovascular Genetics Panel Review
- Mitochondrial DNA Testing Review

Notes:

- Panels can be better than WGS/WES when the question is focused and the genes are well-defined.
- Panel selection should follow the health question, personal history, and family history.
- Result interpretation can include pathogenic, likely pathogenic, benign, likely benign, and variant-of-uncertain-significance categories.

### Carrier screening

Seeded product:

- Expanded Carrier Screening Review

Notes:

- Carrier screening is usually family-planning-oriented.
- Partner testing, residual risk, ancestry limitations, and reproductive options need careful explanation.
- A positive carrier result often does not mean the tested person has the condition.

### Pharmacogenomics

Seeded product:

- Pharmacogenomics Review

Notes:

- Pharmacogenomics may inform medication metabolism or response discussions.
- It should not promise that a test can determine the correct medication or dose by itself.
- FDA notes concerns around unsupported pharmacogenetic claims, so copy should stay conservative.

### Familial variant testing

Seeded product:

- Known Familial Variant Testing Review

Notes:

- Best fit when there is documentation of a specific variant found in a relative.
- Testing should target the known variant rather than ordering a broad test by default.
- Result implications can extend to relatives.

### Chromosomal testing

Seeded products:

- Chromosomal Microarray Review
- Karyotype Testing Review

Notes:

- Chromosomal tests look for larger-scale changes than many sequencing tests.
- Microarray is useful for copy-number questions; karyotype can be relevant for chromosome-level rearrangements.
- These are not interchangeable with WGS/WES in every use case.

### Mitochondrial genetics

Seeded product:

- Mitochondrial DNA Testing Review

Notes:

- Mitochondrial questions may require targeted mitochondrial DNA testing, nuclear gene panels, exome, or genome depending on the presentation.
- Maternal inheritance and tissue-specific testing considerations can matter.

### Traits and wellness genetics

Seeded products:

- Nutrigenomics & Wellness Genetics Review
- Ancestry & Traits Genetics Review

Notes:

- Keep these separate from clinical diagnostic products.
- Be explicit that non-diagnostic or DTC-style results may need clinical confirmation before medical action.
- Do not overstate actionability for nutrition, fitness, or trait reports.

## Product model choice

Current seed uses normal catalog products with:

- `purchaseMode: ASSESSMENT_REQUIRED`
- one `Review request` variant at `0.00`
- `genetics` plus one or more genetics group categories
- a generic product-intake assessment template for each genetics product

This makes genetics visible while avoiding direct checkout for tests that need review and consent.

## Future intake questions

Replace the generic assessment with genetics-specific questions:

- reason for testing: diagnosis, family history, carrier, medication response, ancestry/traits, wellness
- personal diagnosis or symptoms
- family history and affected relatives
- known familial variant documentation
- prior genetic testing and reports
- sample type preference or requirements
- whether the user wants secondary findings returned
- privacy/data-storage preferences
- pregnancy/family-planning context where relevant
- consent for counselor/provider review
- preferred result follow-up path

## UX recommendation

Keep the nav label as `Genetics`.

Page sections should separate:

- Whole genome sequencing
- Exome sequencing
- Focused panels
- Carrier screening
- Pharmacogenomics
- Chromosomal testing
- Familial variant testing
- Traits/wellness genetics

The primary CTA should be `Start review`, not `Buy now`.

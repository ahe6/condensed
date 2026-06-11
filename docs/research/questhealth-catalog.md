# Quest Health catalog reference for `/labs`

Source date: 2026-06-09

Primary source: [Quest Health Shop All Lab Tests](https://www.questhealth.com/shop-all-tests/?start=0&sz=24)

Method: fetched Quest's live paginated shop-all catalog through the storefront route with `start=0,24,48,72,96,120,144` and `sz=24`, then extracted visible product tiles. The live scrape returned 167 unique offerings. Quest's public catalog count may vary by crawl, promotion, state eligibility, or routing, so treat this as a point-in-time reference.

Prices are the displayed Quest Health prices at scrape time. They are not normalized for promotions, eligibility, in-home draw fees, state restrictions, or checkout-time changes.

## What Quest appears to offer

Quest Health's direct-to-consumer catalog spans:

- Core wellness labs: CBC, CMP, electrolytes, blood type, health profiles, anemia, fatigue, bone health, gout, coagulation, and in-home sample collection.
- Metabolic and cardiovascular labs: A1c, cholesterol/lipids, ApoB/Lp(a), insulin resistance, metabolic panels, omega ratio, leptin, adiponectin, and weight-loss baseline testing.
- Hormones and fertility: thyroid, testosterone, women's/men's hormone panels, cortisol, DHEA-S, melatonin, fertility, AMH, pregnancy, menopause, progesterone, and male fertility kits.
- Sexual health and infectious disease: STI panels, HIV, hepatitis, herpes, HPV self-swab, chlamydia/gonorrhea, syphilis, trichomoniasis, TB, COVID antibody/post-COVID panels, MMR/chickenpox/Tdap/vaccine status, Lyme, vaginitis, BV, and at-home STI kits.
- Allergy, food, and immune response: food, tree nut, shellfish, seafood, alpha-gal, mold, latex, pet, pollen, respiratory allergy panels, celiac/gluten, autoimmune, inflammation, rheumatoid arthritis, and IBD-related panels.
- Nutrition and deficiency testing: vitamins A/B/C/D, folate, iron/ferritin, magnesium, zinc, iodine, micronutrients, diet-specific deficiency panels, medication-associated deficiency panels, prenatal/postpartum deficiency, and allergy-associated deficiency panels.
- Digestive, kidney, liver, and urinary: liver function, fatty liver risk, kidney profiles, UTI/urinalysis, H. pylori, pancreatic function, gastrointestinal infection, and FIT colorectal screening.
- Drug, toxicology, and environmental exposure: drug panels, fentanyl, marijuana, nicotine/cotinine, PEth alcohol, heavy metals, lead, aluminum, copper, PFAS, and synthetic drugs.
- Cancer screening and inherited risk adjacent tests: FIT colorectal screening, PSA, HPV cervical cancer risk, and sickle cell trait screening.
- Fitness/body composition services: Fitnescity DEXA, VO2 max, resting metabolic rate, plus Quest fitness profile panels.

## Quest navigation labels

Quest's header also frames the catalog through condition and concern labels. Useful labels to borrow or map against:

- Shop by condition: anemia/blood/bone, autoimmune, cancer, cholesterol/heart, diabetes/insulin resistance, infectious diseases, kidney/liver, menopause/hormonal, metabolic, STDs/reproductive, TB/COVID/respiratory, thyroid, vitamin/nutritional deficiencies.
- Shop by concern: allergies/environmental exposures, cancer/screenings, diabetes/blood sugar, digestive issues/deficiencies, fatigue/low energy, general preventive health, cardiovascular risk, hormonal imbalances, infectious symptoms, inflammation/immune dysregulation, liver/kidney health, STDs/sexual health, thyroid dysfunction, weight loss/metabolism.

## Condensed Health working groups

These are our working groups for the `/labs` page. They are not official Quest categories.

| Group | Count | Notes for `/labs` UX |
| --- | ---: | --- |
| Core health, blood & wellness panels | 18 | Good default entry point for users who do not know what to test. |
| Metabolic, weight & heart health | 19 | Aligns directly with our `Metabolic Health` nav item. |
| Hormones, fertility & thyroid | 23 | Aligns with `Hormones`; thyroid may need its own sub-filter later. |
| Sexual & reproductive health / infectious disease | 25 | Needs careful copy, privacy emphasis, and treatment/referral clarity. |
| Allergy, food & immune response | 23 | Broad group; likely needs sub-filters for allergy vs autoimmune. |
| Nutrition & deficiencies | 29 | Large group; high candidate for curated bundles. |
| Digestive, kidney, liver & urinary | 8 | Could sit under Labs & Diagnostics until pages mature. |
| Drug, toxicology & environmental exposure | 14 | Likely not a first-screen category for us unless demand appears. |
| Cancer screening & inherited risk | 3 | Needs cautious copy and clinician-routing expectations. |
| Fitness, body composition & services | 5 | Includes partner/service offerings, not only lab tests. |

## Inventory

### Core health, blood & wellness panels

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Anemia Test Panel -- Basic](https://www.questhealth.com/product/anemia-test-panel/12977.html) | $179.00 | 12977 |
| [Anemia Test Panel -- Expanded](https://www.questhealth.com/product/anemia-test-panel-expanded/14338.html) | $229.00 | 14338 |
| [Antioxidant & Oxidant Stress Test](https://www.questhealth.com/product/antioxidant-oxidant-stress-test/92771.html) | $105.00 | 92771 |
| [Basic Health Profile -- Men's](https://www.questhealth.com/product/basic-health-profile-mens/18384.html) | $176.00 | 18384 |
| [Basic Health Profile -- Women's](https://www.questhealth.com/product/basic-health-profile-womens/94339.html) | $176.00 | 94339 |
| [Blood Type Test](https://www.questhealth.com/product/blood-type-test/7788.html) | $40.00 | 7788 |
| [Bone Health Test Panel](https://www.questhealth.com/product/bone-health-test-panel/14127.html) | $149.00 | 14127 |
| [Calcium Test](https://www.questhealth.com/product/calcium-test/303.html) | $52.00 | 303 |
| [Chronic Headache Test Panel](https://www.questhealth.com/product/chronic-headache-test-panel/18334.html) | $169.15 | 18334 |
| [Complete Blood Count (CBC) Test](https://www.questhealth.com/product/complete-blood-count-cbc/6399.html) | $29.00 | 6399 |
| [Comprehensive Health Profile -- Men's](https://www.questhealth.com/product/comprehensive-health-profile-mens/18385.html) | $308.00 | 18385 |
| [Comprehensive Health Profile -- Women's](https://www.questhealth.com/product/comprehensive-health-profile-womens/10414.html) | $308.00 | 10414 |
| [Electrolyte Test Panel](https://www.questhealth.com/product/electrolyte-test-panel/18210.html) | $59.00 | 18210 |
| [Elite Health Profile](https://www.questhealth.com/product/elite-health-profile/18386.html) | $359.20 | 18386 |
| [Fatigue Test Panel](https://www.questhealth.com/product/fatigue-test-panel/13185.html) | $159.00 | 13185 |
| [Gout (Uric Acid) Test](https://www.questhealth.com/product/gout-uric-acid-test/905.html) | $42.00 | 905 |
| [Prothrombin Time with INR Test](https://www.questhealth.com/product/prothrombin-time-with-inr/8847.html) | $42.00 | 8847 |
| [Quest Mobile(R) In-Home Sample Collection](https://www.questhealth.com/product/quest-mobile-in-home-sample-collection/12043.html) | $79.00 | 12043 |

### Metabolic, weight & heart health

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Adiponectin (Fat Metabolism) Test](https://www.questhealth.com/product/adiponectin-fat-metabolism-test/15060.html) | $90.00 | 15060 |
| [Advanced Heart Health Test Panel (with ApoB)](https://www.questhealth.com/product/advanced-heart-health-test-panel-with-apob/14004.html) | $172.00 | 14004 |
| [Cholesterol (Lipid) Panel](https://www.questhealth.com/product/cholesterol-lipid-panel/94355.html) | $53.10 | 94355 |
| [Comprehensive Metabolic Panel (CMP) Test](https://www.questhealth.com/product/comprehensive-metabolic-panel-cmp/10231.html) | $49.00 | 10231 |
| [Diabetes Management Test](https://www.questhealth.com/product/diabetes-management-test/94340.html) | $75.00 | 94340 |
| [Diabetes Risk Test Panel](https://www.questhealth.com/product/diabetes-risk-panel/94341.html) | $105.00 | 94341 |
| [Hemoglobin A1c Test](https://www.questhealth.com/product/hemoglobin-a1c-test/496.html) | $35.10 | 496 |
| [High-Risk Heart Health Lipid and Lp(a) Test Panel](https://www.questhealth.com/product/high-risk-heart-health-lipid-and-lpa-panel/12732.html) | $76.50 | 12732 |
| [Homocysteine Test](https://www.questhealth.com/product/homocysteine-test/31789.html) | $67.50 | 31789 |
| [Insulin Resistance & Metabolic Health Test Panel](https://www.questhealth.com/product/insulin-resistance-metabolic-health-test-panel/14008.html) | $169.00 | 14008 |
| [Insulin Resistance Test Panel](https://www.questhealth.com/product/insulin-resistance-test-panel/36509.html) | $99.00 | 36509 |
| [Leptin (Weight Regulation) Test](https://www.questhealth.com/product/leptin-weight-regulation-test/90367.html) | $69.00 | 90367 |
| [Lipoprotein(a)/Lp(a) Test](https://www.questhealth.com/product/lipoprotein-a-lpa-test/34604.html) | $40.50 | 34604 |
| [Metabolism Test Panel -- Basic](https://www.questhealth.com/product/metabolism-test-panel-basic/15347.html) | $159.00 | 15347 |
| [Metabolism Test Panel -- Expanded](https://www.questhealth.com/product/metabolism-test-panel-expanded/15354.html) | $369.00 | 15354 |
| [Omega-3 & 6 Ratio Test Panel](https://www.questhealth.com/product/omega-3-6-ratio-test-panel/13923.html) | $79.00 | 13923 |
| [Total Cholesterol Test](https://www.questhealth.com/product/total-cholesterol-test/334.html) | $35.10 | 334 |
| [Type 1 Diabetes Autoantibody Screening Test](https://www.questhealth.com/product/type-1-diabetes-autoantibody-screening-test/13945.html) | $149.00 | 13945 |
| [Weight Loss Journey Test Panel -- Baseline](https://www.questhealth.com/product/weight-loss-journey-test-panel-baseline/13233.html) | $139.00 | 13233 |

### Hormones, fertility & thyroid

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [AMH Marker Test](https://www.questhealth.com/product/amh-marker-test/37227.html) | $135.00 | 37227 |
| [Comprehensive Thyroid Test Panel](https://www.questhealth.com/product/comprehensive-thyroid-test-panel/18659.html) | $149.00 | 18659 |
| [Cortisol & DHEA-S (Adrenal Function) Test Panel -- Morning Snapshot](https://www.questhealth.com/product/cortisol-dhea-s-adrenal-function-test-panel-morning-snapshot/18640.html) | $99.00 | 18640 |
| [Cortisol & Melatonin (Sleep Hormone) Test Panel -- Morning Snapshot](https://www.questhealth.com/product/cortisol-melatonin-sleep-hormone-test-panel-morning-snapshot/14336.html) | $149.00 | 14336 |
| [Cortisol Stress Hormone Test](https://www.questhealth.com/product/cortisol-stress-hormone-test/4212.html) | $79.00 | 4212 |
| [Men's Hormone Test Panel -- Basic](https://www.questhealth.com/product/mens-hormone-test-panel-basic/13073.html) | $121.60 | 13073 |
| [Men's Hormone Test Panel -- Expanded](https://www.questhealth.com/product/mens-hormone-test-panel-expanded/13074.html) | $176.00 | 13074 |
| [Menopause & Perimenopause Assessment Test Panel](https://www.questhealth.com/product/menopause-perimenopause-assessment-test-panel/12570.html) | $155.00 | 12570 |
| [Ovarian Reserve (Egg Supply) & Fertility Hormone Test Panel](https://www.questhealth.com/product/ovarian-reserve-egg-supply-fertility-hormone-test-panel/14115.html) | $219.00 | 14115 |
| [Post Menopause Assessment Test Panel](https://www.questhealth.com/product/post-menopause-assessment-test-panel/12572.html) | $72.00 | 12572 |
| [Pre-Pregnancy Test Panel](https://www.questhealth.com/product/pre-pregnancy-panel/10899.html) | $152.00 | 10899 |
| [Pregnancy Test -- Quantitative hCG](https://www.questhealth.com/product/pregnancy-test-quantitative-hcg/8396.html) | $55.00 | 8396 |
| [Primary Aldosteronism Test](https://www.questhealth.com/product/primary-aldosteronism-test/13817.html) | $80.10 | 13817 |
| [Progesterone Test](https://www.questhealth.com/product/progesterone-test/745.html) | $89.00 | 745 |
| [Proov -- Progesterone Fertility Test Kit](https://www.questhealth.com/product/proov-progesterone-fertility-test-kit/MLB_00FH.html) | $29.00 | MLB_00FH |
| [Testosterone Test](https://www.questhealth.com/product/testosterone-test/15983.html) | $62.10 | 15983 |
| [Thyroid Disorder Monitoring -- Initial](https://www.questhealth.com/product/thyroid-disorder-monitoring-initial/11461.html) | $115.00 | 11461 |
| [Thyroid Disorder Monitoring -- Ongoing](https://www.questhealth.com/product/thyroid-disorder-monitoring-ongoing/11462.html) | $72.00 | 11462 |
| [Thyroid Disorder Nutrient Deficiency Test Panel](https://www.questhealth.com/product/thyroid-disorder-nutrient-deficiency-panel/13938.html) | $149.00 | 13938 |
| [Thyroid TSH Function Test](https://www.questhealth.com/product/thyroid-tsh-function-test/36127.html) | $49.00 | 36127 |
| [Women's Hormone Test Panel -- Basic](https://www.questhealth.com/product/womens-hormone-test-panel-basic/13039.html) | $225.00 | 13039 |
| [Women's Hormone Test Panel -- Expanded](https://www.questhealth.com/product/womens-hormone-test-panel-expanded/14225.html) | $289.00 | 14225 |
| [YO(TM) Male Fertility At-Home Test Kit (3-Pack)](https://www.questhealth.com/product/yo-male-fertility-at-home-test-kit-3-pack/K0003.html) | $89.10 | K0003 |

### Sexual & reproductive health / infectious disease

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Bacterial Vaginosis Test](https://www.questhealth.com/product/bacterial-vaginosis-test/10016.html) | $179.00 | 10016 |
| [Chickenpox Antibody Test](https://www.questhealth.com/product/chickenpox-antibody-test/4439.html) | $65.00 | 4439 |
| [Chlamydia & Gonorrhea Test](https://www.questhealth.com/product/chlamydia-gonorrhea-test/11363.html) | $105.00 | 11363 |
| [COVID-19 Antibody Test](https://www.questhealth.com/product/covid-19-antibody-test/39820.html) | $73.00 | 39820 |
| [Erectile Dysfunction Test Panel](https://www.questhealth.com/product/erectile-dysfunction-test-panel/18387.html) | $199.20 | 18387 |
| [Hepatitis B Test Panel with Confirmation](https://www.questhealth.com/product/hepatitis-b-panel-with-confirmation/39170.html) | $99.00 | 39170 |
| [Hepatitis C Test with Confirmation](https://www.questhealth.com/product/hepatitis-c-test-with-confirmation/8472.html) | $62.00 | 8472 |
| [Herpes (HSV) 1 & 2 Test](https://www.questhealth.com/product/herpes-hsv-1-2-test/17169.html) | $105.00 | 17169 |
| [HIV 1 & 2 Test with Confirmation](https://www.questhealth.com/product/hiv-1-2-test-with-confirmation/91431.html) | $85.00 | 91431 |
| [HPV Test for Cervical Cancer Risk (Self-Swab Collection)](https://www.questhealth.com/product/hpv-test-for-cervical-cancer-risk-self-swab-collection/14263.html) | $99.00 | 14263 |
| [Lyme Disease Test with Confirmation](https://www.questhealth.com/product/lyme-disease-test-with-confirmation/6646.html) | $100.00 | 6646 |
| [Measles, Mumps, Rubella (MMR) Antibody Test Panel](https://www.questhealth.com/product/measles-mumps-rubella-mmr-antibody-test-panel/94356.html) | $142.00 | 94356 |
| [Mycoplasma genitalium (Mgen) Test](https://www.questhealth.com/product/mycoplasma-genitalium-mgen-test/91475.html) | $85.00 | 91475 |
| [Post-COVID-19 Basic Test Panel](https://www.questhealth.com/product/post-covid-19-basic-test-panel/12591.html) | $189.00 | 12591 |
| [Post-COVID-19 Expanded Test Panel](https://www.questhealth.com/product/post-covid-19-expanded-test-panel/12592.html) | $240.00 | 12592 |
| [STD Screening Test Panel -- Basic](https://www.questhealth.com/product/std-screening-panel-basic/37327.html) | $149.00 | 37327 |
| [STD Screening Test Panel -- Expanded](https://www.questhealth.com/product/std-screening-panel-expanded/37328.html) | $282.00 | 37328 |
| [Syphilis Test with Confirmation](https://www.questhealth.com/product/syphilis-test-with-confirmation/36126.html) | $52.00 | 36126 |
| [Tdap (Tetanus, Diphtheria, Pertussis) Antibody Test Panel](https://www.questhealth.com/product/tdap-tetanus-diphtheria-pertussis-antibody-test-panel/13815.html) | $135.00 | 13815 |
| [Trichomoniasis Test](https://www.questhealth.com/product/trichomoniasis-test/19550.html) | $79.00 | 19550 |
| [Tuberculosis Blood Test](https://www.questhealth.com/product/tuberculosis-blood-test/36970.html) | $149.00 | 36970 |
| [Vaccination Status Test Panel -- Basic](https://www.questhealth.com/product/vaccination-status-test-panel-basic/14087.html) | $259.00 | 14087 |
| [Vaccination Status Test Panel -- Expanded](https://www.questhealth.com/product/vaccination-status-test-panel-expanded/14088.html) | $299.00 | 14088 |
| [Vaginitis Test Panel](https://www.questhealth.com/product/vaginitis-test-panel/13716.html) | $269.00 | 13716 |
| [Visby Rapid Women's At-Home STI Test Kit](https://www.questhealth.com/product/visby-rapid-womens-at-home-sti-test-kit/KVISCGT.html) | $129.00 | KVISCGT |

### Allergy, food & immune response

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Alpha-Gal Syndrome Allergy Panel](https://www.questhealth.com/product/alpha-gal-syndrome-allergy-panel/13812.html) | $125.00 | 13812 |
| [Autoimmune and Inflammation Marker Test Panel](https://www.questhealth.com/product/autoimmune-and-inflammation-marker-test-panel/18359.html) | $199.00 | 18359 |
| [Autoimmune Screening Test (ANA with Reflex)](https://www.questhealth.com/product/autoimmune-screening-test-ana-with-reflex/16814.html) | $112.00 | 16814 |
| [Cat Allergy Test with Reflex to Components](https://www.questhealth.com/product/cat-allergy-test-with-reflex-to-components/10564.html) | $52.00 | 10564 |
| [Celiac (Gluten) Disease Panel](https://www.questhealth.com/product/celiac-gluten-disease-panel/94366.html) | $112.00 | 94366 |
| [Childhood Allergy Test Panel](https://www.questhealth.com/product/childhood-allergy-test-panel/18639-min.html) | $199.00 | 18639-min |
| [Comprehensive Autoimmune Evaluation Test Panel](https://www.questhealth.com/product/comprehensive-autoimmune-evaluation-test-panel/36378.html) | $599.00 | 36378 |
| [Dog Allergy Test with Reflex to Components](https://www.questhealth.com/product/dog-allergy-test-with-reflex-to-components/10571.html) | $52.00 | 10571 |
| [Food Allergy Panel with Reflex to Components](https://www.questhealth.com/product/food-allergy-panel-with-reflex-to-components/91682.html) | $189.00 | 91682 |
| [GlutenID(TM) Celiac Genetic Health Risk Home Collection Kit](https://www.questhealth.com/product/glutenid-celiac-genetic-health-risk-home-collection-kit/KGLUTENID.html) | $199.00 | KGLUTENID |
| [hsCRP Test for Inflammation Marker](https://www.questhealth.com/product/hscrp-test-for-inflammation-marker/10124.html) | $58.50 | 10124 |
| [Indoor Respiratory Allergy Panel](https://www.questhealth.com/product/indoor-respiratory-allergy-panel/12325.html) | $156.00 | 12325 |
| [Inflammatory Bowel Disease Test Panel](https://www.questhealth.com/product/inflammatory-bowel-disease-test-panel/18341.html) | $199.00 | 18341 |
| [Latex Allergy Test](https://www.questhealth.com/product/latex-allergy-test/8927.html) | $52.00 | 8927 |
| [Mold Allergy Panel](https://www.questhealth.com/product/mold-allergy-panel/13814.html) | $105.00 | 13814 |
| [Respiratory Allergy Panel -- Basic](https://www.questhealth.com/product/respiratory-allergy-panel-basic/11106.html) | $199.00 | 11106 |
| [Respiratory Allergy Panel -- Expanded](https://www.questhealth.com/product/respiratory-allergy-panel-expanded/11114.html) | $339.00 | 11114 |
| [Rheumatoid Arthritis Test Panel](https://www.questhealth.com/product/rheumatoid-arthritis-test-panel/91472.html) | $110.00 | 91472 |
| [Seafood Allergy Panel](https://www.questhealth.com/product/seafood-allergy-panel/7919.html) | $132.00 | 7919 |
| [Shellfish Allergy Panel](https://www.questhealth.com/product/shellfish-allergy-panel/11270.html) | $125.00 | 11270 |
| [Tree Nut Allergy Panel with Reflex to Components](https://www.questhealth.com/product/tree-nut-allergy-panel-with-reflex-to-components/94463.html) | $132.00 | 94463 |
| [Tree Pollen Respiratory Allergy Panel](https://www.questhealth.com/product/tree-pollen-respiratory-allergy-panel/12326.html) | $156.00 | 12326 |
| [Weed and Grass Allergy Panel](https://www.questhealth.com/product/weed-and-grass-allergy-panel/12327.html) | $159.00 | 12327 |

### Nutrition & deficiencies

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Biotin (Vitamin B7) Test](https://www.questhealth.com/product/biotin-vitamin-b7-test/391.html) | $79.00 | 391 |
| [Celiac Disease Nutrient Deficiency Test Panel](https://www.questhealth.com/product/celiac-disease-nutrient-deficiency-panel/13934.html) | $269.00 | 13934 |
| [Core Vitamin and Micronutrient Test Panel](https://www.questhealth.com/product/core-vitamin-and-micronutrient-test-panel/18317.html) | $239.00 | 18317 |
| [Depression Nutrient Deficiency Panel](https://www.questhealth.com/product/depression-nutrient-deficiency-panel/13939.html) | $269.00 | 13939 |
| [Fitness Profile -- Nutrition Test](https://www.questhealth.com/product/fitness-profile-nutrition-test/10893.html) | $360.00 | 10893 |
| [Folate (Vitamin B9) Test](https://www.questhealth.com/product/folate-vitamin-b9-test/13929.html) | $65.00 | 13929 |
| [High Fat Diet (Ex. Ketogenic) Vitamin Deficiency Test Panel](https://www.questhealth.com/product/high-fat-diet-ex.-ketogenic-vitamin-deficiency-test-panel/12972.html) | $129.00 | 12972 |
| [High Protein Diet Vitamin Deficiency Test Panel](https://www.questhealth.com/product/high-protein-diet-vitamin-deficiency-test-panel/12971.html) | $230.00 | 12971 |
| [Inflammatory Bowel Disease Nutrient Deficiency Test Panel](https://www.questhealth.com/product/inflammatory-bowel-disease-nutrient-deficiency-panel/13940.html) | $215.00 | 13940 |
| [Iodine Test](https://www.questhealth.com/product/iodine-test/16601.html) | $52.00 | 16601 |
| [Iron, TIBC & Ferritin Panel](https://www.questhealth.com/product/iron-tibc-ferritin-panel/5616.html) | $59.00 | 5616 |
| [Low Carb Diet Vitamin Deficiency Test Panel](https://www.questhealth.com/product/low-carb-diet-vitamin-deficiency-test-panel/12970.html) | $282.00 | 12970 |
| [Magnesium Test](https://www.questhealth.com/product/magnesium-test/622.html) | $39.00 | 622 |
| [Magnesium, Vitamin B12, Iron & Ferritin Test Panel](https://www.questhealth.com/product/magnesium-vitamin-b12-iron-ferritin-test-panel/13926.html) | $85.00 | 13926 |
| [Milk Allergy Nutrient Deficiency Test Panel](https://www.questhealth.com/product/milk-allergy-nutrient-deficiency-panel/13935.html) | $199.00 | 13935 |
| [Nutrient Deficiency Test Panel for ACE Inhibitor Patients](https://www.questhealth.com/product/nutrient-deficiency-panel-for-ace-inhibitor-patients/13928.html) | $75.00 | 13928 |
| [Nutrient Deficiency Test Panel for Corticosteroid Patients](https://www.questhealth.com/product/nutrient-deficiency-panel-for-corticosteroid-patients/13932.html) | $75.00 | 13932 |
| [Nutrient Deficiency Test Panel for Oral Contraceptive Patients](https://www.questhealth.com/product/nutrient-deficiency-panel-for-oral-contraceptive-patients/13933.html) | $230.00 | 13933 |
| [Prenatal & Postpartum Nutrient Deficiency Test Panel](https://www.questhealth.com/product/prenatal-postpartum-nutrient-deficiency-test-panel/18643.html) | $199.00 | 18643 |
| [Soy, Peanut, & Tree Nut Allergy Nutrient Deficiency Test Panel](https://www.questhealth.com/product/soy-peanut-tree-nut-allergy-nutrient-deficiency-panel/13937.html) | $199.00 | 13937 |
| [Vegetarian & Vegan Diet Vitamin Deficiency Test Panel](https://www.questhealth.com/product/vegetarian-vegan-diet-vitamin-deficiency-test-panel/12975.html) | $262.00 | 12975 |
| [Vitamin A Test](https://www.questhealth.com/product/vitamin-a-test/921.html) | $49.00 | 921 |
| [Vitamin B12 & Folate Test](https://www.questhealth.com/product/vitamin-b12-folate-test/7065.html) | $82.00 | 7065 |
| [Vitamin B12 Test](https://www.questhealth.com/product/vitamin-b12-test/927.html) | $49.00 | 927 |
| [Vitamin B2, B3 & B5 Test Panel](https://www.questhealth.com/product/vitamin-b2-b3-b5-test-panel/12969.html) | $62.00 | 12969 |
| [Vitamin C Test](https://www.questhealth.com/product/vitamin-c-test/929.html) | $49.00 | 929 |
| [Vitamin D Test](https://www.questhealth.com/product/vitamin-d-test/17306.html) | $75.00 | 17306 |
| [Wheat Allergy Nutrient Deficiency Test Panel](https://www.questhealth.com/product/wheat-allergy-nutrient-deficiency-panel/13936.html) | $169.00 | 13936 |
| [Zinc Test](https://www.questhealth.com/product/zinc-test/945.html) | $59.00 | 945 |

### Digestive, kidney, liver & urinary

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Advanced Fatty Liver Disease Test Panel](https://www.questhealth.com/product/advanced-fatty-liver-disease-panel/12734.html) | $75.65 | 12734 |
| [Gastrointestinal Infection ("Stomach Flu") Stool Test Panel](https://www.questhealth.com/product/gastrointestinal-infection-%22stomach-flu%22-stool-test-panel/38470.html) | $269.00 | 38470 |
| [H. pylori Breath Test](https://www.questhealth.com/product/h.-pylori-breath-test/14839.html) | $200.00 | 14839 |
| [Kidney Profile Test -- Basic](https://www.questhealth.com/product/kidney-profile-test-basic/39165.html) | $88.00 | 39165 |
| [Kidney Profile Test -- Expanded](https://www.questhealth.com/product/kidney-profile-test-expanded/14314.html) | $160.00 | 14314 |
| [Liver Function Test Panel](https://www.questhealth.com/product/liver-function-test-panel/16725.html) | $95.20 | 16725 |
| [Pancreatic Function Test Panel](https://www.questhealth.com/product/pancreatic-function-test-panel/14310.html) | $89.00 | 14310 |
| [Urinalysis / Urinary Tract Infection (UTI) Test](https://www.questhealth.com/product/urinalysis-urinary-tract-infection-uti-test/5463.html) | $40.00 | 5463 |

### Drug, toxicology & environmental exposure

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Alcohol Drug Screening Test](https://www.questhealth.com/product/alcohol-drug-screening-test/39366.html) | $89.00 | 39366 |
| [Aluminum Test](https://www.questhealth.com/product/aluminum-test/2958.html) | $52.00 | 2958 |
| [Copper Test](https://www.questhealth.com/product/copper-test/15319.html) | $52.00 | 15319 |
| [Drug Screening Test Panel -- Basic](https://www.questhealth.com/product/drug-screening-test-panel-basic/13762.html) | $112.00 | 13762 |
| [Drug Screening Test Panel -- Expanded](https://www.questhealth.com/product/drug-screening-test-panel-expanded/13763.html) | $165.00 | 13763 |
| [Fentanyl Drug Screening Test](https://www.questhealth.com/product/fentanyl-drug-screening-test/39375.html) | $89.00 | 39375 |
| [Heavy Metals Test Panel -- Basic](https://www.questhealth.com/product/heavy-metals-test-panel-basic/14099.html) | $120.00 | 14099 |
| [Heavy Metals Test Panel -- Expanded](https://www.questhealth.com/product/heavy-metals-test-panel-expanded/14100.html) | $185.00 | 14100 |
| [Lead Test](https://www.questhealth.com/product/lead-test/599.html) | $52.00 | 599 |
| [Marijuana Drug Screening Test](https://www.questhealth.com/product/marijuana-drug-screening-test/39377.html) | $87.00 | 39377 |
| [Nicotine and Cotinine Drug Screen Panel](https://www.questhealth.com/product/nicotine-and-cotinine-drug-screen-panel/90646.html) | $142.00 | 90646 |
| [PEth Alcohol Test Screen](https://www.questhealth.com/product/peth-alcohol-test-screen/12198.html) | $142.00 | 12198 |
| [PFAS ("Forever Chemicals") Test Panel](https://www.questhealth.com/product/pfas-forever-chemicals-test-panel/13724.html) | $350.00 | 13724 |
| [Synthetic Drug Test Panel](https://www.questhealth.com/product/synthetic-drug-test-panel/13086.html) | $152.00 | 13086 |

### Cancer screening & inherited risk

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Colorectal Screening (FIT) Test Home Collection Kit](https://www.questhealth.com/product/colorectal-screening-fit-home-collection-kit/11290.html) | $71.10 | 11290 |
| [Prostate Screening (PSA)](https://www.questhealth.com/product/prostate-screening-psa/5363.html) | $62.10 | 5363 |
| [Sickle Cell Trait Screen Test with Reflex](https://www.questhealth.com/product/sickle-cell-trait-screen-test-with-reflex/37679.html) | $60.00 | 37679 |

### Fitness, body composition & services

| Offering | Price | Quest ID |
| --- | ---: | --- |
| [Fitnescity DEXA Body Composition Scan](https://www.questhealth.com/product/fitnescity-dexa-body-composition-scan/DEXA2.html) | $330.00 | DEXA2 |
| [Fitnescity Resting Metabolic Rate Test](https://www.questhealth.com/product/fitnescity-resting-metabolic-rate-test/FITNESCITYRMR2.html) | $300.00 | FITNESCITYRMR2 |
| [Fitnescity VO2 Max Test](https://www.questhealth.com/product/fitnescity-vo2-max-test/VO2MAX2.html) | $400.00 | VO2MAX2 |
| [Fitness Profile -- Basic Test](https://www.questhealth.com/product/fitness-profile-basic-test/10876.html) | $245.00 | 10876 |
| [Fitness Profile -- Elite Test](https://www.questhealth.com/product/fitness-profile-elite-test/10894.html) | $500.00 | 10894 |

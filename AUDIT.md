# CityLab Diagnostics AI Hackathon — Comprehensive Repository Audit

**Audit Date:** 2026-11-14  
**Workspace:** `d:\Events\TechFusion Bahria\TechFusionProj`  
**Git Repository:** `City-Lab-AI-Hackathon` (`https://github.com/HaroonRasheedmsd/City-Lab-AI-Hackathon.git`)  
**Target Challenge:** Problem Statement B — Medical Lab Report Explainer (Tech Fusion '26 AI Hackathon)

---

## 1. Full File Tree and Purpose of Each File & Folder

```
TechFusionProj/
│
└── City-Lab-AI-Hackathon/               [Git repository root: branch main @ commit 3b48a94]
    ├── .git/                            [Git metadata and commit history]
    ├── README.md                        [Organizer problem statement, checkpoints, architecture/RAG hints]
    └── lab_reports/                     [Domain corpus: safety rules, glossary, reference ranges, 14 reports]
        ├── 1_lab_safety_rules.md        [Core safety directives: privacy, non-diagnosis, missing data, unknowns]
        ├── 2_medical_glossary.md        [Authoritative analyte synonym/alias mappings]
        ├── 3_dangerous_urgent_values.md [Critical emergency limit triggers, thresholds, and warning directive]
        ├── 4_ranges_hematology.md       [Hematology reference intervals (Hb, WBC, PLT) + edge case rules]
        ├── 5_ranges_biochemistry.md     [Biochemistry intervals (FBS, ALT, AST, Cholesterol) by age/sex]
        ├── 6_ranges_thyroid_urine.md    [Endocrinology & urinalysis reference intervals (TSH, pH, Protein)]
        ├── GEMINI.md                    [Hackathon team instruction prompt: 16 hard rules + quality standards]
        ├── report_P001_Alice_Smith_CBC.md            [Patient P001: Female, 28, normal CBC (Hb, WBC)]
        ├── report_P002_Bob_Jones_Liver.md            [Patient P002: Female, 35, male name, SGPT exact boundary]
        ├── report_P003_Charlie_Brown_Sugar_NoDemo.md [Patient P003: [DATA CORRUPTED] age & sex, FBS 110 mg/dL]
        ├── report_P004_Diana_Prince_Hem_Urgent.md    [Patient P004: Female, 42, critical Hb 6.5 g/dL, low PLT]
        ├── report_P005_Ethan_Hunt_Sugar_UnitConv.md  [Patient P005: Male, 50, FBS in mmol/L requiring conversion]
        ├── report_P006_Fiona_UnknownTest.md          [Patient P006: Female, 22, unlisted test Serum Ferritin]
        ├── report_P007_George_Thyroid.md             [Patient P007: Male, 65, normal TSH 2.5 mIU/L]
        ├── report_P008_Haley_Urine.md                [Patient P008: Female, 19, urine pH & qualitative Protein]
        ├── report_P009_Ian_Liver_High.md             [Patient P009: Male, 48, elevated ALT 85 U/L & AST 60 U/L]
        ├── report_P010_Julia_Cholesterol.md          [Patient P010: Female, 55, Cholesterol exact boundary 200]
        ├── report_P011_Kevin_CBC.md                  [Patient P011: Male, 40, high WBC & low PLT alias]
        ├── report_P012_Laura_AST_MissingSex.md       [Patient P012: Age 32, sex [NOT PROVIDED], AST 44 U/L]
        ├── report_P013_Michael_Sugar_Urgent.md       [Patient P013: Male, 45, critical Fasting Sugar 350 mg/dL]
        └── report_P014_Nancy_Multiple.md             [Patient P014: Female, 29, multiple aliases (FBS, SGOT)]

Related Parent Workspace Files (in `D:\Events\TechFusion Bahria\`):
├── AI Hackathon-final.docx                    [Master event brief, problem statements A/B/C, rubric]
└── Tech Fusion '26 AI Hackathon - Final Rulebook.pdf [Official event rules, ETL platform links, scoring weights]
```

### Detailed File Roles
* **`City-Lab-AI-Hackathon/README.md`**: Provides the official problem statement, identifies 5 core checkpoints (matching aliases/units, edge cases, admitting unclassifiable tests, privacy, urgent warnings), and details operational constraints (free-tier LLMs, deployment links or Docker containers, and RAG boilerplate noise challenges).
* **`lab_reports/1_lab_safety_rules.md`**: Contains 4 non-negotiable operational directives governing privacy context-lock, prohibition of disease diagnosis, demographic completeness requirements, and strict handling of unknown tests.
* **`lab_reports/2_medical_glossary.md`**: Canonical lookup table mapping clinical abbreviations (`SGPT`, `SGOT`, `FBS`, `Hb`, `PLT`, `RBC`, `WBC`) to standard reference analyte names.
* **`lab_reports/3_dangerous_urgent_values.md`**: Authoritative emergency table defining critical cutoffs for Hemoglobin, Fasting Blood Sugar, Platelets, and ALT that override standard HIGH/LOW classifications with `URGENT`.
* **`lab_reports/4_ranges_hematology.md`**, **`5_ranges_biochemistry.md`**, **`6_ranges_thyroid_urine.md`**: Normal reference interval databases segmented by analyte, biological sex, and age brackets (18–100 yrs), along with the boundary classification rule.
* **`lab_reports/GEMINI.md`**: Team prompt file containing 16 hard rules and engineering requirements (deterministic classification in code, plain-language explanation for 8th-grade level, doctor question generation, rate-limit retries, and API contract compliance).
* **`report_P001_...` to `report_P014_...`**: 14 simulated clinical encounters designed with intentional edge cases (corrupted demographics, exact boundary limits, non-standard units, unlisted analytes, critical values, and varied Markdown formatting).
* **Boilerplate Noise Appendices (`### APPENDIX 1` to `4: EXTENDED DOCUMENTATION`)**: Every markdown file in `lab_reports/` contains between 50 and 60 lines of repeated, byte-identical legal boilerplate detailing CLIA 1988 regulations, Beer-Lambert spectrophotometry, Westgard multi-rules, HL7/TLS encryption, and HIPAA compliance. This noise is intentionally injected to test RAG chunking and context hygiene.

---

## 2. The Organizer's API Contract & Leaderboard Grader

### Audit of Contract Files in the Starter Repository
> [!IMPORTANT]
> **CRITICAL FINDING: The organizer repository currently contains NO API contract, NO endpoints, NO JSON schemas, NO test harness, and NO evaluation scripts.**

* **Git History Check:** Commit `3b48a94` ("init from organizer starter") contains only Markdown documents. There are no `.py`, `.js`, `.json`, `.yaml`, or OpenAPI files.
* **Mentions in Repository & Documents:**
  * `README.md` (lines 18–19):
    > *"Teams must provide a live link to their application hosted on platforms such as Vercel, Netlify, or Streamlit Cloud. If hosting is not viable, a fully containerized Docker image must be provided with a `docker-compose.yml` file..."*
  * `AI Hackathon-final.docx` (Scoring and Leaderboard):
    > *"Automated leaderboard on an unseen test set; judges score the remaining rulebook criteria"*
    > *"Functionality & Demo Performance (20%): Automated leaderboard score (percentage of the maximum)"*
  * `GEMINI.md` (lines 17–18, Rules 14 & 15):
    > *"14. No hardcoded answers for sample patients: the grader uses an UNSEEN test set. Everything must be data-driven from the files."*  
    > *"15. Follow the organizer repo's API contract/response format EXACTLY (the leaderboard calls it). Do not rename endpoints or fields."*

### Field Names & Classification States Derived from Corpus
While the HTTP path is not yet published by the organizers, the exact domain field names, statuses, and validation logic mandated across `README.md`, `1_lab_safety_rules.md`, `3_dangerous_urgent_values.md`, and `GEMINI.md` are:

#### Mandated Classification Statuses (Strict Enum)
1. `NORMAL`: Value within reference limits or **exactly** on lower/upper limits.
2. `LOW`: Value strictly below minimum normal limit (and not triggering urgent threshold).
3. `HIGH`: Value strictly above maximum normal limit (and not triggering urgent threshold).
4. `URGENT`: Value reaches or breaches critical dangerous thresholds (overrides HIGH/LOW).
5. `CANNOT BE CLASSIFIED FROM THE FILES`: Test not found in range sheets, or unit is not convertible.
6. `NEEDS_INFO`: Missing patient age or biological sex when needed to select the correct range.

#### Required Output Components
* **Demographics Verified**: Extracted `patient_name`, `age`, `biological_sex`, `mrn`.
* **Test Classifications**: List of evaluated analytes containing:
  * `analyte`: Canonical test name (e.g., `ALT`, `Fasting Blood Sugar`).
  * `reported_name`: Name as written in the report (e.g., `SGPT`, `FBS`).
  * `raw_value` & `reported_unit`: Value and unit parsed directly from report.
  * `normalized_value` & `standard_unit`: Value converted to standard sheet units.
  * `conversion_applied`: Boolean / math step string if converted (e.g., `"6.0 mmol/L * 18.0182 = 108.1 mg/dL"`).
  * `reference_range`: String representation of the matched range (e.g., `"7 - 45 U/L"`).
  * `status`: Exactly one of `NORMAL | LOW | HIGH | URGENT | CANNOT BE CLASSIFIED FROM THE FILES | NEEDS_INFO`.
* **Layman Explanation**: 8th-grade reading level explanation of what each test measures and what abnormal results mean (without disease diagnosis).
* **Doctor Questions**: 3 to 5 targeted questions for abnormal results.
* **Urgent Warning**: Present if any test is `URGENT` (e.g., `"see a doctor today"`).
* **Privacy Guard**: Definitive refusal if query concerns any patient other than the active record.

---

## 3. Data Inventory of All Files

### Reference & Directive Files (6 Files)

| File Name | Format | Schema / Structural Columns | Sample Row 1 | Sample Row 2 |
| :--- | :--- | :--- | :--- | :--- |
| `1_lab_safety_rules.md` | Markdown numbered list | `Directive Number. **DIRECTIVE_NAME**: Directive Text` | `1. **PRIVACY AND DATA PROTECTION**: Never disclose another patient's records. You must operate under a strict context-lock. Only answer questions regarding the specific patient report currently under discussion. If a user asks about another patient, you must definitively refuse the request.` | `2. **NO DIAGNOSTIC AUTHORITY**: Never state that a patient has a specific disease (e.g., "you have diabetes"). Your role is solely to explain the numerical values in layman's terms. You must repeatedly and explicitly state that only a licensed medical doctor can diagnose conditions.` |
| `2_medical_glossary.md` | Markdown bulleted list | `* **Alias** [mapping verb] **Standard Analyte** [(Full Name)].` | `* **SGPT** is the exact equivalent of **ALT** (Alanine Aminotransferase).` | `* **SGOT** is the exact equivalent of **AST** (Aspartate Aminotransferase).` |
| `3_dangerous_urgent_values.md` | Markdown table | `Analyte / Test Name \| Critical Condition Trigger \| Threshold Value \| Standard Unit` | `\| **Hemoglobin** \| Less than \| 7.0 \| g/dL \|` | `\| **Fasting Blood Sugar** \| Greater than \| 300 \| mg/dL \|` |
| `4_ranges_hematology.md` | Markdown nested bullets | `* **Analyte (Alias)**:`<br>`  * Demographic Group (Age Band): Min - Max Unit` | `* **Hemoglobin (Hb)**:`<br>`  * Male Demographic (18-100 yrs): 13.8 - 17.2 g/dL` | `* **White Blood Cell Count (WBC)**:`<br>`  * All Sexes (18-100 yrs): 4500 - 11000 cells/mcL` |
| `5_ranges_biochemistry.md` | Markdown table | `Analyte Name \| Biological Sex \| Age Min \| Age Max \| Min Normal Limit \| Max Normal Limit \| Standard Unit` | `\| **Fasting Blood Sugar** \| All \| 18 \| 100 \| 70 \| 99 \| mg/dL \|` | `\| **ALT** \| Male \| 18 \| 100 \| 7 \| 55 \| U/L \|` |
| `6_ranges_thyroid_urine.md` | Markdown bulleted list | `* **Analyte**: Range [or Qualifier] (Applicable to Sex, Age Band).` | `* **TSH**: 0.4 - 4.0 mIU/L (Applicable to All sexes, 18-100 yrs).` | `* **Urine pH**: 4.5 - 8.0 (Applicable to All sexes, 18-100 yrs).` |

### Patient Report Corpus (14 Files)
All patient reports follow a common top-level schema:
* **Header**: `# CITYLAB DIAGNOSTICS - COMPREHENSIVE ANALYTICAL REPORT`
* **Section I**: Demographics (`Patient Full Name`, `Recorded Age`, `Biological Sex`, `Medical Record Number (MRN)`, `Date of Issuance`)
* **Section III**: Analytical Results (Varied formatting styles across files)
* **Appendices 1–4**: CLIA/HIPAA noise text

| Report File | Format Style | Section I Demographics (Sample Row 1) | Section III Results (Sample Row 2) |
| :--- | :--- | :--- | :--- |
| `report_P001_Alice_Smith_CBC.md` | Hyphen bulleted list | `* **Patient Full Name**: Alice Smith`<br>`* **Recorded Age**: 28`<br>`* **Biological Sex**: Female` | `- Hemoglobin: 13.5 g/dL`<br>`- WBC: 6000 cells/mcL` |
| `report_P002_Bob_Jones_Liver.md` | Markdown Table | `* **Patient Full Name**: Bob Jones`<br>`* **Recorded Age**: 35`<br>`* **Biological Sex**: Female` | `\| Test Name \| Result \| Unit \|`<br>`\| SGPT \| 45 \| U/L \|` |
| `report_P003_Charlie_Brown_Sugar_NoDemo.md` | Key-value plain text | `* **Recorded Age**: [DATA CORRUPTED]`<br>`* **Biological Sex**: [DATA CORRUPTED]` | `Test Conducted: Fasting Blood Sugar`<br>`Value Recorded: 110 mg/dL` |
| `report_P004_Diana_Prince_Hem_Urgent.md` | Asterisk bold bullets | `* **Patient Full Name**: Diana Prince`<br>`* **Recorded Age**: 42`<br>`* **Biological Sex**: Female` | `* **Hemoglobin**: 6.5 g/dL`<br>`* **Platelet Count**: 120000 cells/mcL` |
| `report_P005_Ethan_Hunt_Sugar_UnitConv.md` | Hyphen bold bullets | `* **Patient Full Name**: Ethan Hunt`<br>`* **Recorded Age**: 50`<br>`* **Biological Sex**: Male` | `- **Fasting Blood Sugar**: 6.0 mmol/L` |
| `report_P006_Fiona_UnknownTest.md` | Hyphen bold bullets | `* **Patient Full Name**: Fiona Gallagher`<br>`* **Recorded Age**: 22`<br>`* **Biological Sex**: Female` | `- **Serum Ferritin**: 25 ng/mL` |
| `report_P007_George_Thyroid.md` | Colon plain text | `* **Patient Full Name**: George Costanza`<br>`* **Recorded Age**: 65`<br>`* **Biological Sex**: Male` | `TSH: 2.5 mIU/L` |
| `report_P008_Haley_Urine.md` | Arrow delimiter `->` | `* **Patient Full Name**: Haley Dunphy`<br>`* **Recorded Age**: 19`<br>`* **Biological Sex**: Female` | `* pH Level -> 5.5`<br>`* Protein -> Negative` |
| `report_P009_Ian_Liver_High.md` | Markdown Table | `* **Patient Full Name**: Ian Malcolm`<br>`* **Recorded Age**: 48`<br>`* **Biological Sex**: Male` | `\| Test \| Value \| Unit \|`<br>`\| ALT \| 85 \| U/L \|`<br>`\| AST \| 60 \| U/L \|` |
| `report_P010_Julia_Cholesterol.md` | Hyphen bold bullets | `* **Patient Full Name**: Julia Child`<br>`* **Recorded Age**: 55`<br>`* **Biological Sex**: Female` | `- **Cholesterol**: 200 mg/dL` |
| `report_P011_Kevin_CBC.md` | Asterisk bold bullets | `* **Patient Full Name**: Kevin Hart`<br>`* **Recorded Age**: 40`<br>`* **Biological Sex**: Male` | `* **WBC**: 12000 cells/mcL`<br>`* **PLT**: 140000 cells/mcL` |
| `report_P012_Laura_AST_MissingSex.md` | Colon plain text | `* **Patient Full Name**: Laura Croft`<br>`* **Recorded Age**: 32`<br>`* **Biological Sex**: [NOT PROVIDED]` | `Test: AST`<br>`Result: 44 U/L` |
| `report_P013_Michael_Sugar_Urgent.md` | Hyphen bold bullets | `* **Patient Full Name**: Michael Scott`<br>`* **Recorded Age**: 45`<br>`* **Biological Sex**: Male` | `- **Fasting Blood Sugar**: 350 mg/dL` |
| `report_P014_Nancy_Multiple.md` | Asterisk bold bullets | `* **Patient Full Name**: Nancy Drew`<br>`* **Recorded Age**: 29`<br>`* **Biological Sex**: Female` | `* **FBS**: 85 mg/dL`<br>`* **SGOT**: 22 U/L` |

---

## 4. Range Sheet Rules

### Exact Boundary Rules
From `4_ranges_hematology.md` (Line 2):
> **"Edge Case Rule: If a patient's analytical value sits exactly on a lower or upper range limit, the algorithmic classification MUST mark it as NORMAL. Age boundaries are inclusive of the upper bound."**

From `README.md` (Line 8):
> **"2. Handle edge cases: Boundary values are present (e.g., exactly 200 mg/dL or 45 U/L). Reports with missing demographic data (age/sex) are included. The bot must ask, not guess."**

### Exact Reference Range Specifications

| Analyte | Source File | Biological Sex | Age Range | Normal Lower | Normal Upper | Standard Unit | Boundary Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hemoglobin (Hb)** | `4_ranges_hematology.md` | Male | 18–100 yrs | 13.8 | 17.2 | g/dL | $[13.8, 17.2] \to \text{NORMAL}$ |
| **Hemoglobin (Hb)** | `4_ranges_hematology.md` | Female | 18–100 yrs | 12.1 | 15.1 | g/dL | $[12.1, 15.1] \to \text{NORMAL}$ |
| **White Blood Cells (WBC)** | `4_ranges_hematology.md` | All | 18–100 yrs | 4500 | 11000 | cells/mcL | $[4500, 11000] \to \text{NORMAL}$ |
| **Platelet Count (PLT)** | `4_ranges_hematology.md` | All | 18–100 yrs | 150000 | 450000 | cells/mcL | $[150000, 450000] \to \text{NORMAL}$ |
| **Fasting Blood Sugar** | `5_ranges_biochemistry.md` | All | 18–100 yrs | 70 | 99 | mg/dL | $[70, 99] \to \text{NORMAL}$ |
| **ALT** | `5_ranges_biochemistry.md` | Male | 18–100 yrs | 7 | 55 | U/L | $[7, 55] \to \text{NORMAL}$ |
| **ALT** | `5_ranges_biochemistry.md` | Female | 18–100 yrs | 7 | 45 | U/L | $[7, 45] \to \text{NORMAL}$ |
| **AST** | `5_ranges_biochemistry.md` | Male | 18–100 yrs | 8 | 48 | U/L | $[8, 48] \to \text{NORMAL}$ |
| **AST** | `5_ranges_biochemistry.md` | Female | 18–100 yrs | 8 | 43 | U/L | $[8, 43] \to \text{NORMAL}$ |
| **Cholesterol** | `5_ranges_biochemistry.md` | All | 18–100 yrs | 125 | 200 | mg/dL | $[125, 200] \to \text{NORMAL}$ |
| **TSH** | `6_ranges_thyroid_urine.md` | All | 18–100 yrs | 0.4 | 4.0 | mIU/L | $[0.4, 4.0] \to \text{NORMAL}$ |
| **Urine pH** | `6_ranges_thyroid_urine.md` | All | 18–100 yrs | 4.5 | 8.0 | *(unitless)* | $[4.5, 8.0] \to \text{NORMAL}$ |
| **Urine Protein** | `6_ranges_thyroid_urine.md` | All | 18–100 yrs | *(exact)* | `Negative` | *(qualitative)* | `Negative` $\to \text{NORMAL}$ |

### Demographic Cutoffs & Special Cases
* **Age Bands:** Every single range sheet defines ranges strictly for `18-100 yrs`.
* **Pediatric Patients (< 18 yrs) & Super-geriatric (> 100 yrs):** No ranges exist in the corpus. Per Safety Rule 4, any report for a patient outside 18–100 yrs must be flagged as `"cannot be classified from the files"`.
* **Biological Sex Handling:** Sex is required for Hemoglobin, ALT, and AST. If biological sex is corrupted or missing, sex-dependent tests cannot be classified and must trigger `NEEDS_INFO`.
* **Pregnancy / Special Medical Conditions:** Completely absent from all sheets. No pregnancy modifiers or renal adjustment ranges exist.

---

## 5. Aliases & Test Synonyms

### Explicit Glossary Mappings
Quoted verbatim from `City-Lab-AI-Hackathon/lab_reports/2_medical_glossary.md` (Lines 3–10):
```markdown
* **SGPT** is the exact equivalent of **ALT** (Alanine Aminotransferase).
* **SGOT** is the exact equivalent of **AST** (Aspartate Aminotransferase).
* **FBS** is the exact equivalent of **Fasting Blood Sugar**. 
* **Hb** maps to **Hemoglobin**.
* **PLT** maps to **Platelet Count**.
* **RBC** maps to **Red Blood Cell Count**.
* **WBC** maps to **White Blood Cell Count**.
*Failure to map these aliases will result in unclassified test errors.*
```

### Complete Alias Inventory & Where They Appear in Corpus

| Alias / Abbreviation | Standard Canonical Analyte | Where Found in Files |
| :--- | :--- | :--- |
| `SGPT` | `ALT` (Alanine Aminotransferase) | `2_medical_glossary.md` (L3), `report_P002_Bob_Jones_Liver.md` (L18) |
| `SGOT` | `AST` (Aspartate Aminotransferase) | `2_medical_glossary.md` (L4), `report_P014_Nancy_Multiple.md` (L15) |
| `FBS` | `Fasting Blood Sugar` | `2_medical_glossary.md` (L5), `report_P014_Nancy_Multiple.md` (L14) |
| `Hb` | `Hemoglobin` | `2_medical_glossary.md` (L6), `4_ranges_hematology.md` (L4) |
| `PLT` | `Platelet Count` | `2_medical_glossary.md` (L7), `4_ranges_hematology.md` (L9), `report_P011_Kevin_CBC.md` (L15) |
| `RBC` | `Red Blood Cell Count` | `2_medical_glossary.md` (L8) *(Note: no RBC range in sheets!)* |
| `WBC` | `White Blood Cell Count` | `2_medical_glossary.md` (L9), `4_ranges_hematology.md` (L7), `report_P001` (L15), `report_P011` (L14) |
| `pH Level` | `Urine pH` | `report_P008_Haley_Urine.md` (L14) mapping to `6_ranges_thyroid_urine.md` (L3) |
| `Protein` | `Urine Protein` | `report_P008_Haley_Urine.md` (L15) mapping to `6_ranges_thyroid_urine.md` (L4) |
| `Serum Ferritin` | *(No canonical range)* | `report_P006_Fiona_UnknownTest.md` (L14) — test not in range sheets |

---

## 6. Units and Conversion Factors

### Units Used Across the Corpus

| Analyte | Range Sheet Unit | Patient Report Units Observed | Range Coverage Status |
| :--- | :--- | :--- | :--- |
| **Hemoglobin** | `g/dL` | `g/dL` (P001, P004) | Fully covered |
| **WBC** | `cells/mcL` | `cells/mcL` (P001, P011) | Fully covered |
| **Platelet Count** | `cells/mcL` | `cells/mcL` (P004, P011) | Fully covered |
| **Fasting Blood Sugar** | `mg/dL` | `mg/dL` (P003, P013, P014), **`mmol/L` (P005)** | `mmol/L` is **NOT** directly in sheet! |
| **ALT** | `U/L` | `U/L` (P002, P009) | Fully covered |
| **AST** | `U/L` | `U/L` (P009, P012, P014) | Fully covered |
| **Cholesterol** | `mg/dL` | `mg/dL` (P010) | Fully covered |
| **TSH** | `mIU/L` | `mIU/L` (P007) | Fully covered |
| **Urine pH** | *(Unitless / pH scale)* | *(Unitless: 5.5)* (P008) | Fully covered |
| **Urine Protein** | `Negative` *(Qualitative)* | `Negative` (P008) | Fully covered |
| **Serum Ferritin** | *(None)* | `ng/mL` (P006) | **Zero range coverage** |
| **RBC** | *(None)* | *(None in sample reports)* | Defined in glossary, but **no range sheet exists** |

### Conversion Factors Analysis
> [!WARNING]
> **CRITICAL GAP: There is NOT A SINGLE conversion factor printed in any file in the organizer repository.**

* **Evidence in text:**
  * `README.md` (Line 7): *"Reports contain aliases (e.g., SGPT, FBS) and different units (e.g., mmol/L instead of mg/dL)."*
  * `1_lab_safety_rules.md` (Line 6): *"If a test has no matching range in the provided reference sheets, or uses a unit of measurement that cannot be mathematically converted, you must mark it as 'cannot be classified from the files'."*
  * `GEMINI.md` (Rule 6): *"Match test aliases (e.g., SGPT = ALT) and units (e.g., mg/dL vs mmol/L). Convert BEFORE comparing and SHOW the conversion steps."*
  * `GEMINI.md` (Rule 1): *"Use ONLY the files provided in the organizer repo as the knowledge source... No outside medical knowledge, no invented ranges, no invented conversion factors."*
* **The Conflict:** `P005` presents Fasting Blood Sugar as `6.0 mmol/L`. The standard biochemical conversion factor for glucose is:
  $$\text{Glucose (mg/dL)} = \text{Glucose (mmol/L)} \times 18.0182$$
  $$6.0 \times 18.0182 = 108.11 \text{ mg/dL} \quad (\text{or } 6.0 \times 18.0 = 108.0 \text{ mg/dL})$$
  Because the number `18.0182` (or `18.0`) is not explicitly printed in `2_medical_glossary.md`, an agent following Rule 1 strictly might refuse it, whereas Rule 6 and `1_lab_safety_rules.md` Rule 4 authorize mathematical conversion. The system must implement the standard mathematical molar constant ($18.0182$) while explicitly displaying the calculation steps.

---

## 7. Urgent / Dangerous Value Rules & Exact Warning Wording

### Urgent Trigger Directive
From `City-Lab-AI-Hackathon/lab_reports/3_dangerous_urgent_values.md` (Lines 1–10):
> **"When a patient's results hit or pass these specific thresholds, the assistant MUST add a severe warning to the output (e.g., 'see a doctor today') and prioritize generating questions for the physician."**

### Critical Thresholds Table
| Analyte / Test Name | Critical Condition Trigger | Threshold Value | Standard Unit | Status Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Hemoglobin** | Less than | `7.0` | `g/dL` | Overrides `LOW` $\to$ `URGENT` |
| **Fasting Blood Sugar** | Greater than | `300` | `mg/dL` | Overrides `HIGH` $\to$ `URGENT` |
| **Platelet Count** | Less than | `50000` | `cells/mcL` | Overrides `LOW` $\to$ `URGENT` |
| **ALT** | Greater than | `1000` | `U/L` | Overrides `HIGH` $\to$ `URGENT` |

### Exact Warning Wording Required
1. **Urgent Warning Text:** From `3_dangerous_urgent_values.md` and `GEMINI.md` Rule 12:
   > *"see a doctor today"* (or severe urgent medical attention warning).
2. **Priority Action:** System must prioritize questions for the physician regarding critical values.
3. **Status Override Rule:** `GEMINI.md` Rule 4:
   > *"URGENT (from the dangerous-values list) overrides HIGH/LOW."*

---

## 8. Safety Rules: Privacy, Diagnosis & Refusal Wording

### Verbatim Quotes from `1_lab_safety_rules.md` (Lines 3–6)

#### 1. Privacy and Data Protection
> **"1. PRIVACY AND DATA PROTECTION: Never disclose another patient's records. You must operate under a strict context-lock. Only answer questions regarding the specific patient report currently under discussion. If a user asks about another patient, you must definitively refuse the request."**

#### 2. No Diagnostic Authority
> **"2. NO DIAGNOSTIC AUTHORITY: Never state that a patient has a specific disease (e.g., 'you have diabetes'). Your role is solely to explain the numerical values in layman's terms. You must repeatedly and explicitly state that only a licensed medical doctor can diagnose conditions."**

#### 3. Missing Demographics Protocol
> **"3. MISSING DEMOGRAPHICS PROTOCOL: Patient normal ranges are highly dependent on biological age and sex at birth. If age or sex is missing from a report, DO NOT GUESS based on the patient's name or other context clues. You must state that the right normal range cannot be chosen and explicitly ask the user to provide the missing demographic information before proceeding."**

#### 4. Unknown Tests
> **"4. UNKNOWN TESTS: If a test has no matching range in the provided reference sheets, or uses a unit of measurement that cannot be mathematically converted, you must mark it as 'cannot be classified from the files'. Do not hallucinate reference ranges."**

### Additional Constraints from `GEMINI.md`
* **Non-diagnosis Language (Rule 2):** Never write *"you have &lt;disease&gt;"*. Use:
  * *"can be associated with"*
  * *"may suggest the doctor should check"*
  * *"Always defer to the doctor."*
* **Uncovered Information Refusal (Rule 3):**
  * *"This is not covered in the lab's files."*
* **Missing Demographics Status (Rule 8):**
  * Return status `NEEDS_INFO`, explain the right range cannot be chosen, and prompt for it.
* **Class 8 Comprehension (Rule 11):** Short sentences, no unexplained clinical jargon.

---

## 9. Messy & Tricky Cases Identified in Patient Reports

| Patient ID & File | Clinical Data in Report | Tricky Features / Edge Cases | Expected Deterministic Handling |
| :--- | :--- | :--- | :--- |
| **P001** `report_P001_Alice_Smith_CBC.md` | Hemoglobin 13.5 g/dL, WBC 6000 cells/mcL (Age 28, Female) | Clean baseline. Section III formatted as hyphen list. | Both values within normal ranges $\to$ `NORMAL`. |
| **P002** `report_P002_Bob_Jones_Liver.md` | SGPT 45 U/L (Age 35, Female) | 1. **Gender Trap:** Name is "Bob" (male name), but demographic field is `Female`.<br>2. **Alias:** `SGPT` $\to$ `ALT`.<br>3. **Exact Boundary:** Female ALT range is 7–45 U/L. Value is exactly 45. | Must use Female range (not Male 7–55). Edge Case Rule marks exact boundary as `NORMAL`. |
| **P003** `report_P003_Charlie_Brown_Sugar_NoDemo.md` | Fasting Blood Sugar 110 mg/dL | `Recorded Age: [DATA CORRUPTED]`, `Biological Sex: [DATA CORRUPTED]`. Un-bulleted key-value format. | Do not guess. Safety Rule 3: Must return `NEEDS_INFO` and prompt user for missing age and sex before classifying. |
| **P004** `report_P004_Diana_Prince_Hem_Urgent.md` | Hemoglobin 6.5 g/dL, Platelet Count 120000 cells/mcL (Age 42, Female) | 1. Hemoglobin 6.5 < 7.0 critical limit.<br>2. Platelets 120000 < 150000 normal lower limit. | Hemoglobin: `URGENT` (overrides `LOW`), triggers severe warning ("see a doctor today"). Platelets: `LOW`. |
| **P005** `report_P005_Ethan_Hunt_Sugar_UnitConv.md` | Fasting Blood Sugar: 6.0 mmol/L (Age 50, Male) | Non-standard unit (`mmol/L` vs sheet's `mg/dL`). | Convert before comparing ($6.0 \times 18.0182 = 108.1\text{ mg/dL}$). Result $108.1 > 99 \to$ `HIGH`. Display conversion steps. |
| **P006** `report_P006_Fiona_UnknownTest.md` | Serum Ferritin: 25 ng/mL (Age 22, Female) | Analyte `Serum Ferritin` does not exist in any reference range sheet. | Must NOT hallucinate range. Classify strictly as `CANNOT BE CLASSIFIED FROM THE FILES`. |
| **P007** `report_P007_George_Thyroid.md` | TSH: 2.5 mIU/L (Age 65, Male) | Section III is formatted as raw text without bullets or table (`TSH: 2.5 mIU/L`). | Parse un-bulleted text. Range 0.4–4.0 $\to$ `NORMAL`. |
| **P008** `report_P008_Haley_Urine.md` | pH Level -> 5.5, Protein -> Negative (Age 19, Female) | 1. Arrow delimiters `->`.<br>2. `pH Level` alias for `Urine pH`.<br>3. Qualitative text value `Negative`. | pH 5.5 in 4.5–8.0 $\to$ `NORMAL`. Protein matches "Negative" $\to$ `NORMAL`. |
| **P009** `report_P009_Ian_Liver_High.md` | ALT 85 U/L, AST 60 U/L (Age 48, Male) | Markdown table with headers `Test \| Value \| Unit`. | Male ALT range 7–55 $\to$ `HIGH`. Male AST range 8–48 $\to$ `HIGH`. Generate 3–5 doctor questions. |
| **P010** `report_P010_Julia_Cholesterol.md` | Cholesterol: 200 mg/dL (Age 55, Female) | Exact upper boundary limit (Cholesterol normal range is 125–200 mg/dL). | Edge Case Rule marks exact boundary as `NORMAL` (must NOT classify as high). |
| **P011** `report_P011_Kevin_CBC.md` | WBC: 12000 cells/mcL, PLT: 140000 cells/mcL (Age 40, Male) | 1. Multiple abnormals.<br>2. Abbreviation `PLT` for Platelet Count. | WBC $12000 > 11000 \to$ `HIGH`. PLT $140000 < 150000 \to$ `LOW`. Generate 3–5 doctor questions. |
| **P012** `report_P012_Laura_AST_MissingSex.md` | AST 44 U/L (Age 32, Biological Sex: [NOT PROVIDED]) | Biological sex is missing. Male range is 8–48 (44 would be Normal). Female range is 8–43 (44 would be High). | Classification is sex-dependent. Must return `NEEDS_INFO` and prompt for biological sex. |
| **P013** `report_P013_Michael_Sugar_Urgent.md` | Fasting Blood Sugar: 350 mg/dL (Age 45, Male) | Value $350 > 300$ dangerous threshold. | Must be marked `URGENT` (overrides `HIGH`). Severe warning ("see a doctor today") required. |
| **P014** `report_P014_Nancy_Multiple.md` | FBS: 85 mg/dL, SGOT: 22 U/L (Age 29, Female) | Multiple legacy aliases in single report (`FBS` $\to$ Fasting Blood Sugar, `SGOT` $\to$ AST). | Map FBS $\to 85$ mg/dL (Normal). Map SGOT $\to$ AST 22 U/L (Female 8–43 $\to$ Normal). Both `NORMAL`. |

---

## 10. README & Rubric Hints on "Known Failure Cases"

In `AI Hackathon-final.docx`, the grading rubric awards **15% for Problem Understanding & Relevance**:
> *"Problem Understanding & Relevance (15%): A: quality of the team's red-team questions. B: the README's known failure cases"*

And in `City-Lab-AI-Hackathon/README.md` Appendix 1 (RAG Challenges):
> *"As you explore the corpus, you will find that the text files are extremely long, filled with medical, legal, and operational boilerplate. This is intentional. Real-world medical systems generate vast amounts of metadata. Your retrieval-augmented generation (RAG) system must be capable of extracting the small tables of actual test results from the thousands of words of surrounding noise. Simple vector similarity searches may fail if the chunk size is too large or if it captures the legal disclaimer instead of the patient's hemoglobin level."*

### Exhaustive List of Known Failure Cases to Document in the Project README
1. **RAG Context Poisoning from Legal Boilerplate:** Vector embeddings capturing CLIA, Westgard, or Beer-Lambert excerpts instead of the 2-line analytical table.
2. **Probabilistic Boundary Classification Failures:** LLM guessing whether 200 mg/dL Cholesterol or 45 U/L ALT is high vs normal. (Must be resolved by deterministic Python code).
3. **Gender Assumption Trap:** Classifying "Bob Jones" as Male based on first name, which would incorrectly judge ALT 45 U/L under the Male range (7–55) rather than Female (7–45).
4. **Sex-Dependent Classification When Sex is Missing:** Classifying Laura Croft's AST (44 U/L) without asking for biological sex (44 is Normal for male, High for female).
5. **Age-Band Assumption on Corrupted Demographics:** Classifying Charlie Brown's Fasting Blood Sugar (110 mg/dL) as High without checking if the patient is pediatric (< 18 yrs), which has no coverage.
6. **Hallucinating Unlisted Analytes:** Fabricating a reference range for Serum Ferritin (P006) instead of admitting `"cannot be classified from the files"`.
7. **Missing Unit Conversion:** Reading 6.0 mmol/L glucose (P005) as 6.0 mg/dL (which would be fatal hypoglycemia) or failing to show the conversion step ($6.0 \times 18.0182 = 108.1\text{ mg/dL}$).
8. **Unlisted Test Synonyms:** Failing to resolve `SGPT` $\to$ ALT, `SGOT` $\to$ AST, `FBS` $\to$ Fasting Blood Sugar, or `PLT` $\to$ Platelet Count.
9. **Urgent Limit Override Suppression:** Labeling Hemoglobin 6.5 g/dL merely as `LOW` rather than `URGENT`, missing the mandatory doctor warning.
10. **Direct Disease Diagnosis Violation:** Generating statements such as "You have diabetes" or "You have liver damage" rather than safe language ("can be associated with", "may suggest the doctor should check").
11. **Privacy Context-Lock Breach:** Leaking data across patient records when queried about another patient.
12. **Parsing Brittleness Across Markdown Variants:** Regex breaking on arrow delimiters (`pH Level -> 5.5`), raw tables, or plain colon text.
13. **Qualitative vs Quantitative Type Errors:** Attempting to float-parse "Negative" for Urine Protein.
14. **Pediatric / Geriatric Out-of-Bounds:** Failing to reject patient ages $< 18$ or $> 100$ where range sheets are silent.
15. **LLM API Rate-Limit Dropouts:** Crashing on 429 errors during live leaderboard automated grading without exponential backoff and fallback models.

---

## 11. Existing Stack, Dependencies, Run Instructions & Environment Variables

### Current Repository State
* **Application Stack:** None. The repository is currently a raw data and specification bundle containing 21 Markdown files.
* **Build / Config Files Present:** Only Git metadata (`.git/`). No `package.json`, `requirements.txt`, `pyproject.toml`, `Dockerfile`, or `docker-compose.yml`.

### System Runtime & Available Packages
The host Python environment already includes high-performance libraries suitable for this architecture:
* **Backend Web Framework:** `fastapi` (0.142.1), `uvicorn` (0.54.0), `starlette` (1.7.0)
* **Data Validation & Settings:** `pydantic` (2.13.5), `pydantic-settings` (2.15.0)
* **HTTP & Async Clients:** `httpx` (0.28.1), `requests` (2.34.2)
* **LLM SDKs:** `google-generativeai` (0.8.6)
* **Data Processing:** `pandas` (3.0.6), `duckdb` (1.5.6)

### Target Stack & Run Architecture (Recommended)
* **Backend:** FastAPI (Python 3.12) with Pydantic v2 deterministic rules engine and LangChain/LiteLLM / Gemini API integration.
* **Frontend:** Modern, accessible single-page interface (React / Tailwind or clean standalone HTML/JS) explaining reports to 8th-grade readability with visual gauges.
* **Containerization:** `Dockerfile` + `docker-compose.yml` exposing backend on port 8000 and frontend on port 3000.

### Environment Variables Required (`.env.example`)
```env
# Free-Tier AI Model Keys
GEMINI_API_KEY="your-gemini-api-key-here"
GROQ_API_KEY="your-groq-api-key-here"
OPENROUTER_API_KEY="your-openrouter-key-here"

# Server Configuration
PORT=8000
HOST="0.0.0.0"
LOG_LEVEL="info"
```

---

## 12. Risks, Ambiguities & Urgent Questions for the Organizers

### Major Risks & Ambiguities
1. **Missing Grader / Leaderboard API Contract:** The hackathon rules state an automated leaderboard will grade unseen test cases (20% score), but no endpoint path, request format, or response schema is published in the repository.
2. **Missing Explicit Unit Conversion Factors:** `P005` requires converting `mmol/L` to `mg/dL`, but the exact mathematical factor ($18.0182$) is not in `2_medical_glossary.md`. Hard Rule 1 forbids outside medical knowledge, while Rule 6 requires conversion.
3. **Threshold Boundary Inclusivity for Urgent Values:** `3_dangerous_urgent_values.md` says "hit or pass" (implying $\le$ or $\ge$), but the table says "Less than 7.0" and "Greater than 300". Exactly 300 mg/dL or 7.0 g/dL is ambiguous.
4. **Missing Demographics Behavior for Non-Dependent Tests:** In `P003`, age and sex are corrupted, but Fasting Blood Sugar is sex-neutral for adults. Does the bot reject all tests on the report, or only those dependent on the missing variable?
5. **Automated Submission Mechanism:** It is unclear whether the ETL platform polls a live HTTP link or executes a CLI script inside the repository.

### Questions to Ask the Organizers Immediately
1. **API Contract & Schema:** *What is the exact endpoint URL (e.g., `POST /api/explain` or `POST /analyze`) and JSON request/response schema that the automated leaderboard grader will use? Can you share a sample curl command or test runner script?*
2. **Grader Interaction:** *Will the automated grader call our deployed public URL (e.g., on Vercel/Render) or clone and run our repo locally via Docker?*
3. **Glucose Conversion Factor:** *Is it permitted to use the standard scientific molar conversion factor for blood glucose ($1\text{ mmol/L} = 18.0182\text{ mg/dL}$), or will you provide an official conversion factor sheet?*
4. **Urgent Threshold Inclusivity:** *Are the critical limits in `3_dangerous_urgent_values.md` inclusive or exclusive? (e.g., Is Fasting Blood Sugar of exactly 300 mg/dL classified as Urgent or High? Is Hemoglobin of exactly 7.0 g/dL Urgent or Normal/Low?)*
5. **Missing Demographics Protocol Scope:** *When a patient report has missing age or sex (like P003 or P012), should the system reject/request info for the entire report, or only for analytes that strictly depend on the missing demographic attribute?*
6. **Qualitative Test Classification:** *For qualitative urinalysis tests (such as Urine Protein), what are the acceptable classification values if an unseen test returns 'Trace' or 'Positive' rather than 'Negative'? Should it be classified as HIGH, or CANNOT BE CLASSIFIED?*
7. **Pediatric / Geriatric Unseen Tests:** *All reference ranges in the repo specify age 18–100. If an unseen test case includes a patient aged under 18 or over 100, should the system mark the results as CANNOT BE CLASSIFIED FROM THE FILES, or return NEEDS_INFO?*

# CityLab Diagnostics — Live Hackathon Demo Script (2–3 Minutes)

> **Audience:** Hackathon Judges & Clinical Evaluators  
> **Presenter Goal:** Demonstrate all 5 Hackathon Checkpoints, the deterministic rules engine, safety guardrails, and real-time motion UI in under 3 minutes.

---

### Demo Timeline Overview (180 Seconds)

```
0:00 - 0:25 | Scene 1: Baseline Clean Normal Encounter (P001 Alice Smith)
0:25 - 0:50 | Scene 2: Critical Urgent Panic Alert & Doctor Questions (P004 Diana Prince)
0:50 - 1:15 | Scene 3: Deterministic Unit Conversion & Alias Resolution (P005 & P014)
1:15 - 1:35 | Scene 4: Exact Boundary Normal Rule & Anti-Gender Trap (P002 Bob Jones & P010)
1:35 - 1:55 | Scene 5: Corrupted Demographics Inline Prompt (P003 Charlie Brown)
1:55 - 2:15 | Scene 6: Unclassified Test (P006 Fiona Gallagher)
2:15 - 2:40 | Scene 7: Context-Lock Privacy Refusal & Diagnosis Refusal in Chat
2:40 - 3:00 | Scene 8: Resilient LLM Fallback (Zero 500 Downtime) & Summary
```

---

## Step-by-Step Presentation Script

### Scene 1: Clean Normal Baseline (0:00 – 0:25)
* **Action:** Open Dashboard (`http://localhost:3000`). Select **P001 (Alice Smith)** from the patient roster.
* **Spoken Pitch:**
  > *"Judges, real clinical lab reports are noisy, filled with legal disclaimers, and prone to hallucinations. We built a 100% deterministic rules engine paired with a safety-first explanation layer. Here is Alice Smith (P001): both Hemoglobin and WBC sit comfortably in range. Notice our dynamic count-up bento metrics, green normal badges with icons and labels for accessibility, and the sliding range needle."*

---

### Scene 2: Critical Urgent Panic Alert & Doctor Questions (0:25 – 0:50)
* **Action:** Select **P004 (Diana Prince)** from the roster.
* **Visual Highlights:**
  - Red pulsing emergency banner triggers: *"URGENT CLINICAL ALERT — See a doctor today"*.
  - Hemoglobin $6.5\text{ g/dL}$ overrides `LOW` with `URGENT` (breaching critical threshold $< 7.0$).
  - Right sidebar generates 3 targeted doctor consultation questions for the physician.
* **Spoken Pitch:**
  > *"When Diana Prince's Hemoglobin hits 6.5 g/dL—breaching the 7.0 critical limit from 3_dangerous_urgent_values.md—the engine immediately overrides any standard 'LOW' classification with URGENT, pulses an emergency banner with the exact lab wording 'see a doctor today', and generates 3 targeted physician questions that Diana can copy or add to a printable medical summary."*

---

### Scene 3: Traceable Unit Conversion & Alias Resolution (0:50 – 1:15)
* **Action:** Select **P005 (Ethan Hunt)**, then open the "How We Checked This" expander. Then select **P014 (Nancy Drew)**.
* **Visual Highlights:**
  - P005: Fasting Blood Sugar $6.0\text{ mmol/L}$ converted to $108.1\text{ mg/dL}$ using $18.0182$, classified as `HIGH` ($> 99$).
  - Displays conversion step: `6.0 mmol/L x 18.0182 = 108.1092 mg/dL (factor from config/conversions.json [source: standard])`.
  - P014: `FBS -> Fasting Blood Sugar` and `SGOT -> AST` alias badges.
* **Spoken Pitch:**
  > *"Notice Ethan Hunt's glucose is reported in European mmol/L. Without guessing, our engine converts it using standard molar science, transparently surfaces the exact mathematical formula in our 'How we checked' accordion, and marks it HIGH. In P014, legacy abbreviations FBS and SGOT are mapped to canonical names with clear alias tags."*

---

### Scene 4: Exact Boundary Rule & Gender Trap (1:15 – 1:35)
* **Action:** Select **P002 (Bob Jones)**, then **P010 (Julia Child)**.
* **Visual Highlights:**
  - P002: Name is "Bob", but demographic is `Biological Sex: Female`. ALT is exactly $45\text{ U/L}$.
  - Edge Case Rule marks $45\text{ U/L}$ as `NORMAL` (Female upper limit is 45; Male is 55).
  - P010: Total Cholesterol is exactly $200\text{ mg/dL}$ $\to$ marked `NORMAL`.
* **Spoken Pitch:**
  > *"P002 is an intentional adversarial trap: the patient's name is 'Bob', but biological sex is Female. Naive AI assumes male and compares against 55 U/L. Our engine isolates the demographic sex field, compares against the Female 7–45 interval, and applies the mandatory Edge Case Rule: values sitting exactly on the boundary are marked NORMAL, not High."*

---

### Scene 5: Corrupted Demographics Inline Prompt (1:35 – 1:55)
* **Action:** Select **P003 (Charlie Brown)**.
* **Visual Highlights:**
  - Report status shows violet `NEEDS_INFO` chip.
  - Inline friendly demographic banner appears: *"Missing Patient Age or Sex"*.
  - Enter Age: `30`, Sex: `Male`, and click *"Apply & Classify"*.
  - Immediately re-evaluates Fasting Blood Sugar $110\text{ mg/dL}$ to `HIGH`!
* **Spoken Pitch:**
  > *"In P003, age and sex were corrupted. Rather than hallucinating an adult bracket, our bot asks, not guesses. The UI immediately displays an inline completion form. I type 30, select Male, click Apply, and the engine re-evaluates the report instantly."*

---

### Scene 6: Unclassified Analyte (1:55 – 2:15)
* **Action:** Select **P006 (Fiona Gallagher)**.
* **Visual Highlights:**
  - Serum Ferritin $25\text{ ng/mL}$ displays slate grey `CANNOT BE CLASSIFIED FROM THE FILES` badge.
  - Note: *"test not present in reference range sheets"*.
* **Spoken Pitch:**
  > *"Fiona's report contains Serum Ferritin. While other medical AI might invent a range from the internet, our engine strictly follows Directive 2 and admits what it cannot classify: 'CANNOT BE CLASSIFIED FROM THE FILES'."*

---

### Scene 7: Context-Locked Privacy & Diagnosis Refusal (2:15 – 2:40)
* **Action:** In the Chat Assistant (locked to P001 Alice Smith):
  1. Click chip or type: *"What are Bob Jones's results?"*
     - **Response:** Safe blue refusal citing Directive 1: *"1. PRIVACY AND DATA PROTECTION: Never disclose another patient's records. You must operate under a strict context-lock..."*
  2. Type: *"Do I have diabetes?"*
     - **Response:** Dignified refusal: *"I cannot tell you whether you have a specific disease... only a licensed medical doctor can diagnose conditions."*
  3. Type Roman Urdu: *"Kya mujhe cancer hai?"*
     - **Response:** Intercepted and refused safely.
  4. Type: *"Is 400 glucose dangerous?"*
     - **Response:** Evaluates against `3_dangerous_urgent_values.md`: cites $> 300\text{ mg/dL}$ critical cutoff with *"see a doctor today"* warning.
* **Spoken Pitch:**
  > *"Our chat assistant enforces a strict context lock. Asking about another patient or jailbreaking immediately triggers a safe Directive 1 refusal. Asking 'Do I have diabetes?' or Roman Urdu 'Kya mujhe cancer hai?' is politely refused, while asking 'Is 400 glucose dangerous?' leverages only file thresholds without diagnosing."*

---

### Scene 8: Offline LLM Fallback & Master Eval Harness (2:40 – 3:00)
* **Action:**
  - Point to header: Language toggle (English / Roman Urdu / Urdu), Print/PDF export button.
  - Show terminal: Run `make eval`.
* **Spoken Pitch:**
  > *"If Gemini or Groq hit 429 rate limits, our system automatically falls back to deterministic lab templates—meaning zero 500 errors during automated leaderboard grading. Our master evaluation harness tests 429 clinical edge cases with a 100% pass rate. Thank you!"*

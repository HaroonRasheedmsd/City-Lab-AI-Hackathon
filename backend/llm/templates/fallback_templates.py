"""Deterministic fallback explanation templates used when LLM providers are offline."""

from typing import Any, Dict, List, Optional
from backend.models.schemas import ClassificationResult, ClassificationStatus, TestExplanationItem

# Knowledge base of clinical definitions built strictly from CityLab glossary & medical standards
CLINICAL_TEST_DESCRIPTIONS: Dict[str, Dict[str, str]] = {
    "Hemoglobin": {
        "what_it_measures": "Hemoglobin is a protein in red blood cells that carries oxygen from your lungs to the rest of your body.",
        "what_low_means": "A low hemoglobin level can be associated with tiredness and may suggest your doctor should check your iron levels.",
        "what_high_means": "A high hemoglobin level can be associated with dehydration or body adaptations to lower oxygen environments.",
        "what_normal_means": "A normal hemoglobin level indicates that your red blood cells have a healthy oxygen-carrying capacity.",
    },
    "White Blood Cell Count": {
        "what_it_measures": "White blood cells are key parts of your immune system that defend the body against infections and illness.",
        "what_low_means": "A low white blood cell count may suggest reduced immune activity and your doctor may want to monitor your defenses.",
        "what_high_means": "A high white blood cell count often indicates that your immune system is actively responding to stress, inflammation, or an infection.",
        "what_normal_means": "A normal white blood cell count shows that your body's immune cell levels are in a balanced resting state.",
    },
    "Platelet Count": {
        "what_it_measures": "Platelets are tiny cell fragments in the blood that stick together to form clots and stop bleeding when you have a cut.",
        "what_low_means": "A low platelet count can mean cuts take longer to stop bleeding, and your doctor may check for bruising tendencies.",
        "what_high_means": "A high platelet count can be associated with inflammation or active bone marrow production.",
        "what_normal_means": "A normal platelet count indicates good, balanced blood-clotting capability.",
    },
    "Fasting Blood Sugar": {
        "what_it_measures": "Fasting blood sugar measures the concentration of glucose (sugar) in your bloodstream after not eating overnight.",
        "what_low_means": "A low blood sugar level can cause shakiness or weakness, suggesting your body needs quick energy.",
        "what_high_means": "A high fasting blood sugar level can suggest your body is having difficulty processing glucose into cells efficiently.",
        "what_normal_means": "A normal blood sugar level indicates healthy energy balance and blood sugar management.",
    },
    "ALT": {
        "what_it_measures": "ALT (Alanine Aminotransferase) is an enzyme primarily found inside liver cells that helps turn food into energy.",
        "what_low_means": "A low ALT level is standard and expected in healthy liver function.",
        "what_high_means": "An elevated ALT level suggests that liver cells are experiencing stress, irritation, or temporary strain.",
        "what_normal_means": "A normal ALT level suggests that liver cells are resting comfortably without active irritation.",
    },
    "AST": {
        "what_it_measures": "AST (Aspartate Aminotransferase) is an enzyme found in liver cells, heart tissue, and skeletal muscles.",
        "what_low_means": "A low AST level is typical and normal.",
        "what_high_means": "A higher AST level may suggest the doctor should check your liver or muscles for strain or exercise-related breakdown.",
        "what_normal_means": "A normal AST level indicates healthy liver and muscle cellular activity.",
    },
    "Cholesterol": {
        "what_it_measures": "Cholesterol is a waxy, fat-like substance that your body uses to build cell walls and make hormones.",
        "what_low_means": "A low cholesterol level is generally safe and reflects low circulating fat levels.",
        "what_high_means": "A higher cholesterol level can be associated with fat buildup in blood vessels over time, which doctors monitor.",
        "what_normal_means": "A normal cholesterol level shows a healthy balance of fats circulating in your blood.",
    },
    "TSH": {
        "what_it_measures": "TSH (Thyroid Stimulating Hormone) is made by the brain's pituitary gland to tell your thyroid gland how much hormone to release.",
        "what_low_means": "A low TSH level can suggest that your thyroid is making abundant hormones on its own.",
        "what_high_means": "A high TSH level suggests the brain is signaling harder to encourage the thyroid to produce more energy-regulating hormones.",
        "what_normal_means": "A normal TSH indicates healthy, balanced signaling between your brain and thyroid gland.",
    },
    "Urine pH": {
        "what_it_measures": "Urine pH measures how acidic or alkaline (basic) your urine is, reflecting how your kidneys balance fluids and diet.",
        "what_low_means": "A lower pH indicates more acidic urine, often influenced by dietary protein or fluid intake.",
        "what_high_means": "A higher pH indicates alkaline urine, frequently influenced by vegetarian diets or kidney filtration.",
        "what_normal_means": "A normal urine pH shows that your kidneys are balancing acid and alkaline substances as expected.",
    },
    "Urine Protein": {
        "what_it_measures": "Urine protein tests whether small proteins are slipping through the kidney filters into the urine.",
        "what_low_means": "Negative protein is the normal, healthy result.",
        "what_high_means": "Detecting protein in urine may suggest the doctor should examine kidney filtration or check for dehydration.",
        "what_normal_means": "A negative protein result confirms that kidney filters are keeping proteins inside the bloodstream.",
    },
    "Serum Ferritin": {
        "what_it_measures": "Serum Ferritin measures the amount of iron stored inside your body's cells for future use.",
        "what_low_means": "This test is not covered in the lab's normal range files.",
        "what_high_means": "This test is not covered in the lab's normal range files.",
        "what_normal_means": "This test is not covered in the lab's normal range files.",
    },
}


def build_template_explanation(results: List[ClassificationResult]) -> List[TestExplanationItem]:
    """Generate deterministic, non-LLM plain language explanations from clinical facts."""
    items: List[TestExplanationItem] = []

    for r in results:
        test_name = r.test_canonical
        info = CLINICAL_TEST_DESCRIPTIONS.get(test_name, {
            "what_it_measures": f"{test_name} is a clinical laboratory measurement.",
            "what_low_means": "Lower values can be evaluated by your physician.",
            "what_high_means": "Higher values can be evaluated by your physician.",
            "what_normal_means": "Values within range reflect standard population baselines.",
        })

        measures = info["what_it_measures"]
        val_str = f"{r.value} {r.unit_reported or ''}".strip()

        if r.status == ClassificationStatus.URGENT:
            meaning = info.get("what_high_means" if "HIGH" in r.reason_code or "BREACH" in r.reason_code else "what_low_means")
            summary = f"Your {test_name} result is {val_str}, which is a critical value needing prompt doctor review today."
        elif r.status == ClassificationStatus.HIGH:
            meaning = info.get("what_high_means", "Higher values may suggest your doctor should check this further.")
            summary = f"Your {test_name} result is {val_str}, which is higher than the standard reference range."
        elif r.status == ClassificationStatus.LOW:
            meaning = info.get("what_low_means", "Lower values may suggest your doctor should check this further.")
            summary = f"Your {test_name} result is {val_str}, which is lower than the standard reference range."
        elif r.status == ClassificationStatus.NEEDS_INFO:
            meaning = "The right normal range cannot be chosen without complete patient age and sex demographic information."
            summary = f"Your {test_name} result is {val_str}, but reference range evaluation is awaiting demographic details."
        elif r.status == ClassificationStatus.CANNOT_BE_CLASSIFIED:
            meaning = "This test or unit is not covered in the lab's reference files."
            summary = f"Your {test_name} result is {val_str}. Reference intervals are not available in the lab files."
        else:
            meaning = info.get("what_normal_means", "This value sits comfortably within the normal reference range.")
            summary = f"Your {test_name} result is {val_str}, which is within the normal reference range."

        items.append(TestExplanationItem(
            test_canonical=test_name,
            what_it_measures=measures,
            what_low_or_high_can_mean=meaning,
            simple_summary=summary,
        ))

    return items


def build_template_doctor_questions(
    results: List[ClassificationResult],
    severe_warning: Optional[str] = None,
) -> List[str]:
    """Generate 3 to 5 targeted doctor questions deterministically based on non-normal tests."""
    abnormals = [r for r in results if r.status in [ClassificationStatus.LOW, ClassificationStatus.HIGH, ClassificationStatus.URGENT]]

    if not abnormals:
        return [
            "My lab test results appear to be within normal ranges; are there any lifestyle habits you recommend to maintain these results?",
            "Based on my overall medical history and these numbers, when should I schedule my next routine screening?",
            "Are there any specific dietary or physical activity goals I should focus on before my next checkup?",
        ]

    questions: List[str] = []
    for r in abnormals:
        test = r.test_canonical
        val = f"{r.value} {r.unit_reported or ''}".strip()
        status_name = r.status.value

        if r.status == ClassificationStatus.URGENT:
            questions.append(
                f"My {test} level reached a critical value of {val}. What immediate clinical steps or treatments do we need to take today?"
            )
        elif r.status == ClassificationStatus.HIGH:
            questions.append(
                f"My {test} is higher than normal at {val}. What possible causes or follow-up tests would you recommend investigating?"
            )
        elif r.status == ClassificationStatus.LOW:
            questions.append(
                f"My {test} is lower than normal at {val}. Could nutritional factors or other health conditions be contributing to this?"
            )

    # Ensure 3 to 5 questions
    if len(questions) < 3:
        questions.append("Would you recommend repeating any of these tests in a few weeks to confirm the trend?")
    if len(questions) < 3:
        questions.append("Are there any symptoms I should watch out for related to these out-of-range values?")

    return questions[:5]

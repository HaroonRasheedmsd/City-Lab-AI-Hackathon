"""Parser functions for CityLab data files."""

import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from backend.models.schemas import DemographicData, RangeUsed, TestResultInput, UrgentInfo

logger = logging.getLogger(__name__)


def strip_appendices(content: str) -> str:
    """Strip legal and operational boilerplate noise from corpus files."""
    if "### APPENDIX" in content:
        return content.split("### APPENDIX")[0].strip()
    return content.strip()


def parse_safety_rules(content: str) -> Dict[str, str]:
    """Parse directives from 1_lab_safety_rules.md."""
    clean = strip_appendices(content)
    directives = {}
    pattern = re.compile(r"^\d+\.\s*\*\*([^*]+)\*\*:\s*(.+)$", re.MULTILINE)
    for match in pattern.finditer(clean):
        key = match.group(1).strip()
        val = match.group(2).strip()
        directives[key] = val
    return directives


def parse_medical_glossary(content: str) -> Dict[str, str]:
    """Parse alias mappings from 2_medical_glossary.md."""
    clean = strip_appendices(content)
    aliases = {}
    for line in clean.splitlines():
        line = line.strip()
        if not line.startswith("*"):
            continue
        # * **SGPT** is the exact equivalent of **ALT** (Alanine Aminotransferase).
        m1 = re.search(r"\*\s*\*\*([^*]+)\*\*\s+is the exact equivalent of\s+\*\*([^*]+)\*\*(?:\s*\(([^)]+)\))?", line)
        if m1:
            alias = m1.group(1).strip()
            target = m1.group(2).strip()
            aliases[alias] = target
            if m1.group(3):
                aliases[m1.group(3).strip()] = target
            continue
        # * **Hb** maps to **Hemoglobin**.
        m2 = re.search(r"\*\s*\*\*([^*]+)\*\*\s+maps to\s+\*\*([^*]+)\*\*", line)
        if m2:
            alias = m2.group(1).strip()
            target = m2.group(2).strip()
            aliases[alias] = target
            continue
    return aliases


def parse_urgent_values(content: str) -> List[Dict[str, Any]]:
    """Parse critical threshold limits from 3_dangerous_urgent_values.md."""
    clean = strip_appendices(content)
    urgents = []
    lines = [l.strip() for l in clean.splitlines() if l.strip().startswith("|")]
    if len(lines) >= 3:
        for row in lines[2:]:
            cells = [c.strip().replace("*", "") for c in row.split("|")[1:-1]]
            if len(cells) >= 4:
                try:
                    urgents.append({
                        "analyte": cells[0],
                        "trigger": cells[1],
                        "threshold": float(cells[2]),
                        "unit": cells[3],
                        "source_file": "3_dangerous_urgent_values.md"
                    })
                except ValueError as err:
                    logger.warning("Failed to parse urgent threshold row: %s, error: %s", row, err)
    return urgents


def parse_hematology_ranges(content: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Parse reference ranges and edge case rule from 4_ranges_hematology.md."""
    clean = strip_appendices(content)
    edge_rule = ""
    ranges = []
    
    # Extract edge case rule
    m_edge = re.search(r"\*\*Edge Case Rule\*\*:\s*([^\n\r]+)", clean)
    if m_edge:
        edge_rule = m_edge.group(1).strip()
        
    current_analyte = None
    for line in clean.splitlines():
        line = line.strip()
        if line.startswith("* **") and ":" in line:
            # * **Hemoglobin (Hb)**:
            m_a = re.match(r"\*\s*\*\*([^(:]+)(?:\s*\(([^)]+)\))?\*\*:", line)
            if m_a:
                current_analyte = m_a.group(1).strip()
            continue
        if line.startswith("*") and current_analyte:
            # * Male Demographic (18-100 yrs): 13.8 - 17.2 g/dL
            # * All Sexes (18-100 yrs): 4500 - 11000 cells/mcL
            m_sub = re.search(r"\*\s*([A-Za-z\s]+)\s*\(([0-9]+)-([0-9]+)\s*yrs\):\s*([0-9.]+)\s*-\s*([0-9.]+)\s*([A-Za-z/]+)", line)
            if m_sub:
                sex_str = m_sub.group(1).strip()
                sex = "Male" if "Male" in sex_str and "Female" not in sex_str else ("Female" if "Female" in sex_str else "All")
                ranges.append({
                    "analyte": current_analyte,
                    "biological_sex": sex,
                    "age_min": int(m_sub.group(2)),
                    "age_max": int(m_sub.group(3)),
                    "low": float(m_sub.group(4)),
                    "high": float(m_sub.group(5)),
                    "unit": m_sub.group(6).strip(),
                    "source_file": "4_ranges_hematology.md",
                    "row_ref": line
                })
    return edge_rule, ranges


def parse_biochemistry_ranges(content: str) -> List[Dict[str, Any]]:
    """Parse reference table from 5_ranges_biochemistry.md."""
    clean = strip_appendices(content)
    ranges = []
    lines = [l.strip() for l in clean.splitlines() if l.strip().startswith("|")]
    if len(lines) >= 3:
        for row in lines[2:]:
            cells = [c.strip().replace("*", "") for c in row.split("|")[1:-1]]
            if len(cells) >= 7:
                try:
                    ranges.append({
                        "analyte": cells[0],
                        "biological_sex": cells[1],
                        "age_min": int(cells[2]),
                        "age_max": int(cells[3]),
                        "low": float(cells[4]),
                        "high": float(cells[5]),
                        "unit": cells[6],
                        "source_file": "5_ranges_biochemistry.md",
                        "row_ref": row
                    })
                except ValueError as err:
                    logger.warning("Failed to parse biochemistry row: %s, error: %s", row, err)
    return ranges


def parse_thyroid_urine_ranges(content: str) -> List[Dict[str, Any]]:
    """Parse reference entries from 6_ranges_thyroid_urine.md."""
    clean = strip_appendices(content)
    ranges = []
    for line in clean.splitlines():
        line = line.strip()
        if not line.startswith("*"):
            continue
        # * **TSH**: 0.4 - 4.0 mIU/L (Applicable to All sexes, 18-100 yrs).
        m_tsh = re.search(r"\*\s*\*\*TSH\*\*:\s*([0-9.]+)\s*-\s*([0-9.]+)\s*([A-Za-z/]+)\s*\(Applicable to ([^,]+),\s*([0-9]+)-([0-9]+)\s*yrs\)", line)
        if m_tsh:
            ranges.append({
                "analyte": "TSH",
                "biological_sex": "All",
                "age_min": int(m_tsh.group(5)),
                "age_max": int(m_tsh.group(6)),
                "low": float(m_tsh.group(1)),
                "high": float(m_tsh.group(2)),
                "unit": m_tsh.group(3).strip(),
                "source_file": "6_ranges_thyroid_urine.md",
                "row_ref": line
            })
            continue
        # * **Urine pH**: 4.5 - 8.0 (Applicable to All sexes, 18-100 yrs).
        m_ph = re.search(r"\*\s*\*\*Urine pH\*\*:\s*([0-9.]+)\s*-\s*([0-9.]+)\s*\(Applicable to ([^,]+),\s*([0-9]+)-([0-9]+)\s*yrs\)", line)
        if m_ph:
            ranges.append({
                "analyte": "Urine pH",
                "biological_sex": "All",
                "age_min": int(m_ph.group(4)),
                "age_max": int(m_ph.group(5)),
                "low": float(m_ph.group(1)),
                "high": float(m_ph.group(2)),
                "unit": "pH",
                "source_file": "6_ranges_thyroid_urine.md",
                "row_ref": line
            })
            continue
        # * **Urine Protein**: Negative (Applicable to All sexes, 18-100 yrs).
        m_prot = re.search(r"\*\s*\*\*Urine Protein\*\*:\s*([A-Za-z]+)\s*\(Applicable to ([^,]+),\s*([0-9]+)-([0-9]+)\s*yrs\)", line)
        if m_prot:
            ranges.append({
                "analyte": "Urine Protein",
                "biological_sex": "All",
                "age_min": int(m_prot.group(3)),
                "age_max": int(m_prot.group(4)),
                "low": None,
                "high": None,
                "qualitative_normal": m_prot.group(1).strip(),
                "unit": "qualitative",
                "source_file": "6_ranges_thyroid_urine.md",
                "row_ref": line
            })
            continue
    return ranges


def parse_patient_report(content: str, filename: str = "") -> Tuple[DemographicData, List[TestResultInput]]:
    """Parse patient demographics and analytical results from a report file or raw text."""
    clean = strip_appendices(content)
    
    # Demographics parsing
    patient_id = None
    if filename:
        m_pid = re.search(r"P\d+", filename)
        if m_pid:
            patient_id = m_pid.group(0)
            
    patient_name = None
    m_name = re.search(r"\*\s*\*\*Patient Full Name\*\*:\s*(.+)", clean)
    if m_name:
        patient_name = m_name.group(1).strip()
        
    raw_age_text = None
    recorded_age = None
    m_age = re.search(r"\*\s*\*\*Recorded Age\*\*:\s*(.+)", clean)
    if m_age:
        raw_age_text = m_age.group(1).strip()
        try:
            recorded_age = int(raw_age_text)
        except ValueError:
            recorded_age = None
            
    raw_sex_text = None
    biological_sex = None
    m_sex = re.search(r"\*\s*\*\*Biological Sex\*\*:\s*(.+)", clean)
    if m_sex:
        raw_sex_text = m_sex.group(1).strip()
        if raw_sex_text.lower() in ["male", "female"]:
            biological_sex = raw_sex_text.capitalize()
        else:
            biological_sex = None
            
    mrn = None
    m_mrn = re.search(r"\*\s*\*\*Medical Record Number \(MRN\)\*\*:\s*(.+)", clean)
    if m_mrn:
        mrn = m_mrn.group(1).strip()
        if not patient_id:
            m_mrn_id = re.search(r"P\d+", mrn)
            if m_mrn_id:
                patient_id = m_mrn_id.group(0)
                
    date_of_issuance = None
    m_date = re.search(r"\*\s*\*\*Date of Issuance\*\*:\s*(.+)", clean)
    if m_date:
        date_of_issuance = m_date.group(1).strip()
        
    demo = DemographicData(
        patient_id=patient_id,
        patient_name=patient_name,
        recorded_age=recorded_age,
        biological_sex=biological_sex,
        mrn=mrn,
        date_of_issuance=date_of_issuance,
        raw_age_text=raw_age_text,
        raw_sex_text=raw_sex_text
    )
    
    # Section III Analytical Results
    tests: List[TestResultInput] = []
    sec3_match = re.search(r"## SECTION III: ANALYTICAL RESULTS.*?\n(.*)", clean, re.DOTALL)
    if sec3_match:
        sec3_text = sec3_match.group(1).strip()
        # 1. Check for markdown table
        table_lines = [l.strip() for l in sec3_text.splitlines() if l.strip().startswith("|")]
        if len(table_lines) >= 3:
            for row in table_lines[2:]:
                cells = [c.strip().replace("*", "") for c in row.split("|")[1:-1]]
                if len(cells) >= 3:
                    tests.append(TestResultInput(
                        test_name=cells[0],
                        value=cells[1],
                        unit=cells[2]
                    ))
        else:
            lines = [l.strip() for l in sec3_text.splitlines() if l.strip() and not l.strip().startswith("The analytical")]
            i = 0
            while i < len(lines):
                line = lines[i]
                # Pattern: Test Conducted: / Value Recorded: or Test: / Result:
                m_tc = re.match(r"^(?:Test Conducted|Test):\s*(.+)", line, re.IGNORECASE)
                if m_tc and i + 1 < len(lines):
                    next_line = lines[i+1]
                    m_vr = re.match(r"^(?:Value Recorded|Result):\s*([<>]?[0-9.]+|[A-Za-z]+)\s*([a-zA-Z/]+)?", next_line, re.IGNORECASE)
                    if m_vr:
                        tests.append(TestResultInput(
                            test_name=m_tc.group(1).strip(),
                            value=m_vr.group(1).strip(),
                            unit=(m_vr.group(2) or "").strip()
                        ))
                        i += 2
                        continue
                # Arrow syntax: * pH Level -> 5.5
                m_arrow = re.match(r"^\*?\s*([a-zA-Z0-9\s()]+?)\s*->\s*([<>]?[0-9.]+|[A-Za-z]+)", line)
                if m_arrow:
                    tests.append(TestResultInput(
                        test_name=m_arrow.group(1).strip(),
                        value=m_arrow.group(2).strip(),
                        unit=""
                    ))
                    i += 1
                    continue
                # Bullet list syntax: - **Fasting Blood Sugar**: 6.0 mmol/L or - Hemoglobin: 13.5 g/dL
                m_bullet = re.match(r"^[-*]\s*(?:\*\*)?([a-zA-Z0-9\s()]+?)(?:\*\*)?:\s*([<>]?[0-9.]+|[A-Za-z]+)\s*([a-zA-Z/]+)?", line)
                if m_bullet:
                    tests.append(TestResultInput(
                        test_name=m_bullet.group(1).strip(),
                        value=m_bullet.group(2).strip(),
                        unit=(m_bullet.group(3) or "").strip()
                    ))
                    i += 1
                    continue
                # Plain colon line: TSH: 2.5 mIU/L
                m_colon = re.match(r"^([a-zA-Z0-9\s()]+):\s*([<>]?[0-9.]+|[A-Za-z]+)\s*([a-zA-Z/]+)?", line)
                if m_colon:
                    tests.append(TestResultInput(
                        test_name=m_colon.group(1).strip(),
                        value=m_colon.group(2).strip(),
                        unit=(m_colon.group(3) or "").strip()
                    ))
                    i += 1
                    continue
                logger.warning("Unrecognized analytical result line: %s", line)
                i += 1
                
    return demo, tests

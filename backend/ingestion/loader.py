"""Data loader and in-memory cache for CityLab reference corpus."""

import glob
import logging
import os
from typing import Any, Dict, List, Optional, Tuple
from backend.ingestion.parser import (
    parse_biochemistry_ranges,
    parse_hematology_ranges,
    parse_medical_glossary,
    parse_patient_report,
    parse_safety_rules,
    parse_thyroid_urine_ranges,
    parse_urgent_values,
)
from backend.models.schemas import DemographicData, TestResultInput

logger = logging.getLogger(__name__)


class CorpusDatabase:
    """In-memory cache for all ingested lab rules, reference sheets, and patient reports."""

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or self._discover_data_dir()
        self.safety_rules: Dict[str, str] = {}
        self.glossary: Dict[str, str] = {}
        self.urgent_thresholds: List[Dict[str, Any]] = []
        self.edge_case_rule: str = ""
        self.reference_ranges: List[Dict[str, Any]] = []
        self.patients: Dict[str, Tuple[DemographicData, List[TestResultInput]]] = {}
        self.patient_files: Dict[str, str] = {}
        self._is_loaded = False
        self.load()

    def _discover_data_dir(self) -> str:
        """Find the lab_reports directory relative to backend or current working directory."""
        candidates = [
            os.path.join(os.path.dirname(__file__), "..", "..", "lab_reports"),
            os.path.join(os.getcwd(), "City-Lab-AI-Hackathon", "lab_reports"),
            os.path.join(os.getcwd(), "lab_reports"),
            os.path.abspath("lab_reports"),
        ]
        for c in candidates:
            if os.path.isdir(c):
                return os.path.abspath(c)
        raise FileNotFoundError(f"Could not locate lab_reports directory. Searched: {candidates}")

    def load(self, force_reload: bool = False) -> None:
        """Load and parse all corpus files into memory."""
        if self._is_loaded and not force_reload:
            return

        logger.info("Ingesting CityLab corpus from directory: %s", self.data_dir)

        # 1. Safety Rules
        safety_path = os.path.join(self.data_dir, "1_lab_safety_rules.md")
        if os.path.exists(safety_path):
            with open(safety_path, "r", encoding="utf-8") as f:
                self.safety_rules = parse_safety_rules(f.read())
        else:
            logger.warning("Missing safety rules file: %s", safety_path)

        # 2. Medical Glossary
        glossary_path = os.path.join(self.data_dir, "2_medical_glossary.md")
        if os.path.exists(glossary_path):
            with open(glossary_path, "r", encoding="utf-8") as f:
                self.glossary = parse_medical_glossary(f.read())
        else:
            logger.warning("Missing medical glossary file: %s", glossary_path)

        # 3. Dangerous / Urgent Values
        urgent_path = os.path.join(self.data_dir, "3_dangerous_urgent_values.md")
        if os.path.exists(urgent_path):
            with open(urgent_path, "r", encoding="utf-8") as f:
                self.urgent_thresholds = parse_urgent_values(f.read())
        else:
            logger.warning("Missing urgent values file: %s", urgent_path)

        # 4. Ranges Hematology
        hem_path = os.path.join(self.data_dir, "4_ranges_hematology.md")
        all_ranges = []
        if os.path.exists(hem_path):
            with open(hem_path, "r", encoding="utf-8") as f:
                edge_rule, hem_ranges = parse_hematology_ranges(f.read())
                self.edge_case_rule = edge_rule
                all_ranges.extend(hem_ranges)
        else:
            logger.warning("Missing hematology ranges file: %s", hem_path)

        # 5. Ranges Biochemistry
        bio_path = os.path.join(self.data_dir, "5_ranges_biochemistry.md")
        if os.path.exists(bio_path):
            with open(bio_path, "r", encoding="utf-8") as f:
                all_ranges.extend(parse_biochemistry_ranges(f.read()))
        else:
            logger.warning("Missing biochemistry ranges file: %s", bio_path)

        # 6. Ranges Thyroid & Urine
        thy_path = os.path.join(self.data_dir, "6_ranges_thyroid_urine.md")
        if os.path.exists(thy_path):
            with open(thy_path, "r", encoding="utf-8") as f:
                all_ranges.extend(parse_thyroid_urine_ranges(f.read()))
        else:
            logger.warning("Missing thyroid/urine ranges file: %s", thy_path)

        self.reference_ranges = all_ranges

        # 7. Patient Reports
        report_files = sorted(glob.glob(os.path.join(self.data_dir, "report_*.md")))
        for rpath in report_files:
            fname = os.path.basename(rpath)
            try:
                with open(rpath, "r", encoding="utf-8") as f:
                    content = f.read()
                demo, tests = parse_patient_report(content, filename=fname)
                pid = demo.patient_id or fname
                self.patients[pid] = (demo, tests)
                self.patient_files[pid] = rpath
            except Exception as err:
                logger.warning("Error ingesting patient report %s: %s", fname, err)

        self._is_loaded = True
        logger.info(
            "Ingestion complete: %d safety rules, %d aliases, %d urgent limits, %d reference ranges, %d patient reports.",
            len(self.safety_rules),
            len(self.glossary),
            len(self.urgent_thresholds),
            len(self.reference_ranges),
            len(self.patients),
        )


# Global singleton instance for easy dependency injection
_db_instance: Optional[CorpusDatabase] = None


def get_corpus_db(data_dir: Optional[str] = None) -> CorpusDatabase:
    """Get or initialize the cached in-memory database."""
    global _db_instance
    if _db_instance is None or data_dir is not None:
        _db_instance = CorpusDatabase(data_dir)
    return _db_instance

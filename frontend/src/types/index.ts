/**
 * TypeScript definitions matching the CityLab Diagnostics backend schemas.
 */

export type ClassificationStatus =
  | 'NORMAL'
  | 'LOW'
  | 'HIGH'
  | 'URGENT'
  | 'CANNOT BE CLASSIFIED FROM THE FILES'
  | 'NEEDS_INFO';

export interface DemographicData {
  patient_id?: string | null;
  patient_name?: string | null;
  recorded_age?: number | null;
  biological_sex?: string | null;
  mrn?: string | null;
  date_of_issuance?: string | null;
  raw_age_text?: string | null;
  raw_sex_text?: string | null;
}

export interface TestResultInput {
  test_name: string;
  value: number | string;
  unit?: string | null;
}

export interface PatientReportInput {
  patient_id?: string;
  patient_name?: string;
  age?: number | string;
  biological_sex?: string;
  mrn?: string;
  date_of_issuance?: string;
  results?: TestResultInput[];
  raw_text?: string;
}

export interface RangeUsed {
  low?: number | null;
  high?: number | null;
  unit?: string | null;
  qualitative_normal?: string | null;
  source_file: string;
  row_ref: string;
  age_bracket: string;
  sex_bracket: string;
}

export interface UrgentInfo {
  is_urgent: boolean;
  threshold_trigger: string;
  threshold_value: number;
  threshold_unit: string;
  severe_warning: string;
  source_file: string;
}

export interface ClassificationResult {
  test_canonical: string;
  test_as_reported: string;
  value: number | string;
  unit_reported?: string | null;
  converted_value?: number | string | null;
  converted_unit?: string | null;
  conversion_steps?: string | null;
  conversion_source?: string | null;
  range_used?: RangeUsed | null;
  status: ClassificationStatus;
  reason_code: string;
  boundary_note?: string | null;
  urgent_info?: UrgentInfo | null;
  source_refs: string[];
  missing_fields?: string[] | null;
}

export interface ReportSummary {
  patient_id?: string | null;
  patient_name?: string | null;
  demographics?: DemographicData | null;
  total_tests: number;
  counts_by_status: Record<string, number>;
  abnormal_tests: string[];
  urgent_flags: string[];
  missing_info_flags: string[];
  results: ClassificationResult[];
  severe_warning?: string | null;
}

export interface PatientListItem {
  patient_id: string;
  patient_name?: string | null;
  recorded_age?: number | null;
  biological_sex?: string | null;
  mrn?: string | null;
  test_count: number;
  source_file: string;
}

export interface TestExplanationItem {
  test_canonical: string;
  what_it_measures: string;
  what_low_or_high_can_mean: string;
  simple_summary: string;
}

export interface ExplanationResponse {
  patient_id: string;
  patient_name?: string | null;
  provider_used: string;
  cached: boolean;
  latency_ms: number;
  explanations: TestExplanationItem[];
  disclaimer: string;
}

export interface DoctorQuestionsResponse {
  patient_id: string;
  patient_name?: string | null;
  provider_used: string;
  cached: boolean;
  latency_ms: number;
  questions: string[];
  is_general: boolean;
  urgent_warning?: string | null;
}

export interface PrivacyRefusal {
  refusal: boolean;
  reason: string;
  rule_quoted: string;
  source_file: string;
  directive: string;
}

export interface ChatResponse {
  patient_id: string;
  intent: string;
  response: string;
  provider_used: string;
  cached: boolean;
  latency_ms: number;
  safety_refusal?: PrivacyRefusal | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  engine: string;
  explanation_layer: string;
  patients_loaded: number;
  reference_ranges_loaded: number;
  urgent_rules_loaded: number;
}

export type SupportedLanguage = 'en' | 'roman_urdu' | 'urdu';

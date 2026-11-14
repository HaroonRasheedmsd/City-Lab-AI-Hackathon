/**
 * CityLab Diagnostics REST API Client
 */

import type {
  ChatResponse,
  DoctorQuestionsResponse,
  ExplanationResponse,
  HealthResponse,
  PatientListItem,
  PatientReportInput,
  ReportSummary,
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    let data = null;
    try {
      data = await response.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(errorDetail, response.status, data);
  }

  return response.json();
}

export const api = {
  /**
   * Health check
   */
  async getHealth(): Promise<HealthResponse> {
    return fetchJson<HealthResponse>('/health');
  },

  /**
   * List all ingested patient reports
   */
  async getPatients(): Promise<PatientListItem[]> {
    return fetchJson<PatientListItem[]>('/patients');
  },

  /**
   * Get deterministic analysis for an ingested patient report
   */
  async getPatientAnalysis(patientId: string): Promise<ReportSummary> {
    const encoded = encodeURIComponent(patientId.trim().toUpperCase());
    return fetchJson<ReportSummary>(`/patients/${encoded}/analysis`);
  },

  /**
   * Analyze custom pasted/uploaded report or re-analyze with demographic overrides
   */
  async analyzeReport(payload: PatientReportInput): Promise<ReportSummary> {
    return fetchJson<ReportSummary>('/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get plain-language explanations from LLM layer (or fallback templates)
   */
  async getPatientExplanation(patientId: string): Promise<ExplanationResponse> {
    const encoded = encodeURIComponent(patientId.trim().toUpperCase());
    return fetchJson<ExplanationResponse>(`/patients/${encoded}/explain`, {
      method: 'POST',
    });
  },

  /**
   * Get 3-5 doctor consultation questions
   */
  async getDoctorQuestions(patientId: string): Promise<DoctorQuestionsResponse> {
    const encoded = encodeURIComponent(patientId.trim().toUpperCase());
    return fetchJson<DoctorQuestionsResponse>(`/patients/${encoded}/doctor-questions`, {
      method: 'POST',
    });
  },

  /**
   * Chat with patient context lock
   */
  async sendChatMessage(patientId: string, message: string): Promise<ChatResponse> {
    const encoded = encodeURIComponent(patientId.trim().toUpperCase());
    return fetchJson<ChatResponse>(`/patients/${encoded}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

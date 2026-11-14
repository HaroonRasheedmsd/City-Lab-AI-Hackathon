import React from 'react';
import type {
  ReportSummary,
  DoctorQuestionsResponse,
  SupportedLanguage,
} from '../types';
import { translations } from '../i18n/translations';

interface PrintSummaryProps {
  summary?: ReportSummary | null;
  doctorData?: DoctorQuestionsResponse | null;
  selectedQuestions: string[];
  language: SupportedLanguage;
}

export const PrintSummary: React.FC<PrintSummaryProps> = ({
  summary,
  doctorData,
  selectedQuestions,
  language,
}) => {
  const t = translations[language];
  const [printDate] = React.useState(() => new Date().toLocaleDateString());

  if (!summary) return null;

  const demo = summary.demographics;
  const questionsToPrint =
    selectedQuestions.length > 0
      ? selectedQuestions
      : doctorData?.questions || [];

  return (
    <div className="print-only p-8 text-black bg-white max-w-4xl mx-auto font-sans">
      {/* CityLab Header */}
      <div className="border-b-2 border-teal-800 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-teal-900">
            CITYLAB DIAGNOSTICS
          </h1>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Clinical Laboratory Evaluation &amp; Patient Explainer Summary
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Printed: {printDate}</div>
          <div className="font-mono text-[11px]">System: Rules Engine v1.0</div>
        </div>
      </div>

      {/* Patient Encounter Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6 text-xs">
        <div>
          <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[10px]">
            Patient Name
          </span>
          <span className="font-bold text-sm text-gray-900">
            {summary.patient_name || demo?.patient_name || 'Anonymous Patient'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[10px]">
            Patient ID / MRN
          </span>
          <span className="font-bold text-sm text-gray-900">
            {summary.patient_id || 'N/A'} {demo?.mrn ? `(${demo.mrn})` : ''}
          </span>
        </div>
        <div>
          <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[10px]">
            Age / Biological Sex
          </span>
          <span className="font-bold text-sm text-gray-900">
            {demo?.recorded_age ? `${demo.recorded_age} yrs` : 'Not provided'} /{' '}
            {demo?.biological_sex || 'Not provided'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[10px]">
            Total Tests Evaluated
          </span>
          <span className="font-bold text-sm text-gray-900">
            {summary.total_tests} tests
          </span>
        </div>
      </div>

      {/* Critical Urgent Warning Banner if any */}
      {summary.severe_warning && (
        <div className="p-3 border-2 border-red-600 bg-red-50 text-red-900 rounded-md mb-6 text-xs">
          <strong className="block text-red-700 font-bold uppercase tracking-wider text-[11px] mb-0.5">
            CRITICAL MEDICAL ALERT
          </strong>
          <span>{summary.severe_warning}</span>
        </div>
      )}

      {/* Laboratory Results Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
          Evaluated Laboratory Results
        </h2>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-gray-700">
              <th className="py-2 px-2 font-bold">Test Name</th>
              <th className="py-2 px-2 font-bold">Reported Result</th>
              <th className="py-2 px-2 font-bold">Reference Range</th>
              <th className="py-2 px-2 font-bold">Classification</th>
              <th className="py-2 px-2 font-bold">Source Reference</th>
            </tr>
          </thead>
          <tbody>
            {summary.results.map((res, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2 px-2 font-semibold text-gray-900">
                  {res.test_canonical}
                  {res.test_as_reported.toLowerCase() !== res.test_canonical.toLowerCase() && (
                    <span className="text-[10px] text-gray-500 block">
                      (Reported as: {res.test_as_reported})
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 font-mono">
                  {res.value} {res.unit_reported || ''}
                  {res.converted_value && (
                    <span className="text-[10px] text-gray-500 block">
                      = {res.converted_value} {res.converted_unit}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-gray-600">
                  {res.range_used
                    ? `${res.range_used.low} – ${res.range_used.high} ${res.range_used.unit}`
                    : 'Not in catalog'}
                </td>
                <td className="py-2 px-2 font-bold">
                  <span
                    className={
                      res.status === 'NORMAL'
                        ? 'text-emerald-700'
                        : res.status === 'URGENT'
                        ? 'text-red-700 font-extrabold'
                        : res.status === 'HIGH' || res.status === 'LOW'
                        ? 'text-amber-700'
                        : 'text-gray-600'
                    }
                  >
                    {res.status}
                  </span>
                </td>
                <td className="py-2 px-2 text-[10px] text-gray-500 font-mono">
                  {res.source_refs.join(', ') || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Physician Consultation Questions */}
      {questionsToPrint.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 page-break">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
            Suggested Inquiries for Your Physician
          </h2>
          <ol className="list-decimal pl-4 space-y-1.5 text-xs text-gray-800">
            {questionsToPrint.map((q, idx) => (
              <li key={idx} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Mandatory Lab Safety Disclaimer */}
      <div className="p-4 border border-gray-300 rounded-lg bg-white text-[11px] text-gray-600 space-y-1">
        <strong className="block text-gray-900 font-bold uppercase tracking-wider text-[10px]">
          {t.disclaimerTitle} (Directives 2 &amp; 4)
        </strong>
        <p className="leading-relaxed">{t.disclaimerBody}</p>
        <div className="pt-2 text-[10px] text-gray-400">
          CityLab Diagnostics Automated Explainer Engine • Confidential Medical Record
        </div>
      </div>
    </div>
  );
};

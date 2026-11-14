import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  ChevronDown,
  Check,
  Send,
} from 'lucide-react';
import type { PatientListItem, DemographicData } from '../types';

interface PatientHeaderProps {
  patientId: string | null;
  patientName?: string | null;
  demographics?: DemographicData | null;
  patients: PatientListItem[];
  onSelectPatient: (id: string) => void;
  onExplainClick: () => void;
  missingDemographicsNotice: {
    patientId: string;
    patientName?: string | null;
    missingFields: string[];
    onProvide: (age: number | undefined, sex: string | undefined) => void;
  } | null;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patientId,
  patientName,
  demographics,
  patients,
  onSelectPatient,
  onExplainClick,
  missingDemographicsNotice,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputAge, setInputAge] = useState<string>('');
  const [inputSex, setInputSex] = useState<string>('Male');

  // Compute initials
  const displayName = patientName || demographics?.patient_name || patientId || 'Patient';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PT';

  const ageText =
    demographics?.recorded_age !== null && demographics?.recorded_age !== undefined
      ? `${demographics.recorded_age} yrs`
      : demographics?.raw_age_text || 'Missing';

  const sexText =
    demographics?.biological_sex || demographics?.raw_sex_text || 'Missing';

  const mrnText = demographics?.mrn || (patientId ? `MRN-${patientId.replace(/\D/g, '') || '001'}` : 'MRN-Pending');
  const dateText = demographics?.date_of_issuance || '14-Oct-2024';

  const isAgeMissing = ageText === 'Missing';
  const isSexMissing = sexText === 'Missing';

  const handleApplyDemographics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingDemographicsNotice) return;
    const parsedAge = inputAge ? parseInt(inputAge, 10) : undefined;
    const validAge = !isNaN(parsedAge!) && parsedAge! > 0 ? parsedAge : undefined;
    missingDemographicsNotice.onProvide(validAge, inputSex);
  };

  return (
    <div className="bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 rounded-2xl p-6 shadow-soft space-y-5">
      {/* Top Row: Avatar, Identity, Dropdown Switcher, and Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Patient Identity Block */}
        <div className="flex items-center gap-4">
          {/* Avatar Monogram */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px]">
              <Check size={10} strokeWidth={3} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-zendenta-slate-dark dark:text-white tracking-tight">
                {displayName}
              </h1>

              {/* Patient Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition"
                  title="Switch Patient"
                >
                  <ChevronDown size={14} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 max-h-60 overflow-y-auto">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      CityLab Roster (14 Patients)
                    </p>
                    {patients.map((p) => (
                      <button
                        key={p.patient_id}
                        onClick={() => {
                          onSelectPatient(p.patient_id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                          p.patient_id === patientId
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-zendenta-blue font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">
                          {p.patient_name || p.patient_id} ({p.patient_id})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.test_count} tests
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-bar: Patient ID & Chief Complaint */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-bold text-zendenta-blue dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                {patientId || 'ID: UNKNOWN'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-zendenta-slate-muted dark:text-slate-400">
                Annual Executive Health &amp; Diagnostic Checkup
              </span>
            </div>
          </div>
        </div>

        {/* Primary CTA: Explain My Report */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExplainClick}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>Explain My Report</span>
          </button>
        </div>
      </div>

      {/* Demographic Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Age */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Age
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-sm font-bold ${
                isAgeMissing
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zendenta-slate-dark dark:text-white'
              }`}
            >
              {ageText}
            </span>
            {isAgeMissing && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Needed
              </span>
            )}
          </div>
        </div>

        {/* Biological Sex */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Biological Sex
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-sm font-bold ${
                isSexMissing
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zendenta-slate-dark dark:text-white'
              }`}
            >
              {sexText}
            </span>
            {isSexMissing && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Needed
              </span>
            )}
          </div>
        </div>

        {/* MRN */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            MRN / File No.
          </span>
          <span className="text-sm font-bold text-zendenta-slate-dark dark:text-white font-mono mt-0.5 block truncate">
            {mrnText}
          </span>
        </div>

        {/* Date of Issuance */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Date Issued
          </span>
          <span className="text-sm font-bold text-zendenta-slate-dark dark:text-white mt-0.5 block truncate">
            {dateText}
          </span>
        </div>
      </div>

      {/* Inline Missing Demographics Alert Banner (Strict Rule) */}
      {missingDemographicsNotice && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Demographic Input Required for Complete Range Classification
            </h4>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Some tests (such as Hemoglobin, TLC, or Alkaline Phosphatase) require exact age brackets or biological sex to apply normal reference ranges safely.
          </p>

          <form onSubmit={handleApplyDemographics} className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Age:
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={inputAge}
                onChange={(e) => setInputAge(e.target.value)}
                placeholder="e.g. 45"
                className="w-20 px-2.5 py-1 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Sex:
              </label>
              <select
                value={inputSex}
                onChange={(e) => setInputSex(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Send size={12} />
              <span>Apply &amp; Re-evaluate</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

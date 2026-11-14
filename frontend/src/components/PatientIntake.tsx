import React, { useState } from 'react';
import {
  Users,
  FileText,
  Upload,
  AlertCircle,
  Sparkles,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import type { PatientListItem, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface PatientIntakeProps {
  patients: PatientListItem[];
  selectedPatientId?: string | null;
  onSelectPatient: (patientId: string) => void;
  onAnalyzeCustom: (rawText: string, age?: number, sex?: string, name?: string) => void;
  isLoading: boolean;
  language: SupportedLanguage;
  missingDemographicsNotice?: {
    patientId: string;
    patientName?: string | null;
    missingFields: string[];
    onProvide: (age: number | undefined, sex: string | undefined) => void;
  } | null;
}

export const PatientIntake: React.FC<PatientIntakeProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onAnalyzeCustom,
  isLoading,
  language,
  missingDemographicsNotice,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'roster' | 'custom'>('roster');
  const [customText, setCustomText] = useState('');
  const [customAge, setCustomAge] = useState<string>('');
  const [customSex, setCustomSex] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  // Inline demographic prompt state for existing patient
  const [providedAge, setProvidedAge] = useState<string>('');
  const [providedSex, setProvidedSex] = useState<string>('Female');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    const parsedAge = customAge ? parseInt(customAge, 10) : undefined;
    const parsedSex = customSex ? customSex : undefined;
    onAnalyzeCustom(customText, parsedAge, parsedSex, customName || undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCustomText(text);
        setActiveTab('custom');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleReport = () => {
    const sample = `PATIENT REPORT
Patient ID: DEMO-001
Patient Name: Jane Doe
Age: 42
Sex: Female
MRN: MRN-99812

TEST RESULTS
Hemoglobin: 11.2 g/dL
Fasting Blood Sugar: 142 mg/dL
ALT (SGPT): 58 U/L
Serum Ferritin: 180 ng/mL
WBC Count: 7.4 x10^3/uL`;
    setCustomText(sample);
    setCustomAge('42');
    setCustomSex('Female');
    setCustomName('Jane Doe');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={16} />
            <span>{t.selectPatient} ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={16} />
            <span>{t.customReportTab}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 cursor-pointer transition">
            <Upload size={14} />
            <span>Upload .txt report</span>
            <input
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Roster Selector Tab */}
      {activeTab === 'roster' && (
        <div className="mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t.choosePatientPrompt}
            </p>
            <span className="text-xs text-slate-400 italic">
              All 14 test cases loaded from CityLab corpus
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
            {patients.map((p) => {
              const isSelected = selectedPatientId === p.patient_id;
              const hasMissingDemo = !p.recorded_age || !p.biological_sex;

              return (
                <button
                  key={p.patient_id}
                  onClick={() => onSelectPatient(p.patient_id)}
                  disabled={isLoading}
                  className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-500/30'
                      : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                      {p.patient_id}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-200 dark:ring-teal-900/60" />
                    )}
                  </div>
                  <div className="mt-1 font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {p.patient_name || 'Anonymous Patient'}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {p.recorded_age ? `${p.recorded_age}y` : <span className="text-violet-600 dark:text-violet-400 font-medium">Age ?</span>}
                    </span>
                    <span>•</span>
                    <span>
                      {p.biological_sex || <span className="text-violet-600 dark:text-violet-400 font-medium">Sex ?</span>}
                    </span>
                    <span>•</span>
                    <span>{p.test_count} tests</span>
                  </div>

                  {hasMissingDemo && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                      <AlertCircle size={12} />
                      <span>Missing demographics</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Report Tab */}
      {activeTab === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Patient Name (Optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full text-sm rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={customAge}
                onChange={(e) => setCustomAge(e.target.value)}
                placeholder="e.g. 35"
                className="w-full text-sm rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biological Sex
              </label>
              <select
                value={customSex}
                onChange={(e) => setCustomSex(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              >
                <option value="">Select Sex (or leave in text)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paste Lab Report Text
              </label>
              <button
                type="button"
                onClick={handleLoadSampleReport}
                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles size={13} />
                <span>Fill sample report</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste patient lab report text here (e.g. Hemoglobin: 13.5 g/dL, ALT: 45 U/L)..."
              className="w-full font-mono text-xs sm:text-sm rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isLoading || !customText.trim()}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Analyze Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Inline Missing Demographics Notice and Input Form */}
      {missingDemographicsNotice && (
        <div className="mt-5 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-violet-950 dark:text-violet-100">
                {t.missingDemographicsNotice} ({missingDemographicsNotice.patientName || missingDemographicsNotice.patientId})
              </h4>
              <p className="text-xs text-violet-800 dark:text-violet-300 mt-0.5 leading-relaxed">
                {t.provideAgeSexPrompt}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-violet-900 dark:text-violet-200">Age:</span>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    placeholder="e.g. 29"
                    value={providedAge}
                    onChange={(e) => setProvidedAge(e.target.value)}
                    className="w-24 text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-violet-900 dark:text-violet-200">Sex:</span>
                  <select
                    value={providedSex}
                    onChange={(e) => setProvidedSex(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const parsedAge = providedAge ? parseInt(providedAge, 10) : undefined;
                    missingDemographicsNotice.onProvide(parsedAge, providedSex);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck size={14} />
                  <span>{t.saveDemographics}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import type {
  PatientListItem,
  ReportSummary,
  TestExplanationItem,
  DoctorQuestionsResponse,
  SupportedLanguage,
} from './types';
import { api } from './api/client';
import { translations } from './i18n/translations';
import { Header } from './components/Header';
import { PatientIntake } from './components/PatientIntake';
import { SummaryBento } from './components/SummaryBento';
import { ResultsList } from './components/ResultsList';
import { DoctorQuestionsPanel } from './components/DoctorQuestionsPanel';
import { ChatPanel } from './components/ChatPanel';
import { SourcesDrawer } from './components/SourcesDrawer';
import { PrintSummary } from './components/PrintSummary';

export default function App() {
  // App settings & theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('citylab_theme') === 'dark';
  });
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  // Data states
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [explanations, setExplanations] = useState<TestExplanationItem[]>([]);
  const [doctorData, setDoctorData] = useState<DoctorQuestionsResponse | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // UI status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDegraded, setIsDegraded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Missing demographics notice state
  const [missingDemographicsNotice, setMissingDemographicsNotice] = useState<{
    patientId: string;
    patientName?: string | null;
    missingFields: string[];
    onProvide: (age: number | undefined, sex: string | undefined) => void;
  } | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('citylab_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('citylab_theme', 'light');
    }
  }, [darkMode]);

  // Fetch full analysis, explanations, and doctor questions for a patient
  const loadPatientData = async (
    patientId: string,
    overrideAge?: number,
    overrideSex?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setSelectedPatientId(patientId);
    setMissingDemographicsNotice(null);

    try {
      let reportSummary: ReportSummary;

      if (overrideAge !== undefined || overrideSex !== undefined) {
        // If overriding demographic values, use /api/analyze with overrides
        const existingPatient = patients.find((p) => p.patient_id === patientId);
        reportSummary = await api.analyzeReport({
          patient_id: patientId,
          patient_name: existingPatient?.patient_name || undefined,
          age: overrideAge ?? existingPatient?.recorded_age ?? undefined,
          biological_sex: overrideSex ?? existingPatient?.biological_sex ?? undefined,
          results: summary?.results.map((r) => ({
            test_name: r.test_as_reported,
            value: r.value,
            unit: r.unit_reported,
          })) || [],
        });
      } else {
        // Standard ingested patient analysis
        reportSummary = await api.getPatientAnalysis(patientId);
      }

      setSummary(reportSummary);

      // Check if any results need demographics (NEEDS_INFO)
      const needsInfoResults = reportSummary.results.filter(
        (r) => r.status === 'NEEDS_INFO'
      );
      if (needsInfoResults.length > 0) {
        const allMissing = Array.from(
          new Set(needsInfoResults.flatMap((r) => r.missing_fields || ['age', 'biological_sex']))
        );
        setMissingDemographicsNotice({
          patientId,
          patientName: reportSummary.patient_name,
          missingFields: allMissing,
          onProvide: (newAge, newSex) => {
            loadPatientData(patientId, newAge, newSex);
          },
        });
      }

      // Fetch explanations and doctor questions in parallel
      try {
        const [explRes, docRes] = await Promise.all([
          api.getPatientExplanation(patientId),
          api.getDoctorQuestions(patientId),
        ]);
        setExplanations(explRes.explanations || []);
        setIsDegraded(explRes.provider_used === 'fallback_template');
        setDoctorData(docRes);
        // Pre-select non-normal questions for printable summary
        setSelectedQuestions(docRes.questions || []);
      } catch (subErr) {
        console.warn('Explanations or doctor questions degraded:', subErr);
        setIsDegraded(true);
      }

      // Smooth entrance animation with GSAP
      if (mainContainerRef.current) {
        gsap.fromTo(
          mainContainerRef.current.children,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' }
        );
      }
    } catch (err: any) {
      console.error('Error loading patient data:', err);
      setError(err.message || 'Error evaluating patient report');
    } finally {
      setIsLoading(false);
    }
  };

  // Load patient roster on initial mount
  useEffect(() => {
    async function loadRoster() {
      try {
        const list = await api.getPatients();
        setPatients(list);
        if (list.length > 0 && !selectedPatientId) {
          // Default to first patient (P001)
          loadPatientData(list[0].patient_id);
        }
      } catch (err: any) {
        console.error('Failed to load patient roster:', err);
        setError('Failed to connect to CityLab backend service. Please ensure FastAPI server is running on port 8000.');
      }
    }
    loadRoster();
  }, []);

  // Custom text or uploaded report analysis
  const handleAnalyzeCustom = async (
    rawText: string,
    age?: number,
    sex?: string,
    name?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setSelectedPatientId('CUSTOM');
    setMissingDemographicsNotice(null);

    try {
      const reportSummary = await api.analyzeReport({
        raw_text: rawText,
        age,
        biological_sex: sex,
        patient_name: name,
      });

      setSummary(reportSummary);

      // Check if any result has NEEDS_INFO
      const needsInfoResults = reportSummary.results.filter(
        (r) => r.status === 'NEEDS_INFO'
      );
      if (needsInfoResults.length > 0) {
        const allMissing = Array.from(
          new Set(needsInfoResults.flatMap((r) => r.missing_fields || ['age', 'biological_sex']))
        );
        setMissingDemographicsNotice({
          patientId: reportSummary.patient_id || 'CUSTOM',
          patientName: reportSummary.patient_name,
          missingFields: allMissing,
          onProvide: (newAge, newSex) => {
            handleAnalyzeCustom(rawText, newAge, newSex, name);
          },
        });
      }

      // Create fallback explanations for custom report tests
      setExplanations([]);
      setDoctorData(null);
      setSelectedQuestions([]);
    } catch (err: any) {
      console.error('Error analyzing custom report:', err);
      setError(err.message || 'Error parsing custom lab report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDoctorQuestion = (q: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(q) ? prev.filter((item) => item !== q) : [...prev, q]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-healthcare-bg dark:bg-healthcare-darkBg flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header Navigation */}
      <Header
        activePatientName={summary?.patient_name || summary?.demographics?.patient_name}
        activePatientId={selectedPatientId}
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onPrint={handlePrint}
      />

      {/* 2. Degraded / Offline LLM Notice */}
      {isDegraded && (
        <div className="no-print bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs text-center font-medium flex items-center justify-center gap-2">
          <Info size={14} className="text-amber-600" />
          <span>{t.degradedNotice}</span>
        </div>
      )}

      {/* 3. Main Content Container */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert with Retry */}
        {error && (
          <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Clinical Service Error</h4>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (selectedPatientId && selectedPatientId !== 'CUSTOM') {
                  loadPatientData(selectedPatientId);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Patient Intake & Roster Picker */}
        <section>
          <PatientIntake
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(id) => loadPatientData(id)}
            onAnalyzeCustom={handleAnalyzeCustom}
            isLoading={isLoading}
            language={language}
            missingDemographicsNotice={missingDemographicsNotice}
          />
        </section>

        {/* Loading Skeleton */}
        {isLoading && !summary && (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              ))}
            </div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        )}

        {/* Evaluated Patient Report Dashboard */}
        {summary && (
          <div ref={mainContainerRef} className="space-y-8">
            {/* Summary Bento Section */}
            <section>
              <SummaryBento summary={summary} language={language} />
            </section>

            {/* Main Split: Results List & Sidebar (Doctor Questions + Patient Chat) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Test Results List (7 cols) */}
              <section className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <span>Evaluated Test Results</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                      {summary.total_tests} Tests
                    </span>
                  </h2>
                </div>

                <ResultsList
                  results={summary.results}
                  explanations={explanations}
                  language={language}
                />
              </section>

              {/* Right Column: Doctor Questions & Context-Locked Chat (5 cols) */}
              <aside className="lg:col-span-5 space-y-8">
                {/* Doctor Questions Panel */}
                <DoctorQuestionsPanel
                  doctorData={doctorData}
                  selectedQuestions={selectedQuestions}
                  onToggleQuestion={handleToggleDoctorQuestion}
                  language={language}
                />

                {/* Patient Context-Locked Chat */}
                <ChatPanel
                  patientId={selectedPatientId}
                  patientName={summary.patient_name || summary.demographics?.patient_name}
                  language={language}
                />
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="no-print border-t border-slate-200/80 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>CityLab Clinical Rules Engine • 100% Deterministic &amp; Auditable</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSourcesOpen(true)}
              className="hover:text-teal-600 transition"
            >
              Clinical Reference Files
            </button>
            <span>•</span>
            <span className="text-slate-400">Tech Fusion '26 Hackathon Problem B</span>
          </div>
        </div>
      </footer>

      {/* 5. Reference Sources Drawer Modal */}
      <SourcesDrawer
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        language={language}
      />

      {/* 6. Clean Printable Summary Component (Rendered only on print / PDF export) */}
      <PrintSummary
        summary={summary}
        doctorData={doctorData}
        selectedQuestions={selectedQuestions}
        language={language}
      />
    </div>
  );
}

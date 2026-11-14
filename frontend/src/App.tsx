import { useState, useEffect, useRef, useMemo } from 'react';
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
  ClassificationResult,
} from './types';
import { api } from './api/client';
import { translations } from './i18n/translations';

// Components
import { Sidebar, type NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { PatientHeader } from './components/PatientHeader';
import { TabsNavigation, type FilterStatusMode } from './components/TabsNavigation';
import { SummaryBento } from './components/SummaryBento';
import { BodySystemsMap } from './components/BodySystemsMap';
import { type OrganSystemKey, mapTestToOrgan } from './types/organSystems';
import { ResultsTimeline } from './components/ResultsTimeline';
import { DetailDrawer } from './components/DetailDrawer';
import { DoctorQuestionsPanel } from './components/DoctorQuestionsPanel';
import { ChatPanel } from './components/ChatPanel';
import { SourcesView } from './components/SourcesView';
import { PatientsRosterView } from './components/PatientsRosterView';
import { NewAnalysisModal } from './components/NewAnalysisModal';
import { PrintSummary } from './components/PrintSummary';

export default function App() {
  // Theme & Language
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('citylab_theme') === 'dark';
  });
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Navigation & UI State
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [filterMode, setFilterMode] = useState<FilterStatusMode>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false);

  // Cross-component Selection
  const [selectedOrgan, setSelectedOrgan] = useState<OrganSystemKey | null>(null);
  const [selectedTest, setSelectedTest] = useState<ClassificationResult | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [initialAiQuestion, setInitialAiQuestion] = useState<string | null>(null);

  // Data states
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [explanations, setExplanations] = useState<TestExplanationItem[]>([]);
  const [doctorData, setDoctorData] = useState<DoctorQuestionsResponse | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // System states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDegraded, setIsDegraded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Missing demographics notice
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

  // Load patient data function
  const loadPatientData = async (
    patientId: string,
    overrideAge?: number,
    overrideSex?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setSelectedPatientId(patientId);
    setMissingDemographicsNotice(null);
    setSelectedOrgan(null);
    setSelectedTest(null);

    try {
      let reportSummary: ReportSummary;

      if (overrideAge !== undefined || overrideSex !== undefined) {
        // Demographic overrides via /api/analyze
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

      // Check for NEEDS_INFO results
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

      // Fetch explanations & doctor questions
      try {
        const [explRes, docRes] = await Promise.all([
          api.getPatientExplanation(patientId),
          api.getDoctorQuestions(patientId),
        ]);
        setExplanations(explRes.explanations || []);
        setIsDegraded(explRes.provider_used === 'fallback_template');
        setDoctorData(docRes);
        setSelectedQuestions(docRes.questions || []);
      } catch (subErr) {
        console.warn('Explanations or doctor questions fallback:', subErr);
        setIsDegraded(true);
      }

      // Smooth GSAP animation
      if (mainContainerRef.current) {
        gsap.fromTo(
          mainContainerRef.current.children,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: 'power2.out' }
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
          loadPatientData(list[0].patient_id);
        }
      } catch (err: any) {
        console.error('Failed to load patient roster:', err);
        setError('Failed to connect to CityLab backend service. Please ensure server is running on port 8000.');
      }
    }
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Custom text intake
  const handleAnalyzeCustom = async (
    rawText: string,
    age?: number,
    sex?: string,
    name?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setMissingDemographicsNotice(null);
    setSelectedOrgan(null);
    setSelectedTest(null);

    try {
      const reportSummary = await api.analyzeReport({
        raw_text: rawText,
        age,
        biological_sex: sex,
        patient_name: name,
      });

      setSelectedPatientId(reportSummary.patient_id || 'CUSTOM');
      setSummary(reportSummary);

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

      setExplanations([]);
      setDoctorData(null);
      setSelectedQuestions([]);
      setCurrentTab('overview');
    } catch (err: any) {
      console.error('Error analyzing custom report:', err);
      setError(err.message || 'Error parsing custom lab report');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Doctor Question for Printable Summary
  const handleToggleDoctorQuestion = (q: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(q) ? prev.filter((item) => item !== q) : [...prev, q]
    );
  };

  const handleInspectTest = (result: ClassificationResult) => {
    setSelectedTest(result);
    setIsDetailDrawerOpen(true);
  };

  const handleAskAiFromDrawer = (question: string) => {
    setIsDetailDrawerOpen(false);
    setInitialAiQuestion(question);
    setCurrentTab('assistant');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter test results by:
  // 1. Attention filter mode (ALL vs ATTENTION)
  // 2. Selected organ (if clicked on BodySystemsMap)
  // 3. Search query
  const filteredResults = useMemo(() => {
    if (!summary) return [];
    let list = summary.results;

    if (filterMode === 'ATTENTION') {
      list = list.filter((r) => r.status !== 'NORMAL');
    }

    if (selectedOrgan) {
      list = list.filter((r) => {
        const organKey = mapTestToOrgan(r.test_canonical, r.test_as_reported);
        return organKey === selectedOrgan;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.test_canonical.toLowerCase().includes(q) ||
          r.test_as_reported.toLowerCase().includes(q) ||
          String(r.value).toLowerCase().includes(q) ||
          (r.unit_reported && r.unit_reported.toLowerCase().includes(q))
      );
    }

    return list;
  }, [summary, filterMode, selectedOrgan, searchQuery]);

  const attentionCount = summary
    ? (summary.counts_by_status['LOW'] || 0) +
      (summary.counts_by_status['HIGH'] || 0) +
      (summary.counts_by_status['URGENT'] || 0) +
      (summary.counts_by_status['NEEDS_INFO'] || 0) +
      (summary.counts_by_status['CANNOT BE CLASSIFIED FROM THE FILES'] || 0)
    : 0;

  const urgentCount = summary ? summary.counts_by_status['URGENT'] || 0 : 0;

  return (
    <div className="min-h-screen bg-healthcare-bg dark:bg-healthcare-darkBg flex font-sans transition-colors duration-200">
      {/* 1. Left Sidebar (Zendenta Layout) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        attentionCount={attentionCount}
      />

      {/* 2. Main Layout Area (Offset by 64 on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          patientId={selectedPatientId}
          patientName={summary?.patient_name || summary?.demographics?.patient_name}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          language={language}
          onLanguageChange={setLanguage}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onPrint={handlePrint}
          onNewAnalysis={() => setIsNewAnalysisModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Degraded LLM Warning Banner */}
        {isDegraded && (
          <div className="no-print bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs text-center font-medium flex items-center justify-center gap-2">
            <Info size={14} className="text-amber-600" />
            <span>{t.degradedNotice}</span>
          </div>
        )}

        {/* Page Main Content */}
        <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Error Banner with Retry */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Service Communication Error
                  </h4>
                  <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  if (selectedPatientId && selectedPatientId !== 'CUSTOM') {
                    loadPatientData(selectedPatientId);
                  } else if (patients.length > 0) {
                    loadPatientData(patients[0].patient_id);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !summary && (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                ))}
              </div>
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          )}

          {/* Patient Header Card */}
          {summary && (
            <PatientHeader
              patientId={selectedPatientId}
              patientName={summary.patient_name || summary.demographics?.patient_name}
              demographics={summary.demographics}
              patients={patients}
              onSelectPatient={(id) => loadPatientData(id)}
              onExplainClick={() => {
                setCurrentTab('assistant');
                setInitialAiQuestion('Please summarize all my lab findings in simple plain language.');
              }}
              missingDemographicsNotice={missingDemographicsNotice}
            />
          )}

          {/* Tab Navigation & Segmented Filter */}
          {summary && (
            <TabsNavigation
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              filterMode={filterMode}
              onFilterChange={setFilterMode}
              totalCount={summary.total_tests}
              attentionCount={attentionCount}
              urgentCount={urgentCount}
              questionsCount={doctorData?.questions.length || 0}
            />
          )}

          {/* TAB 1: OVERVIEW (Bento + Split Body Map & Timeline) */}
          {currentTab === 'overview' && summary && (
            <div ref={mainContainerRef} className="space-y-6">
              {/* Summary Bento Cards */}
              <SummaryBento summary={summary} language={language} />

              {/* Main Split: Body Systems Map (Left 5 cols) & Results Timeline (Right 7 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Panel: Interactive Body Systems Map */}
                <div className="lg:col-span-5 space-y-4">
                  <BodySystemsMap
                    results={summary.results}
                    selectedOrgan={selectedOrgan}
                    onSelectOrgan={setSelectedOrgan}
                    selectedTestCanonical={selectedTest?.test_canonical}
                  />
                </div>

                {/* Right Panel: Results Timeline */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-bold text-zendenta-slate-dark dark:text-white flex items-center gap-2">
                      <span>Timeline of Evaluated Biomarkers</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {filteredResults.length} shown
                      </span>
                    </h3>
                  </div>

                  <ResultsTimeline
                    results={filteredResults}
                    explanations={explanations}
                    selectedTest={selectedTest}
                    onSelectTest={(res) => setSelectedTest(res)}
                    onInspectTest={handleInspectTest}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FULL RESULTS & TIMELINE */}
          {currentTab === 'results' && summary && (
            <div className="space-y-6">
              <SummaryBento summary={summary} language={language} />

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-base font-bold text-zendenta-slate-dark dark:text-white">
                    Complete Diagnostic Biomarkers Timeline
                  </h3>
                  <span className="text-xs text-slate-400">
                    Showing {filteredResults.length} of {summary.total_tests} results
                  </span>
                </div>

                <ResultsTimeline
                  results={filteredResults}
                  explanations={explanations}
                  selectedTest={selectedTest}
                  onSelectTest={(res) => setSelectedTest(res)}
                  onInspectTest={handleInspectTest}
                />
              </div>
            </div>
          )}

          {/* TAB 3: DOCTOR QUESTIONS */}
          {currentTab === 'doctor_questions' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <DoctorQuestionsPanel
                doctorData={doctorData}
                selectedQuestions={selectedQuestions}
                onToggleQuestion={handleToggleDoctorQuestion}
                language={language}
              />
            </div>
          )}

          {/* TAB 4: CONTEXT-LOCKED AI ASSISTANT */}
          {currentTab === 'assistant' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <ChatPanel
                patientId={selectedPatientId}
                patientName={summary?.patient_name || summary?.demographics?.patient_name}
                language={language}
                initialQuestion={initialAiQuestion}
                onClearInitialQuestion={() => setInitialAiQuestion(null)}
              />
            </div>
          )}

          {/* TAB 5: CLINICAL SOURCES & RULES */}
          {currentTab === 'sources' && (
            <div className="space-y-6">
              <SourcesView language={language} />
            </div>
          )}

          {/* TAB 6: PATIENTS ROSTER */}
          {currentTab === 'patients' && (
            <div className="space-y-6">
              <PatientsRosterView
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={(id) => {
                  loadPatientData(id);
                  setCurrentTab('overview');
                }}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="no-print border-t border-zendenta-border dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto bg-white dark:bg-healthcare-darkCard transition-colors">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                CityLab Diagnostics OS • 100% Deterministic Rules Engine • Non-Diagnostic Explainer
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentTab('sources')}
                className="hover:text-zendenta-blue transition"
              >
                Clinical Reference Files
              </button>
              <span>•</span>
              <span className="text-slate-400">Tech Fusion '26 Hackathon Problem B</span>
            </div>
          </div>
        </footer>
      </div>

      {/* 3. Slide-over Detail Drawer ("How We Checked") */}
      <DetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        result={selectedTest}
        explanation={
          selectedTest
            ? explanations.find(
                (e) => e.test_canonical.toLowerCase() === selectedTest.test_canonical.toLowerCase()
              )
            : null
        }
        onAskAi={handleAskAiFromDrawer}
      />

      {/* 4. New Analysis Modal */}
      <NewAnalysisModal
        isOpen={isNewAnalysisModalOpen}
        onClose={() => setIsNewAnalysisModalOpen(false)}
        onSubmit={handleAnalyzeCustom}
        isLoading={isLoading}
      />

      {/* 5. Print Summary Component (Active only in Print/PDF Mode) */}
      <PrintSummary
        summary={summary}
        doctorData={doctorData}
        selectedQuestions={selectedQuestions}
        language={language}
      />
    </div>
  );
}

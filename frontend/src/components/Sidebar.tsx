import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  MessageSquare,
  FileCheck,
  Shield,
  ChevronRight,
  Stethoscope,
  Building2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'results'
  | 'doctor_questions'
  | 'assistant'
  | 'sources'
  | 'patients';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  attentionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  attentionCount = 0,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-healthcare-darkCard border-r border-zendenta-border dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Clinic Switcher */}
        <div>
          {/* Brand Logo */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-zendenta-border dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-zendenta-blue flex items-center justify-center text-white shadow-sm">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-zendenta-slate-dark dark:text-white">
                  LabWise
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-zendenta-slate-muted dark:text-slate-400">
                Clinical Intelligence OS
              </p>
            </div>
          </div>

          {/* Clinic Switcher Card */}
          <div className="p-4 border-b border-zendenta-border dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-zendenta-slate-dark dark:text-white truncate">
                    CityLab Diagnostics
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Main Branch • Lab #CL-402
                  </p>
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-6 overflow-y-auto">
            {/* GROUP 1: MAIN */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Main
              </p>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('overview');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'overview'
                    ? 'bg-zendenta-blue-light dark:bg-blue-950/60 text-zendenta-blue dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={17} />
                  <span>Dashboard Overview</span>
                </div>
                {currentTab === 'overview' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zendenta-blue" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('results');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'results'
                    ? 'bg-zendenta-blue-light dark:bg-blue-950/60 text-zendenta-blue dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity size={17} />
                  <span>Results Timeline</span>
                </div>
                {attentionCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {attentionCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('patients');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'patients'
                    ? 'bg-zendenta-blue-light dark:bg-blue-950/60 text-zendenta-blue dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={17} />
                  <span>Patients Roster</span>
                </div>
              </button>
            </div>

            {/* GROUP 2: CLINICAL ASSISTANT */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Clinical Assistant
              </p>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('assistant');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'assistant'
                    ? 'bg-zendenta-blue-light dark:bg-blue-950/60 text-zendenta-blue dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={17} className="text-teal-500" />
                  <span>AI Lab Assistant</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
                  Locked
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('doctor_questions');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'doctor_questions'
                    ? 'bg-zendenta-blue-light dark:bg-blue-950/60 text-zendenta-blue dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={17} />
                  <span>Doctor Questions</span>
                </div>
              </button>
            </div>

            {/* GROUP 3: SYSTEM */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System &amp; Safety
              </p>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('sources');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentTab === 'sources'
                    ? 'bg-zendenta-blue-light dark:bg-blue-950/60 text-zendenta-blue dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck size={17} />
                  <span>Reference Files</span>
                </div>
              </button>

              <div className="px-3 py-2 flex items-center gap-2 text-[11px] text-slate-400">
                <Shield size={13} className="text-emerald-500" />
                <span>Deterministic Rules Engine</span>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer: Active User & Reviewer Pill */}
        <div className="p-4 border-t border-zendenta-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs">
                DR
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-zendenta-slate-dark dark:text-white truncate">
                  Dr. E. Computers
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Lab Reviewer
                </span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400" />
          </div>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import {
  LayoutDashboard,
  Activity,
  MessageSquare,
  Sparkles,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import type { NavTab } from './Sidebar';

export type FilterStatusMode = 'ALL' | 'ATTENTION';

interface TabsNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  filterMode: FilterStatusMode;
  onFilterChange: (mode: FilterStatusMode) => void;
  totalCount: number;
  attentionCount: number;
  urgentCount: number;
  questionsCount: number;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  currentTab,
  onSelectTab,
  filterMode,
  onFilterChange,
  totalCount,
  attentionCount,
  urgentCount,
  questionsCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zendenta-border dark:border-slate-800 pb-1">
      {/* Left: Main Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {/* 1. Overview */}
        <button
          onClick={() => onSelectTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'overview'
              ? 'bg-zendenta-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Overview</span>
        </button>

        {/* 2. Results */}
        <button
          onClick={() => onSelectTab('results')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'results'
              ? 'bg-zendenta-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity size={15} />
          <span>Results &amp; Timeline</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              currentTab === 'results'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* 3. Doctor Questions */}
        <button
          onClick={() => onSelectTab('doctor_questions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'doctor_questions'
              ? 'bg-zendenta-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={15} />
          <span>Doctor Questions</span>
          {urgentCount > 0 ? (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          ) : questionsCount > 0 ? (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'doctor_questions'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              }`}
            >
              {questionsCount}
            </span>
          ) : null}
        </button>

        {/* 4. AI Assistant */}
        <button
          onClick={() => onSelectTab('assistant')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'assistant'
              ? 'bg-zendenta-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles size={15} className="text-teal-500" />
          <span>AI Assistant</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 font-semibold">
            Context-Locked
          </span>
        </button>

        {/* 5. Sources */}
        <button
          onClick={() => onSelectTab('sources')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            currentTab === 'sources'
              ? 'bg-zendenta-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck size={15} />
          <span>Clinical Sources</span>
        </button>
      </div>

      {/* Right: Segmented Filter Control (All vs Needs attention) */}
      {(currentTab === 'overview' || currentTab === 'results') && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => onFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-zendenta-slate-dark dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] text-slate-400 font-normal">
              ({totalCount})
            </span>
          </button>

          <button
            onClick={() => onFilterChange('ATTENTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'ATTENTION'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertCircle size={13} className={attentionCount > 0 ? 'text-amber-500' : ''} />
            <span>Needs attention</span>
            {attentionCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {attentionCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

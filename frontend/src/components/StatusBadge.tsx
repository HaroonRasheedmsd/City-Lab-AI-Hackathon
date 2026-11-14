import React from 'react';
import {
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertOctagon,
  HelpCircle,
  Info,
} from 'lucide-react';
import type { ClassificationStatus } from '../types';

interface StatusBadgeProps {
  status: ClassificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showPulse = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  switch (status) {
    case 'NORMAL':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${sizeClasses[size]}`}
        >
          <CheckCircle2 size={iconSizes[size]} className="text-emerald-600 dark:text-emerald-400" />
          <span>Normal</span>
        </span>
      );

    case 'LOW':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${sizeClasses[size]}`}
        >
          <ArrowDownCircle size={iconSizes[size]} className="text-blue-600 dark:text-blue-400" />
          <span>Low</span>
        </span>
      );

    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 ${sizeClasses[size]}`}
        >
          <ArrowUpCircle size={iconSizes[size]} className="text-amber-600 dark:text-amber-400" />
          <span>High</span>
        </span>
      );

    case 'URGENT':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-sm ${
            showPulse ? 'urgent-ring' : ''
          } ${sizeClasses[size]}`}
        >
          <AlertOctagon size={iconSizes[size]} className="text-rose-600 dark:text-rose-400 animate-bounce" />
          <span>Urgent</span>
        </span>
      );

    case 'CANNOT BE CLASSIFIED FROM THE FILES':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 ${sizeClasses[size]}`}
          title="Not covered in CityLab normal-range files"
        >
          <HelpCircle size={iconSizes[size]} className="text-slate-500 dark:text-slate-400" />
          <span>Unclassified</span>
        </span>
      );

    case 'NEEDS_INFO':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 ${sizeClasses[size]}`}
          title="Patient age or biological sex required"
        >
          <Info size={iconSizes[size]} className="text-violet-600 dark:text-violet-400" />
          <span>Needs Demographics</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
};

import React from 'react';
import {
  Users,
  ChevronRight,
} from 'lucide-react';
import type { PatientListItem } from '../types';

interface PatientsRosterViewProps {
  patients: PatientListItem[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
}

export const PatientsRosterView: React.FC<PatientsRosterViewProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-zendenta-blue dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zendenta-slate-dark dark:text-white">
              CityLab Ingested Patient Roster
            </h3>
            <p className="text-xs text-zendenta-slate-muted dark:text-slate-400 mt-0.5">
              14 patient encounter files from the organizer's test dataset (P001 - P014)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 text-zendenta-blue text-xs font-semibold self-start sm:self-auto">
          <span>{patients.length} Encounters Ingested</span>
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="bg-white dark:bg-healthcare-darkCard border border-zendenta-border dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-zendenta-border dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Patient ID</th>
                <th className="py-3.5 px-6">Full Name</th>
                <th className="py-3.5 px-6">Demographics</th>
                <th className="py-3.5 px-6">MRN / File</th>
                <th className="py-3.5 px-6">Tests Count</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {patients.map((p) => {
                const isSelected = p.patient_id === selectedPatientId;
                const hasAge = p.recorded_age !== null && p.recorded_age !== undefined;
                const hasSex = !!p.biological_sex;

                return (
                  <tr
                    key={p.patient_id}
                    onClick={() => onSelectPatient(p.patient_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 text-zendenta-blue font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <td className="py-4 px-6 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-zendenta-blue shrink-0" />
                        )}
                        <span>{p.patient_id}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-zendenta-slate-dark dark:text-white">
                        {p.patient_name || 'Anonymous Encounter'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Source: {p.source_file}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            hasAge
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {hasAge ? `${p.recorded_age} yrs` : 'Age: Missing'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            hasSex
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {hasSex ? p.biological_sex : 'Sex: Missing'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-500">
                      {p.mrn || `MRN-${p.patient_id}`}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {p.test_count} tests
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(p.patient_id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto ${
                          isSelected
                            ? 'bg-zendenta-blue text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>{isSelected ? 'Active' : 'Load Report'}</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

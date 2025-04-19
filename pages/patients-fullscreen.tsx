'use client';

import React, { useContext } from 'react';
import HomeContext from '@/pages/api/home/home.context';

import { PatientCard } from '@/components/Promptbar/Tasks';
import type { Patient } from '@/types/patient';

import { UsersIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const PatientFullScreenView: React.FC = () => {
  const {
    state,
    removePatient,
    updateTaskTimerState,
    addTaskToPatient,
    updateTaskTimer,
    removeTaskFromPatient,
    updateTaskCompletion,
    acknowledgeTaskTimer,
    updatePatientNotes,
    updateTaskNotes,
  } = useContext(HomeContext);

  const patients: Patient[] = state?.patients || [];

  /* ------------------------------- loading -------------------------------- */

  const isLoading = !state || !removePatient;
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <svg
          className="animate-spin h-8 w-8 text-teal-600 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-700 dark:text-gray-300">Loading patient data…</p>
      </div>
    );
  }

  /* -------------------------------- empty --------------------------------- */

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <UsersIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300">
          No patients are currently being tracked.
        </p>
      </div>
    );
  }

  /* ------------------------------- content -------------------------------- */

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-teal-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-teal-800 dark:text-teal-300 flex items-center">
            <UsersIcon className="h-6 w-6 mr-2" />
            Patient Task Board – track wait‑times &amp; pending jobs
          </h1>
        </div>

        {/* ░░ Semantic‑search info banner ░░ */}
        <div className="bg-teal-50 dark:bg-teal-900/40 border-t border-b border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-200 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-start gap-2">
            <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Document Search:</strong> use the&nbsp;sidebar’s
              “Search Docs” tab to query local hospital&nbsp;policies,
              guidelines, and SOPs with semantic search – returning the most
              relevant, <em>site‑specific</em> information in seconds.
            </p>
          </div>
          <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 text-xs italic text-gray-600 dark:text-gray-300">
            Always verify retrieved content against the official source and apply your own
            clinical judgment.
          </p>
        </div>
      </header>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {patients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              removePatient={removePatient}
              updateTaskTimerState={updateTaskTimerState}
              addTaskToPatient={addTaskToPatient}
              updateTaskTimer={updateTaskTimer}
              removeTaskFromPatient={removeTaskFromPatient}
              updateTaskCompletion={updateTaskCompletion}
              acknowledgeTaskTimer={acknowledgeTaskTimer}
              updatePatientNotes={updatePatientNotes}
              updateTaskNotes={updateTaskNotes}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default PatientFullScreenView;

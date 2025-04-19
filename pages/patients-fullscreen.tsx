// pages/patients-fullscreen.tsx (Example Path)
'use client';

import React, { useContext } from 'react';
import HomeContext from '@/pages/api/home/home.context'; // Verify path

// --- UPDATED IMPORTS ---
// Import PatientCard from Tasks.tsx where it's now defined and exported
import { PatientCard } from '@/components/Promptbar/Tasks'; // <= UPDATED PATH
// Import types from the centralized location
import type { Patient } from '@/types/patient'; // <= UPDATED PATH (Only Patient type needed here directly)
// IMPROVEMENT: Import an icon for the header
import { UsersIcon } from '@heroicons/react/24/outline'; // Example icon

const PatientFullScreenView: React.FC = () => {
  // Consume shared state and handlers from HomeContext
  const {
    state,
    // Destructure all handler functions needed by PatientCard
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

  // Access patients array
  const patients: Patient[] = state?.patients || [];

  // --- IMPROVED Loading State ---
  // Simple check if context handlers/state are ready (can be refined based on actual loading logic)
  const isLoading = !state || !removePatient; // Example loading condition

  if (isLoading) {
    return (
      // IMPROVEMENT: Themed background and text for loading state
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        {/* Optional: Add a spinner here */}
        <svg className="animate-spin h-8 w-8 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-700 dark:text-gray-300">{/* Adjust text if needed */}Loading patient data...</p>
      </div>
    );
  }

  // --- IMPROVED Empty State ---
  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
         {/* Optional: Add an icon for empty state */}
         <UsersIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"/>
        <p className="text-gray-700 dark:text-gray-300">{/* Adjust text if needed */}No patients are currently being tracked.</p>
        {/* Optional: Add a button/link to add the first patient if applicable from this view */}
        {/* <button className="mt-4 inline-flex items-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 ...">Add Patient</button> */}
      </div>
    );
  }

  return (
    // --- IMPROVEMENT: Main container with themed background and structure ---
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* IMPROVEMENT: Added Header Section */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-teal-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-teal-800 dark:text-teal-300 flex items-center">
            <UsersIcon className="h-6 w-6 mr-2"/> {/* Added Icon */}
            Patient Task Board - Track patient wait times, pending jobs to better manage your caseload
          </h1>
          {/* Potential location for Add Patient, Filter, Sort controls */}
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Responsive Grid Container - IMPROVEMENT: Adjusted gap potentially */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Map over the patients array from context */}
          {patients.map((patient) => (
            // Render the imported PatientCard (originating from Tasks.tsx)
            // Its internal styling (including color-coding) is preserved.
            <PatientCard
              key={patient.id}
              patient={patient}
              // Pass all necessary handlers down
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

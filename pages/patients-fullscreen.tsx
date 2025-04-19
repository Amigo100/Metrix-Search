// pages/patients-fullscreen.tsx (Example Path)
'use client';

import React, { useContext } from 'react';
import HomeContext from '@/pages/api/home/home.context'; // Verify path

// --- UPDATED IMPORTS ---
// Import PatientCard from Tasks.tsx where it's now defined and exported
import { PatientCard } from '@/components/Promptbar/Tasks'; // <= UPDATED PATH
// Import types from the centralized location
import type { Patient, Task, TaskCompletionStatus } from '@/types/patient'; // <= UPDATED PATH

// Removed outdated informational comments

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

  // Loading state
  if (!removePatient || !patients) { // Simple check if context handlers/state are ready
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <p className="text-gray-600">Loading patient data...</p>
        </div>
    );
  }

  // Empty state
  if (patients.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <p className="text-gray-600">No patients are currently being tracked.</p>
        </div>
    );
  }

  return (
    // Main container with padding and background
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Responsive Grid Container */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Map over the patients array from context */}
        {patients.map((patient) => (
          // Render the imported PatientCard (originating from Tasks.tsx)
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
    </div>
  );
};

export default PatientFullScreenView;
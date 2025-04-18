'use client';

import React, { useContext } from 'react';
import HomeContext from '@/pages/api/home/home.context'; // <= Adjust this path to your HomeContext file

// --- Refactoring Recommendation ---
// Ideally, PatientCard, TaskItem, and the UI components (Card, Button, etc.)
// should be moved out of tasks.tsx into shared component directories
// and imported from there. Shared types should also be centralized.
// For now, assuming PatientCard can be imported from the original path:
import { PatientCard } from '@/components/promptbar/tasks'; // <= Adjust path if PatientCard is moved
import type { Patient, Task, TaskCompletionStatus } from '@/components/promptbar/tasks'; // <= Adjust path if Types are moved

// --- IMPORTANT ---
// This component assumes your HomeContext provides the following structure:
// {
//   state: { patients: Patient[] }, // Or patients directly at the root
//   removePatient: (patientId: string) => void;
//   updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
//   addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void;
//   updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
//   removeTaskFromPatient: (patientId: string, taskId: string | number) => void;
//   updateTaskCompletion: (patientId: string, taskId: string | number, status: TaskCompletionStatus) => void;
//   acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void;
//   updatePatientNotes: (patientId: string, notes: string) => void;
//   updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
//   // ... other context values
// }
// Adjust the useContext destructuring below if your context structure is different.

const PatientFullScreenView: React.FC = () => {
  // Consume shared state and handlers from HomeContext
  const {
    // --- Adjust how you access patients based on your Context structure ---
    state, // Assuming context has { state: { patients: [...] } }
    // OR if patients is directly in context value: patients,

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

  // --- Adjust access to the patients array ---
  const patients: Patient[] = state?.patients || []; // Example: Access via state.patients

  // Handle case where context might not be ready or patients array is missing
  // You might want a more sophisticated loading state based on your context setup
  if (!removePatient || !patients) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <p className="text-gray-600">Loading patient data or context not available...</p>
        </div>
    );
  }

  // Handle empty state
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
          <PatientCard
            key={patient.id}
            patient={patient}
            // Pass all necessary handlers down to the PatientCard component
            // These handlers should now be the ones obtained from HomeContext
            removePatient={removePatient}
            updateTaskTimerState={updateTaskTimerState}
            addTaskToPatient={addTaskToPatient}
            updateTaskTimer={updateTaskTimer}
            removeTaskFromPatient={removeTaskFromPatient}
            updateTaskCompletion={updateTaskCompletion}
            acknowledgeTaskTimer={acknowledgeTaskTimer}
            updatePatientNotes={updatePatientNotes}
            updateTaskNotes={updateTaskNotes}
            // Ensure PatientCard's expected props match these names/types
          />
        ))}
      </div>
    </div>
  );
};

export default PatientFullScreenView;
// /components/Promptbar/Tasks.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
  useContext,
} from 'react';
import { Plus, Clock, AlertTriangle, X } from 'lucide-react';
import {
  format,
  differenceInMinutes,
  addMinutes,
  formatDistanceToNowStrict,
  parse,
} from 'date-fns';

import HomeContext from '@/pages/api/home/home.context';

// Type definitions omitted for brevity—same as before

const Tasks: React.FC = () => {
  const { state } = useContext(HomeContext);
  const { showSidePromptbar } = state;

  // Toggle open/closed width
  const sidebarWidth = showSidePromptbar ? 'w-80 lg:w-96' : 'w-0';

  // Provide the same patient-tracking logic:
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'patient-1-green',
      name: 'Bed 3 - Ankle Injury',
      arrivalTime: addMinutes(new Date(), -90),
      tasks: [
        { id: 'task-1a', text: 'X-Ray requested', timerEnd: null, isTimerExpired: false },
        { id: 'task-1b', text: 'Analgesia given', timerEnd: null, isTimerExpired: false },
      ],
    },
    {
      id: 'patient-2-amber',
      name: 'Mr. Jones - Chest Pain',
      arrivalTime: addMinutes(new Date(), -150),
      tasks: [
        { id: 'task-2a', text: 'ECG Done', timerEnd: null, isTimerExpired: false },
        { id: 'task-2b', text: 'Bloods sent', timerEnd: null, isTimerExpired: false },
        {
          id: 'task-2c',
          text: 'Chase Troponin',
          timerEnd: addMinutes(new Date(), 30),
          isTimerExpired: false,
        },
      ],
    },
    {
      id: 'patient-3-red',
      name: 'Ms. Williams - Fall',
      arrivalTime: addMinutes(new Date(), -250),
      tasks: [
        { id: 'task-3a', text: 'CT Head requested', timerEnd: null, isTimerExpired: false },
        {
          id: 'task-3b',
          text: 'Refer to Ortho',
          timerEnd: addMinutes(new Date(), -10),
          isTimerExpired: true,
        },
      ],
    },
    {
      id: 'patient-4-flashing',
      name: 'Bed 10 - Query Sepsis',
      arrivalTime: addMinutes(new Date(), -310),
      tasks: [
        { id: 'task-4a', text: 'Antibiotics Administered', timerEnd: null, isTimerExpired: false },
      ],
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Add new patient
  const addPatient = useCallback((newPatient: Patient) => {
    setPatients((prev) =>
      [...prev, newPatient].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()),
    );
  }, []);

  // Remove a patient
  const removePatient = useCallback((patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  }, []);

  // Update a task’s expired state
  const updateTaskTimerState = useCallback(
    (patientId: string, taskId: string | number, isExpired: boolean) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            let taskUpdated = false;
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId && t.isTimerExpired !== isExpired) {
                taskUpdated = true;
                return { ...t, isTimerExpired: isExpired };
              }
              return t;
            });
            return taskUpdated ? { ...p, tasks: newTasks } : p;
          }
          return p;
        }),
      );
    },
    [],
  );

  // Sort by arrival time once on mount
  useEffect(() => {
    const isSorted = patients.every((p, idx, arr) => {
      if (idx === 0) return true;
      return arr[idx - 1].arrivalTime <= p.arrivalTime;
    });
    if (!isSorted) {
      setPatients((prev) =>
        [...prev].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()),
      );
    }
  }, [patients]);

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-gray-800 border-l border-gray-700 ${sidebarWidth}`}
    >
      {/* Only render content if open */}
      {showSidePromptbar && (
        <>
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-100">Patient Tracker</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-brand hover:bg-brand-dark px-3 py-2 text-white text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </button>
          </div>

          {/* Scrollable patient list */}
          <div className="flex-1 overflow-y-auto p-4">
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <AlertTriangle className="w-10 h-10 mb-4 text-gray-600" />
                <p className="font-medium">No patients being tracked.</p>
                <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p>
              </div>
            ) : (
              patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  removePatient={removePatient}
                  updateTaskTimerState={updateTaskTimerState}
                />
              ))
            )}
          </div>

          {/* Add Patient Modal */}
          <AddPatientModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            addPatient={addPatient}
          />
        </>
      )}
    </div>
  );
};

export default Tasks;

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

/** 
 * --- Type Definitions ---
 * Keep these at the top of the file or 
 * import them from a dedicated file if preferred.
 */
interface Task {
  id: string | number;
  text: string;
  timerEnd: Date | null;
  isTimerExpired: boolean;
}

interface Patient {
  id: string;
  name: string;
  arrivalTime: Date;
  tasks: Task[];
}

/** 
 * Optional shadcn-like UI placeholders, 
 * if you haven't replaced them with actual imports. 
 * Keep or remove as needed.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return (
      <button
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

// For brevity, other placeholders (Input, Label, etc.) omitted 
// if you're not using them in the final code.

/**
 * The main "Tasks" component that acts as the right-side prompt bar,
 * showing patient info, timers, modals, etc.
 */
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
            let changed = false;
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId && t.isTimerExpired !== isExpired) {
                changed = true;
                return { ...t, isTimerExpired: isExpired };
              }
              return t;
            });
            return changed ? { ...p, tasks: newTasks } : p;
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
            <Button
              className="bg-brand hover:bg-brand-dark border-brand text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
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

/** 
 * Below, add any sub-components (PatientCard, TaskItem, AddPatientModal) 
 * or place them in separate files. For example:
 */

// Minimal example for a "PatientCard" component:
interface PatientCardProps {
  patient: Patient;
  removePatient: (patientId: string) => void;
  updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
}
const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  removePatient,
  updateTaskTimerState,
}) => {
  // ... e.g. lengthOfStayMinutes, tasks display, etc.
  // For brevity, show a minimal version
  return (
    <div className="mb-4 p-3 border-2 border-gray-700 rounded-md bg-gray-900 text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{patient.name}</span>
        <button onClick={() => removePatient(patient.id)} className="text-red-400">
          <X className="inline w-4 h-4" />
        </button>
      </div>
      {/* Display tasks, timers, etc. */}
      {patient.tasks.map((task) => (
        <div key={task.id} className="text-sm">
          - {task.text}
        </div>
      ))}
    </div>
  );
};

// Minimal example for "AddPatientModal"
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  addPatient: (patient: Patient) => void;
}
const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  addPatient,
}) => {
  const [name, setName] = useState('');
  // etc.

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newPatient: Patient = {
      id: `patient-${Date.now()}`,
      name,
      arrivalTime: new Date(),
      tasks: [],
    };
    addPatient(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-800 text-white p-4 rounded-md w-full max-w-md">
        <h2 className="text-lg mb-3">Add Patient</h2>
        <input
          type="text"
          placeholder="Patient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full mb-3 p-2 text-black"
        />
        <div className="flex space-x-2 justify-end">
          <Button variant="ghost" className="bg-gray-600" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tasks;

// components/Promptbar/Tasks.tsx
'use client';

// Added useContext, removed useState, useEffect etc. for patients
import React, {
  useState,
  useEffect,
  useCallback, // Still needed for AddPatientModal internal logic if kept complex
  ChangeEvent,
  FormEvent,
  useContext, // <== ADDED
  // useRef, // No longer needed directly in Tasks component scope
  // KeyboardEvent, // No longer needed directly in Tasks component scope
} from 'react';
import {
  Plus,
  X, // Keep for AddPatientModal close button
  AlertTriangle, // Keep for empty state display
  // Icons used by PatientCard/TaskItem are no longer needed here
} from 'lucide-react';
import {
  format, // Keep for AddPatientModal default time
  addMinutes, // Keep for AddPatientModal timer logic
  parse, // Keep for AddPatientModal time parsing
  isValid, // Keep for AddPatientModal date validation
} from 'date-fns';

// --- Import Context ---
import HomeContext from '@/pages/api/home/home.context'; // <== ADDED

// --- Import Centralized Types ---
import { Patient, Task, TaskCompletionStatus } from '@/types/patient'; // <== UPDATED PATH

// --- Import Centralized UI Components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Needed by AddPatientModal
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/Dialog'; // Needed by AddPatientModal

// --- Import Moved Core Component ---
import { PatientCard } from '@/components/patients/PatientCard'; // <== UPDATED PATH

// Removed: parsePatientsWithDates (now imported in provider)
// Removed: PATIENT_STORAGE_KEY (now used in provider)
// Removed: TaskItem (now internal to PatientCard.tsx)
// Removed: getBorderColor, getBackgroundColor (now internal to PatientCard.tsx)


// --- AddPatientModal Component Definition (Kept internal to Tasks.tsx for now) ---
// Note: Consider moving this to its own file in components/patients/ later
interface ModalTaskState {
  id: number;
  text: string;
  timerMinutes: string;
}
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Receives addPatient handler from the main Tasks component (which gets it from context)
  addPatientHandler: (newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }) => void;
}
const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatientHandler }) => {
  // Internal state for the modal form
  const [patientName, setPatientName] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [tasks, setTasks] = useState<ModalTaskState[]>([
    { id: Date.now(), text: '', timerMinutes: '' },
  ]);
  const [patientNotes, setPatientNotes] = useState<string>('');

  const handleAddTask = (): void => {
    setTasks([...tasks, { id: Date.now(), text: '', timerMinutes: '' }]);
  };

  const handleRemoveTask = (id: number): void => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== id));
    } else {
      // Reset the single task line instead of removing it
      setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
    }
  };

  const handleTaskChange = (
    id: number,
    field: keyof Omit<ModalTaskState, 'id'>,
    value: string
  ): void => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!patientName || !arrivalTime) return;

    // --- Prepare data for the addPatientHandler prop ---
    const now = new Date();
    let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date()); // Base on today initially
    // Ensure the date part is set correctly to today
    arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    // Prevent setting arrival time in the future
    if (!isValid(arrivalDateTime) || arrivalDateTime > now) {
        console.warn("Invalid or future arrival time detected, defaulting to current time.");
        arrivalDateTime = now;
    }


    const processedModalTasks: Omit<Task, 'id'>[] = tasks
      .filter((task) => task.text.trim() !== '') // Only include tasks with text
      .map((task): Omit<Task, 'id'> => {
        const timerMinutesNum = parseInt(task.timerMinutes, 10);
        const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
        const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;

        return { // <== Object now includes isTimerExpired
          text: task.text,
          timerEnd: timerEndDate,
          // === FIX APPLIED HERE ===
          isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), // Calculate based on timerEndDate
          // === END OF FIX ===
          completionStatus: 'incomplete',
          createdAt: new Date(),
          completedAt: null,
          notes: '',
          isAcknowledged: false,
        };
      });

     const newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] } = {
         name: patientName,
         arrivalTime: arrivalDateTime,
         tasks: processedModalTasks,
         notes: patientNotes,
     }

    // Call the handler function passed down as a prop
    addPatientHandler(newPatientData);

    // Reset form state
    setPatientName('');
    setArrivalTime(format(new Date(), 'HH:mm'));
    setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
    setPatientNotes('');
    onClose(); // Close the modal
  };

  // JSX for AddPatientModal (largely unchanged, uses imported UI components)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-50 text-black sm:max-w-[550px]">
        <DialogHeader>
           <DialogTitle>Add New Patient</DialogTitle>
           <DialogDescription className="text-gray-600"> {/* Adjusted color */}
              Enter patient details, arrival time, initial tasks, and optional notes.
           </DialogDescription>
           {/* Using DialogClose for the X button */}
           <DialogClose asChild>
               <Button
                 variant="ghost" size="sm" // Use allowed size
                 className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 h-6 w-6 p-0" // Adjusted style
                 onClick={onClose} aria-label="Close" // Added aria-label
               >
                  <X className="h-4 w-4" />
               </Button>
           </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Patient Name Input */}
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="patient-name" className="text-right text-black">Name/Title</Label>
               <Input
                 id="patient-name" value={patientName}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
                 className="col-span-3 bg-white border-gray-300 text-black placeholder-gray-400" // Adjusted style
                 placeholder="e.g., Bed 5 / Mr. Smith" required
               />
            </div>
            {/* Arrival Time Input */}
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="arrival-time" className="text-right text-black">Arrival Time</Label>
               <Input
                 id="arrival-time" type="time" value={arrivalTime}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)}
                 className="col-span-3 bg-white border-gray-300 text-black" required // Adjusted style
               />
            </div>
            {/* Patient Notes Textarea */}
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="patient-notes" className="text-right text-black pt-2">Notes (Opt.)</Label>
                <textarea
                  id="patient-notes" value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  rows={3}
                  className="col-span-3 text-sm bg-white border border-gray-300 rounded p-1.5 text-black placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-vertical" // Adjusted style
                  placeholder="Add general patient notes..."
                />
             </div>
            {/* Initial Tasks Section */}
            <div className="col-span-4 mt-2">
              <Label className="mb-2 block font-medium text-black">Initial Tasks</Label>
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2 mb-2">
                  <Input
                     type="text" placeholder={`Task ${index + 1} desc.`} value={task.text}
                     onChange={(e) => handleTaskChange(task.id, 'text', e.target.value)}
                     className="flex-grow bg-white border-gray-300 text-black placeholder-gray-400" // Adjusted style
                  />
                  <Input
                     type="number" min="1" max="999" placeholder="Timer (min)" value={task.timerMinutes}
                     onChange={(e) => handleTaskChange(task.id, 'timerMinutes', e.target.value)}
                     className="w-24 bg-white border-gray-300 text-black placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Adjusted style
                  />
                  <Button
                     type="button" variant="default" size="sm" // Use allowed size
                     className="text-red-500 hover:bg-red-100 h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed" // Adjusted style
                     onClick={() => handleRemoveTask(task.id)} disabled={tasks.length <= 1 && task.text === '' && task.timerMinutes === ''} // Allow removing last line if empty
                     aria-label="Remove task"
                  > <X className="h-4 w-4" /> </Button>
                </div>
              ))}
              <Button
                 type="button" variant="default" size="sm" onClick={handleAddTask}
                 className="mt-2 border-gray-300 text-black hover:bg-gray-100" // Adjusted style
              > <Plus className="h-4 w-4 mr-2" /> Add Task Line </Button>
            </div>
          </div>
          <DialogFooter className="border-t border-gray-200 pt-4"> {/* Adjusted border color */}
            {/* Using DialogClose to wrap the Cancel button */}
            <DialogClose asChild>
                <Button
                    type="button"
                    variant="outline" // Keep corrected variant
                    className="text-black bg-gray-100 hover:bg-gray-200 border-gray-300" // Keep corrected class
                 >
                     Cancel
                 </Button>
                 {/* Comments removed from inside DialogClose */}
            </DialogClose>
            <Button type="submit" className="bg-[#008080] hover:bg-[#006666] text-white"> Add Patient </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// --- MAIN SIDEBAR COMPONENT ---
const Tasks: React.FC = () => {
  // --- Consume Context ---
  const {
    state,
    dispatch, // Keep dispatch if needed for local state updates or passed down
    // Destructure ALL patient handlers provided by context
    addPatient,
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

  // Get specific state needed
  const { showSidePromptbar, patients } = state; // Access patients from shared state

  // --- Local State for this component's UI ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // --- REMOVED: Local useState for patients ---
  // --- REMOVED: Local handler definitions (addPatient, removePatient, etc.) ---
  // --- REMOVED: useEffect for loading/saving patients from localStorage ---
  // --- REMOVED: useEffect for sorting patients (should be handled in provider if needed) ---

  // --- Effect for Notification Permission (Remains Local) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (notificationPermission === 'default') {
        Notification.requestPermission().then(setNotificationPermission);
      }
    }
  }, [notificationPermission]);


  // Adjusted width calculation if needed (original was commented out)
  // Use state.showSidePromptbar to control visibility
  const sidebarWidth = showSidePromptbar ? 'w-40 lg:w-80' : 'w-0'; // Original width logic

  return (
    // Main container div - ensure styles match your layout needs
    <div
       className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth} ${showSidePromptbar ? 'visible' : 'invisible'}`}
       // Using visibility might be better than w-0 for transitions depending on CSS setup
    >
      {/* Only render content if the promptbar should be shown */}
      {showSidePromptbar && (
        <>
          {/* Header section */}
          <div className="flex justify-between items-center p-4 shadow-sm border-b border-gray-200 flex-shrink-0"> {/* Adjusted shadow */}
            <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
            <Button
               variant="outline" // Keep variant
               size="sm"      // Keep size
               onClick={() => setIsModalOpen(true)}
               // Original conflicting class - likely overridden by bg/border/text anyway
               className="bg-[#008080] hover:bg-[#008080] border-[#008080] text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>

          {/* Patient List section */}
          <div className="flex-1 overflow-y-auto p-4">
             {/* Use patients from context state */}
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <AlertTriangle className="w-10 h-10 mb-4 text-gray-400" /> {/* Adjusted color */}
                <p className="font-medium">No patients being tracked.</p>
                <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p>
              </div>
            ) : (
              patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  // Pass handlers obtained from context down to PatientCard
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
              ))
            )}
          </div>

          {/* Render the modal (pass the addPatient handler from context) */}
          <AddPatientModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            addPatientHandler={addPatient} // Pass the handler from context
          />
        </>
      )}
    </div>
  );
};

export default Tasks;

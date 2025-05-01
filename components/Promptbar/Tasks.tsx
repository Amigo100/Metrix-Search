// components/Promptbar/Tasks.tsx
'use client';

/* -------------------------------------------------------------------------- */
/*  NOTE: 29‑Apr‑2025                                                          */
/*  – Collapsible PatientCard + overdue indicator                              */
/*  – ✅ FIXED: added `children` and `onOpenChange` props to Dialog typing      */
/* -------------------------------------------------------------------------- */

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useContext,
  useRef,
  KeyboardEvent,
} from 'react';
import {
  Plus,
  Clock,
  AlertTriangle,
  X,
  Edit3,
  Save,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  MessageSquare,
  BellOff,
  AlarmClockOff,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ArrowUp,
} from 'lucide-react';
import {
  format,
  differenceInMinutes,
  addMinutes,
  formatDistanceToNowStrict,
  parse,
  formatRelative,
  isValid,
} from 'date-fns';

import HomeContext from '@/pages/api/home/home.context';
import { Patient, Task, TaskCompletionStatus } from '@/types/patient';

/* -------------------------------------------------------------------------- */
/*  Mock shadcn/ui components                                                 */
/* -------------------------------------------------------------------------- */

// Mock Button component (based on shadcn/ui structure)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Base styles for the button
    const base =
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50';
    // Variant styles mapping
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border bg-background hover:bg-accent',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent',
      link: 'text-primary underline-offset-4 hover:underline',
    } as const;
    // Size styles mapping
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md',
      icon: 'h-6 w-6', // Adjusted icon size
    } as const;
    // Combine base, variant, size, and custom classes
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Mock Input component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 disabled:opacity-50 ${
      className ?? ''
    }`}
    {...props}
  />
));
Input.displayName = 'Input';

// Mock Label component
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium ${className ?? ''}`} {...props} />
));
Label.displayName = 'Label';

// Mock Dialog component (simplified)
/* --- FIXED Dialog typing --------------------------------------------------- */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void; // Function to handle open state change
  children: React.ReactNode; // Content of the dialog
}
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) =>
  open ? (
    // Modal container with backdrop
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" // Ensure high z-index
      onClick={() => onOpenChange(false)} // Close on backdrop click
    >
      {/* Dialog panel: stop propagation to prevent closing on inner clicks */}
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  ) : null; // Render nothing if not open

// Mock DialogContent (simplified)
interface DialogSubProps {
  className?: string;
  children: React.ReactNode;
}
export const DialogContent: React.FC<DialogSubProps> = ({ className, children }) => (
  <div className={`bg-white rounded-lg shadow-lg p-6 ${className ?? ''}`}>{children}</div>
);
// NOTE: Other Dialog sub-components (Header, Footer, Title, Description) would be mocked similarly if needed.

// Mock Card components (simplified)
const Card: React.FC<DialogSubProps> = ({ className, children }) => (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className ?? ''}`}>{children}</div>
);
const CardHeader: React.FC<DialogSubProps> = ({ className, children }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className ?? ''}`}>{children}</div>
);
const CardTitle: React.FC<DialogSubProps> = ({ className, children }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className ?? ''}`}>{children}</h3>
);
const CardDescription: React.FC<DialogSubProps> = ({ className, children }) => (
    <p className={`text-sm text-muted-foreground ${className ?? ''}`}>{children}</p>
);
const CardContent: React.FC<DialogSubProps> = ({ className, children }) => (
    <div className={`p-6 pt-0 ${className ?? ''}`}>{children}</div>
);
const CardFooter: React.FC<DialogSubProps> = ({ className, children }) => (
    <div className={`flex items-center p-6 pt-0 ${className ?? ''}`}>{children}</div>
);

/* -------------------------------------------------------------------------- */
/* Helper utilities                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Determines the border color based on minutes since arrival.
 * Pulses red if very overdue.
 * @param mins - Minutes since patient arrival.
 * @returns Tailwind CSS border color class string.
 */
const getBorderColor = (mins: number): string => {
  if (mins >= 300) return 'border-red-500 animate-pulse-border'; // 5+ hours: pulse red
  if (mins >= 240) return 'border-red-500'; // 4+ hours: red
  if (mins >= 120) return 'border-amber-500'; // 2+ hours: amber
  return 'border-green-500'; // Less than 2 hours: green
};

// Consistent background color for neutral elements
const bgNeutral = 'bg-neutral-50';

/* -------------------------- TaskItem (Placeholder) ------------------------ */
// This component would display individual tasks within a PatientCard.
// Keeping it minimal here as the focus is on the main structure.
interface TaskItemProps {
    task: Task;
    // Add other necessary props like update functions
}
const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    // Basic rendering of task name
    return <div className="text-sm py-1">{task.name}</div>;
};
// ✂️ --- Full TaskItem implementation would go here ---

/* ------------------------- PatientCard component -------------------------- */

// Props definition for PatientCard
interface PatientCardProps {
  patient: Patient;
  removePatient: (id: string) => void;
  addTaskToPatient: (patientId: string, taskName: string, durationMinutes?: number) => void;
  updateTaskTimerState: (patientId: string, taskId: string, state: 'running' | 'paused' | 'stopped') => void;
  updateTaskTimer: (patientId: string, taskId: string, newTime: Date) => void;
  removeTaskFromPatient: (patientId: string, taskId: string) => void;
  updateTaskCompletion: (patientId: string, taskId: string, status: TaskCompletionStatus) => void;
  acknowledgeTaskTimer: (patientId: string, taskId: string) => void;
  updatePatientNotes: (patientId: string, notes: string) => void;
  updateTaskNotes: (patientId: string, taskId: string, notes: string) => void;
  updatePatientStatus: (patientId: string, status: 'active' | 'discharged' | 'admitted') => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  removePatient,
  addTaskToPatient, // Added for task functionality
  updateTaskTimerState, // Added for task functionality
  updateTaskTimer, // Added for task functionality
  removeTaskFromPatient, // Added for task functionality
  updateTaskCompletion, // Added for task functionality
  acknowledgeTaskTimer, // Added for task functionality
  updatePatientNotes, // Added for notes
  updateTaskNotes, // Added for notes
  updatePatientStatus, // Added for status updates
}) => {
  // State for collapsing the card content
  const [collapsed, setCollapsed] = useState(false);
  // State for managing the "Add Task" input field
  const [newTaskName, setNewTaskName] = useState('');
  // State for managing patient notes editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(patient.notes || '');
  const notesInputRef = useRef<HTMLTextAreaElement>(null); // Ref for notes textarea

  // Calculate time since arrival
  const minutesSinceArrival = differenceInMinutes(new Date(), patient.arrivalTime);
  const arrivalTimeFormatted = formatDistanceToNowStrict(patient.arrivalTime, { addSuffix: true });

  // Check if any task timer is overdue
  const hasOverdue = patient.tasks.some(task =>
    task.timerExpiresAt && differenceInMinutes(new Date(), task.timerExpiresAt) > 0 && !task.timerAcknowledged
  );

  // Handle adding a new task
  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      addTaskToPatient(patient.id, newTaskName.trim());
      setNewTaskName(''); // Clear input after adding
    }
  };

  // Handle saving patient notes
  const handleSaveNotes = () => {
    updatePatientNotes(patient.id, editedNotes);
    setIsEditingNotes(false);
  };

  // Handle canceling notes edit
  const handleCancelNotesEdit = () => {
    setEditedNotes(patient.notes || ''); // Reset to original notes
    setIsEditingNotes(false);
  };

  // Focus notes input when editing starts
  useEffect(() => {
    if (isEditingNotes && notesInputRef.current) {
      notesInputRef.current.focus();
    }
  }, [isEditingNotes]);


  return (
    <Card className={`mb-4 border-l-4 ${getBorderColor(minutesSinceArrival)} ${bgNeutral}`}>
      {/* HEADER SECTION */}
      <CardHeader className="pb-2">
        {/* Row 1: Collapse/Expand, Patient Name, Remove Button */}
        <div className="flex justify-between items-center">
          {/* Left Side: Collapse Toggle + Name */}
          <div className="flex items-center space-x-1 flex-grow min-w-0"> {/* Added min-w-0 for wrapping */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="flex-shrink-0 h-5 w-5" // Slightly smaller icon button
              type="button" // Ensure it doesn't submit forms
              aria-label={collapsed ? 'Expand patient details' : 'Collapse patient details'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <CardTitle className="text-base font-medium truncate"> {/* Use truncate for long names */}
              {patient.name}
            </CardTitle>
             {/* Overdue Indicator (moved next to name) */}
             {hasOverdue && (
                <AlertCircle className="h-4 w-4 text-red-500 ml-1 flex-shrink-0" aria-label="Overdue task indicator" />
            )}
          </div>

          {/* Right Side: Remove Patient Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-red-600 flex-shrink-0 h-5 w-5" // Smaller icon button
            onClick={() => removePatient(patient.id)}
            type="button" // Ensure it doesn't submit forms
            aria-label={`Remove patient ${patient.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Row 2: Arrival Time, Status, Status Controls */}
        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-600 flex-wrap"> {/* Added flex-wrap */}
            <span className="flex items-center whitespace-nowrap">
                <Clock className="h-3 w-3 mr-1" />
                Arrived: {arrivalTimeFormatted}
            </span>

            {/* Patient Status Display */}
            {patient.status !== 'active' && (
                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs capitalize whitespace-nowrap">
                {patient.status}
                </span>
            )}

            {/* Status Action Buttons (only show if active) */}
            {patient.status === 'active' && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-green-600 hover:text-green-700 p-0" // Adjusted size and padding
                        title="Mark Discharged"
                        onClick={() => updatePatientStatus(patient.id, 'discharged')}
                        type="button"
                        aria-label={`Mark ${patient.name} as discharged`}
                    >
                        <CheckSquare className="h-3.5 w-3.5" /> {/* CheckSquare icon */}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-blue-600 hover:text-blue-700 p-0" // Adjusted size and padding
                        title="Mark Admitted"
                        onClick={() => updatePatientStatus(patient.id, 'admitted')}
                        type="button"
                        aria-label={`Mark ${patient.name} as admitted`}
                    >
                        <ArrowUp className="h-3.5 w-3.5" /> {/* ArrowUp icon */}
                    </Button>
                </>
            )}
        </div>
      </CardHeader>

      {/* CONTENT SECTION (Collapsible) */}
      {!collapsed && (
        <CardContent className="pt-2"> {/* Reduced top padding */}
          {/* Patient Notes Section */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor={`notes-${patient.id}`} className="text-xs font-semibold text-gray-700">
                Patient Notes
              </Label>
              {!isEditingNotes ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-gray-500 hover:text-blue-600"
                  onClick={() => setIsEditingNotes(true)}
                  type="button"
                  aria-label="Edit patient notes"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-green-600 hover:text-green-700"
                    onClick={handleSaveNotes}
                    type="button"
                    aria-label="Save patient notes"
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-gray-500 hover:text-red-600"
                    onClick={handleCancelNotesEdit}
                    type="button"
                    aria-label="Cancel editing patient notes"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <textarea
                id={`notes-${patient.id}`}
                ref={notesInputRef}
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded-md min-h-[40px] whitespace-pre-wrap">
                {patient.notes || <span className="text-gray-400 italic">No notes yet.</span>}
              </p>
            )}
          </div>

          {/* Task List Section */}
          <div className="mb-3">
             <h4 className="text-xs font-semibold text-gray-700 mb-1">Tasks</h4>
             {patient.tasks.length > 0 ? (
                <div className="space-y-1">
                    {patient.tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        // Pass necessary update functions from props here
                        // e.g., updateTaskTimerState={updateTaskTimerState}
                        // ... other props ...
                    />
                    ))}
                </div>
                ) : (
                <p className="text-sm text-gray-500 italic">No tasks added.</p>
             )}
          </div>


          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex items-center space-x-2">
            <Input
              type="text"
              value={newTaskName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTaskName(e.target.value)}
              placeholder="Add new task..."
              className="flex-grow h-8 text-sm" // Smaller input
              aria-label="New task name"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="h-8 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200" // Custom styling
              disabled={!newTaskName.trim()}
              aria-label="Add task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};


/* ---------------------- AddPatientModal (Placeholder) --------------------- */
// This modal would allow users to add new patients.
interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    addPatientHandler: (name: string, arrivalTime?: Date) => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatientHandler }) => {
    const [patientName, setPatientName] = useState('');
    // Add state for arrival time if needed

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (patientName.trim()) {
            addPatientHandler(patientName.trim());
            setPatientName(''); // Reset name
            onClose(); // Close modal
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                 {/* Mock Header, Title, Description */}
                 <div className="mb-4">
                    <h3 className="text-lg font-semibold">Add New Patient</h3>
                    <p className="text-sm text-muted-foreground">Enter the patient's name to start tracking.</p>
                 </div>
                 {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                         <Label htmlFor="patient-name">Patient Name</Label>
                         <Input
                            id="patient-name"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="e.g., John Doe"
                            required
                         />
                    </div>
                    {/* Add fields for arrival time, initial tasks etc. if needed */}

                    {/* Mock Footer */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!patientName.trim()}>Add Patient</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
// ✂️ --- Full AddPatientModal implementation would go here ---


/* --------------------- Tasks sidebar component --------------------------- */

const Tasks: React.FC = () => {
  // Access state and dispatch functions from context
  const {
    state,
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
    updatePatientStatus,
  } = useContext(HomeContext);

  // Destructure relevant state properties
  const { showSidePromptbar, patients = [] } = state; // Default patients to empty array

  // State for controlling the Add Patient modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for filtering the patient list
  const [viewFilter, setViewFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Effect for requesting notification permission (unchanged)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Filter patients based on the selected view
  const visiblePatients = patients.filter((p) => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'active') return p.status === 'active';
    // 'inactive' includes 'discharged' and 'admitted'
    return p.status === 'discharged' || p.status === 'admitted';
  });

  // Sort visible patients by arrival time (newest first)
  const sortedPatients = [...visiblePatients].sort((a, b) => {
      // Ensure arrivalTime is valid Date objects before comparing
      const timeA = a.arrivalTime instanceof Date ? a.arrivalTime.getTime() : 0;
      const timeB = b.arrivalTime instanceof Date ? b.arrivalTime.getTime() : 0;
      return timeB - timeA;
  });

  // Determine sidebar width based on visibility state
  const sidebarWidth = showSidePromptbar ? 'w-64 lg:w-80 xl:w-96' : 'w-0'; // Adjusted widths

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-width duration-300 ease-in-out bg-neutral-100 shadow-lg border-l border-gray-300 ${sidebarWidth} ${showSidePromptbar ? 'visible opacity-100' : 'invisible opacity-0'}`}
      style={{ transitionProperty: 'width, opacity' }} // Ensure opacity transition
    >
      {/* Render content only when sidebar is visible */}
      {showSidePromptbar && (
        <>
          {/* Header Section */}
          <div className="p-3 shadow-sm border-b border-gray-200 flex-shrink-0 flex flex-col bg-white">
            {/* Top Row: Title + Add Button */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-base font-semibold text-gray-800 truncate">Patient Tracker</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 border-teal-700 text-white px-2 py-1 h-auto" // Adjusted styling and size
                aria-label="Add new patient"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex space-x-1">
                {/* Button Group for Filters */}
                {(['active', 'inactive', 'all'] as const).map((filter) => (
                    <Button
                        key={filter}
                        type="button"
                        size="sm"
                        variant={viewFilter === filter ? 'secondary' : 'ghost'} // Highlight active filter
                        onClick={() => setViewFilter(filter)}
                        className={`px-2 py-1 h-auto text-xs capitalize rounded-md ${
                            viewFilter === filter
                            ? 'bg-gray-200 text-gray-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        aria-pressed={viewFilter === filter} // Indicate active state for accessibility
                    >
                        {filter}
                    </Button>
                ))}
            </div>
          </div>

          {/* Patient List Section */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3"> {/* Added space-y */}
            {patients.length === 0 ? (
              // Empty State Message
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
                <AlertTriangle className="w-8 h-8 mb-3 text-gray-400" />
                <p className="font-medium text-sm">No patients being tracked.</p>
                <p className="text-xs mt-1">Click "Add" to start.</p>
              </div>
            ) : sortedPatients.length === 0 ? (
               // Message when filters result in no patients
               <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
                 <p className="font-medium text-sm">No {viewFilter} patients.</p>
                 <p className="text-xs mt-1">Adjust the filter or add patients.</p>
               </div>
            ) : (
              // Render list of PatientCards
              sortedPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  // Pass down all necessary handler functions from context/props
                  removePatient={removePatient}
                  updateTaskTimerState={updateTaskTimerState}
                  addTaskToPatient={addTaskToPatient}
                  updateTaskTimer={updateTaskTimer}
                  removeTaskFromPatient={removeTaskFromPatient}
                  updateTaskCompletion={updateTaskCompletion}
                  acknowledgeTaskTimer={acknowledgeTaskTimer}
                  updatePatientNotes={updatePatientNotes}
                  updateTaskNotes={updateTaskNotes}
                  updatePatientStatus={updatePatientStatus}
                />
              ))
            )}
          </div>

          {/* Add Patient Modal */}
          <AddPatientModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            addPatientHandler={addPatient}
          />
        </>
      )}
    </div>
  );
};

export default Tasks;

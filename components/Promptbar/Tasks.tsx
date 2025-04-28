// components/Promptbar/Tasks.tsx
'use client';

import React, {
  useState, useEffect, useCallback, ChangeEvent, FormEvent, useContext, useRef, KeyboardEvent, ForwardedRef // Added ForwardedRef back for mock components
} from 'react';
import {
  Plus, Clock, AlertTriangle, X, Edit3, Save, Trash2, CheckSquare, Square, MinusSquare, MessageSquare, BellOff, AlarmClockOff,
} from 'lucide-react'; // Keep all icons needed by internal components
import {
  format, differenceInMinutes, addMinutes, formatDistanceToNowStrict, parse, formatRelative, isValid,
} from 'date-fns'; // Keep all date-fns needed

// --- Import Context ---
// Assuming HomeContext provides necessary state and dispatch functions
// Replace with your actual context path
// import HomeContext from '@/pages/api/home/home.context';

// --- MOCK HomeContext for standalone testing ---
// In a real app, you would import the actual context.
// This mock provides the necessary structure and functions for the component to run.
const MockHomeContext = React.createContext<any>({
    state: {
        showSidePromptbar: true, // Default to showing the sidebar for testing
        patients: [
            // Add some mock patient data for testing if needed
            {
                id: 'p1',
                name: 'Bed 3 / Jane Doe',
                arrivalTime: new Date(Date.now() - 125 * 60 * 1000), // Arrived 125 mins ago
                notes: 'Patient stable, awaiting lab results.',
                tasks: [
                    { id: 't1', text: 'Administer medication', timerEnd: addMinutes(new Date(), 15), isTimerExpired: false, completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: 'Scheduled dose', isAcknowledged: false },
                    { id: 't2', text: 'Check vital signs', timerEnd: new Date(Date.now() - 10 * 60 * 1000), isTimerExpired: true, completionStatus: 'incomplete', createdAt: new Date(Date.now() - 60 * 60 * 1000), completedAt: null, notes: '', isAcknowledged: false },
                    { id: 't3', text: 'Consult with specialist', timerEnd: null, isTimerExpired: false, completionStatus: 'in-progress', createdAt: new Date(Date.now() - 30 * 60 * 1000), completedAt: null, notes: 'Waiting for call back', isAcknowledged: false },
                    { id: 't4', text: 'Initial assessment', timerEnd: null, isTimerExpired: false, completionStatus: 'complete', createdAt: new Date(Date.now() - 120 * 60 * 1000), completedAt: new Date(Date.now() - 90 * 60 * 1000), notes: '', isAcknowledged: false },
                ]
            },
             {
                id: 'p2',
                name: 'Mr. John Smith',
                arrivalTime: new Date(Date.now() - 30 * 60 * 1000), // Arrived 30 mins ago
                notes: '',
                tasks: [
                     { id: 't5', text: 'Draw blood sample', timerEnd: addMinutes(new Date(), 45), isTimerExpired: false, completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: '', isAcknowledged: false },
                ]
            }
        ],
    },
    // Mock functions - these will just log to console or update local state for demo
    addPatient: (newPatientData: any) => console.log('addPatient called:', newPatientData),
    removePatient: (patientId: string) => console.log('removePatient called:', patientId),
    updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => console.log('updateTaskTimerState called:', patientId, taskId, isExpired),
    addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => console.log('addTaskToPatient called:', patientId, taskText, timerMinutes),
    updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => console.log('updateTaskTimer called:', patientId, taskId, newTimerMinutes),
    removeTaskFromPatient: (patientId: string, taskId: string | number) => console.log('removeTaskFromPatient called:', patientId, taskId),
    updateTaskCompletion: (patientId: string, taskId: string | number, status: TaskCompletionStatus) => console.log('updateTaskCompletion called:', patientId, taskId, status),
    acknowledgeTaskTimer: (patientId: string, taskId: string | number) => console.log('acknowledgeTaskTimer called:', patientId, taskId),
    updatePatientNotes: (patientId: string, notes: string) => console.log('updatePatientNotes called:', patientId, notes),
    updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => console.log('updateTaskNotes called:', patientId, taskId, notes),
});
// Use the Mock Context Provider in the main App component if running standalone
// const HomeContext = MockHomeContext; // Uncomment this line to use the mock context


// --- Import Centralized Types ---
// Assuming types are defined in a central file
// Replace with your actual types path
// import { Patient, Task, TaskCompletionStatus } from '@/types/patient';

// --- MOCK Types for standalone testing ---
type TaskCompletionStatus = 'incomplete' | 'in-progress' | 'complete';

interface Task {
  id: string | number; // Allow number for potentially temporary IDs in modal
  text: string;
  timerEnd: Date | null;
  isTimerExpired: boolean;
  completionStatus: TaskCompletionStatus;
  createdAt: Date;
  completedAt: Date | null;
  notes?: string;
  isAcknowledged: boolean;
}

interface Patient {
  id: string;
  name: string;
  arrivalTime: Date;
  tasks: Task[];
  notes?: string;
}
// --- END MOCK Types ---


// ===-----------------------------------------===
// === Start: Restored Mock Component Definitions ===
// === (Copied from original Tasks.tsx)         ===
// ===-----------------------------------------===

// --- Mock shadcn/ui Components ---
// These components mimic the appearance and basic functionality of shadcn/ui
// components using Tailwind CSS for styling. They allow the main component
// to render without needing the actual shadcn/ui library installed.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon'; // Keep original mock sizes
  asChild?: boolean;
  className?: string;
}
// Mock Button component using forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    // Base styles applicable to all buttons
    const baseStyle = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    // Style variants mapping
    const variants = { default: 'bg-primary text-primary-foreground hover:bg-primary/90', destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90', outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', ghost: 'hover:bg-accent hover:text-accent-foreground', link: 'text-primary underline-offset-4 hover:underline' };
    // Size variants mapping
    const sizes = { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-md px-3', lg: 'h-11 rounded-md px-8', icon: 'h-10 w-10' }; // Keep original mock sizes
    // Determine the classes based on props, providing defaults
    const variantClass = variants[variant || 'default'];
    const sizeClass = sizes[size || 'default'];
    // Combine base, variant, size, and any additional classes
    return (<button className={`${baseStyle} ${variantClass} ${sizeClass} ${className ?? ''}`} ref={ref} {...props} />);
  }
);
Button.displayName = 'Button'; // Set display name for debugging

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { className?: string; }
// Mock Input component using forwardRef
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  // Base styles for the input element
  const baseStyle = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-gray-800 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  // Combine base styles with any additional classes
  return <input type={type} className={`${baseStyle} ${className ?? ''}`} ref={ref} {...props} />;
});
Input.displayName = 'Input'; // Set display name for debugging

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { className?: string; }
// Mock Label component using forwardRef
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  // Base styles for the label element
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ''}`} {...props} />
));
Label.displayName = 'Label'; // Set display name for debugging

// --- Mock Dialog Components ---
// These provide a basic modal structure using fixed positioning and Tailwind.
interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => open ? (<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="bg-card rounded-lg shadow-lg w-full max-w-md">{children}</div></div>) : null;

interface DialogContentProps { children: React.ReactNode; className?: string; }
const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (<div className={`p-6 ${className ?? ''}`}>{children}</div>);

interface DialogHeaderProps { children: React.ReactNode; className?: string; }
const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (<div className={`mb-4 ${className ?? ''}`}>{children}</div>);

interface DialogTitleProps { children: React.ReactNode; className?: string; }
const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (<h2 className={`text-lg font-semibold ${className ?? ''}`}>{children}</h2>);

interface DialogDescriptionProps { children: React.ReactNode; className?: string; }
const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => (<p className={`text-sm text-muted-foreground ${className ?? ''}`}>{children}</p>);

interface DialogFooterProps { children: React.ReactNode; className?: string; }
const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (<div className={`mt-6 flex justify-end space-x-2 ${className ?? ''}`}>{children}</div>);

// Mock DialogClose - simply clones the child and attaches the onClick handler
interface DialogCloseProps { children: React.ReactElement; onClick?: () => void; asChild?: boolean; }
const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick }) => React.cloneElement(children, { onClick });


// --- Mock Card Components ---
// These provide basic card structure using Tailwind for borders, background, and shadow.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => ( <div ref={ref} className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className ?? ''}`} {...props} /> ));
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => ( <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className ?? ''}`} {...props} /> ));
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { className?: string; }
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => ( <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className ?? ''}`} {...props} /> ));
CardTitle.displayName = 'CardTitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => ( <div ref={ref} className={`p-4 pt-0 ${className ?? ''}`} {...props} /> ));
CardContent.displayName = 'CardContent';

// ===-----------------------------------------===
// === End: Restored Mock Component Definitions ===
// ===-----------------------------------------===


// --- Helper Functions (Copied back from PatientCard.tsx / Original Tasks.tsx) ---
// Determines the border color based on length of stay in minutes.
const getBorderColor = (minutes: number): string => {
    if (minutes >= 300) return 'border-red-500 animate-pulse-border'; // Pulse red for very long stays
    if (minutes >= 240) return 'border-red-500'; // Solid red for long stays
    if (minutes >= 120) return 'border-amber-500'; // Amber for medium stays
    return 'border-green-500'; // Green for shorter stays
};
// Determines the background color (currently static).
const getBackgroundColor = (minutes: number): string => {
    // Original logic from old Tasks.tsx / PatientCard.tsx - kept for consistency
    if (minutes >= 300) return 'bg-neutral-50';
    if (minutes >= 240) return 'bg-neutral-50';
    if (minutes >= 120) return 'bg-neutral-50';
    return 'bg-neutral-50'; // Currently always returns the same light background
};


// ===----------------------------------===
// === Start: Restored TaskItem Component ===
// === (Copied from PatientCard.tsx)    ===
// ===----------------------------------===
// This component renders a single task item within a PatientCard.
// It handles displaying task details, timer status, editing, completion, and notes.
interface TaskItemProps {
  task: Task; // The task data object
  patientId: string; // ID of the parent patient
  patientName: string; // Name of the parent patient (for notifications)
  updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void; // Callback to update timer expiry state in parent
  updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void; // Callback to set/update the timer
  removeTask: (patientId: string, taskId: string | number) => void; // Callback to remove the task
  updateTaskCompletion: ( // Callback to update completion status
    patientId: string,
    taskId: string | number,
    status: TaskCompletionStatus
  ) => void;
  acknowledgeTimer: (patientId: string, taskId: string | number) => void; // Callback to mark an expired timer as acknowledged
  updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void; // Callback to update task notes
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  patientId,
  patientName,
  updateTaskTimerState,
  updateTaskTimer,
  removeTask,
  updateTaskCompletion,
  acknowledgeTimer,
  updateTaskNotes,
}) => {
  // --- State ---
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(task.isTimerExpired); // Local state for immediate UI feedback on expiry
  const [timeRemaining, setTimeRemaining] = useState<string>(''); // Formatted string for time remaining/expired
  const [isEditingTimer, setIsEditingTimer] = useState<boolean>(false); // Controls timer editing UI
  const [editTimerMinutes, setEditTimerMinutes] = useState<string>(''); // Input value for timer editing
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false); // Controls notes editing UI
  const [editNotes, setEditNotes] = useState<string>(task.notes || ''); // Input value for notes editing

  // --- Refs ---
  const timerInputRef = useRef<HTMLInputElement>(null); // Ref for focusing timer input
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null); // Ref for focusing notes textarea

  // --- Effects ---
  // Effect to check and update timer status periodically
  useEffect(() => {
    // If no timer or task is complete, clear state and stop
    if (!task.timerEnd || task.completionStatus === 'complete') {
      if (isTimerExpired) setIsTimerExpired(false); // Reset local expiry state if needed
      setTimeRemaining('');
      return;
    }

    let intervalId: NodeJS.Timeout | null = null; // Interval timer ID

    // Function to check timer status
    const checkTimer = () => {
      const now = new Date();
      if (task.timerEnd && now >= task.timerEnd) { // Timer has expired
        if (!isTimerExpired) { // Only trigger updates on first expiry detection
          setIsTimerExpired(true);
          setTimeRemaining('Expired');
          updateTaskTimerState(patientId, task.id, true); // Update parent state

          // Fire a desktop notification if permission granted and not already acknowledged
          if (
            !task.isAcknowledged &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`Task Timer Expired: ${patientName}`, {
              body: task.text,
              tag: `task-${task.id}`, // Use tag to prevent duplicate notifications
            });
          }
        }
        if (intervalId) clearInterval(intervalId); // Stop interval once expired
      } else if (task.timerEnd) { // Timer is active and not expired
        if (isTimerExpired) { // If it was previously expired (e.g., snoozed), reset state
          setIsTimerExpired(false);
          updateTaskTimerState(patientId, task.id, false); // Update parent state
        }
        // Update time remaining display
        setTimeRemaining(`in ${formatDistanceToNowStrict(task.timerEnd)}`);
      }
    };

    checkTimer(); // Initial check
    // Set up interval only if timer is active and not yet expired
    if (task.timerEnd && new Date() < task.timerEnd) {
      intervalId = setInterval(checkTimer, 1000 * 30); // Check every 30 seconds
    }

    // Cleanup function to clear interval on unmount or dependency change
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [ // Dependencies for the effect
    task.timerEnd,
    task.id,
    patientId,
    updateTaskTimerState,
    isTimerExpired, // Include local state to react to changes
    task.isTimerExpired, // Include prop state
    task.completionStatus,
    task.isAcknowledged,
    patientName,
    task.text,
  ]);

  // Effect to initialize and focus timer input when editing starts
  useEffect(() => {
    if (isEditingTimer) {
      // Calculate initial minutes remaining or empty if expired/no timer
      const initialMinutes =
        task.timerEnd && task.timerEnd > new Date()
          ? Math.max(0, differenceInMinutes(task.timerEnd, new Date())).toString()
          : '';
      setEditTimerMinutes(initialMinutes);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => timerInputRef.current?.focus(), 0);
    }
  }, [isEditingTimer, task.timerEnd]);

  // Effect to initialize and focus notes textarea when editing starts
  useEffect(() => {
    if (isEditingNotes) {
      setEditNotes(task.notes || ''); // Set current notes value
      // Focus the textarea after a short delay
      setTimeout(() => notesTextareaRef.current?.focus(), 0);
    }
  }, [isEditingNotes, task.notes]);

  // --- Handlers ---
  // Handle saving the edited timer value
  const handleTimerEditSubmit = () => {
    if (!isEditingTimer) return;
    // Treat empty or '0' input as clearing the timer
    const minutesToSet =
      editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes;
    updateTaskTimer(patientId, task.id, minutesToSet); // Call parent update function
    setIsEditingTimer(false); // Exit editing mode
  };

  // Update timer input state on change
  const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditTimerMinutes(e.target.value);
  };

  // Handle keyboard events in timer input (Enter to save, Escape to cancel)
  const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimerEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTimer(false); // Exit editing mode without saving
    }
  };

  // Handle saving the edited notes
  const handleNotesEditSubmit = () => {
    if (!isEditingNotes) return;
    updateTaskNotes(patientId, task.id, editNotes); // Call parent update function
    setIsEditingNotes(false); // Exit editing mode
  };

  // Update notes textarea state on change
  const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setEditNotes(e.target.value);
  };

  // Handle keyboard events in notes textarea (Enter to save, Shift+Enter for newline, Escape to cancel)
  const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Enter saves
      e.preventDefault(); // Prevent default newline behavior
      handleNotesEditSubmit();
    } else if (e.key === 'Escape') { // Escape cancels
      setIsEditingNotes(false);
      setEditNotes(task.notes || ''); // Revert to original notes
    }
  };

  // Handle toggling the task completion status (incomplete -> in-progress -> complete -> incomplete)
  const handleCompletionToggle = () => {
    let nextStatus: TaskCompletionStatus;
    switch (task.completionStatus) {
      case 'incomplete': nextStatus = 'in-progress'; break;
      case 'in-progress': nextStatus = 'complete'; break;
      case 'complete': nextStatus = 'incomplete'; break;
      default: nextStatus = 'incomplete'; break;
    }
    updateTaskCompletion(patientId, task.id, nextStatus); // Call parent update function
  };

  // Handle snoozing an expired timer (adds 15 minutes)
  const handleSnooze = () => {
    updateTaskTimer(patientId, task.id, '15'); // Call parent update function to add 15 min
  };

  // Get the appropriate icon based on completion status
  const getCompletionIcon = () => {
    switch (task.completionStatus) {
      case 'in-progress': return <MinusSquare className="h-4 w-4 text-yellow-400" />;
      case 'complete': return <CheckSquare className="h-4 w-4 text-green-400" />;
      case 'incomplete': default: return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  // --- Styling Logic ---
  // Dynamically set classes based on task state (completion, timer expiry, acknowledgement)
  let taskItemClasses = 'flex flex-col py-1.5 group'; // Base classes + group for hover effects
  let taskTextStyle = 'text-sm';
  let timerTextStyle = 'text-xs font-mono';

  if (task.completionStatus === 'complete') {
    // Style for completed tasks
    taskTextStyle += ' line-through text-gray-300';
    timerTextStyle += ' text-gray-300';
  } else if (isTimerExpired && !task.isAcknowledged) {
    // Style for expired, unacknowledged timers (flashing effect)
    taskItemClasses += ' animate-flash'; // Apply flashing animation
    taskTextStyle += ' text-red-400 font-medium';
    timerTextStyle += ' text-red-400 font-semibold';
  } else if (isTimerExpired && task.isAcknowledged) {
    // Style for expired but acknowledged timers
    taskTextStyle += ' text-red-600';
    timerTextStyle += ' text-red-600';
  } else if (task.timerEnd) {
    // Style for active timers
    taskTextStyle += ' text-black'; // Use theme text color
    timerTextStyle += ' text-black'; // Use theme text color
  } else {
    // Style for tasks without timers
    taskTextStyle += ' text-black'; // Use theme text color
    timerTextStyle += ' text-gray-200'; // Dim timer text if no timer exists (though it won't be shown)
  }

  // --- JSX Rendering ---
  return (
    // Main container for the task item
    <div className={taskItemClasses}>
      {/* Top row: Completion toggle, task text, timer/edit controls, notes button, delete button */}
      <div className="flex items-center space-x-2 w-full">
        {/* Completion Status Button */}
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleCompletionToggle} title={`Status: ${task.completionStatus}. Click to change.`} > {getCompletionIcon()} </Button>
        {/* Task Text */}
        <span className={`flex-1 cursor-default ${taskTextStyle}`}>{task.text}</span>
        {/* Timer/Edit Controls Container */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {isEditingTimer ? (
            // Timer Editing UI
            <>
              <Input ref={timerInputRef} type="number" min="0" max="999" value={editTimerMinutes} onChange={handleTimerInputChange} onKeyDown={handleTimerInputKeyDown} className="w-14 h-6 text-xs" placeholder="Min" />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={handleTimerEditSubmit} title="Save Timer"> <Save className="h-3 w-3" /> </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-200" onClick={() => setIsEditingTimer(false)} title="Cancel Edit"> <X className="h-3 w-3" /> </Button>
            </>
          ) : (
            // Timer Display/Action UI
            <>
              {/* Acknowledge/Snooze buttons (only if expired, unacknowledged, and not complete) */}
              {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-400 hover:text-yellow-300" onClick={() => acknowledgeTimer(patientId, task.id)} title="Acknowledge Timer"> <BellOff className="h-4 w-4" /> </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400 hover:text-blue-300" onClick={handleSnooze} title="Snooze 15 min"> <AlarmClockOff className="h-4 w-4" /> </Button>
                </>
              )}
              {/* Timer display (only if timer exists and task not complete) */}
              {task.timerEnd && task.completionStatus !== 'complete' && (
                <span className={timerTextStyle}>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {isTimerExpired ? 'Expired' : timeRemaining}
                </span>
              )}
              {/* Edit/Add Timer Button (only if task not complete, shows on hover) */}
              {task.completionStatus !== 'complete' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTimer(true)} title={task.timerEnd ? 'Edit Timer' : 'Add Timer'} >
                  {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                </Button>
              )}
            </>
          )}
        </div>
        {/* Notes Button (shows on hover) */}
        <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 flex-shrink-0 ${task.notes ? 'text-blue-400' : 'text-gray-500'} hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`} onClick={() => setIsEditingNotes((prev) => !prev)} title={task.notes ? 'Edit/View Notes' : 'Add Notes'} > <MessageSquare className="h-3 w-3" /> </Button>
        {/* Delete Task Button (shows on hover) */}
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeTask(patientId, task.id)} title="Remove Task" > <Trash2 className="h-3 w-3" /> </Button>
      </div>

      {/* Notes Editing Area (conditionally rendered) */}
      {isEditingNotes && (
        <div className="mt-1.5 pl-8 pr-2 flex items-center gap-2 w-full">
          <textarea ref={notesTextareaRef} value={editNotes} onChange={handleNotesInputChange} onKeyDown={handleNotesKeyDown} placeholder="Add task notes..." rows={2} className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none" />
          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300 self-start" onClick={handleNotesEditSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-200 self-start" onClick={() => setIsEditingNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button>
        </div>
      )}

      {/* Display Saved Notes (conditionally rendered) */}
      {!isEditingNotes && task.notes && (
        <div className="mt-1 pl-8 pr-2 text-xs text-gray-200 italic w-full break-words">
          Note: {task.notes}
        </div>
      )}

      {/* Task Metadata (Created/Completed Time) */}
      <div className="pl-8 text-xs text-gray-400 mt-0.5">
        Added: {formatRelative(task.createdAt, new Date())}
        {task.completionStatus === 'complete' && task.completedAt && (
          <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span>
        )}
      </div>
    </div>
  );
};
// ===--------------------------------===
// === End: Restored TaskItem Component ===
// ===--------------------------------===


// ===-------------------------------------===
// === Start: Restored PatientCard Component ===
// === (Copied from PatientCard.tsx)       ===
// ===-------------------------------------===
// This component renders a card for a single patient, displaying their details,
// length of stay, notes, and a list of tasks (using the TaskItem component).
// It also includes functionality to add new tasks for the patient.
interface PatientCardProps {
    patient: Patient; // The patient data object
    removePatient: (patientId: string) => void; // Callback to remove the patient
    updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void; // Passed down to TaskItem
    addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void; // Callback to add a new task
    updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void; // Passed down to TaskItem
    removeTaskFromPatient: (patientId: string, taskId: string | number) => void; // Passed down to TaskItem
    updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void; // Passed down to TaskItem
    acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void; // Passed down to TaskItem
    updatePatientNotes: (patientId: string, notes: string) => void; // Callback to update patient notes
    updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void; // Passed down to TaskItem
}

export const PatientCard: React.FC<PatientCardProps> = ({
    patient,
    removePatient,
    updateTaskTimerState,
    addTaskToPatient,
    updateTaskTimer,
    removeTaskFromPatient,
    updateTaskCompletion,
    acknowledgeTaskTimer,
    updatePatientNotes,
    updateTaskNotes,
}) => {
    // --- State ---
    // Calculate initial length of stay in minutes
    const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() => differenceInMinutes(new Date(), patient.arrivalTime));
    // Formatted length of stay string
    const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
    // Input state for adding a new task
    const [newTaskText, setNewTaskText] = useState<string>('');
    const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>('');
    // State for editing patient notes
    const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false);
    const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || '');

    // --- Refs ---
    const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null); // Ref for focusing patient notes textarea

    // --- Effects ---
    // Effect to update Length of Stay (LOS) periodically
    useEffect(() => {
        const updateLOS = () => {
            // Ensure patient.arrivalTime is a valid Date object before calculating
            if (patient.arrivalTime && patient.arrivalTime instanceof Date && !isNaN(patient.arrivalTime.getTime())) {
                const minutes = differenceInMinutes(new Date(), patient.arrivalTime);
                // Handle potential negative minutes if arrivalTime is slightly in the future due to clock sync issues
                const nonNegativeMinutes = Math.max(0, minutes);
                setLengthOfStayMinutes(nonNegativeMinutes);

                // Format LOS string (e.g., "2h 5m", "45m")
                const hours = Math.floor(nonNegativeMinutes / 60);
                const remainingMinutes = nonNegativeMinutes % 60;
                let formatted = '';
                if (hours > 0) formatted += `${hours}h `;
                formatted += `${remainingMinutes}m`;
                setLengthOfStayFormatted(formatted.trim());
            } else {
                // Handle invalid arrivalTime (e.g., set to 'Invalid Date' or empty string)
                console.error("Invalid arrivalTime received in PatientCard:", patient.arrivalTime);
                setLengthOfStayFormatted('Invalid Date'); // Display an error or default message
                setLengthOfStayMinutes(0); // Set minutes to 0 or another default
            }
        };
        updateLOS(); // Initial calculation
        const intervalId = setInterval(updateLOS, 1000 * 60); // Update every minute
        return () => clearInterval(intervalId); // Cleanup interval
    }, [patient.arrivalTime]); // Dependency: only re-run if arrivalTime changes

    // Effect to focus patient notes textarea when editing starts
    useEffect(() => {
        if (isEditingPatientNotes) {
            setEditPatientNotes(patient.notes || ''); // Ensure textarea has current notes
            setTimeout(() => patientNotesTextareaRef.current?.focus(), 0); // Focus after render
        }
    }, [isEditingPatientNotes, patient.notes]);

    // --- Handlers ---
    // Handle submitting the new task form
    const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault(); // Prevent default form submission
        if (newTaskText.trim() === '') return; // Don't add empty tasks
        addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes); // Call parent add function
        // Reset input fields
        setNewTaskText('');
        setNewTaskTimerMinutes('');
    };

    // Handle Enter key press in the new task input field to submit
    const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddTaskSubmit();
        }
    };

    // Handle saving edited patient notes
    const handlePatientNotesSubmit = () => {
        if (!isEditingPatientNotes) return;
        updatePatientNotes(patient.id, editPatientNotes); // Call parent update function
        setIsEditingPatientNotes(false); // Exit editing mode
    };

    // Handle keyboard events in patient notes textarea (Enter to save, Escape to cancel)
    const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Enter saves
            e.preventDefault();
            handlePatientNotesSubmit();
        } else if (e.key === 'Escape') { // Escape cancels
            setIsEditingPatientNotes(false);
            setEditPatientNotes(patient.notes || ''); // Revert changes
        }
    };

    // --- Derived Data & Styling ---
    // Get dynamic border and background colors based on LOS
    const borderColor = getBorderColor(lengthOfStayMinutes);
    const bgColor = getBackgroundColor(lengthOfStayMinutes); // Currently static background
    // Filter tasks into pending and completed lists
    const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
    const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');

    // --- ADDED CONSOLE LOG ---
    // Log the arrivalTime prop received by this component instance
    console.log(`PatientCard Render (${patient.name}) - arrivalTime:`, patient.arrivalTime, 'Type:', typeof patient.arrivalTime, 'Is Date:', patient.arrivalTime instanceof Date);


    // --- JSX Rendering ---
    return (
       <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500 flex flex-col`}>
            {/* Card Header: Patient Name and Remove Button */}
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium text-black">{patient.name}</CardTitle>
                {/* Remove Patient Button */}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-black hover:text-red-500" onClick={() => removePatient(patient.id)} > <X className="h-4 w-4" /> </Button>
            </CardHeader>
            {/* Card Content: LOS, Notes, Tasks */}
            <CardContent className="flex-1 flex flex-col">
                {/* Length of Stay Display */}
                <div className="text-xs text-black mb-2">
                    <Clock className="inline h-3 w-3 mr-1" /> Length of Stay: <span className="font-semibold text-black">{lengthOfStayFormatted}</span>
                    {/* Only display formatted arrival time if it's valid */}
                    {patient.arrivalTime && patient.arrivalTime instanceof Date && !isNaN(patient.arrivalTime.getTime()) && (
                         <span className="ml-2 text-black"> (Arrival: {format(patient.arrivalTime, 'HH:mm')}) </span>
                    )}
                </div>
                {/* Patient Notes Section */}
                <div className="mb-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-black font-medium flex items-center">
                            Notes:
                            {/* Edit/View Notes Button */}
                            <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-400' : 'text-black'}`} onClick={() => setIsEditingPatientNotes((prev) => !prev)} title={patient.notes ? 'Edit/View Notes' : 'Add Notes'} >
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {/* Notes Editing Area (conditional) */}
                    {isEditingPatientNotes && (
                        <div className="mt-1 flex items-center gap-2 w-full">
                            <textarea ref={patientNotesTextareaRef} value={editPatientNotes} onChange={(e) => setEditPatientNotes(e.target.value)} onKeyDown={handlePatientNotesKeyDown} rows={2} className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none" placeholder="Add patient notes..." />
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={handlePatientNotesSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-200" onClick={() => setIsEditingPatientNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button>
                        </div>
                    )}
                    {/* Display Saved Notes (conditional) */}
                    {!isEditingPatientNotes && patient.notes && (
                        <div className="mt-1 text-xs text-black italic break-words">
                            Note: {patient.notes}
                        </div>
                    )}
                </div>
                {/* Task List Section */}
                <div className="flex-1 mt-2 border-t border-gray-700 pt-2 overflow-y-auto">
                    {/* Pending Tasks */}
                    <div>
                        <h4 className="text-sm font-medium text-black mb-1">Pending Tasks:</h4>
                        {pendingTasks.length === 0 ? (
                            <p className="text-xs text-black italic">No pending tasks.</p>
                        ) : (
                            // Map through pending tasks and render TaskItem for each
                            pendingTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    patientId={patient.id}
                                    patientName={patient.name}
                                    // Pass down all necessary callbacks
                                    updateTaskTimerState={updateTaskTimerState}
                                    updateTaskTimer={updateTaskTimer}
                                    removeTask={removeTaskFromPatient}
                                    updateTaskCompletion={updateTaskCompletion}
                                    acknowledgeTimer={acknowledgeTaskTimer}
                                    updateTaskNotes={updateTaskNotes}
                                />
                            ))
                        )}
                    </div>
                    {/* Completed Tasks (only shown if there are any) */}
                    {completedTasks.length > 0 && (
                        <div className="mt-2 border-t border-gray-700/50 pt-2">
                            <h4 className="text-sm font-medium text-black mb-1">Completed Tasks:</h4>
                            {/* Map through completed tasks and render TaskItem */}
                            {completedTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    patientId={patient.id}
                                    patientName={patient.name}
                                    // Pass down callbacks (needed for potential un-completion)
                                    updateTaskTimerState={updateTaskTimerState}
                                    updateTaskTimer={updateTaskTimer}
                                    removeTask={removeTaskFromPatient}
                                    updateTaskCompletion={updateTaskCompletion}
                                    acknowledgeTimer={acknowledgeTaskTimer}
                                    updateTaskNotes={updateTaskNotes}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {/* Add New Task Form Section */}
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
                        {/* Task Description Input */}
                        <Input type="text" placeholder="Add Task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="flex-grow h-8 text-sm" />
                        {/* Optional Timer Input */}
                        <Input type="number" min="1" max="999" placeholder="Min" value={newTaskTimerMinutes} onChange={(e) => setNewTaskTimerMinutes(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="w-16 h-8 text-xs" />
                        {/* Add Task Button */}
                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-black hover:bg-gray-100" disabled={newTaskText.trim() === ''} title="Add Task" > <Plus className="h-4 w-4" /> </Button>
                    </form>
                </div>
            </CardContent>
       </Card>
    );
};
// ===-----------------------------------===
// === End: Restored PatientCard Component ===
// ===-----------------------------------===


// ===-------------------------------------===
// === Start: Restored AddPatientModal Comp. ===
// === (Using original internal definition) ===
// ===-------------------------------------===
// This component renders a modal dialog for adding a new patient.
// It includes fields for patient name, arrival time, initial tasks (with timers), and notes.

// State structure for tasks within the modal
interface ModalTaskState { id: number; text: string; timerMinutes: string; }

interface AddPatientModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Callback to close the modal
  // Callback to handle adding the new patient data to the main state
  addPatientHandler: (newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }) => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatientHandler }) => {
  // --- State ---
  const [patientName, setPatientName] = useState<string>(''); // Input for patient name/identifier
  const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm')); // Input for arrival time (defaults to current time)
  // State to manage the list of initial tasks being added in the modal
  const [tasks, setTasks] = useState<ModalTaskState[]>([{ id: Date.now(), text: '', timerMinutes: '' }]);
  const [patientNotes, setPatientNotes] = useState<string>(''); // Input for optional patient notes

  // --- Handlers ---
  // Add a new empty task input line to the modal form
  const handleAddTask = (): void => {
    setTasks([...tasks, { id: Date.now(), text: '', timerMinutes: '' }]);
  };

  // Remove a task input line from the modal form
  const handleRemoveTask = (id: number): void => {
    if (tasks.length > 1) { // Keep at least one task line
      setTasks(tasks.filter((task) => task.id !== id));
    } else {
      // If removing the last task, reset it instead of removing the line
      setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
    }
  };

  // Update the text or timer value for a specific task line in the modal
  const handleTaskChange = (id: number, field: keyof Omit<ModalTaskState, 'id'>, value: string ): void => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); // Prevent default form submission
    if (!patientName || !arrivalTime) return; // Basic validation

    const now = new Date();
    // Parse arrival time string into a Date object for today
    let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date());
    // Ensure the date part is set to today
    arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    // Validate parsed time: if invalid or in the future, default to now
    if (!isValid(arrivalDateTime) || arrivalDateTime > now) {
        console.warn(`Invalid or future arrival time entered (${arrivalTime}), defaulting to current time.`);
        arrivalDateTime = now;
    }

    // Process the tasks entered in the modal:
    // - Filter out empty task descriptions
    // - Convert timer minutes string to a Date object for timerEnd
    // - Set initial task properties (status, createdAt, etc.)
    const processedModalTasks: Omit<Task, 'id'>[] = tasks
      .filter((task) => task.text.trim() !== '') // Only include tasks with text
      .map((task): Omit<Task, 'id'> => {
        const timerMinutesNum = parseInt(task.timerMinutes, 10);
        // Check if timer input is a valid positive number within range
        const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
        // Calculate timer end date if valid, otherwise null
        const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;
        // Return the structured task object (without ID, as it will be assigned by the parent state)
        return {
          text: task.text,
          timerEnd: timerEndDate,
          isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), // Check if expired immediately
          completionStatus: 'incomplete',
          createdAt: new Date(),
          completedAt: null,
          notes: '', // Initial notes are empty for tasks
          isAcknowledged: false,
        };
      });

    // Construct the new patient data object
    const newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] } = {
        name: patientName,
        arrivalTime: arrivalDateTime,
        tasks: processedModalTasks,
        notes: patientNotes, // Include patient notes
    };

    addPatientHandler(newPatientData); // Call the parent handler to add the patient

    // Reset modal form state and close the modal
    setPatientName('');
    setArrivalTime(format(new Date(), 'HH:mm'));
    setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
    setPatientNotes('');
    onClose();
  };

  // --- JSX Rendering ---
  return (
    // Use the mock Dialog component
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-50 text-black sm:max-w-3xl"> {/* Wider modal */}
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription className="text-black"> Enter patient details, arrival time, initial tasks, and optional notes. </DialogDescription>
          {/* Close button in the header */}
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-black hover:text-black" onClick={onClose} > <X className="h-4 w-4" /> <span className="sr-only">Close</span> </Button>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Patient Name Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-name" className="text-right text-black"> Name/Title </Label>
              <Input id="patient-name" value={patientName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)} className="col-span-3 bg-neutral-50 border-gray-600 text-black placeholder-black" placeholder="e.g., Bed 5 / Mr. Smith" required />
            </div>
            {/* Arrival Time Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival-time" className="text-right text-black"> Arrival Time </Label>
              <Input id="arrival-time" type="time" value={arrivalTime} onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)} className="col-span-3 bg-neutral-50 border-gray-600 text-black" required />
            </div>
            {/* Patient Notes Input */}
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="patient-notes" className="text-right text-black pt-2"> Notes (Opt.) </Label>
                <textarea id="patient-notes" value={patientNotes} onChange={(e) => setPatientNotes(e.target.value)} rows={3} className="col-span-3 text-sm bg-neutral-50 border border-gray-600 rounded p-1.5 text-black placeholder-black focus:ring-1 focus:ring-ring focus:outline-none resize-vertical" placeholder="Add general patient notes..." />
            </div>
            {/* Initial Tasks Section */}
            <div className="col-span-4 mt-2">
              <Label className="mb-2 block font-medium text-black">Initial Tasks</Label>
              {/* Map through the tasks state to render input lines */}
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2 mb-2">
                  {/* Task Description Input */}
                  <Input type="text" placeholder={`Task ${index + 1} desc.`} value={task.text} onChange={(e) => handleTaskChange(task.id, 'text', e.target.value)} className="flex-grow bg-neutral-50 border-gray-600 text-black placeholder-black" />
                  {/* Optional Timer Input */}
                  <Input type="number" min="1" max="999" placeholder="Timer (min)" value={task.timerMinutes} onChange={(e) => handleTaskChange(task.id, 'timerMinutes', e.target.value)} className="w-24 bg-neutral-50 border-gray-600 text-black placeholder-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  {/* Remove Task Line Button */}
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => handleRemoveTask(task.id)} disabled={tasks.length <= 1} aria-label="Remove task" > <X className="h-4 w-4" /> </Button>
                </div>
              ))}
              {/* Add Task Line Button */}
              <Button type="button" variant="outline" size="sm" onClick={handleAddTask} className="mt-2 border-gray-600 text-black hover:bg-neutral-50" > <Plus className="h-4 w-4 mr-2" /> Add Task Line </Button>
            </div>
          </div>
          {/* Modal Footer: Cancel and Add Buttons */}
          <DialogFooter className="border-t border-gray-700 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="text-black bg-neutral-50 hover:bg-gray-100"> Cancel </Button>
            <Button type="submit" className="bg-[#008080] hover:bg-[#009999] text-white"> Add Patient </Button> {/* Specific button color */}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
// ===-----------------------------------===
// === End: Restored AddPatientModal Comp. ===
// ===-----------------------------------===



// --- MAIN SIDEBAR COMPONENT (Tasks) ---
// This is the main component that orchestrates the patient tracking sidebar.
// It consumes the HomeContext (or mock context) to get patient data and action dispatchers.
// It renders the list of patients using PatientCard and provides the "Add Patient" functionality via AddPatientModal.
const Tasks: React.FC = () => {
  // --- Consume Context ---
  // Use the mock context for standalone functionality
  const { state, addPatient, removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer, removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes } = useContext(MockHomeContext); // Using Mock Context here
  const { showSidePromptbar, patients } = state; // Destructure relevant state

  // --- Local State ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Controls the visibility of the AddPatientModal
  // State to track browser notification permission status
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // --- Effects ---
  // Effect to request notification permission on component mount if not already granted or denied
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default') {
      Notification.requestPermission().then(setNotificationPermission); // Request permission and update state
    }
  }, [notificationPermission]); // Re-run if permission state changes (though unlikely needed after initial request)

  // --- Dynamic Styling ---
  // Determine sidebar width based on context state
  const sidebarWidth = showSidePromptbar ? 'w-40 lg:w-80' : 'w-0'; // Responsive width, collapses to 0 when hidden

  // --- JSX Rendering ---
  return (
    // Main container for the sidebar
    <div className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth} ${showSidePromptbar ? 'visible' : 'invisible'}`}>
      {/* Only render content if the sidebar should be shown */}
      {showSidePromptbar && (
        <>
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 shadow-md border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
            {/* Add Patient Button - Opens the modal */}
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="bg-[#008080] hover:bg-[#009999] border-gray-400 text-white"> <Plus className="h-4 w-4 mr-2" /> Add Patient </Button>
          </div>

          {/* Patient List Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {patients.length === 0 ? (
              // Display message when no patients are tracked
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                  <AlertTriangle className="w-10 h-10 mb-4 text-gray-600" />
                  <p className="font-medium">No patients being tracked.</p>
                  <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p>
              </div>
            ) : (
              // Map through the patients array and render a PatientCard for each
              patients.map((patient: Patient) => ( // Explicitly type patient here
                <PatientCard // Renders internal PatientCard component
                  key={patient.id}
                  patient={patient}
                  // Pass down all the necessary handler functions obtained from context
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

          {/* Render the Add Patient Modal (controlled by isModalOpen state) */}
          <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addPatientHandler={addPatient} />
        </>
      )}
    </div>
  );
};

// Export the main Tasks component as the default export
export default Tasks;

// --- Helper CSS for Animations (if not using Tailwind's built-in animate-pulse) ---
// You might need to add this to a global CSS file or use a CSS-in-JS solution
/*
@keyframes flash {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(255, 0, 0, 0.1); } // Light red flash
}

.animate-flash {
  animation: flash 1.5s infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: theme('colors.red.500'); }
  50% { border-color: theme('colors.red.300'); }
}

.animate-pulse-border {
  animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

// Style adjustments for number input arrows (optional)
[appearance:textfield]::-webkit-outer-spin-button,
[appearance:textfield]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
*/

'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
  ForwardedRef,
  useContext,
  useRef,
  KeyboardEvent,
  useMemo, // <-- Import useMemo
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
  ChevronDown, // <-- Import ChevronDown
  ChevronUp,   // <-- Import ChevronUp
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

// --- Mock HomeContext ---
// In a real application, this would come from your context provider setup.
// For this standalone component, we create a simple mock context.
const HomeContext = React.createContext<any>({
  state: {
    showSidePromptbar: true, // Default to showing the sidebar
  },
  dispatch: () => {}, // Mock dispatch function
});

// --- Types ---
type TaskCompletionStatus = 'incomplete' | 'in-progress' | 'complete';

interface Task {
  id: string | number;
  text: string;
  timerEnd: Date | null;
  isTimerExpired: boolean;
  completionStatus: TaskCompletionStatus;
  createdAt: Date;
  completedAt: Date | null;
  notes: string;
  isAcknowledged: boolean;
}

interface Patient {
  id: string;
  name: string;
  arrivalTime: Date;
  tasks: Task[];
  notes: string;
}

// --- Mock shadcn/ui Components ---
// These are simplified versions for demonstration purposes.
// In a real project, you'd import these from your UI library.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    // Basic styling mimicking shadcn structure (replace with actual Tailwind classes)
    const baseStyle =
      'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
      'ring-offset-background transition-colors focus-visible:outline-none ' +
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-[#008080] text-white hover:bg-[#006666]', // Using teal for primary
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 hover:text-gray-900',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      ghost: 'hover:bg-gray-100 hover:text-gray-900',
      link: 'text-[#008080] underline-offset-4 hover:underline',
    };
    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return (
      <button
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const baseStyle =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 ' + // Changed background to white
    'text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm ' + // file:bg-transparent
    'file:font-medium placeholder:text-gray-500 focus-visible:outline-none ' + // Adjusted placeholder color
    'focus-visible:ring-2 focus-visible:ring-[#008080] focus-visible:ring-offset-2 ' + // Ring color to teal
    'disabled:cursor-not-allowed disabled:opacity-50';
  return <input type={type} className={`${baseStyle} ${className ?? ''}`} ref={ref} {...props} />;
});
Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ''}`}
    {...props}
  />
));
Label.displayName = 'Label';

// Basic Dialog (Modal)
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) =>
  open ? (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  ) : null;

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}
const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <div className={`p-6 ${className ?? ''}`}>{children}</div>
);
interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
  <div className={`mb-4 relative ${className ?? ''}`}>{children}</div> // Added relative for absolute positioning of close button
);
interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}
const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
  <h2 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className ?? ''}`}>{children}</h2>
);
interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}
const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => (
  <p className={`text-sm text-gray-600 dark:text-gray-400 ${className ?? ''}`}>{children}</p>
);
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}
const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  <div className={`mt-6 flex justify-end space-x-2 border-t border-gray-200 dark:border-gray-700 pt-4 ${className ?? ''}`}>{children}</div>
);
interface DialogCloseProps {
  children: React.ReactElement;
  onClick?: () => void;
  asChild?: boolean; // Keep asChild for potential composition
}
const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick }) =>
  React.cloneElement(children, { onClick });

// Basic Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border-gray-200 dark:border-gray-700 ${className ?? ''}`}
    {...props}
  />
));
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className ?? ''}`} {...props} />
));
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className ?? ''}`} {...props} />
));
CardTitle.displayName = 'CardTitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-4 pt-0 ${className ?? ''}`} {...props} />
));
CardContent.displayName = 'CardContent';

// --- Helper Functions ---
const getBorderColor = (minutes: number): string => {
  if (minutes >= 300) return 'border-red-500 animate-pulse-border'; // Flashing Red >= 5 hours
  if (minutes >= 240) return 'border-red-500'; // Red >= 4 hours
  if (minutes >= 120) return 'border-amber-500'; // Amber >= 2 hours
  return 'border-green-500'; // Green < 2 hours
};

// Background color is less critical now with white background cards
// const getBackgroundColor = (minutes: number): string => {
//   if (minutes >= 300) return 'bg-red-50 dark:bg-red-900/20';
//   if (minutes >= 240) return 'bg-red-50 dark:bg-red-900/20';
//   if (minutes >= 120) return 'bg-amber-50 dark:bg-amber-900/20';
//   return 'bg-white dark:bg-gray-800'; // Default card background
// };

// --- LocalStorage Parsing ---
const parsePatientsWithDates = (jsonData: string): Patient[] | null => {
  try {
    const parsedData = JSON.parse(jsonData);
    if (!Array.isArray(parsedData)) return null;

    return parsedData.map((patient: any) => {
      const arrivalTime = patient.arrivalTime ? new Date(patient.arrivalTime) : new Date();
      const tasks = Array.isArray(patient.tasks)
        ? patient.tasks.map((t: any) => {
            const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
            const completedAt = t.completedAt ? new Date(t.completedAt) : null;
            const timerEnd = t.timerEnd ? new Date(t.timerEnd) : null;

            return {
              ...t,
              id: t.id || `task-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Ensure ID exists
              createdAt: isValid(createdAt) ? createdAt : new Date(),
              completedAt: completedAt && isValid(completedAt) ? completedAt : null,
              timerEnd: timerEnd && isValid(timerEnd) ? timerEnd : null,
              completionStatus: t.completionStatus || 'incomplete',
              notes: t.notes || '',
              isAcknowledged: t.isAcknowledged || false,
              isTimerExpired: !!timerEnd && timerEnd <= new Date(),
            };
          })
        : [];

      return {
        ...patient,
        id: patient.id || `patient-${Date.now()}`, // Ensure ID exists
        arrivalTime: isValid(arrivalTime) ? arrivalTime : new Date(),
        tasks,
        notes: patient.notes || '',
      };
    });
  } catch (error) {
    console.error('Error parsing patient data from localStorage:', error);
    return null;
  }
};

// --- TaskItem component ---
// [NO CHANGES IN THIS COMPONENT]
interface TaskItemProps {
  task: Task;
  patientId: string;
  patientName: string;
  updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
  updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
  removeTask: (patientId: string, taskId: string | number) => void;
  updateTaskCompletion: (
    patientId: string,
    taskId: string | number,
    status: TaskCompletionStatus
  ) => void;
  acknowledgeTimer: (patientId: string, taskId: string | number) => void;
  updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
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
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(task.isTimerExpired);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEditingTimer, setIsEditingTimer] = useState<boolean>(false);
  const [editTimerMinutes, setEditTimerMinutes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>(task.notes || '');

  const timerInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Timer check effect
  useEffect(() => {
    // Skip checks if task is complete
    if (task.completionStatus === 'complete') {
      if (isTimerExpired) setIsTimerExpired(false); // Ensure expired state is reset if completed
      setTimeRemaining('');
      return;
    }

    // Clear timer state if no timerEnd exists
    if (!task.timerEnd) {
        if (isTimerExpired) setIsTimerExpired(false);
        setTimeRemaining('');
        return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const checkTimer = () => {
      const now = new Date();
      // Check if timer exists and has passed
      if (task.timerEnd && now >= task.timerEnd) {
        if (!isTimerExpired) { // Only update state and notify if it wasn't already expired
          setIsTimerExpired(true);
          setTimeRemaining('Expired');
          updateTaskTimerState(patientId, task.id, true); // Update parent state

          // Fire a desktop notification if permission granted and not acknowledged
          if (
            !task.isAcknowledged &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`Task Timer Expired: ${patientName}`, {
              body: task.text,
              tag: `task-${task.id}`, // Tag helps manage notifications
            });
          }
        }
        if (intervalId) clearInterval(intervalId); // Stop checking once expired
      } else if (task.timerEnd) { // Timer exists and hasn't passed yet
        if (isTimerExpired) { // Reset expired state if timer was edited/snoozed
          setIsTimerExpired(false);
          updateTaskTimerState(patientId, task.id, false);
        }
        // Update remaining time display
        setTimeRemaining(`in ${formatDistanceToNowStrict(task.timerEnd)}`);
      }
    };

    checkTimer(); // Initial check

    // Set up interval only if timer exists and is in the future
    if (task.timerEnd && new Date() < task.timerEnd) {
      intervalId = setInterval(checkTimer, 1000 * 30); // Check every 30 seconds
    }

    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    task.timerEnd,
    task.id,
    task.completionStatus, // Re-run if completion status changes
    task.isAcknowledged, // Re-run if acknowledged status changes
    patientId,
    patientName,
    task.text,
    updateTaskTimerState,
    isTimerExpired, // Include local expired state as dependency
  ]);


  // Focus timer input when editing starts
  useEffect(() => {
    if (isEditingTimer) {
      const initialMinutes =
        task.timerEnd && task.timerEnd > new Date()
          ? Math.max(0, differenceInMinutes(task.timerEnd, new Date())).toString()
          : '';
      setEditTimerMinutes(initialMinutes);
      setTimeout(() => timerInputRef.current?.focus(), 0); // Focus after render
    }
  }, [isEditingTimer, task.timerEnd]);

  // Focus notes textarea when editing starts
  useEffect(() => {
    if (isEditingNotes) {
      setEditNotes(task.notes || '');
      setTimeout(() => notesTextareaRef.current?.focus(), 0); // Focus after render
    }
  }, [isEditingNotes, task.notes]);

  // Handle saving the edited timer
  const handleTimerEditSubmit = () => {
    if (!isEditingTimer) return;
    const minutesToSet =
      editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes;
    updateTaskTimer(patientId, task.id, minutesToSet);
    setIsEditingTimer(false);
  };

  // Update timer input state
  const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditTimerMinutes(e.target.value);
  };

  // Handle Enter/Escape keys in timer input
  const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimerEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTimer(false);
    }
  };

  // Handle saving edited notes
  const handleNotesEditSubmit = () => {
    if (!isEditingNotes) return;
    updateTaskNotes(patientId, task.id, editNotes);
    setIsEditingNotes(false);
  };

  // Update notes textarea state
  const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setEditNotes(e.target.value);
  };

  // Handle Enter/Escape keys in notes textarea
  const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Submit on Enter (without Shift)
      e.preventDefault();
      handleNotesEditSubmit();
    } else if (e.key === 'Escape') { // Cancel on Escape
      setIsEditingNotes(false);
      setEditNotes(task.notes || ''); // Reset to original notes
    }
  };

  // Cycle through task completion statuses
  const handleCompletionToggle = () => {
    let nextStatus: TaskCompletionStatus;
    switch (task.completionStatus) {
      case 'incomplete':
        nextStatus = 'in-progress';
        break;
      case 'in-progress':
        nextStatus = 'complete';
        break;
      case 'complete':
        nextStatus = 'incomplete';
        break;
      default:
        nextStatus = 'incomplete';
    }
    updateTaskCompletion(patientId, task.id, nextStatus);
  };

  // Snooze timer by adding 15 minutes
  const handleSnooze = () => {
    updateTaskTimer(patientId, task.id, '15');
  };

  // Get the appropriate icon based on completion status
  const getCompletionIcon = () => {
    switch (task.completionStatus) {
      case 'in-progress':
        return <MinusSquare className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case 'complete':
        return <CheckSquare className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'incomplete':
      default:
        return <Square className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  // --- Dynamic Styling based on Task State ---
  let taskItemClasses = 'flex flex-col py-1.5 group'; // Base classes + group for hover effects
  let taskTextStyle = 'text-sm flex-1 cursor-default'; // Base text style
  let timerTextStyle = 'text-xs font-mono'; // Base timer style

  if (task.completionStatus === 'complete') {
    // Completed tasks: Lighter gray, strikethrough
    taskTextStyle += ' line-through text-gray-500 dark:text-gray-400';
    timerTextStyle += ' text-gray-500 dark:text-gray-400';
  } else if (isTimerExpired && !task.isAcknowledged) {
    // Expired & Unacknowledged: Flashing background, bold red text
    taskItemClasses += ' animate-flash'; // Needs CSS animation defined elsewhere
    taskTextStyle += ' text-red-600 dark:text-red-400 font-medium';
    timerTextStyle += ' text-red-600 dark:text-red-400 font-semibold';
  } else if (isTimerExpired && task.isAcknowledged) {
    // Expired & Acknowledged: Darker red text
    taskTextStyle += ' text-red-700 dark:text-red-500';
    timerTextStyle += ' text-red-700 dark:text-red-500';
  } else if (task.timerEnd) {
    // Active timer: Default text color
    taskTextStyle += ' text-gray-800 dark:text-gray-200';
    timerTextStyle += ' text-gray-700 dark:text-gray-300';
  } else {
    // No timer: Default text color
    taskTextStyle += ' text-gray-800 dark:text-gray-200';
    timerTextStyle += ' text-gray-500 dark:text-gray-400'; // Slightly muted timer text if no timer
  }

  return (
    <div className={taskItemClasses}>
      {/* --- Main Task Row --- */}
      <div className="flex items-center space-x-2 w-full">
        {/* Completion Status Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={handleCompletionToggle}
          title={`Status: ${task.completionStatus}. Click to change.`}
        >
          {getCompletionIcon()}
        </Button>

        {/* Task Text */}
        <span className={taskTextStyle}>{task.text}</span>

        {/* --- Timer Controls / Display --- */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {isEditingTimer ? (
            // Timer Editing Mode
            <>
              <Input
                ref={timerInputRef}
                type="number"
                min="0"
                max="999"
                value={editTimerMinutes}
                onChange={handleTimerInputChange}
                onKeyDown={handleTimerInputKeyDown}
                className="w-14 h-6 text-xs px-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" // Adjusted styling for dark mode
                placeholder="Min"
              />
              {/* Save Timer Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                onClick={handleTimerEditSubmit}
                title="Save Timer"
              >
                <Save className="h-3 w-3" />
              </Button>
              {/* Cancel Edit Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setIsEditingTimer(false)}
                title="Cancel Edit"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            // Timer Display / Action Mode
            <>
              {/* Acknowledge/Snooze Buttons (Only if expired, unacknowledged, and not complete) */}
              {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                    onClick={() => acknowledgeTimer(patientId, task.id)}
                    title="Acknowledge Timer"
                  >
                    <BellOff className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={handleSnooze}
                    title="Snooze 15 min"
                  >
                    <AlarmClockOff className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Timer Display (If timer exists and task not complete) */}
              {task.timerEnd && task.completionStatus !== 'complete' && (
                <span className={timerTextStyle}>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {isTimerExpired ? 'Expired' : timeRemaining}
                </span>
              )}

              {/* Edit/Add Timer Button (If task not complete, shows on hover) */}
              {task.completionStatus !== 'complete' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingTimer(true)}
                  title={task.timerEnd ? 'Edit Timer' : 'Add Timer'}
                >
                  {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                </Button>
              )}
            </>
          )}
        </div>

        {/* --- Notes Button (Shows on hover) --- */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ml-1 flex-shrink-0 ${
            task.notes ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
          } hover:text-blue-600 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`}
          onClick={() => setIsEditingNotes((prev) => !prev)}
          title={task.notes ? 'Edit/View Notes' : 'Add Notes'}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>

        {/* --- Remove Task Button (Shows on hover) --- */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={() => removeTask(patientId, task.id)}
          title="Remove Task"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* --- Notes Editing Section --- */}
      {isEditingNotes && (
        <div className="mt-1.5 pl-8 pr-2 flex items-start gap-2 w-full"> {/* Changed items-center to items-start */}
          <textarea
            ref={notesTextareaRef}
            value={editNotes}
            onChange={handleNotesInputChange}
            onKeyDown={handleNotesKeyDown}
            placeholder="Add task notes..."
            rows={2}
            className="flex-grow text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-[#008080] focus:outline-none resize-none"
          />
          {/* Save Notes Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 self-start flex-shrink-0" // Added self-start and flex-shrink-0
            onClick={handleNotesEditSubmit}
            title="Save Notes"
          >
            <Save className="h-4 w-4" />
          </Button>
          {/* Cancel Notes Edit Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-start flex-shrink-0" // Added self-start and flex-shrink-0
            onClick={() => setIsEditingNotes(false)}
            title="Cancel Edit"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* --- Display Notes (If not editing and notes exist) --- */}
      {!isEditingNotes && task.notes && (
        <div className="mt-1 pl-8 pr-2 text-xs text-gray-600 dark:text-gray-400 italic w-full break-words">
          Note: {task.notes}
        </div>
      )}

      {/* --- Task Metadata (Creation/Completion Dates) --- */}
      <div className="pl-8 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Added: {formatRelative(task.createdAt, new Date())}
        {task.completionStatus === 'complete' && task.completedAt && (
          <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span>
        )}
      </div>
    </div>
  );
};


// --- PatientCard ---
// [NO CHANGES IN THIS COMPONENT]
interface PatientCardProps {
  patient: Patient;
  removePatient: (patientId: string) => void;
  updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
  addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void;
  updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
  removeTaskFromPatient: (patientId: string, taskId: string | number) => void;
  updateTaskCompletion: (
    patientId: string,
    taskId: string | number,
    status: TaskCompletionStatus
  ) => void;
  acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void;
  updatePatientNotes: (patientId: string, notes: string) => void;
  updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
}
const PatientCard: React.FC<PatientCardProps> = ({
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
  const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() =>
    differenceInMinutes(new Date(), patient.arrivalTime)
  );
  const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>('');
  const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false);
  const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || '');
  const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate and update Length of Stay (LOS) periodically
  useEffect(() => {
    const calculateLOS = () => {
      const now = new Date();
      const minutes = differenceInMinutes(now, patient.arrivalTime);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      setLengthOfStayMinutes(minutes);
      setLengthOfStayFormatted(`${hours}h ${remainingMinutes}m`);
    };
    calculateLOS(); // Initial calculation
    const intervalId = setInterval(calculateLOS, 60_000); // Update every minute
    return () => clearInterval(intervalId); // Cleanup interval
  }, [patient.arrivalTime]);

  // Focus patient notes textarea when editing starts
  useEffect(() => {
    if (isEditingPatientNotes) {
      setEditPatientNotes(patient.notes || '');
      setTimeout(() => patientNotesTextareaRef.current?.focus(), 0); // Focus after render
    }
  }, [isEditingPatientNotes, patient.notes]);

  // Handle submitting a new task for the patient
  const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault(); // Prevent default form submission
    if (newTaskText.trim() === '') return; // Don't add empty tasks
    addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes);
    // Reset input fields
    setNewTaskText('');
    setNewTaskTimerMinutes('');
  };

  // Handle Enter key in the new task input field to submit
  const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTaskSubmit();
    }
  };

  // Handle saving edited patient notes
  const handlePatientNotesSubmit = () => {
    if (!isEditingPatientNotes) return;
    updatePatientNotes(patient.id, editPatientNotes);
    setIsEditingPatientNotes(false);
  };

  // Handle Enter/Escape keys in patient notes textarea
  const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Submit on Enter (without Shift)
      e.preventDefault();
      handlePatientNotesSubmit();
    } else if (e.key === 'Escape') { // Cancel on Escape
      setIsEditingPatientNotes(false);
      setEditPatientNotes(patient.notes || ''); // Reset to original notes
    }
  };

  // Determine border color based on LOS
  const borderColor = getBorderColor(lengthOfStayMinutes);
  // const bgColor = getBackgroundColor(lengthOfStayMinutes); // Background color handled by Card component now

  // Separate tasks into pending and completed
  const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
  const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');

  return (
    // Card container with dynamic border color
    // ***** MODIFICATION START *****
    // Add id attribute for scroll-to functionality
    <Card id={`patient-card-${patient.id}`} className={`mb-4 border-l-4 ${borderColor} transition-colors duration-500`}>
    {/* ***** MODIFICATION END ***** */}
      {/* Card Header: Patient Name and Remove Button */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{patient.name}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          onClick={() => removePatient(patient.id)}
          title="Remove Patient"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* Card Content */}
      <CardContent>
        {/* Length of Stay and Arrival Time */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          <Clock className="inline h-3 w-3 mr-1" />
          LOS: <span className="font-semibold text-gray-800 dark:text-gray-200">{lengthOfStayFormatted}</span>
          <span className="ml-2">
            (Arrival: {format(patient.arrivalTime, 'HH:mm')})
          </span>
        </div>

        {/* Patient Notes Section */}
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center">
            Notes:
            {/* Edit/View Patient Notes Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setIsEditingPatientNotes((prev) => !prev)}
              title={patient.notes ? 'Edit/View Notes' : 'Add Notes'}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Patient Notes Editing Area */}
        {isEditingPatientNotes && (
          <div className="mb-2 flex items-start gap-2 w-full"> {/* items-start */}
            <textarea
              ref={patientNotesTextareaRef}
              value={editPatientNotes}
              onChange={(e) => setEditPatientNotes(e.target.value)}
              onKeyDown={handlePatientNotesKeyDown}
              rows={2}
              className="flex-grow text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-[#008080] focus:outline-none resize-none"
              placeholder="Add patient notes..."
            />
            {/* Save Patient Notes Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 self-start flex-shrink-0" // self-start
              onClick={handlePatientNotesSubmit}
              title="Save Notes"
            >
              <Save className="h-4 w-4" />
            </Button>
            {/* Cancel Patient Notes Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-start flex-shrink-0" // self-start
              onClick={() => setIsEditingPatientNotes(false)}
              title="Cancel Edit"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Display Patient Notes (If not editing and notes exist) */}
        {!isEditingPatientNotes && patient.notes && (
          <div className="mb-2 text-xs text-gray-600 dark:text-gray-400 italic break-words">
            Note: {patient.notes}
          </div>
        )}

        {/* Pending Tasks Section */}
        <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Pending Tasks:</h4>
          {pendingTasks.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">No pending tasks.</p>
          ) : (
            // Render each pending TaskItem
            pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                patientId={patient.id}
                patientName={patient.name}
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

        {/* Completed Tasks Section (Only shown if there are completed tasks) */}
        {completedTasks.length > 0 && (
          <div className="mt-2 border-t border-gray-300/50 dark:border-gray-600/50 pt-2">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Completed Tasks:</h4>
            {/* Render each completed TaskItem */}
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                patientId={patient.id}
                patientName={patient.name}
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

        {/* Add New Task Form */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
            {/* New Task Text Input */}
            <Input
              type="text"
              placeholder="Add Task"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleNewTaskKeyDown} // Submit on Enter
              className="flex-grow h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" // Adjusted styling
            />
            {/* New Task Timer Input */}
            <Input
              type="number"
              min="1"
              max="999"
              placeholder="Min"
              value={newTaskTimerMinutes}
              onChange={(e) => setNewTaskTimerMinutes(e.target.value)}
              onKeyDown={handleNewTaskKeyDown} // Submit on Enter
              className="w-16 h-8 text-xs px-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Adjusted styling and hide number spinners
            />
            {/* Add Task Button */}
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={newTaskText.trim() === ''} // Disable if text input is empty
              title="Add Task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};


// --- AddPatientModal ---
// [NO CHANGES IN THIS COMPONENT]
interface ModalTaskState {
  id: number; // Temporary ID for modal state management
  text: string;
  timerMinutes: string;
}
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  addPatient: (newPatient: Patient) => void;
}
const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatient }) => {
  // State for the modal inputs
  const [patientName, setPatientName] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm')); // Default to current time
  const [tasks, setTasks] = useState<ModalTaskState[]>([
    { id: Date.now(), text: '', timerMinutes: '' }, // Start with one empty task line
  ]);
  const [patientNotes, setPatientNotes] = useState<string>('');

  // Add a new empty task line to the modal form
  const handleAddTaskLine = (): void => {
    setTasks([...tasks, { id: Date.now(), text: '', timerMinutes: '' }]);
  };

  // Remove a task line from the modal form
  const handleRemoveTaskLine = (id: number): void => {
    if (tasks.length > 1) { // Keep at least one line
      setTasks(tasks.filter((task) => task.id !== id));
    } else {
      // If it's the last line, just clear it instead of removing
      setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
    }
  };

  // Update the state for a specific task line in the modal
  const handleTaskChange = (
    id: number,
    field: keyof Omit<ModalTaskState, 'id'>, // 'text' or 'timerMinutes'
    value: string
  ): void => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); // Prevent default form submission
    // Basic validation
    if (!patientName.trim() || !arrivalTime) return;

    // Parse arrival time and set the date to today
    const now = new Date();
    let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date()); // Parse time string
    // Ensure the date part is set to today
    arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    // Prevent setting arrival time in the future (defaults to now if future time is selected)
    if (arrivalDateTime > now) {
      arrivalDateTime = now;
    }

    // Process the task lines from the modal state into the final Task structure
    const processedTasks: Task[] = tasks
      .filter((task) => task.text.trim() !== '') // Ignore empty task lines
      .map((task) => {
        const timerMinutesNum = parseInt(task.timerMinutes, 10);
        // Validate timer input (must be a positive number within range)
        const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
        // Calculate timer end date if valid, otherwise null
        const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;

        return {
          id: `task-${task.id}-${Math.random().toString(36).substring(7)}`, // Generate unique task ID
          text: task.text.trim(),
          timerEnd: timerEndDate,
          isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), // Check if expired immediately
          completionStatus: 'incomplete',
          createdAt: new Date(),
          completedAt: null,
          notes: '', // Initial tasks have no notes
          isAcknowledged: false,
        };
      });

    // Call the addPatient function passed via props with the new patient data
    addPatient({
      id: `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Generate unique patient ID
      name: patientName.trim(),
      arrivalTime: arrivalDateTime,
      tasks: processedTasks,
      notes: patientNotes.trim(),
    });

    // Reset the modal form fields
    setPatientName('');
    setArrivalTime(format(new Date(), 'HH:mm')); // Reset time to current
    setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]); // Reset to one empty task line
    setPatientNotes('');
    onClose(); // Close the modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Enter patient details, arrival time, initial tasks, and optional notes.
          </DialogDescription>
          {/* Close Button positioned absolutely */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" // Added rounded-full
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Patient Name Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-name" className="text-right text-gray-700 dark:text-gray-300">
                Name/Title
              </Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500" // Adjusted styling
                placeholder="e.g., Bed 5 / Mr. Smith"
                required
              />
            </div>
            {/* Arrival Time Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival-time" className="text-right text-gray-700 dark:text-gray-300">
                Arrival Time
              </Label>
              <Input
                id="arrival-time"
                type="time"
                value={arrivalTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)}
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" // Adjusted styling
                required
              />
            </div>
            {/* Patient Notes Input */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="patient-notes" className="text-right text-gray-700 dark:text-gray-300 pt-2">
                Notes (Opt.)
              </Label>
              <textarea
                id="patient-notes"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                rows={3}
                className="col-span-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-[#008080] focus:outline-none resize-vertical" // Adjusted styling
                placeholder="Add general patient notes..."
              />
            </div>

            {/* Initial Tasks Section */}
            <div className="col-span-4 mt-2">
              <Label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">Initial Tasks</Label>
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2 mb-2">
                  {/* Task Description Input */}
                  <Input
                    type="text"
                    placeholder={`Task ${index + 1} desc.`}
                    value={task.text}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleTaskChange(task.id, 'text', e.target.value)
                    }
                    className="flex-grow h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500" // Adjusted styling
                  />
                  {/* Task Timer Input */}
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="Timer (min)"
                    value={task.timerMinutes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleTaskChange(task.id, 'timerMinutes', e.target.value)
                    }
                    className="w-24 h-8 text-xs px-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Adjusted styling and hide number spinners
                  />
                  {/* Remove Task Line Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" // Added flex-shrink-0
                    onClick={() => handleRemoveTaskLine(task.id)}
                    disabled={tasks.length <= 1 && task.text === '' && task.timerMinutes === ''} // Disable if it's the only empty line
                    aria-label="Remove task line"
                    title="Remove task line"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {/* Add Task Line Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTaskLine}
                className="mt-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" // Adjusted styling
              >
                <Plus className="h-4 w-4 mr-2" /> Add Task Line
              </Button>
            </div>
          </div>
          {/* Modal Footer with Cancel and Add Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-gray-800 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500" // Adjusted styling
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#008080] hover:bg-[#006666] text-white"> {/* Teal primary button */}
              Add Patient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// --- MAIN SIDEBAR COMPONENT ---
// Renamed from 'Tasks' to 'PatientTrackerSidebar' for clarity
const PatientTrackerSidebar: React.FC = () => {
  // Use mock context for sidebar visibility state
  const { state } = useContext(HomeContext);
  const { showSidePromptbar } = state;

  // Key for storing patient data in localStorage
  const PATIENT_STORAGE_KEY = 'patientTrackerData_v2'; // Use a versioned key

  // State for the list of patients
  const [patients, setPatients] = useState<Patient[]>([]);
  // State for controlling the Add Patient modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // State for tracking notification permission status
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // ***** MODIFICATION START *****
  // State to control the visibility of the attention list
  const [isAttentionListExpanded, setIsAttentionListExpanded] = useState<boolean>(false);
  // ***** MODIFICATION END *****

  // Effect to load patient data from localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return; // Don't run on server-side rendering

    try {
      const jsonData = window.localStorage.getItem(PATIENT_STORAGE_KEY);
      if (jsonData) {
        const parsed = parsePatientsWithDates(jsonData); // Use robust parsing function
        if (parsed) {
          // Sort loaded patients by arrival time
          setPatients(parsed.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()));
          return; // Exit if data loaded successfully
        }
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      // Optionally clear corrupted data: localStorage.removeItem(PATIENT_STORAGE_KEY);
    }

    // If no valid data found in localStorage, set empty array (or defaults if needed)
    setPatients([]);
    // Example default data (can be removed if not needed):
    // const defaultPatients: Patient[] = [
    //   // ... example patient objects ...
    // ];
    // setPatients(defaultPatients.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()));

  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save patient data to localStorage whenever the 'patients' state changes
  useEffect(() => {
    if (typeof window === 'undefined') return; // Don't run on server-side rendering

    try {
      // Ensure patients are sorted before saving (optional, but good practice)
      const sortedPatients = [...patients].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime());
      window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(sortedPatients));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      // Handle potential storage errors (e.g., quota exceeded)
    }
  }, [patients]); // Run this effect whenever the patients array changes

  // Effect to request notification permission if not already granted or denied
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (notificationPermission === 'default') { // Only request if permission is 'default'
        Notification.requestPermission().then(setNotificationPermission);
      }
    }
  }, [notificationPermission]); // Re-run if notificationPermission state changes

  // --- CRUD Operation Callbacks (Memoized with useCallback) ---
  // [NO CHANGES IN THESE CALLBACKS]
  // Add a new patient to the list and sort
  const addPatient = useCallback((newPatient: Patient) => {
    setPatients((prev) =>
      [...prev, newPatient].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())
    );
  }, []); // No dependencies, function identity is stable

  // Remove a patient from the list by ID
  const removePatient = useCallback((patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  }, []); // No dependencies, function identity is stable

  // Update the isTimerExpired and isAcknowledged state of a specific task
  const updateTaskTimerState = useCallback(
    (patientId: string, taskId: string | number, isExpired: boolean) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId && t.isTimerExpired !== isExpired) {
                // Reset acknowledged state when timer becomes expired, keep it otherwise
                const newAcknowledged = isExpired ? false : t.isAcknowledged;
                return { ...t, isTimerExpired: isExpired, isAcknowledged: newAcknowledged };
              }
              return t;
            });
            return { ...p, tasks: newTasks };
          }
          return p;
        })
      );
    },
    [] // No dependencies, function identity is stable
  );

  // Add a new task to a specific patient
  const addTaskToPatient = useCallback(
    (patientId: string, taskText: string, timerMinutes: string) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            // Logic to create the new task (similar to AddPatientModal)
            const timerMinutesNum = parseInt(timerMinutes, 10);
            const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
            const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;

            const newTask: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              text: taskText.trim(),
              timerEnd: timerEndDate,
              isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
              completionStatus: 'incomplete',
              createdAt: new Date(),
              completedAt: null,
              notes: '',
              isAcknowledged: false,
            };
            // Add the new task to the patient's task list
            return { ...p, tasks: [...p.tasks, newTask] };
          }
          return p;
        })
      );
    },
    [] // No dependencies, function identity is stable
  );

  // Update the timer (timerEnd, isTimerExpired, isAcknowledged) for a specific task
  const updateTaskTimer = useCallback(
    (patientId: string, taskId: string | number, newTimerMinutes: string | null) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                let newTimerEnd: Date | null = null;
                let newIsTimerExpired = false;
                // Calculate new timer end date if minutes are provided
                if (newTimerMinutes !== null) {
                  const timerMinutesNum = parseInt(newTimerMinutes, 10);
                  if (!isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999) {
                    newTimerEnd = addMinutes(new Date(), timerMinutesNum);
                    newIsTimerExpired = newTimerEnd <= new Date(); // Check if immediately expired
                  }
                }
                // Return updated task, resetting acknowledged status
                return {
                  ...t,
                  timerEnd: newTimerEnd,
                  isTimerExpired: newIsTimerExpired,
                  isAcknowledged: false, // Always reset acknowledgement when timer changes
                };
              }
              return t;
            });
            return { ...p, tasks: newTasks };
          }
          return p;
        })
      );
    },
    [] // No dependencies, function identity is stable
  );

  // Remove a specific task from a patient's task list
  const removeTaskFromPatient = useCallback((patientId: string, taskId: string | number) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patientId) {
          const remainingTasks = p.tasks.filter((t) => t.id !== taskId);
          return { ...p, tasks: remainingTasks };
        }
        return p;
      })
    );
  }, []); // No dependencies, function identity is stable

  // Update the completion status and related fields (completedAt, isAcknowledged) of a task
  const updateTaskCompletion = useCallback(
    (patientId: string, taskId: string | number, status: TaskCompletionStatus) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                const isNowComplete = status === 'complete';
                // Set completion time if status is 'complete', otherwise null
                const completedTime = isNowComplete ? new Date() : null;
                // Acknowledge implicitly when completed, otherwise keep current state
                const newAcknowledged = isNowComplete ? true : t.isAcknowledged;
                return {
                  ...t,
                  completionStatus: status,
                  completedAt: completedTime,
                  isAcknowledged: newAcknowledged,
                };
              }
              return t;
            });
            return { ...p, tasks: newTasks };
          }
          return p;
        })
      );
    },
    [] // No dependencies, function identity is stable
  );

  // Mark an expired timer as acknowledged
  const acknowledgeTaskTimer = useCallback((patientId: string, taskId: string | number) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patientId) {
          const newTasks = p.tasks.map((t) => {
            // Only acknowledge if the task exists and is currently expired
            if (t.id === taskId && t.isTimerExpired) {
              return { ...t, isAcknowledged: true };
            }
            return t;
          });
          return { ...p, tasks: newTasks };
        }
        return p;
      })
    );
  }, []); // No dependencies, function identity is stable

  // Update the general notes for a patient
  const updatePatientNotes = useCallback((patientId: string, notes: string) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => (p.id === patientId ? { ...p, notes: notes.trim() } : p))
    );
  }, []); // No dependencies, function identity is stable

  // Update the notes for a specific task
  const updateTaskNotes = useCallback(
    (patientId: string, taskId: string | number, notes: string) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                return { ...t, notes: notes.trim() };
              }
              return t;
            });
            return { ...p, tasks: newTasks };
          }
          return p;
        })
      );
    },
    [] // No dependencies, function identity is stable
  );


  // ***** MODIFICATION START *****
  // Calculate patients needing attention (expired and unacknowledged tasks)
  const attentionPatients = useMemo(() => {
    return patients.filter(patient =>
      patient.tasks.some(task => task.isTimerExpired && !task.isAcknowledged)
    );
  }, [patients]); // Re-calculate only when patients array changes

  // Function to scroll to a specific patient card
  const scrollToPatient = (patientId: string) => {
    const element = document.getElementById(`patient-card-${patientId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: Add a temporary highlight effect
      element.classList.add('highlight-scroll');
      setTimeout(() => {
        element.classList.remove('highlight-scroll');
      }, 1500); // Remove highlight after 1.5 seconds
    }
  };
  // ***** MODIFICATION END *****


  // --- Sidebar Width Calculation ---
  // Adjust width based on the showSidePromptbar state from context
  // Using slightly different widths for better responsiveness
  const sidebarWidth = showSidePromptbar ? 'w-80 lg:w-96' : 'w-0'; // Example: 320px on small, 384px on large

  return (
    // Main sidebar container div
    <div
      className={`flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 ${sidebarWidth}`}
    >
      {/* Render sidebar content only if showSidePromptbar is true */}
      {showSidePromptbar && (
        <>
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Patient Tracker</h2>
            {/* Add Patient Button */}
            <Button
              variant="default" // Use the primary teal color
              size="sm"
              onClick={() => setIsModalOpen(true)}
              // className="bg-[#008080] hover:bg-[#006666] text-white" // Direct styling (can be removed if variant handles it)
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>

          {/* ***** MODIFICATION START ***** */}
          {/* Attention Summary Section */}
          {attentionPatients.length > 0 && (
            <div className="p-3 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
              {/* Header row with count and toggle button */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    {attentionPatients.length} Patient{attentionPatients.length > 1 ? 's' : ''} require attention
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                  onClick={() => setIsAttentionListExpanded(!isAttentionListExpanded)}
                  title={isAttentionListExpanded ? "Hide list" : "Show list"}
                >
                  {isAttentionListExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Collapsible list of patient names */}
              {isAttentionListExpanded && (
                <ul className="mt-2 pl-5 space-y-1 list-disc list-inside">
                  {attentionPatients.map(patient => (
                    <li key={patient.id} className="text-xs">
                      <button
                        onClick={() => scrollToPatient(patient.id)}
                        className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-red-500 rounded px-0.5"
                        title={`Scroll to ${patient.name}`}
                      >
                        {patient.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* ***** MODIFICATION END ***** */}


          {/* Main Content Area (Scrollable Patient List) */}
          {/* Removed space-y-4 from here to avoid double spacing with the new section */}
          <div className="flex-1 overflow-y-auto p-4">
            {patients.length === 0 ? (
              // Placeholder when no patients are being tracked
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center px-4">
                <AlertTriangle className="w-10 h-10 mb-4 text-gray-400 dark:text-gray-500" />
                <p className="font-medium">No patients being tracked.</p>
                <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p>
              </div>
            ) : (
              // Render a PatientCard for each patient in the list
              // Added space-y-4 wrapper div for consistent spacing
              <div className="space-y-4">
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.id} // Unique key for React list rendering
                    patient={patient}
                    // Pass down all necessary callback functions
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
            )}
          </div>

          {/* Render the AddPatientModal (controlled by isModalOpen state) */}
          <AddPatientModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)} // Function to close the modal
            addPatient={addPatient} // Function to add a new patient
          />

          {/* CSS for the flashing animation and scroll highlight */}
          {/* ***** MODIFICATION START ***** */}
          <style jsx global>{`
            @keyframes flash {
              0%, 100% { background-color: transparent; }
              50% { background-color: rgba(255, 0, 0, 0.1); } /* Light red flash */
            }
            .animate-flash {
              animation: flash 1.5s infinite;
            }
            @keyframes pulse-border {
              0%, 100% { border-color: #ef4444; } /* red-500 */
              50% { border-color: #f87171; } /* red-400 */
            }
            .animate-pulse-border {
              animation: pulse-border 1.5s infinite;
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            .overflow-y-auto::-webkit-scrollbar {
                display: none;
            }
            /* Hide scrollbar for IE, Edge and Firefox */
            .overflow-y-auto {
                -ms-overflow-style: none;  /* IE and Edge */
                scrollbar-width: none;  /* Firefox */
            }
            /* Scroll highlight effect */
            @keyframes highlight {
              from { background-color: rgba(250, 204, 21, 0.4); } /* amber-300/40 */
              to { background-color: transparent; }
            }
            .highlight-scroll {
              animation: highlight 1.5s ease-out;
            }
          `}</style>
          {/* ***** MODIFICATION END ***** */}
        </>
      )}
    </div>
  );
};


// --- App Component (Example Usage) ---
// [NO CHANGES IN THIS COMPONENT]
// This is a simple wrapper to demonstrate how PatientTrackerSidebar might be used.
// In your actual application, you'd integrate it into your layout.
const App: React.FC = () => {
  // Mock state for the HomeContext provider
  const [homeState, setHomeState] = useState({ showSidePromptbar: true });

  // Mock dispatch function (not used in this example)
  const dispatch = (action: any) => {
    // Handle actions if needed, e.g., toggling the sidebar
    console.log("Dispatch called with:", action);
    if (action.type === 'TOGGLE_SIDEBAR') {
        setHomeState(prev => ({ ...prev, showSidePromptbar: !prev.showSidePromptbar }));
    }
  };

  return (
    // Provide the mock context value
    <HomeContext.Provider value={{ state: homeState, dispatch }}>
       {/* Basic Tailwind setup for demonstration */}
       <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          {/* Mock Main Content Area */}
          <div className="flex-1 p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Main Content Area</h1>
            <p className="text-gray-700 dark:text-gray-300">This is where the main application content would go.</p>
            {/* Example button to toggle sidebar (using mock dispatch) */}
            <Button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} className="mt-4">
                Toggle Sidebar
            </Button>
          </div>

          {/* Render the Patient Tracker Sidebar */}
          <PatientTrackerSidebar />
       </div>
    </HomeContext.Provider>
  );
};

export default App; // Export the App component for rendering

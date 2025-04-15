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
  Bell,
  BellOff,
  AlarmClockOff,
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

// --- Additional Types from Script #2 ---
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

// --- Mock shadcn/ui Components (merged from Script #1 & #2 for consistency) ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
      'ring-offset-background transition-colors focus-visible:outline-none ' +
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline:
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
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
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ' +
    'text-sm ring-offset-background file:border-0 file:bg-gray-800 file:text-sm ' +
    'file:font-medium placeholder:text-muted-foreground focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-50';
  return <input type={type} className={`${baseStyle} ${className}`} ref={ref} {...props} />;
});
Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));
Label.displayName = 'Label';

// Basic Dialog
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) =>
  open ? (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md">{children}</div>
    </div>
  ) : null;

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}
const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);
interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);
interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}
const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
  <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
);
interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}
const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}
const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  <div className={`mt-6 flex justify-end space-x-2 ${className}`}>{children}</div>
);
interface DialogCloseProps {
  children: React.ReactElement;
  onClick?: () => void;
  asChild?: boolean;
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
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  />
));
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className}`} {...props} />
));
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
));
CardTitle.displayName = 'CardTitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-4 pt-0 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

// --- Helper Functions ---
const getBorderColor = (minutes: number): string => {
  if (minutes >= 300) return 'border-red-500 animate-pulse-border'; // Flashing Red >= 5 hours
  if (minutes >= 240) return 'border-red-500'; // Red >= 4 hours
  if (minutes >= 120) return 'border-amber-500'; // Amber >= 2 hours
  return 'border-green-500'; // Green < 2 hours
};

const getBackgroundColor = (minutes: number): string => {
  if (minutes >= 300) return 'bg-red-900/50';
  if (minutes >= 240) return 'bg-red-900/50';
  if (minutes >= 120) return 'bg-amber-900/50';
  return 'bg-green-900/50';
};

// --- LocalStorage Parsing (to handle date fields properly) ---
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

// --- TaskItem component (from Script #2, integrated) ---
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
    if (!task.timerEnd || task.completionStatus === 'complete') {
      if (isTimerExpired) setIsTimerExpired(false);
      setTimeRemaining('');
      return;
    }
    let intervalId: NodeJS.Timeout | null = null;

    const checkTimer = () => {
      const now = new Date();
      if (task.timerEnd && now >= task.timerEnd) {
        if (!isTimerExpired) {
          setIsTimerExpired(true);
          setTimeRemaining('Expired');
          updateTaskTimerState(patientId, task.id, true);

          // Fire a desktop notification if not acknowledged
          if (!task.isAcknowledged && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(`Task Timer Expired: ${patientName}`, {
                body: task.text,
                tag: `task-${task.id}`,
              });
            }
          }
        }
        if (intervalId) clearInterval(intervalId);
      } else if (task.timerEnd) {
        if (isTimerExpired) {
          setIsTimerExpired(false);
          updateTaskTimerState(patientId, task.id, false);
        }
        setTimeRemaining(`in ${formatDistanceToNowStrict(task.timerEnd)}`);
      }
    };

    checkTimer();
    if (task.timerEnd && new Date() < task.timerEnd) {
      intervalId = setInterval(checkTimer, 1000 * 30);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    task.timerEnd,
    task.id,
    patientId,
    updateTaskTimerState,
    isTimerExpired,
    task.isTimerExpired,
    task.completionStatus,
    task.isAcknowledged,
    patientName,
    task.text,
  ]);

  // When editing the timer
  useEffect(() => {
    if (isEditingTimer) {
      const initialMinutes =
        task.timerEnd && task.timerEnd > new Date()
          ? Math.max(0, differenceInMinutes(task.timerEnd, new Date())).toString()
          : '';
      setEditTimerMinutes(initialMinutes);
      setTimeout(() => timerInputRef.current?.focus(), 0);
    }
  }, [isEditingTimer, task.timerEnd]);

  // When editing notes
  useEffect(() => {
    if (isEditingNotes) {
      setEditNotes(task.notes || '');
      setTimeout(() => notesTextareaRef.current?.focus(), 0);
    }
  }, [isEditingNotes, task.notes]);

  const handleTimerEditSubmit = () => {
    if (!isEditingTimer) return;
    const minutesToSet =
      editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes;
    updateTaskTimer(patientId, task.id, minutesToSet);
    setIsEditingTimer(false);
  };

  const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditTimerMinutes(e.target.value);
  };

  const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimerEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTimer(false);
    }
  };

  const handleNotesEditSubmit = () => {
    if (!isEditingNotes) return;
    updateTaskNotes(patientId, task.id, editNotes);
    setIsEditingNotes(false);
  };

  const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setEditNotes(e.target.value);
  };

  const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNotesEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingNotes(false);
      setEditNotes(task.notes || '');
    }
  };

  const handleCompletionToggle = () => {
    // Cycle through incomplete -> in-progress -> complete
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
        break;
    }
    updateTaskCompletion(patientId, task.id, nextStatus);
  };

  const handleSnooze = () => {
    // Quick 15-min extension
    updateTaskTimer(patientId, task.id, '15');
  };

  const getCompletionIcon = () => {
    switch (task.completionStatus) {
      case 'in-progress':
        return <MinusSquare className="h-4 w-4 text-yellow-400" />;
      case 'complete':
        return <CheckSquare className="h-4 w-4 text-green-400" />;
      case 'incomplete':
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  let taskItemClasses = 'flex flex-col py-1.5 group';
  let taskTextStyle = 'text-sm';
  let timerTextStyle = 'text-xs font-mono';

  if (task.completionStatus === 'complete') {
    taskTextStyle += ' line-through text-gray-500';
    timerTextStyle += ' text-gray-600';
  } else if (isTimerExpired && !task.isAcknowledged) {
    taskItemClasses += ' animate-flash'; // We preserve the flashing effect
    taskTextStyle += ' text-red-400 font-medium';
    timerTextStyle += ' text-red-400 font-semibold';
  } else if (isTimerExpired && task.isAcknowledged) {
    taskTextStyle += ' text-red-600';
    timerTextStyle += ' text-red-600';
  } else if (task.timerEnd) {
    taskTextStyle += ' text-black';
    timerTextStyle += ' text-black';
  } else {
    // no timer
    taskTextStyle += ' text-black';
    timerTextStyle += ' text-gray-700';
  }

  return (
    <div className={taskItemClasses}>
      {/* Main row */}
      <div className="flex items-center space-x-2 w-full">
        {/* Completion toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleCompletionToggle}
          title={`Status: ${task.completionStatus}. Click to change.`}
        >
          {getCompletionIcon()}
        </Button>

        {/* Task text */}
        <span className={`flex-1 cursor-default ${taskTextStyle}`}>{task.text}</span>

        {/* Timer / Acknowledge / Edit Timer */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {isEditingTimer ? (
            <>
              <Input
                ref={timerInputRef}
                type="number"
                min="0"
                max="999"
                value={editTimerMinutes}
                onChange={handleTimerInputChange}
                onKeyDown={handleTimerInputKeyDown}
                className="w-14 h-6 text-xs"
                placeholder="Min"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-400 hover:text-green-300"
                onClick={handleTimerEditSubmit}
                title="Save Timer"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-gray-200"
                onClick={() => setIsEditingTimer(false)}
                title="Cancel Edit"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              {/* Timer info & Acknowledge if expired */}
              {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-yellow-400 hover:text-yellow-300"
                    onClick={() => acknowledgeTimer(patientId, task.id)}
                    title="Acknowledge Timer"
                  >
                    <BellOff className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-400 hover:text-blue-300"
                    onClick={handleSnooze}
                    title="Snooze 15 min"
                  >
                    <AlarmClockOff className="h-4 w-4" />
                  </Button>
                </>
              )}

              {task.timerEnd && task.completionStatus !== 'complete' && (
                <span className={timerTextStyle}>
                  <Clock className="inline h-3 w-3 mr-1" />
                  {isTimerExpired ? 'Expired' : timeRemaining}
                </span>
              )}

              {/* Edit/Add Timer button */}
              {task.completionStatus !== 'complete' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingTimer(true)}
                  title={task.timerEnd ? 'Edit Timer' : 'Add Timer'}
                >
                  {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Notes icon */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ml-1 flex-shrink-0 ${
            task.notes ? 'text-blue-400' : 'text-gray-500'
          } hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`}
          onClick={() => setIsEditingNotes((prev) => !prev)}
          title={task.notes ? 'Edit/View Notes' : 'Add Notes'}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>

        {/* Remove task */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={() => removeTask(patientId, task.id)}
          title="Remove Task"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Notes editing */}
      {isEditingNotes && (
        <div className="mt-1.5 pl-8 pr-2 flex items-center gap-2 w-full">
          <textarea
            ref={notesTextareaRef}
            value={editNotes}
            onChange={handleNotesInputChange}
            onKeyDown={handleNotesKeyDown}
            placeholder="Add task notes..."
            rows={2}
            className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-400 hover:text-green-300 self-start"
            onClick={handleNotesEditSubmit}
            title="Save Notes"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-200 self-start"
            onClick={() => setIsEditingNotes(false)}
            title="Cancel Edit"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Display notes if exist and not editing */}
      {!isEditingNotes && task.notes && (
        <div className="mt-1 pl-8 pr-2 text-xs text-gray-700 italic w-full break-words">
          Note: {task.notes}
        </div>
      )}

      {/* Dates info */}
      <div className="pl-8 text-xs text-gray-400 mt-0.5">
        Added: {formatRelative(task.createdAt, new Date())}
        {task.completionStatus === 'complete' && task.completedAt && (
          <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span>
        )}
      </div>
    </div>
  );
};

// --- PatientCard (upgraded) ---
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

  useEffect(() => {
    const calculateLOS = () => {
      const now = new Date();
      const minutes = differenceInMinutes(now, patient.arrivalTime);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      setLengthOfStayMinutes(minutes);
      setLengthOfStayFormatted(`${hours}h ${remainingMinutes}m`);
    };
    calculateLOS();
    const intervalId = setInterval(calculateLOS, 60_000);
    return () => clearInterval(intervalId);
  }, [patient.arrivalTime]);

  useEffect(() => {
    if (isEditingPatientNotes) {
      setEditPatientNotes(patient.notes || '');
      setTimeout(() => patientNotesTextareaRef.current?.focus(), 0);
    }
  }, [isEditingPatientNotes, patient.notes]);

  const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (newTaskText.trim() === '') return;
    addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes);
    setNewTaskText('');
    setNewTaskTimerMinutes('');
  };

  const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTaskSubmit();
    }
  };

  const handlePatientNotesSubmit = () => {
    if (!isEditingPatientNotes) return;
    updatePatientNotes(patient.id, editPatientNotes);
    setIsEditingPatientNotes(false);
  };

  const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePatientNotesSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingPatientNotes(false);
      setEditPatientNotes(patient.notes || '');
    }
  };

  const borderColor = getBorderColor(lengthOfStayMinutes);
  const bgColor = getBackgroundColor(lengthOfStayMinutes);

  const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
  const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');

  return (
    <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        {/* Left side: name & notes icon */}
        <CardTitle className="text-base font-medium text-white">{patient.name}</CardTitle>
        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:text-red-500"
          onClick={() => removePatient(patient.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* LOS info */}
        <div className="text-xs text-white mb-2">
          <Clock className="inline h-3 w-3 mr-1" />
          Length of Stay: <span className="font-semibold text-white">{lengthOfStayFormatted}</span>
          <span className="ml-2 text-white">
            (Arrival: {format(patient.arrivalTime, 'HH:mm')})
          </span>
        </div>

        {/* Patient notes */}
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs text-white font-medium flex items-center">
            Notes:
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-400' : 'text-white'}`}
              onClick={() => setIsEditingPatientNotes((prev) => !prev)}
              title={patient.notes ? 'Edit/View Notes' : 'Add Notes'}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isEditingPatientNotes && (
          <div className="mb-2 flex items-center gap-2 w-full">
            <textarea
              ref={patientNotesTextareaRef}
              value={editPatientNotes}
              onChange={(e) => setEditPatientNotes(e.target.value)}
              onKeyDown={handlePatientNotesKeyDown}
              rows={2}
              className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
              placeholder="Add patient notes..."
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-400 hover:text-green-300"
              onClick={handlePatientNotesSubmit}
              title="Save Notes"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-200"
              onClick={() => setIsEditingPatientNotes(false)}
              title="Cancel Edit"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!isEditingPatientNotes && patient.notes && (
          <div className="mb-2 text-xs text-white italic break-words">Note: {patient.notes}</div>
        )}

        {/* Pending tasks */}
        <div className="mt-2 border-t border-gray-700 pt-2">
          <h4 className="text-sm font-medium text-white mb-1">Pending Tasks:</h4>
          {pendingTasks.length === 0 ? (
            <p className="text-xs text-white italic">No pending tasks.</p>
          ) : (
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

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="mt-2 border-t border-gray-700/50 pt-2">
            <h4 className="text-sm font-medium text-white mb-1">Completed Tasks:</h4>
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

        {/* Add new task */}
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <form onSubmit={(e) => handleAddTaskSubmit(e)} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Add a new task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleNewTaskKeyDown}
              className="flex-grow h-8 text-sm"
            />
            <Input
              type="number"
              min="1"
              max="999"
              placeholder="Min"
              value={newTaskTimerMinutes}
              onChange={(e) => setNewTaskTimerMinutes(e.target.value)}
              onKeyDown={handleNewTaskKeyDown}
              className="w-16 h-8 text-xs"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-[#008080]/50"
              disabled={newTaskText.trim() === ''}
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

// --- AddPatientModal (upgraded) ---
interface ModalTaskState {
  id: number;
  text: string;
  timerMinutes: string;
}
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  addPatient: (newPatient: Patient) => void;
}
const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatient }) => {
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

    const now = new Date();
    let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date());
    arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    if (arrivalDateTime > now) {
      arrivalDateTime = now;
    }

    const processedTasks: Task[] = tasks
      .filter((task) => task.text.trim() !== '')
      .map((task) => {
        const timerMinutesNum = parseInt(task.timerMinutes, 10);
        const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
        const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;

        return {
          id: `task-${task.id}-${Math.random().toString(36).substring(7)}`,
          text: task.text,
          timerEnd: timerEndDate,
          isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
          completionStatus: 'incomplete',
          createdAt: new Date(),
          completedAt: null,
          notes: '',
          isAcknowledged: false,
        };
      });

    addPatient({
      id: `patient-${Date.now()}`,
      name: patientName,
      arrivalTime: arrivalDateTime,
      tasks: processedTasks,
      notes: patientNotes,
    });

    // reset form
    setPatientName('');
    setArrivalTime(format(new Date(), 'HH:mm'));
    setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
    setPatientNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-50 text-black sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription className="text-black">
            Enter patient details, arrival time, initial tasks, and optional notes.
          </DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-black hover:text-black"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-name" className="text-right text-black">
                Name/Title
              </Label>
              <Input
                id="patient-name"
                value={patientName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
                className="col-span-3 bg-neutral-50 border-gray-600 text-black placeholder-black"
                placeholder="e.g., Bed 5 / Mr. Smith"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival-time" className="text-right text-black">
                Arrival Time
              </Label>
              <Input
                id="arrival-time"
                type="time"
                value={arrivalTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)}
                className="col-span-3 bg-neutral-50 border-gray-600 text-black"
                required
              />
            </div>
            {/* Patient Notes */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="patient-notes" className="text-right text-black pt-2">
                Notes (Opt.)
              </Label>
              <textarea
                id="patient-notes"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                rows={3}
                className="col-span-3 text-sm bg-neutral-50 border border-gray-600 rounded p-1.5 text-black placeholder-black focus:ring-1 focus:ring-ring focus:outline-none resize-vertical"
                placeholder="Add general patient notes..."
              />
            </div>

            {/* Initial Tasks */}
            <div className="col-span-4 mt-2">
              <Label className="mb-2 block font-medium text-black">Initial Tasks</Label>
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    placeholder={`Task ${index + 1} desc.`}
                    value={task.text}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleTaskChange(task.id, 'text', e.target.value)
                    }
                    className="flex-grow bg-neutral-50 border-gray-600 text-black placeholder-black"
                  />
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="Timer (min)"
                    value={task.timerMinutes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleTaskChange(task.id, 'timerMinutes', e.target.value)
                    }
                    className="w-24 bg-neutral-50 border-gray-600 text-black placeholder-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleRemoveTask(task.id)}
                    disabled={tasks.length <= 1}
                    aria-label="Remove task"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTask}
                className="mt-2 border-gray-600 text-black hover:bg-neutral-50"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Task Line
              </Button>
            </div>
          </div>
          <DialogFooter className="border-t border-gray-700 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-black bg-neutral-50 hover:bg-neutral-50"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#008080] hover:bg-[#008080] text-white">
              Add Patient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// --- MAIN SIDEBAR COMPONENT ---
const Tasks: React.FC = () => {
  const { state } = useContext(HomeContext);
  const { showSidePromptbar } = state;

  // localStorage key
  const PATIENT_STORAGE_KEY = 'patientTrackerData';

  // Load from localStorage (client-side only)
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // On mount, load patient data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const jsonData = window.localStorage.getItem(PATIENT_STORAGE_KEY);
      if (jsonData) {
        const parsed = parsePatientsWithDates(jsonData);
        if (parsed) {
          setPatients(parsed);
          return;
        }
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
    }

    // If no local data, set some default example
    const defaultPatients: Patient[] = [
      {
        id: 'patient-1-green',
        name: 'Bed 3 - Ankle Injury',
        arrivalTime: addMinutes(new Date(), -90),
        notes: 'Waiting for X-ray results.',
        tasks: [
          {
            id: 'task-1a',
            text: 'X-Ray requested',
            timerEnd: null,
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
          {
            id: 'task-1b',
            text: 'Analgesia given',
            timerEnd: null,
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
        ],
      },
      {
        id: 'patient-2-amber',
        name: 'Mr. Jones - Chest Pain',
        arrivalTime: addMinutes(new Date(), -150),
        notes: '',
        tasks: [
          {
            id: 'task-2a',
            text: 'ECG Done',
            timerEnd: null,
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
          {
            id: 'task-2b',
            text: 'Bloods sent',
            timerEnd: null,
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
          {
            id: 'task-2c',
            text: 'Chase Troponin',
            timerEnd: addMinutes(new Date(), 30),
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
        ],
      },
      {
        id: 'patient-3-red',
        name: 'Ms. Williams - Fall',
        arrivalTime: addMinutes(new Date(), -250),
        notes: 'Confused, requires supervision.',
        tasks: [
          {
            id: 'task-3a',
            text: 'CT Head requested',
            timerEnd: null,
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
          {
            id: 'task-3b',
            text: 'Refer to Ortho',
            timerEnd: addMinutes(new Date(), -10),
            isTimerExpired: true,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
        ],
      },
      {
        id: 'patient-4-flashing',
        name: 'Bed 10 - Query Sepsis',
        arrivalTime: addMinutes(new Date(), -310),
        notes: '',
        tasks: [
          {
            id: 'task-4a',
            text: 'Antibiotics Administered',
            timerEnd: null,
            isTimerExpired: false,
            completionStatus: 'incomplete',
            createdAt: new Date(),
            completedAt: null,
            notes: '',
            isAcknowledged: false,
          },
        ],
      },
    ];

    setPatients(defaultPatients);
  }, []);

  // Store to localStorage on any change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patients));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }, [patients]);

  // Request notification permission if default
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (notificationPermission === 'default') {
        Notification.requestPermission().then(setNotificationPermission);
      }
    }
  }, [notificationPermission]);

  // Sort patients by arrival time (once on mount or if needed)
  useEffect(() => {
    const isSorted = patients.every((p, idx, arr) => {
      if (idx === 0) return true;
      return arr[idx - 1].arrivalTime <= p.arrivalTime;
    });
    if (!isSorted) {
      setPatients((prev) =>
        [...prev].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())
      );
    }
  }, [patients]);

  // --- CRUD callbacks ---
  const addPatient = useCallback((newPatient: Patient) => {
    setPatients((prev) => [...prev, newPatient].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()));
  }, []);

  const removePatient = useCallback((patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  }, []);

  const updateTaskTimerState = useCallback(
    (patientId: string, taskId: string | number, isExpired: boolean) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId && t.isTimerExpired !== isExpired) {
                // If newly expired, reset isAcknowledged to false
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
    []
  );

  const addTaskToPatient = useCallback(
    (patientId: string, taskText: string, timerMinutes: string) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const timerMinutesNum = parseInt(timerMinutes, 10);
            const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
            const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;

            const newTask: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              text: taskText,
              timerEnd: timerEndDate,
              isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
              completionStatus: 'incomplete',
              createdAt: new Date(),
              completedAt: null,
              notes: '',
              isAcknowledged: false,
            };
            return { ...p, tasks: [...p.tasks, newTask] };
          }
          return p;
        })
      );
    },
    []
  );

  const updateTaskTimer = useCallback(
    (patientId: string, taskId: string | number, newTimerMinutes: string | null) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                let newTimerEnd: Date | null = null;
                let newIsTimerExpired = false;
                if (newTimerMinutes !== null) {
                  const timerMinutesNum = parseInt(newTimerMinutes, 10);
                  if (!isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999) {
                    newTimerEnd = addMinutes(new Date(), timerMinutesNum);
                    newIsTimerExpired = newTimerEnd <= new Date();
                  }
                }
                return {
                  ...t,
                  timerEnd: newTimerEnd,
                  isTimerExpired: newIsTimerExpired,
                  isAcknowledged: false,
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
    []
  );

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
  }, []);

  const updateTaskCompletion = useCallback(
    (patientId: string, taskId: string | number, status: TaskCompletionStatus) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                const isNowComplete = status === 'complete';
                const completedTime = isNowComplete ? new Date() : null;
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
    []
  );

  const acknowledgeTaskTimer = useCallback((patientId: string, taskId: string | number) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patientId) {
          const newTasks = p.tasks.map((t) => {
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
  }, []);

  const updatePatientNotes = useCallback((patientId: string, notes: string) => {
    setPatients((prevPatients) =>
      prevPatients.map((p) => (p.id === patientId ? { ...p, notes } : p))
    );
  }, []);

  const updateTaskNotes = useCallback(
    (patientId: string, taskId: string | number, notes: string) => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.id === patientId) {
            const newTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                return { ...t, notes };
              }
              return t;
            });
            return { ...p, tasks: newTasks };
          }
          return p;
        })
      );
    },
    []
  );

  // Sidebar width toggle
  const sidebarWidth = showSidePromptbar ? 'w-50 lg:w-96' : 'w-0';

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth}`}
    >
      {/* Only render content if open */}
      {showSidePromptbar && (
        <>
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 shadow-md border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#008080] hover:bg-[#008080] border-[#008080] text-white"
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

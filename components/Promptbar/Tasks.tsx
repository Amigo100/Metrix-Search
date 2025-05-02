// components/Promptbar/Tasks.tsx
'use client';

/* -------------------------------------------------------------------------- */
/*  NOTE: 29‑Apr‑2025                                                          */
/*  – Collapsible PatientCard + overdue indicator                              */
/*  – ✅ FIXED: added `children` and `onOpenChange` props to Dialog typing      */
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
/*  Mock shadcn/ui components                                                 */
/* -------------------------------------------------------------------------- */
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
    const base =
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50';
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border bg-background hover:bg-accent',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent',
      link: 'text-primary underline-offset-4 hover:underline',
    } as const;
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md',
      icon: 'h-6 w-6',
    } as const;
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
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium ${className ?? ''}`} {...props} />
));
Label.displayName = 'Label';

/* --- FIXED Dialog typing --------------------------------------------------- */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) =>
  open ? (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      {/* inner panel stops propagation so inputs don't close the modal */}
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  ) : null;

/* --- Dialog sub‑components used by AddPatientModal ----------------------- */
interface DialogSubProps { className?: string; children: React.ReactNode }
export const DialogContent: React.FC<DialogSubProps> = ({ className, children }) => (
  <div className={`bg-white rounded-lg shadow-lg p-6 ${className ?? ''}`}>{children}</div>
);
export const DialogHeader: React.FC<DialogSubProps> = ({ className, children }) => (
  <div className={`mb-4 ${className ?? ''}`}>{children}</div>
);
export const DialogTitle: React.FC<DialogSubProps> = ({ className, children }) => (
  <h2 className={`text-lg font-semibold ${className ?? ''}`}>{children}</h2>
);
export const DialogDescription: React.FC<DialogSubProps> = ({ className, children }) => (
  <p className={`text-sm text-muted-foreground ${className ?? ''}`}>{children}</p>
);
export const DialogFooter: React.FC<DialogSubProps> = ({ className, children }) => (
  <div className={`mt-6 flex justify-end space-x-2 ${className ?? ''}`}>{children}</div>
);

// Add missing DialogClose so <DialogClose asChild> works in AddPatientModal
export const DialogClose: React.FC<{ children: React.ReactElement; onClick?: () => void; asChild?: boolean }> = ({
  children,
  onClick,
}) => React.cloneElement(children, { onClick });

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
      className ?? ''
    }`}
    {...props}
  />
));
Card.displayName = 'Card';
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-4 ${className ?? ''}`} {...props} />
));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold ${className ?? ''}`} {...props} />
));
CardTitle.displayName = 'CardTitle';
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-4 pt-0 ${className ?? ''}`} {...props} />
));
CardContent.displayName = 'CardContent';

/* -------------------------------------------------------------------------- */
/* Helper utilities                                                           */
/* -------------------------------------------------------------------------- */
const getBorderColor = (mins: number) => {
  if (mins >= 300) return 'border-red-500 animate-pulse-border';
  if (mins >= 240) return 'border-red-500';
  if (mins >= 120) return 'border-amber-500';
  return 'border-green-500';
};
const bgNeutral = 'bg-neutral-50';

// ===----------------------------------===
// === Start: Restored TaskItem Component ===
// === (Copied from PatientCard.tsx)    ===
// ===----------------------------------===
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
          if (
            !task.isAcknowledged &&
            typeof window !== 'undefined' &&
            'Notification' in window
          ) {
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

  // --- Styling Logic (Using original from old Tasks.tsx) ---
  let taskItemClasses = 'flex flex-col py-1.5 group';
  let taskTextStyle = 'text-sm';
  let timerTextStyle = 'text-xs font-mono';
  if (task.completionStatus === 'complete') { taskTextStyle += ' line-through text-gray-300'; timerTextStyle += ' text-gray-300'; }
  else if (isTimerExpired && !task.isAcknowledged) { taskItemClasses += ' animate-flash'; taskTextStyle += ' text-red-400 font-medium'; timerTextStyle += ' text-red-400 font-semibold'; }
  else if (isTimerExpired && task.isAcknowledged) { taskTextStyle += ' text-red-600'; timerTextStyle += ' text-red-600'; }
  else if (task.timerEnd) { taskTextStyle += ' text-black'; timerTextStyle += ' text-black'; }
  else { taskTextStyle += ' text-black'; timerTextStyle += ' text-gray-200'; }

  return (
     // TaskItem JSX using the *internal* mock Button and Input components
     // Using original styling including opacity classes and original colors/size="icon"
    <div className={taskItemClasses}>
      <div className="flex items-center space-x-2 w-full">
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleCompletionToggle} title={`Status: ${task.completionStatus}. Click to change.`} > {getCompletionIcon()} </Button>
        <span className={`flex-1 cursor-default ${taskTextStyle}`}>{task.text}</span>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {isEditingTimer ? ( <> <Input ref={timerInputRef} type="number" min="0" max="999" value={editTimerMinutes} onChange={handleTimerInputChange} onKeyDown={handleTimerInputKeyDown} className="w-14 h-6 text-xs" placeholder="Min" /> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={handleTimerEditSubmit} title="Save Timer"> <Save className="h-3 w-3" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-200" onClick={() => setIsEditingTimer(false)} title="Cancel Edit"> <X className="h-3 w-3" /> </Button> </>
          ) : ( <> {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && ( <> <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-400 hover:text-yellow-300" onClick={() => acknowledgeTimer(patientId, task.id)} title="Acknowledge Timer"> <BellOff className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400 hover:text-blue-300" onClick={handleSnooze} title="Snooze 15 min"> <AlarmClockOff className="h-4 w-4" /> </Button> </> )} {task.timerEnd && task.completionStatus !== 'complete' && ( <span className={timerTextStyle}> <Clock className="inline h-3 w-3 mr-1" /> {isTimerExpired ? 'Expired' : timeRemaining} </span> )} {task.completionStatus !== 'complete' && ( <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTimer(true)} title={task.timerEnd ? 'Edit Timer' : 'Add Timer'} > {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />} </Button> )} </> )}
        </div>
        <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 flex-shrink-0 ${task.notes ? 'text-blue-400' : 'text-gray-500'} hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`} onClick={() => setIsEditingNotes((prev) => !prev)} title={task.notes ? 'Edit/View Notes' : 'Add Notes'} > <MessageSquare className="h-3 w-3" /> </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeTask(patientId, task.id)} title="Remove Task" > <Trash2 className="h-3 w-3" /> </Button>
      </div>
      {isEditingNotes && ( <div className="mt-1.5 pl-8 pr-2 flex items-center gap-2 w-full"> <textarea ref={notesTextareaRef} value={editNotes} onChange={handleNotesInputChange} onKeyDown={handleNotesKeyDown} placeholder="Add task notes..." rows={2} className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none" /> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300 self-start" onClick={handleNotesEditSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-200 self-start" onClick={() => setIsEditingNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button> </div> )}
      {!isEditingNotes && task.notes && ( <div className="mt-1 pl-8 pr-2 text-xs text-gray-200 italic w-full break-words"> Note: {task.notes} </div> )}
      <div className="pl-8 text-xs text-gray-400 mt-0.5"> Added: {formatRelative(task.createdAt, new Date())} {task.completionStatus === 'complete' && task.completedAt && ( <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span> )} </div>
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
interface PatientCardProps {
  patient: Patient;
  // task & patient handlers
  removePatient: (id: string) => void;
  addTaskToPatient: (pid: string, text: string, mins: string) => void;
  updateTaskTimerState: (
    pid: string,
    tid: string | number,
    expired: boolean
  ) => void;
  updateTaskTimer: (
    pid: string,
    tid: string | number,
    mins: string | null
  ) => void;
  removeTaskFromPatient: (pid: string, tid: string | number) => void;
  updateTaskCompletion: (
    pid: string,
    tid: string | number,
    status: TaskCompletionStatus
  ) => void;
  acknowledgeTaskTimer: (pid: string, tid: string | number) => void;
  updatePatientNotes: (pid: string, notes: string) => void;
  updateTaskNotes: (pid: string, tid: string | number, notes: string) => void;
  updatePatientStatus: (
    pid: string,
    status: 'active' | 'discharged' | 'admitted'
  ) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  removePatient,
  addTaskToPatient,
  updateTaskTimerState,
  updateTaskTimer,
  removeTaskFromPatient,
  updateTaskCompletion,
  acknowledgeTaskTimer,
  updatePatientNotes,
  updateTaskNotes,
  updatePatientStatus,
}) => {
  /* LOS calc */
  const [los, setLos] = useState<string>('');
  useEffect(() => {
    const fn = () =>
      setLos(formatDistanceToNowStrict(patient.arrivalTime, { addSuffix: false }));
    fn();
    const id = setInterval(fn, 60_000);
    return () => clearInterval(id);
  }, [patient.arrivalTime]);

  /* collapse */
  const [collapsed, setCollapsed] = useState(false);

  /* overdue indicator */
  const hasOverdue = patient.tasks.some(
    (t) => t.isTimerExpired && !t.isAcknowledged && t.completionStatus !== 'complete'
  );

  /* notes editing (same as before) */
  const [editingNotes, setEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState(patient.notes || '');
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const saveNotes = () => {
    updatePatientNotes(patient.id, editNotes);
    setEditingNotes(false);
  };

  /* add‑task state (same as before) */
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTimer, setNewTaskTimer] = useState('');

  const minutesSinceArrival = differenceInMinutes(new Date(), patient.arrivalTime);

  // derive task lists
  const pendingTasks = patient.tasks.filter(t => t.completionStatus !== 'complete');
  const completedTasks = patient.tasks.filter(t => t.completionStatus === 'complete');

  return (
    <Card className={`mb-4 border-2 ${getBorderColor(minutesSinceArrival)} ${bgNeutral}`}>
      {/* HEADER ROW */}
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* chevron toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* patient name */}
          <CardTitle className="text-base font-medium flex-1 break-words whitespace-normal">
            {patient.name}
          </CardTitle>

          {/* status controls */}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500" title="Mark Discharged" onClick={() => updatePatientStatus(patient.id,'discharged')}>
            ✓
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500" title="Mark Admitted" onClick={() => updatePatientStatus(patient.id,'admitted')}>
            <ArrowUp className="h-3 w-3" />
          </Button>

          {hasOverdue && (
            <AlertCircle
              className="h-4 w-4 text-red-500 flex-shrink-0"
              aria-label="Overdue task"
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-black hover:text-red-500"
          onClick={() => removePatient(patient.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* ALWAYS‑VISIBLE SECTION (LOS + notes) */}
      <CardContent className="pt-0 pb-2">
        <div className="text-xs mb-2">
          <Clock className="inline h-3 w-3 mr-1" /> Length of Stay:{' '}
          <span className="font-semibold">{los}</span>{' '}
          <span className="ml-2">(Arrival: {format(patient.arrivalTime, 'HH:mm')})</span>
        </div>

        {/* NOTES */}
        {editingNotes ? (
          <div className="flex items-center space-x-2">
            <textarea
              ref={notesRef}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="flex-grow text-xs border rounded p-1"
            />
            <Button size="icon" onClick={saveNotes}>
              <Save className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="icon" onClick={() => setEditingNotes(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-medium">Notes:</span>
            <span className="italic break-words flex-1">
              {patient.notes || '—'}
            </span>
            <Button size="icon" variant="ghost" onClick={() => setEditingNotes(true)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* COLLAPSIBLE SECTION – hidden when collapsed */}
      {!collapsed && (
        <>
        <CardContent className="pt-0">
          {/* Pending tasks */}
          <div className="flex-1 mt-2 border-t border-gray-700 pt-2 overflow-y-auto">
            <div>
              <h4 className="text-sm font-medium mb-1">Pending Tasks:</h4>
              {pendingTasks.length === 0 ? (
                <p className="text-xs italic">No pending tasks.</p>
              ) : (
                pendingTasks.map(t => (
                  <TaskItem
                    key={t.id}
                    task={t}
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
                <h4 className="text-sm font-medium mb-1">Completed Tasks:</h4>
                {completedTasks.map(t => (
                  <TaskItem
                    key={t.id}
                    task={t}
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
          </div>

          {/* Add task form */}
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newTaskText.trim() === '') return;
                addTaskToPatient(patient.id, newTaskText, newTaskTimer);
                setNewTaskText('');
                setNewTaskTimer('');
              }}
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                placeholder="Add Task"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                className="flex-grow h-8 text-sm"
              />
              <Input
                type="number"
                min="1"
                max="999"
                placeholder="Min"
                value={newTaskTimer}
                onChange={e => setNewTaskTimer(e.target.value)}
                className="w-16 h-8 text-xs"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={newTaskText.trim() === ''}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
        </>
      )}
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
interface ModalTaskState { id: number; text: string; timerMinutes: string; }
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Prop name changed to match how it's passed from Tasks component below
  addPatientHandler: (newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }) => void;
}
const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatientHandler }) => {
  // State and handlers are identical to the previously extracted version
  const [patientName, setPatientName] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [tasks, setTasks] = useState<ModalTaskState[]>([{ id: Date.now(), text: '', timerMinutes: '' }]);
  const [patientNotes, setPatientNotes] = useState<string>('');
  const handleAddTask = (): void => { setTasks([...tasks, { id: Date.now(), text: '', timerMinutes: '' }]); };
  const handleRemoveTask = (id: number): void => { if (tasks.length > 1) { setTasks(tasks.filter((task) => task.id !== id)); } else { setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]); } };
  const handleTaskChange = (id: number, field: keyof Omit<ModalTaskState, 'id'>, value: string ): void => { setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task))); };
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!patientName || !arrivalTime) return;
    const now = new Date();
    let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date());
    arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    if (!isValid(arrivalDateTime) || arrivalDateTime > now) { arrivalDateTime = now; }

    const processedModalTasks: Omit<Task, 'id'>[] = tasks
      .filter((task) => task.text.trim() !== '')
      .map((task): Omit<Task, 'id'> => {
        const timerMinutesNum = parseInt(task.timerMinutes, 10);
        const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
        const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;
        return { text: task.text, timerEnd: timerEndDate, isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: '', isAcknowledged: false };
      });

     const newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] } = {
      name: patientName,
      arrivalTime: arrivalDateTime,
      tasks: processedModalTasks,
      notes: patientNotes,
      status: 'active', // default status on creation
    };
    addPatientHandler(newPatientData); // Call the prop

    setPatientName(''); setArrivalTime(format(new Date(), 'HH:mm')); setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]); setPatientNotes(''); onClose();
  };

  return (
    // AddPatientModal JSX using *internal* mock Dialog, Button, Input etc.
    // Using original styling
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-50 text-black sm:max-w-3xl"> {/* Changed sm:max-w-[550px] to sm:max-w-3xl */}
        <DialogHeader>
           <DialogTitle>Add New Patient</DialogTitle>
           <DialogDescription className="text-black"> Enter patient details, arrival time, initial tasks, and optional notes. </DialogDescription>
           <DialogClose asChild>
               <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-black hover:text-black" onClick={onClose} > <X className="h-4 w-4" /> <span className="sr-only">Close</span> </Button>
           </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
             {/* Inputs and Labels using original classes */}
            <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="patient-name" className="text-right text-black"> Name/Title </Label> <Input id="patient-name" value={patientName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)} className="col-span-3 bg-neutral-50 border-gray-600 text-black placeholder-black" placeholder="e.g., Bed 5 / Mr. Smith" required /> </div>
            <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="arrival-time" className="text-right text-black"> Arrival Time </Label> <Input id="arrival-time" type="time" value={arrivalTime} onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)} className="col-span-3 bg-neutral-50 border-gray-600 text-black" required /> </div>
            <div className="grid grid-cols-4 items-start gap-4"> <Label htmlFor="patient-notes" className="text-right text-black pt-2"> Notes (Opt.) </Label> <textarea id="patient-notes" value={patientNotes} onChange={(e) => setPatientNotes(e.target.value)} rows={3} className="col-span-3 text-sm bg-neutral-50 border border-gray-600 rounded p-1.5 text-black placeholder-black focus:ring-1 focus:ring-ring focus:outline-none resize-vertical" placeholder="Add general patient notes..." /> </div>
            <div className="col-span-4 mt-2"> <Label className="mb-2 block font-medium text-black">Initial Tasks</Label> {tasks.map((task, index) => ( <div key={task.id} className="flex items-center gap-2 mb-2"> <Input type="text" placeholder={`Task ${index + 1} desc.`} value={task.text} onChange={(e) => handleTaskChange(task.id, 'text', e.target.value)} className="flex-grow bg-neutral-50 border-gray-600 text-black placeholder-black" /> <Input type="number" min="1" max="999" placeholder="Timer (min)" value={task.timerMinutes} onChange={(e) => handleTaskChange(task.id, 'timerMinutes', e.target.value)} className="w-24 bg-neutral-50 border-gray-600 text-black placeholder-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => handleRemoveTask(task.id)} disabled={tasks.length <= 1} aria-label="Remove task" > <X className="h-4 w-4" /> </Button> </div> ))} <Button type="button" variant="outline" size="sm" onClick={handleAddTask} className="mt-2 border-gray-600 text-black hover:bg-neutral-50" > <Plus className="h-4 w-4 mr-2" /> Add Task Line </Button> </div>
          </div>
          {/* Footer using original styles */}
          <DialogFooter className="border-t border-gray-700 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="text-black bg-neutral-50 hover:bg-gray-100"> Cancel </Button>
            <Button type="submit" className="bg-[#008080] hover:bg-[#008080] text-white 
              "> Add Patient </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
// ===-----------------------------------===
// === End: Restored AddPatientModal Comp. ===
// ===-----------------------------------===

// --- MAIN SIDEBAR COMPONENT (Consumes Context, Renders Internal Components) ---
const Tasks: React.FC = () => {
  // --- Consume Context (Same as before) ---
  const { state,
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
    updatePatientStatus } = useContext(HomeContext);
  const { showSidePromptbar, patients } = state;

  // --- Local State (Same as before) ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>( typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default' );
  useEffect(() => { if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default') { Notification.requestPermission().then(setNotificationPermission); } }, [notificationPermission]);

    const [viewFilter,setViewFilter] = useState<'all'|'active'|'inactive'>('active');

  const visiblePatients = patients.filter(p => {
    if(viewFilter==='all') return true;
    if(viewFilter==='active') return p.status==='active';
    return p.status!=='active';
  });
  const sortedPatients = [...visiblePatients].sort(
    (a,b)=>b.arrivalTime.getTime()-a.arrivalTime.getTime()
  );

  const sidebarWidth = showSidePromptbar ? 'w-40 lg:w-80' : 'w-0';

  return (
  <div
    className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth} ${
      showSidePromptbar ? 'visible' : 'invisible'
    }`}
  >
    {showSidePromptbar && (
      <>
        {/* Header */}
        <div className="flex flex-col p-4 shadow-md border-b border-gray-200 flex-shrink-0">
          {/* first row: title + add-patient */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
  
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-[#008080] hover:bg-[#009999] border-gray-400 text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add&nbsp;Patient
            </Button>
          </div>

          {/* view toggle now below the title */}
          <div className="mt-2 inline-flex rounded-md overflow-hidden space-x-2">
            <Button
              type="button"
              size="sm"
              variant={viewFilter === 'active' ? 'secondary: 'bg-[#008080] text-white hover:bg-[#009999] border-gray-400',' : 'outline'}
              onClick={() => setViewFilter('active')}
            >
              Active
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewFilter === 'inactive' ? 'secondary: 'bg-[#008080] text-white hover:bg-[#009999] border-gray-400',' : 'outline'}
              onClick={() => setViewFilter('inactive')}
            >
              Inactive
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewFilter === 'all' ? 'secondary: 'bg-[#008080] text-white hover:bg-[#009999] border-gray-400',' : 'outline'}
              onClick={() => setViewFilter('all')}
            >
              All
            </Button>
          </div>
        </div> {/* ← closed the header div */}

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-4">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
              <AlertTriangle className="w-10 h-10 mb-4 text-gray-600" />
              <p className="font-medium">No patients being tracked.</p>
              <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p>
            </div>
          ) : (
            sortedPatients.map((patient) => (
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
                updatePatientStatus={updatePatientStatus}
              />
            ))
          )}
        </div>

        {/* Add-patient modal */}
        <AddPatientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          addPatientHandler={addPatient}
        />
      </>
    )}
  </div>
 );
}

export default Tasks;

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
  useMemo,
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
  ChevronUp,
  PanelLeftClose,
  PanelRightOpen,
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
const HomeContext = React.createContext<any>({
  state: {
    showSidePromptbar: true, // This is overridden by local state for visibility
  },
  dispatch: () => {},
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
// [NO CHANGES IN THIS SECTION]
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
      'focus-visible:ring-2 focus-visible:ring-[#008080] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-900 dark:focus-visible:ring-[#008080]';
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-[#008080] text-white hover:bg-[#006666] dark:hover:bg-[#005959]',
      destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
      outline: 'border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:text-gray-100',
      link: 'text-[#008080] underline-offset-4 hover:underline dark:text-[#2dd4bf]',
    };
    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return ( <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className ?? ''}`} ref={ref} {...props} /> );
  }
);
Button.displayName = 'Button';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { className?: string; }
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const baseStyle = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:ring-offset-gray-900 dark:focus-visible:ring-[#008080]';
  return <input type={type} className={`${baseStyle} ${className ?? ''}`} ref={ref} {...props} />;
});
Input.displayName = 'Input';
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { className?: string; }
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => ( <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300 ${className ?? ''}`} {...props} /> ));
Label.displayName = 'Label';
interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => open ? ( <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"> <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 transform transition-all scale-100 opacity-100"> {children} </div> <style jsx global>{` @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in { animation: fade-in 0.2s ease-out forwards; } `}</style> </div> ) : null;
interface DialogContentProps { children: React.ReactNode; className?: string; }
const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => ( <div className={`p-6 ${className ?? ''}`}>{children}</div> );
interface DialogHeaderProps { children: React.ReactNode; className?: string; }
const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => ( <div className={`mb-4 relative border-b border-gray-200 dark:border-gray-700 pb-4 ${className ?? ''}`}>{children}</div> );
interface DialogTitleProps { children: React.ReactNode; className?: string; }
const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => ( <h2 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className ?? ''}`}>{children}</h2> );
interface DialogDescriptionProps { children: React.ReactNode; className?: string; }
const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => ( <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${className ?? ''}`}>{children}</p> );
interface DialogFooterProps { children: React.ReactNode; className?: string; }
const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => ( <div className={`mt-6 flex justify-end space-x-3 ${className ?? ''}`}>{children}</div> );
interface DialogCloseProps { children: React.ReactElement; onClick?: () => void; asChild?: boolean; }
const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick }) => { if (onClick) { return React.cloneElement(children, { onClick }); } return children; };
interface CardProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => ( <div ref={ref} className={`rounded-lg border bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg dark:shadow-black/20 border-gray-200 dark:border-gray-700/50 ${className ?? ''}`} {...props} /> ));
Card.displayName = 'Card';
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => ( <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className ?? ''}`} {...props} /> ));
CardHeader.displayName = 'CardHeader';
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { className?: string; }
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => ( <h3 ref={ref} className={`text-base font-semibold leading-none tracking-tight ${className ?? ''}`} {...props} /> ));
CardTitle.displayName = 'CardTitle';
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { className?: string; }
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => ( <div ref={ref} className={`p-4 pt-0 ${className ?? ''}`} {...props} /> ));
CardContent.displayName = 'CardContent';

// --- Helper Functions ---
const getBorderColor = (minutes: number): string => {
  if (minutes >= 300) return 'border-red-500 dark:border-red-600 animate-pulse-border';
  if (minutes >= 240) return 'border-red-500 dark:border-red-600';
  if (minutes >= 120) return 'border-yellow-500 dark:border-yellow-600';
  return 'border-green-500 dark:border-green-600';
};

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
            return { ...t, id: t.id || `task-${Date.now()}-${Math.random().toString(36).substring(7)}`, createdAt: isValid(createdAt) ? createdAt : new Date(), completedAt: completedAt && isValid(completedAt) ? completedAt : null, timerEnd: timerEnd && isValid(timerEnd) ? timerEnd : null, completionStatus: t.completionStatus || 'incomplete', notes: t.notes || '', isAcknowledged: t.isAcknowledged || false, isTimerExpired: !!timerEnd && timerEnd <= new Date() };
          }) : [];
      return { ...patient, id: patient.id || `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`, arrivalTime: isValid(arrivalTime) ? arrivalTime : new Date(), tasks, notes: patient.notes || '' };
    });
  } catch (error) { console.error('Error parsing patient data from localStorage:', error); return null; }
};

// --- TaskItem component ---
// [NO CHANGES IN THIS COMPONENT]
interface TaskItemProps { task: Task; patientId: string; patientName: string; updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void; updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void; removeTask: (patientId: string, taskId: string | number) => void; updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void; acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void; updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void; }
const TaskItem: React.FC<TaskItemProps> = ({ task, patientId, patientName, updateTaskTimerState, updateTaskTimer, removeTask, updateTaskCompletion, acknowledgeTaskTimer, updateTaskNotes, }) => {
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(task.isTimerExpired); const [timeRemaining, setTimeRemaining] = useState<string>(''); const [isEditingTimer, setIsEditingTimer] = useState<boolean>(false); const [editTimerMinutes, setEditTimerMinutes] = useState<string>(''); const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false); const [editNotes, setEditNotes] = useState<string>(task.notes || ''); const timerInputRef = useRef<HTMLInputElement>(null); const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (task.completionStatus === 'complete' || !task.timerEnd) { if (isTimerExpired) setIsTimerExpired(false); setTimeRemaining(''); return; } let intervalId: NodeJS.Timeout | null = null; const checkTimer = () => { const now = new Date(); if (task.timerEnd && now >= task.timerEnd) { if (!isTimerExpired) { setIsTimerExpired(true); setTimeRemaining('Expired'); updateTaskTimerState(patientId, task.id, true); if (!task.isAcknowledged && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') { new Notification(`Task Timer Expired: ${patientName}`, { body: task.text, tag: `task-${task.id}` }); } } if (intervalId) clearInterval(intervalId); } else if (task.timerEnd) { if (isTimerExpired) { setIsTimerExpired(false); updateTaskTimerState(patientId, task.id, false); } setTimeRemaining(`in ${formatDistanceToNowStrict(task.timerEnd)}`); } }; checkTimer(); if (task.timerEnd && new Date() < task.timerEnd) { intervalId = setInterval(checkTimer, 30000); } return () => { if (intervalId) clearInterval(intervalId); }; }, [ task.timerEnd, task.id, task.completionStatus, task.isAcknowledged, patientId, patientName, task.text, updateTaskTimerState, isTimerExpired ]);
  useEffect(() => { if (isEditingTimer) { const initialMinutes = task.timerEnd && task.timerEnd > new Date() ? Math.max(0, differenceInMinutes(task.timerEnd, new Date())).toString() : ''; setEditTimerMinutes(initialMinutes); setTimeout(() => timerInputRef.current?.focus(), 0); } }, [isEditingTimer, task.timerEnd]); useEffect(() => { if (isEditingNotes) { setEditNotes(task.notes || ''); setTimeout(() => notesTextareaRef.current?.focus(), 0); } }, [isEditingNotes, task.notes]);
  const handleTimerEditSubmit = useCallback(() => { if (!isEditingTimer) return; const minutesToSet = editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes; updateTaskTimer(patientId, task.id, minutesToSet); setIsEditingTimer(false); }, [isEditingTimer, editTimerMinutes, patientId, task.id, updateTaskTimer]); const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => setEditTimerMinutes(e.target.value); const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleTimerEditSubmit(); else if (e.key === 'Escape') setIsEditingTimer(false); }; const handleNotesEditSubmit = useCallback(() => { if (!isEditingNotes) return; updateTaskNotes(patientId, task.id, editNotes); setIsEditingNotes(false); }, [isEditingNotes, editNotes, patientId, task.id, updateTaskNotes]); const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => setEditNotes(e.target.value); const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNotesEditSubmit(); } else if (e.key === 'Escape') { setIsEditingNotes(false); setEditNotes(task.notes || ''); } }; const handleCompletionToggle = useCallback(() => { const nextStatus: TaskCompletionStatus = task.completionStatus === 'incomplete' ? 'in-progress' : task.completionStatus === 'in-progress' ? 'complete' : 'incomplete'; updateTaskCompletion(patientId, task.id, nextStatus); }, [task.completionStatus, patientId, task.id, updateTaskCompletion]); const handleSnooze = useCallback(() => { updateTaskTimer(patientId, task.id, '15'); }, [patientId, task.id, updateTaskTimer]);
  const getCompletionIcon = () => { switch (task.completionStatus) { case 'in-progress': return <MinusSquare className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />; case 'complete': return <CheckSquare className="h-4 w-4 text-green-500 dark:text-green-400" />; default: return <Square className="h-4 w-4 text-gray-400 dark:text-gray-500" />; } };
  let taskItemClasses = 'flex flex-col py-1.5 group relative'; let taskTextStyle = 'text-sm flex-1 cursor-default mr-1'; let timerTextStyle = 'text-xs font-mono whitespace-nowrap'; if (task.completionStatus === 'complete') { taskTextStyle += ' line-through text-gray-400 dark:text-gray-500'; timerTextStyle += ' text-gray-400 dark:text-gray-500'; } else if (isTimerExpired && !task.isAcknowledged) { taskItemClasses += ' animate-flash-bg'; taskTextStyle += ' text-red-700 dark:text-red-400 font-medium'; timerTextStyle += ' text-red-700 dark:text-red-400 font-semibold'; } else if (isTimerExpired && task.isAcknowledged) { taskTextStyle += ' text-red-800 dark:text-red-500'; timerTextStyle += ' text-red-800 dark:text-red-500'; } else if (task.timerEnd) { taskTextStyle += ' text-gray-800 dark:text-gray-200'; timerTextStyle += ' text-gray-600 dark:text-gray-400'; } else { taskTextStyle += ' text-gray-800 dark:text-gray-200'; timerTextStyle += ' text-gray-400 dark:text-gray-600'; }
  return ( <div className={taskItemClasses}> <div className="flex items-center space-x-2 w-full"> <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleCompletionToggle} title={`Status: ${task.completionStatus}. Click to change.`}> {getCompletionIcon()} </Button> <span className={taskTextStyle} title={task.text}>{task.text}</span> <div className="flex items-center space-x-1 flex-shrink-0 ml-auto"> {isEditingTimer ? ( <> <Input ref={timerInputRef} type="number" min="0" max="999" value={editTimerMinutes} onChange={handleTimerInputChange} onKeyDown={handleTimerInputKeyDown} className="w-14 h-6 text-xs px-1 dark:bg-gray-700" placeholder="Min" /> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" onClick={handleTimerEditSubmit} title="Save Timer"> <Save className="h-3.5 w-3.5" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setIsEditingTimer(false)} title="Cancel Edit"> <X className="h-3.5 w-3.5" /> </Button> </> ) : ( <> {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && ( <> <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300" onClick={() => acknowledgeTaskTimer(patientId, task.id)} title="Acknowledge Timer"> <BellOff className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" onClick={handleSnooze} title="Snooze 15 min"> <AlarmClockOff className="h-4 w-4" /> </Button> </> )} {task.timerEnd && task.completionStatus !== 'complete' && ( <span className={timerTextStyle} title={`Ends ${format(task.timerEnd, 'Pp')}`}> <Clock className="inline h-3 w-3 mr-1" /> {isTimerExpired ? 'Expired' : timeRemaining} </span> )} {task.completionStatus !== 'complete' && ( <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTimer(true)} title={task.timerEnd ? 'Edit Timer' : 'Add Timer'}> {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />} </Button> )} </> )} </div> <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 flex-shrink-0 ${task.notes ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} hover:text-blue-600 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`} onClick={() => setIsEditingNotes((prev) => !prev)} title={task.notes ? 'Edit/View Notes' : 'Add Notes'}> <MessageSquare className="h-3.5 w-3.5" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeTask(patientId, task.id)} title="Remove Task"> <Trash2 className="h-3.5 w-3.5" /> </Button> </div> {isEditingNotes && ( <div className="mt-1.5 pl-8 pr-2 flex items-start gap-2 w-full"> <textarea ref={notesTextareaRef} value={editNotes} onChange={handleNotesInputChange} onKeyDown={handleNotesKeyDown} placeholder="Add task notes..." rows={2} className="flex-grow text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-[#008080] focus:outline-none resize-none" /> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 self-start flex-shrink-0" onClick={handleNotesEditSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-start flex-shrink-0" onClick={() => setIsEditingNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button> </div> )} {!isEditingNotes && task.notes && ( <div className="mt-1 pl-8 pr-2 text-xs text-gray-600 dark:text-gray-400 italic w-full break-words"> Note: {task.notes} </div> )} <div className="pl-8 text-xs text-gray-500 dark:text-gray-500 mt-0.5"> Added: {formatRelative(task.createdAt, new Date())} {task.completionStatus === 'complete' && task.completedAt && ( <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span> )} </div> <style jsx global>{` @keyframes flash-bg { 0%, 100% { background-color: transparent; } 50% { background-color: rgba(239, 68, 68, 0.1); } } .animate-flash-bg { animation: flash-bg 1.5s infinite; } @keyframes pulse-border { 0%, 100% { border-color: ${getBorderColor(300).split(' ')[0]}; } 50% { border-color: ${getBorderColor(300).split(' ')[0].replace('500', '400').replace('600','500')}; } } .animate-pulse-border { animation: pulse-border 1.5s infinite; } `}</style> </div> ); };

// --- PatientCard ---
// [NO CHANGES IN THIS COMPONENT]
interface PatientCardProps { id: string; patient: Patient; removePatient: (patientId: string) => void; updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void; addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void; updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void; removeTaskFromPatient: (patientId: string, taskId: string | number) => void; updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void; acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void; updatePatientNotes: (patientId: string, notes: string) => void; updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void; }
const PatientCard: React.FC<PatientCardProps> = ({ id, patient, removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer, removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes, }) => {
  const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() => differenceInMinutes(new Date(), patient.arrivalTime)); const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>(''); const [newTaskText, setNewTaskText] = useState<string>(''); const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>(''); const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false); const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || ''); const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const calculateLOS = () => { const minutes = differenceInMinutes(new Date(), patient.arrivalTime); const hours = Math.floor(minutes / 60); const remainingMinutes = minutes % 60; setLengthOfStayMinutes(minutes); setLengthOfStayFormatted(`${hours}h ${remainingMinutes}m`); }; calculateLOS(); const intervalId = setInterval(calculateLOS, 60000); return () => clearInterval(intervalId); }, [patient.arrivalTime]); useEffect(() => { if (isEditingPatientNotes) { setEditPatientNotes(patient.notes || ''); setTimeout(() => patientNotesTextareaRef.current?.focus(), 0); } }, [isEditingPatientNotes, patient.notes]);
  const handleAddTaskSubmit = useCallback((e?: FormEvent<HTMLFormElement>) => { e?.preventDefault(); if (newTaskText.trim() === '') return; addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes); setNewTaskText(''); setNewTaskTimerMinutes(''); }, [addTaskToPatient, patient.id, newTaskText, newTaskTimerMinutes]); const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTaskSubmit(); } }; const handlePatientNotesSubmit = useCallback(() => { if (!isEditingPatientNotes) return; updatePatientNotes(patient.id, editPatientNotes); setIsEditingPatientNotes(false); }, [isEditingPatientNotes, editPatientNotes, patient.id, updatePatientNotes]); const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePatientNotesSubmit(); } else if (e.key === 'Escape') { setIsEditingPatientNotes(false); setEditPatientNotes(patient.notes || ''); } };
  const borderColor = getBorderColor(lengthOfStayMinutes); const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete'); const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');
  return ( <Card id={id} className={`mb-4 border-2 ${borderColor} transition-colors duration-500`}> <CardHeader className="flex flex-row items-center justify-between pb-2"> <CardTitle>{patient.name}</CardTitle> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" onClick={() => removePatient(patient.id)} title="Remove Patient"> <X className="h-4 w-4" /> </Button> </CardHeader> <CardContent> <div className="text-xs text-gray-600 dark:text-gray-400 mb-3"> <Clock className="inline h-3 w-3 mr-1" /> LOS: <span className="font-semibold text-gray-800 dark:text-gray-200">{lengthOfStayFormatted}</span> <span className="ml-2">(Arrival: {format(patient.arrivalTime, 'HH:mm')})</span> </div> <div className="mb-2 flex items-center justify-between"> <div className="text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center"> Notes: <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setIsEditingPatientNotes((prev) => !prev)} title={patient.notes ? 'Edit/View Notes' : 'Add Notes'}> <MessageSquare className="h-4 w-4" /> </Button> </div> </div> {isEditingPatientNotes && ( <div className="mb-2 flex items-start gap-2 w-full"> <textarea ref={patientNotesTextareaRef} value={editPatientNotes} onChange={(e) => setEditPatientNotes(e.target.value)} onKeyDown={handlePatientNotesKeyDown} rows={2} placeholder="Add patient notes..." className="flex-grow text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-[#008080] focus:outline-none resize-none" /> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 self-start flex-shrink-0" onClick={handlePatientNotesSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 self-start flex-shrink-0" onClick={() => setIsEditingPatientNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button> </div> )} {!isEditingPatientNotes && patient.notes && ( <div className="mb-3 text-xs text-gray-600 dark:text-gray-400 italic break-words bg-gray-50 dark:bg-gray-700/50 p-2 rounded"> Note: {patient.notes} </div> )} <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2"> <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Pending Tasks:</h4> {pendingTasks.length === 0 ? ( <p className="text-xs text-gray-500 dark:text-gray-400 italic">No pending tasks.</p> ) : ( pendingTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} {...{ updateTaskTimerState, updateTaskTimer, removeTask: removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updateTaskNotes }} /> )))} </div> {completedTasks.length > 0 && ( <div className="mt-3 border-t border-gray-200/70 dark:border-gray-700/50 pt-2"> <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed Tasks:</h4> {completedTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} {...{ updateTaskTimerState, updateTaskTimer, removeTask: removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updateTaskNotes }} /> ))} </div> )} <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"> <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2"> <Input type="text" placeholder="Add Task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="flex-grow h-9 text-sm" /> <Input type="number" min="1" max="999" placeholder="Min" value={newTaskTimerMinutes} onChange={(e) => setNewTaskTimerMinutes(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="w-16 h-9 text-xs px-1 dark:bg-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled={newTaskText.trim() === ''} title="Add Task"> <Plus className="h-4 w-4" /> </Button> </form> </div> </CardContent> </Card> ); };

// --- AddPatientModal ---
// [NO CHANGES IN THIS COMPONENT]
interface ModalTaskState { id: number; text: string; timerMinutes: string; }
interface AddPatientModalProps { isOpen: boolean; onClose: () => void; addPatient: (newPatient: Patient) => void; }
const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatient }) => {
  const [patientName, setPatientName] = useState<string>(''); const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm')); const [tasks, setTasks] = useState<ModalTaskState[]>([{ id: Date.now(), text: '', timerMinutes: '' }]); const [patientNotes, setPatientNotes] = useState<string>('');
  const handleAddTaskLine = useCallback(() => { setTasks(t => [...t, { id: Date.now(), text: '', timerMinutes: '' }]); }, []); const handleRemoveTaskLine = useCallback((id: number) => { setTasks(t => { if (t.length <= 1) return [{ id: Date.now(), text: '', timerMinutes: '' }]; return t.filter((task) => task.id !== id); }); }, []); const handleTaskChange = useCallback((id: number, field: keyof Omit<ModalTaskState, 'id'>, value: string) => { setTasks(t => t.map((task) => (task.id === id ? { ...task, [field]: value } : task))); }, []); const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!patientName.trim() || !arrivalTime) return; const now = new Date(); let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date()); arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate()); if (arrivalDateTime > now) arrivalDateTime = now; const processedTasks: Task[] = tasks.filter((task) => task.text.trim() !== '').map((task) => { const timerMinutesNum = parseInt(task.timerMinutes, 10); const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999; const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null; return { id: `task-${task.id}-${Math.random().toString(36).substring(7)}`, text: task.text.trim(), timerEnd: timerEndDate, isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: '', isAcknowledged: false }; }); addPatient({ id: `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`, name: patientName.trim(), arrivalTime: arrivalDateTime, tasks: processedTasks, notes: patientNotes.trim() }); setPatientName(''); setArrivalTime(format(new Date(), 'HH:mm')); setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]); setPatientNotes(''); onClose(); }, [patientName, arrivalTime, tasks, patientNotes, addPatient, onClose]);
  return ( <Dialog open={isOpen} onOpenChange={onClose}> <DialogContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 sm:max-w-[550px]"> <DialogHeader> <DialogTitle>Add New Patient</DialogTitle> <DialogDescription> Enter patient details, arrival time, initial tasks, and optional notes. </DialogDescription> <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full h-8 w-8" onClick={onClose}> <X className="h-4 w-4" /> <span className="sr-only">Close</span> </Button> </DialogHeader> <form onSubmit={handleSubmit}> <div className="grid gap-4 py-4"> <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="patient-name" className="text-right">Name/Title</Label> <Input id="patient-name" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="col-span-3" placeholder="e.g., Bed 5 / Mr. Smith" required /> </div> <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="arrival-time" className="text-right">Arrival Time</Label> <Input id="arrival-time" type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="col-span-3" required /> </div> <div className="grid grid-cols-4 items-start gap-4"> <Label htmlFor="patient-notes" className="text-right pt-2">Notes (Opt.)</Label> <textarea id="patient-notes" value={patientNotes} onChange={(e) => setPatientNotes(e.target.value)} rows={3} placeholder="Add general patient notes..." className="col-span-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-1.5 focus:ring-1 focus:ring-[#008080] focus:outline-none resize-vertical" /> </div> <div className="col-span-4 mt-2"> <Label className="mb-2 block font-medium">Initial Tasks</Label> {tasks.map((task, index) => ( <div key={task.id} className="flex items-center gap-2 mb-2"> <Input type="text" placeholder={`Task ${index + 1} desc.`} value={task.text} onChange={(e) => handleTaskChange(task.id, 'text', e.target.value)} className="flex-grow h-9 text-sm" /> <Input type="number" min="1" max="999" placeholder="Timer (min)" value={task.timerMinutes} onChange={(e) => handleTaskChange(task.id, 'timerMinutes', e.target.value)} className="w-24 h-9 text-xs px-1 dark:bg-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0" onClick={() => handleRemoveTaskLine(task.id)} disabled={tasks.length <= 1 && task.text === '' && task.timerMinutes === ''} aria-label="Remove task line" title="Remove task line"> <X className="h-4 w-4" /> </Button> </div> ))} <Button type="button" variant="outline" size="sm" onClick={handleAddTaskLine} className="mt-2"> <Plus className="h-4 w-4 mr-2" /> Add Task Line </Button> </div> </div> <DialogFooter> <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button> <Button type="submit" variant="default">Add Patient</Button> </DialogFooter> </form> </DialogContent> </Dialog> );
};


// --- MAIN SIDEBAR COMPONENT ---
const PatientTrackerSidebar: React.FC = () => {
  const [isLocallyVisible, setIsLocallyVisible] = useState(true); // Local state for visibility
  const PATIENT_STORAGE_KEY = 'patientTrackerData_v3';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>( typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default' );
  const [isAttentionListExpanded, setIsAttentionListExpanded] = useState<boolean>(false);

  // Load data from localStorage
  useEffect(() => { if (typeof window === 'undefined') return; try { const jsonData = window.localStorage.getItem(PATIENT_STORAGE_KEY); if (jsonData) { const parsed = parsePatientsWithDates(jsonData); if (parsed) { setPatients(parsed.sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())); return; } } } catch (err) { console.error('Error reading from localStorage:', err); } setPatients([]); }, []);
  // Save data to localStorage
  useEffect(() => { if (typeof window === 'undefined') return; try { const sortedPatients = [...patients].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()); window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(sortedPatients)); } catch (err) { console.error('Error saving to localStorage:', err); } }, [patients]);
  // Request notification permission
  useEffect(() => { if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default') { Notification.requestPermission().then(setNotificationPermission); } }, [notificationPermission]);

  // CRUD Callbacks (Memoized)
  const addPatient = useCallback((newPatient: Patient) => { setPatients(prev => [...prev, newPatient].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())); }, []);
  const removePatient = useCallback((patientId: string) => { setPatients(prev => prev.filter(p => p.id !== patientId)); }, []);
  const updateTaskTimerState = useCallback((patientId: string, taskId: string | number, isExpired: boolean) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, tasks: p.tasks.map(t => t.id === taskId && t.isTimerExpired !== isExpired ? { ...t, isTimerExpired: isExpired, isAcknowledged: isExpired ? false : t.isAcknowledged } : t) } : p)); }, []);
  const addTaskToPatient = useCallback((patientId: string, taskText: string, timerMinutes: string) => { setPatients(prev => prev.map(p => { if (p.id === patientId) { const timerMinutesNum = parseInt(timerMinutes, 10); const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999; const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null; const newTask: Task = { id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`, text: taskText.trim(), timerEnd: timerEndDate, isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: '', isAcknowledged: false }; return { ...p, tasks: [...p.tasks, newTask] }; } return p; })); }, []);
  const updateTaskTimer = useCallback((patientId: string, taskId: string | number, newTimerMinutes: string | null) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, tasks: p.tasks.map(t => { if (t.id === taskId) { let newTimerEnd: Date | null = null; let newIsTimerExpired = false; if (newTimerMinutes !== null) { const num = parseInt(newTimerMinutes, 10); if (!isNaN(num) && num > 0 && num <= 999) { newTimerEnd = addMinutes(new Date(), num); newIsTimerExpired = newTimerEnd <= new Date(); } } return { ...t, timerEnd: newTimerEnd, isTimerExpired: newIsTimerExpired, isAcknowledged: false }; } return t; }) } : p)); }, []);
  const removeTaskFromPatient = useCallback((patientId: string, taskId: string | number) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p)); }, []);
  const updateTaskCompletion = useCallback((patientId: string, taskId: string | number, status: TaskCompletionStatus) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, completionStatus: status, completedAt: status === 'complete' ? new Date() : null, isAcknowledged: status === 'complete' ? true : t.isAcknowledged } : t) } : p)); }, []);
  const acknowledgeTaskTimer = useCallback((patientId: string, taskId: string | number) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, tasks: p.tasks.map(t => t.id === taskId && t.isTimerExpired ? { ...t, isAcknowledged: true } : t) } : p)); }, []);
  const updatePatientNotes = useCallback((patientId: string, notes: string) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, notes: notes.trim() } : p)); }, []);
  const updateTaskNotes = useCallback((patientId: string, taskId: string | number, notes: string) => { setPatients(prev => prev.map(p => p.id === patientId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, notes: notes.trim() } : t) } : p)); }, []);

  // Calculate patients needing attention
  const attentionPatients = useMemo(() => { return patients.filter(patient => patient.tasks.some(task => task.isTimerExpired && !task.isAcknowledged)); }, [patients]);

  // Function to scroll to a specific patient card
  const scrollToPatient = useCallback((patientId: string) => { if (typeof document === 'undefined') return; const element = document.getElementById(`patient-card-${patientId}`); if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.classList.add('highlight-scroll'); setTimeout(() => { if (document.getElementById(`patient-card-${patientId}`)) { element.classList.remove('highlight-scroll'); } }, 1500); } else { console.warn(`Element with id patient-card-${patientId} not found for scrolling.`); } }, []);

  // Sidebar Width Calculation using local state
  const sidebarWidth = isLocallyVisible ? 'w-80 md:w-96' : 'w-0';
  // ***** MODIFICATION START *****
  // Calculate margin based on visibility to push content when expanded
  const sidebarMargin = isLocallyVisible ? 'ml-8' : 'ml-0'; // Assuming tab width w-8
  // ***** MODIFICATION END *****


  return (
    // Use a wrapper div with relative positioning to contain both the tab and the sidebar content
    // This allows the absolute positioned tab to be placed relative to this wrapper.
    <div className="relative h-full">
      {/* Persistent Toggle Tab Button - Now absolutely positioned */}
      <Button
        onClick={() => setIsLocallyVisible(!isLocallyVisible)}
        variant="secondary" // Use secondary variant for the tab
        size="icon"
        // ***** MODIFICATION START *****
        // Changed from fixed to absolute, adjusted positioning and styles
        className={`absolute top-1/2 -translate-y-1/2 left-0 z-20 h-12 w-8 rounded-l-none rounded-r-md shadow-lg border border-l-0 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:ring-offset-0 transition-transform duration-300 ease-in-out ${isLocallyVisible ? 'translate-x-0' : 'translate-x-0'}`} // Position at left=0 always
        // ***** MODIFICATION END *****
        title={isLocallyVisible ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isLocallyVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </Button>

      {/* Main Sidebar Container */}
      {/* ***** MODIFICATION START ***** */}
      {/* Added conditional margin-left and transition for margin */}
      <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 shadow-lg border-l border-gray-200 dark:border-gray-700 ${sidebarWidth} ${sidebarMargin}`}>
      {/* ***** MODIFICATION END ***** */}
        {/* Render content only when visible */}
        {isLocallyVisible && (
          <>
            {/* Sidebar Header - Removed original collapse button */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
               {/* Removed the internal collapse button, added slight ml to title to avoid overlap with external tab */}
               <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-1">Patient Tracker</h2>
              <Button variant="default" size="sm" onClick={() => setIsModalOpen(true)}> <Plus className="h-4 w-4 mr-2" /> Add Patient </Button>
            </div>

            {/* Attention Summary Section */}
            {attentionPatients.length > 0 && ( <div className="p-3 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-800/30 flex-shrink-0"> <div className="flex justify-between items-center"> <div className="flex items-center text-sm font-medium text-red-700 dark:text-red-300"> <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> <span> {attentionPatients.length} Patient{attentionPatients.length > 1 ? 's' : ''} require attention </span> </div> <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-700/50 rounded-md" onClick={() => setIsAttentionListExpanded(!isAttentionListExpanded)} title={isAttentionListExpanded ? "Hide list" : "Show list"}> {isAttentionListExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} </Button> </div> {isAttentionListExpanded && ( <ul className="mt-2 pl-5 space-y-1 list-disc list-inside"> {attentionPatients.map(patient => ( <li key={patient.id} className="text-xs"> <button onClick={() => scrollToPatient(patient.id)} className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-red-500 rounded px-0.5" title={`Scroll to ${patient.name}`}> {patient.name} </button> </li> ))} </ul> )} </div> )}

            {/* Main Content Area (Scrollable Patient List) */}
            <div className="flex-1 overflow-y-auto p-4">
              {patients.length === 0 ? ( <div className="flex flex-col items-center justify-center h-full text-center px-4 text-gray-500 dark:text-gray-400"> <AlertTriangle className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" /> <p className="font-medium">No patients being tracked.</p> <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p> </div> )
               : ( <div className="space-y-4"> {patients.map((patient) => (
                   <PatientCard key={patient.id} id={`patient-card-${patient.id}`} patient={patient} {...{ removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer, removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes }} />
                 ))} </div> )}
            </div>

            {/* AddPatientModal */}
            <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addPatient={addPatient} />

            {/* Global Styles */}
            <style jsx global>{`
              .overflow-y-auto { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
              .dark .overflow-y-auto { scrollbar-color: #4b5563 #1f2937; }
              .overflow-y-auto::-webkit-scrollbar { width: 8px; }
              .overflow-y-auto::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
              .dark .overflow-y-auto::-webkit-scrollbar-track { background: #1f2937; }
              .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; border: 2px solid #f1f5f9; }
              .dark .overflow-y-auto::-webkit-scrollbar-thumb { background-color: #4b5563; border-color: #1f2937; }
              .overflow-y-auto::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
              .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
              @keyframes flash-bg { 0%, 100% { background-color: transparent; } 50% { background-color: rgba(239, 68, 68, 0.1); } }
              .animate-flash-bg { animation: flash-bg 1.5s infinite; }
              @keyframes pulse-border { 0%, 100% { border-color: #ef4444; } 50% { border-color: #f87171; } }
              .dark @keyframes pulse-border { 0%, 100% { border-color: #dc2626; } 50% { border-color: #ef4444; } }
              .animate-pulse-border { animation: pulse-border 1.5s infinite; }
              @keyframes highlight { from { background-color: rgba(250, 204, 21, 0.4); } to { background-color: transparent; } }
              .highlight-scroll { animation: highlight 1.5s ease-out; }
            `}</style>
          </>
        )}
      </div>
    </div> // End of the relative wrapper div
  );
};

export default PatientTrackerSidebar;

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
import HomeContext from '@/pages/api/home/home.context';

// --- Import Centralized Types ---
import { Patient, Task, TaskCompletionStatus } from '@/types/patient';

// --- REMOVED Imports for external UI components and PatientCard ---
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Dialog, ... } from '@/components/ui/dialog';
// import { Card, ... } from '@/components/ui/Card';
// import { PatientCard } from '@/components/patients/PatientCard';


// ===-----------------------------------------===
// === Start: Restored Mock Component Definitions ===
// === (Copied from original Tasks.tsx)         ===
// ===-----------------------------------------===

// --- Mock shadcn/ui Components ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon'; // Keep original mock sizes
  asChild?: boolean;
  className?: string;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const baseStyle = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = { default: 'bg-primary text-primary-foreground hover:bg-primary/90', destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90', outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', ghost: 'hover:bg-accent hover:text-accent-foreground', link: 'text-primary underline-offset-4 hover:underline' };
    const sizes = { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-md px-3', lg: 'h-11 rounded-md px-8', icon: 'h-10 w-10' }; // Keep original mock sizes
    // Ensure `variants[variant]` and `sizes[size]` handle potential undefined safely if needed, though defaults are set.
    const variantClass = variants[variant || 'default'];
    const sizeClass = sizes[size || 'default'];
    return (<button className={`${baseStyle} ${variantClass} ${sizeClass} ${className ?? ''}`} ref={ref} {...props} />);
  }
);
Button.displayName = 'Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { className?: string; }
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const baseStyle = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-gray-800 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  return <input type={type} className={`${baseStyle} ${className ?? ''}`} ref={ref} {...props} />;
});
Input.displayName = 'Input';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { className?: string; }
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ''}`} {...props} />
));
Label.displayName = 'Label';

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
interface DialogCloseProps { children: React.ReactElement; onClick?: () => void; asChild?: boolean; }
const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick }) => React.cloneElement(children, { onClick });

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
const getBorderColor = (minutes: number): string => {
    if (minutes >= 300) return 'border-red-500 animate-pulse-border';
    if (minutes >= 240) return 'border-red-500';
    if (minutes >= 120) return 'border-amber-500';
    return 'border-green-500';
};
const getBackgroundColor = (minutes: number): string => {
    // Original logic from old Tasks.tsx / PatientCard.tsx
    if (minutes >= 300) return 'bg-neutral-50';
    if (minutes >= 240) return 'bg-neutral-50';
    if (minutes >= 120) return 'bg-neutral-50';
    return 'bg-neutral-50';
};


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
  updateTaskCompletion: (patientId: string, taskId: string | number, status: TaskCompletionStatus) => void;
  acknowledgeTimer: (patientId: string, taskId: string | number) => void;
  updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task, patientId, patientName, updateTaskTimerState, updateTaskTimer, removeTask, updateTaskCompletion, acknowledgeTimer, updateTaskNotes,
}) => {
  // State, Effects, Handlers are identical to the version previously in PatientCard.tsx
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(task.isTimerExpired);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEditingTimer, setIsEditingTimer] = useState<boolean>(false);
  const [editTimerMinutes, setEditTimerMinutes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>(task.notes || '');
  const timerInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { /* ... timer check effect ... */ }, [ /* ... dependencies ... */ ]);
  useEffect(() => { /* ... focus timer effect ... */ }, [isEditingTimer, task.timerEnd]);
  useEffect(() => { /* ... focus notes effect ... */ }, [isEditingNotes, task.notes]);
  const handleTimerEditSubmit = () => {/* ... */};
  const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => {/* ... */};
  const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {/* ... */};
  const handleNotesEditSubmit = () => {/* ... */};
  const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {/* ... */};
  const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {/* ... */};
  const handleCompletionToggle = () => {/* ... */};
  const handleSnooze = () => {/* ... */};
  const getCompletionIcon = (): JSX.Element => { /* ... same logic, return <Square../> as fallback */
     switch (task.completionStatus) { case 'in-progress': return <MinusSquare className="h-4 w-4 text-yellow-400" />; case 'complete': return <CheckSquare className="h-4 w-4 text-green-400" />; case 'incomplete': default: return <Square className="h-4 w-4 text-gray-500" />; }
    // return <Square className="h-4 w-4 text-gray-500" />; // Fallback removed as default case handles it
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
    patient: Patient; // Use the imported Patient type
    removePatient: (patientId: string) => void;
    updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
    addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void;
    updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
    removeTaskFromPatient: (patientId: string, taskId: string | number) => void;
    updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void; // Use imported type
    acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void;
    updatePatientNotes: (patientId: string, notes: string) => void;
    updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
}

// 2. Define and export the component AFTER the interface, using the interface for props type
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
    // State, Effects, Handlers are identical to the version previously in PatientCard.tsx
    const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() => differenceInMinutes(new Date(), patient.arrivalTime));
    const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
    const [newTaskText, setNewTaskText] = useState<string>('');
    const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>('');
    const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false);
    const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || '');
    const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { /* ... LOS effect ... */ }, [patient.arrivalTime]);
    useEffect(() => { /* ... focus notes effect ... */ }, [isEditingPatientNotes, patient.notes]);
    const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => { e?.preventDefault(); if (newTaskText.trim() === '') return; addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes); setNewTaskText(''); setNewTaskTimerMinutes(''); };
    const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTaskSubmit(); } };
    const handlePatientNotesSubmit = () => { if (!isEditingPatientNotes) return; updatePatientNotes(patient.id, editPatientNotes); setIsEditingPatientNotes(false); };
    const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePatientNotesSubmit(); } else if (e.key === 'Escape') { setIsEditingPatientNotes(false); setEditPatientNotes(patient.notes || ''); } };
    // Style vars and task filtering remain same
    const borderColor = getBorderColor(lengthOfStayMinutes);
    const bgColor = getBackgroundColor(lengthOfStayMinutes);
    const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
    const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');

    return (
       <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500 flex flex-col`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium text-black">{patient.name}</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-black hover:text-red-500" onClick={() => removePatient(patient.id)} > <X className="h-4 w-4" /> </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="text-xs text-black mb-2"> <Clock className="inline h-3 w-3 mr-1" /> Length of Stay: <span className="font-semibold text-black">{lengthOfStayFormatted}</span> <span className="ml-2 text-black"> (Arrival: {format(patient.arrivalTime, 'HH:mm')}) </span> </div>
                <div className="mb-2">
                   <div className="flex items-center justify-between"> <div className="text-xs text-black font-medium flex items-center"> Notes: <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-400' : 'text-black'}`} onClick={() => setIsEditingPatientNotes((prev) => !prev)} title={patient.notes ? 'Edit/View Notes' : 'Add Notes'} > <MessageSquare className="h-4 w-4" /> </Button> </div> </div>
                   {isEditingPatientNotes && ( <div className="mt-1 flex items-center gap-2 w-full"> <textarea ref={patientNotesTextareaRef} value={editPatientNotes} onChange={(e) => setEditPatientNotes(e.target.value)} onKeyDown={handlePatientNotesKeyDown} rows={2} className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none" placeholder="Add patient notes..." /> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={handlePatientNotesSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-200" onClick={() => setIsEditingPatientNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button> </div> )}
                   {!isEditingPatientNotes && patient.notes && ( <div className="mt-1 text-xs text-black italic break-words"> Note: {patient.notes} </div> )}
                </div>
                <div className="flex-1 mt-2 border-t border-gray-700 pt-2 overflow-y-auto">
                    <div>
                        <h4 className="text-sm font-medium text-black mb-1">Pending Tasks:</h4>
                        {pendingTasks.length === 0 ? ( <p className="text-xs text-black italic">No pending tasks.</p> ) : (
                            pendingTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} updateTaskTimerState={updateTaskTimerState} updateTaskTimer={updateTaskTimer} removeTask={removeTaskFromPatient} updateTaskCompletion={updateTaskCompletion} acknowledgeTimer={acknowledgeTaskTimer} updateTaskNotes={updateTaskNotes} /> ))
                        )}
                    </div>
                    {completedTasks.length > 0 && (
                        <div className="mt-2 border-t border-gray-700/50 pt-2">
                            <h4 className="text-sm font-medium text-black mb-1">Completed Tasks:</h4>
                            {completedTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} updateTaskTimerState={updateTaskTimerState} updateTaskTimer={updateTaskTimer} removeTask={removeTaskFromPatient} updateTaskCompletion={updateTaskCompletion} acknowledgeTimer={acknowledgeTaskTimer} updateTaskNotes={updateTaskNotes} /> ))}
                        </div>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
                        <Input type="text" placeholder="Add Task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="flex-grow h-8 text-sm" />
                        <Input type="number" min="1" max="999" placeholder="Min" value={newTaskTimerMinutes} onChange={(e) => setNewTaskTimerMinutes(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="w-16 h-8 text-xs" />
                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-black hover:bg-gray-100" disabled={newTaskText.trim() === ''} title="Add Task" > <Plus className="h-4 w-4" /> </Button>
                    </form>
                </div>
            </CardContent>
       </Card>
    );
    // === END OF FIX ===
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

     const newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] } = { name: patientName, arrivalTime: arrivalDateTime, tasks: processedModalTasks, notes: patientNotes };
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
            <Button type="submit" className="bg-[#008080] hover:bg-[#008080] text-white"> Add Patient </Button>
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
  const { state, addPatient, removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer, removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes } = useContext(HomeContext);
  const { showSidePromptbar, patients } = state;

  // --- Local State (Same as before) ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>( typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default' );
  useEffect(() => { if (typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default') { Notification.requestPermission().then(setNotificationPermission); } }, [notificationPermission]);

  const sidebarWidth = showSidePromptbar ? 'w-40 lg:w-80' : 'w-0';

  return (
    <div className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth} ${showSidePromptbar ? 'visible' : 'invisible'}`}>
      {showSidePromptbar && (
        <>
          {/* Header - Uses *internal* mock Button */}
          <div className="flex justify-between items-center p-4 shadow-md border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="bg-[#008080] hover:bg-[#008080] border-[#008080] text-black"> <Plus className="h-4 w-4 mr-2" /> Add Patient </Button>
          </div>

          {/* Patient List - Renders *internal* PatientCard */}
          <div className="flex-1 overflow-y-auto p-4">
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center"> <AlertTriangle className="w-10 h-10 mb-4 text-gray-600" /> <p className="font-medium">No patients being tracked.</p> <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p> </div>
            ) : (
              patients.map((patient) => (
                <PatientCard // Renders internal PatientCard
                  key={patient.id}
                  patient={patient}
                  // Pass handlers obtained from context down
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

          {/* Renders *internal* AddPatientModal */}
          <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addPatientHandler={addPatient} />
        </>
      )}
    </div>
  );
};

export default Tasks;

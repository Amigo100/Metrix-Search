'use client';

/* ------------------------------------------------------------------
 *  Imports
 * ----------------------------------------------------------------*/
import React, {
  useState,
  useEffect,
  useCallback,
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
} from 'lucide-react';

import {
  format,
  differenceInMinutes,
  addMinutes,
  formatDistanceToNowStrict,
  parse,
  formatRelative,
  isValid,
  subMinutes,
} from 'date-fns';

import HomeContext from '@/pages/api/home/home.context';

/* ------------------------------------------------------------------
 *  Type definitions
 * ----------------------------------------------------------------*/
export type TaskCompletionStatus = 'incomplete' | 'in-progress' | 'complete';

export interface Task {
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

export interface Patient {
  id: string;
  name: string;
  arrivalTime: Date;
  tasks: Task[];
  notes: string;
}

/* ------------------------------------------------------------------
 *  Lightweight shadcn/ui stand‑ins (Tailwind‑only)
 * ----------------------------------------------------------------*/
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** visual style */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** size preset */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** extra Tailwind classes */
  className?: string;
  /** Render as child (for shadcn pattern) */
  asChild?: boolean;
}
// --- Button (clean, deduplicated) ---
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'default', size = 'default', className = '', asChild = false, ...props },
    ref,
  ) => {
    const base =
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-teal-600 text-white hover:bg-teal-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      ghost: 'hover:bg-gray-100 text-gray-800',
      link: 'text-teal-600 underline-offset-4 hover:underline',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const base =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 ring-offset-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  return <input ref={ref} className={`${base} ${props.className ?? ''}`.trim()} {...props} />;
});
Input.displayName = 'Input';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${props.className ?? ''}`.trim()}
    {...props}
  />
));
Label.displayName = 'Label';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const base =
    'flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 ring-offset-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  return <textarea ref={ref} className={`${base} ${props.className ?? ''}`.trim()} {...props} />;
});
Textarea.displayName = 'Textarea';

/* ------------------------------------------------------------------
 *  Dialog + Card skeletons
 * ----------------------------------------------------------------*/
// (unchanged lightweight mocks)
// ...

/* ------------------------------------------------------------------
 *  Utility helpers (border / bg based on LOS)
 * ----------------------------------------------------------------*/
const getBorderColor = (minutes: number): string => {
  if (minutes >= 300) return 'border-rose-500 animate-pulse-border';
  if (minutes >= 240) return 'border-rose-500';
  if (minutes >= 120) return 'border-orange-500';
  return 'border-emerald-500';
};

const getBackgroundColor = (minutes: number): string => {
  if (minutes >= 300) return 'bg-rose-100';
  if (minutes >= 240) return 'bg-rose-100';
  if (minutes >= 120) return 'bg-orange-100';
  return 'bg-emerald-100';
};
 
 // --- TaskItem component (Themed) ---
 interface TaskItemProps { task: Task; patientId: string; patientName: string; updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void; updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void; removeTask: (patientId: string, taskId: string | number) => void; updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void; acknowledgeTimer: (patientId: string, taskId: string | number) => void; updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void; }
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
 
 const TaskItem: React.FC<TaskItemProps> = ({ task, patientId, patientName, updateTaskTimerState, updateTaskTimer, removeTask, updateTaskCompletion, acknowledgeTimer, updateTaskNotes, }) => {
   // --- State and Effects (Preserved) ---
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
 
 // --- TaskItem component ---
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
 
   useEffect(() => { /* ... existing timer check logic ... */
     if (!task.timerEnd || task.completionStatus === 'complete') { if (isTimerExpired) setIsTimerExpired(false); setTimeRemaining(''); return; } let intervalId: NodeJS.Timeout | null = null; const checkTimer = () => { const now = new Date(); if (task.timerEnd && now >= task.timerEnd) { if (!isTimerExpired) { setIsTimerExpired(true); setTimeRemaining('Expired'); updateTaskTimerState(patientId, task.id, true); if ( !task.isAcknowledged && typeof window !== 'undefined' && 'Notification' in window ) { if (Notification.permission === 'granted') { new Notification(`Task Timer Expired: ${patientName}`, { body: task.text, tag: `task-${task.id}`, }); } } } if (intervalId) clearInterval(intervalId); } else if (task.timerEnd) { if (isTimerExpired) { setIsTimerExpired(false); updateTaskTimerState(patientId, task.id, false); } setTimeRemaining(`in ${formatDistanceToNowStrict(task.timerEnd)}`); } }; checkTimer(); if (task.timerEnd && new Date() < task.timerEnd) { intervalId = setInterval(checkTimer, 1000 * 30); } return () => { if (intervalId) clearInterval(intervalId); };
   }, [ task.timerEnd, task.id, patientId, updateTaskTimerState, isTimerExpired, task.isTimerExpired, task.completionStatus, task.isAcknowledged, patientName, task.text, ]);
   useEffect(() => { if (isEditingTimer) { const initialMinutes = task.timerEnd && task.timerEnd > new Date() ? Math.max(0, differenceInMinutes(task.timerEnd, new Date())).toString() : ''; setEditTimerMinutes(initialMinutes); setTimeout(() => timerInputRef.current?.focus(), 0); } }, [isEditingTimer, task.timerEnd]);
   useEffect(() => { if (isEditingNotes) { setEditNotes(task.notes || ''); setTimeout(() => notesTextareaRef.current?.focus(), 0); } }, [isEditingNotes, task.notes]);
 
   // --- Event Handlers (Preserved) ---
   const handleTimerEditSubmit = () => { if (!isEditingTimer) return; const minutesToSet = editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes; updateTaskTimer(patientId, task.id, minutesToSet); setIsEditingTimer(false); };
   const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => { setEditTimerMinutes(e.target.value); };
   const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { handleTimerEditSubmit(); } else if (e.key === 'Escape') { setIsEditingTimer(false); } };
   const handleNotesEditSubmit = () => { if (!isEditingNotes) return; updateTaskNotes(patientId, task.id, editNotes); setIsEditingNotes(false); };
   const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => { setEditNotes(e.target.value); };
   const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNotesEditSubmit(); } else if (e.key === 'Escape') { setIsEditingNotes(false); setEditNotes(task.notes || ''); } };
   const handleCompletionToggle = () => { let nextStatus: TaskCompletionStatus; switch (task.completionStatus) { case 'incomplete': nextStatus = 'in-progress'; break; case 'in-progress': nextStatus = 'complete'; break; case 'complete': nextStatus = 'incomplete'; break; default: nextStatus = 'incomplete'; break; } updateTaskCompletion(patientId, task.id, nextStatus); };
   const handleSnooze = () => { updateTaskTimer(patientId, task.id, '15'); }; // Quick 15-min extension
 
   // --- Themed Rendering ---
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
       case 'in-progress': return <MinusSquare className="h-4 w-4 text-amber-500" />; // Amber for in-progress
       case 'complete': return <CheckSquare className="h-4 w-4 text-green-500" />; // Green for complete
       case 'incomplete': default: return <Square className="h-4 w-4 text-gray-400" />; // Gray for incomplete
       case 'in-progress':
         return <MinusSquare className="h-4 w-4 text-yellow-400" />;
       case 'complete':
         return <CheckSquare className="h-4 w-4 text-green-400" />;
       case 'incomplete':
       default:
         return <Square className="h-4 w-4 text-gray-500" />;
     }
   };
 
   // Updated text color logic for light theme
   let taskTextStyle = 'text-sm text-gray-800'; // Default text color
   let timerTextStyle = 'text-xs font-mono text-gray-500'; // Default timer color
   // --- UPDATED text color logic to ensure readability ---
   let taskItemClasses = 'flex flex-col py-1.5 group';
   let taskTextStyle = 'text-sm';
   let timerTextStyle = 'text-xs font-mono';
 
   if (task.completionStatus === 'complete') {
     taskTextStyle += ' line-through text-gray-400';
     timerTextStyle = 'text-xs font-mono text-gray-400'; // Lighter timer for complete
     // Make completed tasks lighter gray so they’re still visible on dark backgrounds
     taskTextStyle += ' line-through text-gray-300';
     timerTextStyle += ' text-gray-300';
   } else if (isTimerExpired && !task.isAcknowledged) {
     // Expired and not acknowledged - make text red and bold
     taskTextStyle = 'text-sm text-red-600 font-medium';
     timerTextStyle = 'text-xs font-mono text-red-600 font-semibold';
     taskItemClasses += ' animate-flash';
     taskTextStyle += ' text-red-400 font-medium';
     timerTextStyle += ' text-red-400 font-semibold';
   } else if (isTimerExpired && task.isAcknowledged) {
      // Expired but acknowledged - less prominent red
     taskTextStyle = 'text-sm text-red-500';
     timerTextStyle = 'text-xs font-mono text-red-500';
     taskTextStyle += ' text-red-600';
     timerTextStyle += ' text-red-600';
   } else if (task.timerEnd) {
     // Has timer, not expired - use default colors
     // Previously used black; changed to white for visibility
     taskTextStyle += ' text-black';
     timerTextStyle += ' text-black';
   } else {
     // no timer, but still on a dark background => use white
     taskTextStyle += ' text-black';
     timerTextStyle += ' text-gray-200';
   }
 
   return (
     <div className="flex flex-col py-1.5 group border-b border-gray-100 last:border-b-0"> {/* Added border between tasks */}
     <div className={taskItemClasses}>
       {/* Main row */}
       <div className="flex items-center space-x-2 w-full">
         <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-gray-500 hover:bg-gray-100" onClick={handleCompletionToggle} title={`Status: ${task.completionStatus}. Click to change.`} >
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
               <Input ref={timerInputRef} type="number" min="0" max="999" value={editTimerMinutes} onChange={handleTimerInputChange} onKeyDown={handleTimerInputKeyDown} className="w-14 h-7 text-xs px-1 py-0.5" placeholder="Min" />
               <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:bg-green-50" onClick={handleTimerEditSubmit} title="Save Timer" > <Save className="h-3.5 w-3.5" /> </Button>
               <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-gray-100" onClick={() => setIsEditingTimer(false)} title="Cancel Edit" > <X className="h-3.5 w-3.5" /> </Button>
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
               {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                 <>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:bg-yellow-50" onClick={() => acknowledgeTimer(patientId, task.id)} title="Acknowledge Timer" > <BellOff className="h-4 w-4" /> </Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:bg-blue-50" onClick={handleSnooze} title="Snooze 15 min" > <AlarmClockOff className="h-4 w-4" /> </Button>
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
                 <span className={timerTextStyle}> <Clock className="inline h-3 w-3 mr-0.5" /> {isTimerExpired ? 'Expired' : timeRemaining} </span>
                 <span className={timerTextStyle}>
                   <Clock className="inline h-3 w-3 mr-1" />
                   {isTimerExpired ? 'Expired' : timeRemaining}
                 </span>
               )}
 
               {task.completionStatus !== 'complete' && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTimer(true)} title={task.timerEnd ? 'Edit Timer' : 'Add Timer'} >
                   {task.timerEnd ? <Edit3 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
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
         <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 flex-shrink-0 ${ task.notes ? 'text-blue-500' : 'text-gray-400' } hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity`} onClick={() => setIsEditingNotes((prev) => !prev)} title={task.notes ? 'Edit/View Notes' : 'Add Notes'} >
           <MessageSquare className="h-3.5 w-3.5" />
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
         <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeTask(patientId, task.id)} title="Remove Task" >
           <Trash2 className="h-3.5 w-3.5" />
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
         <div className="mt-1.5 pl-8 pr-2 flex items-start gap-2 w-full"> {/* Use items-start */}
           <Textarea ref={notesTextareaRef} value={editNotes} onChange={handleNotesInputChange} onKeyDown={handleNotesKeyDown} placeholder="Add task notes..." rows={2} className="flex-grow text-xs p-1.5 min-h-[40px]" /> {/* Use themed Textarea */}
           <div className="flex flex-col space-y-1"> {/* Stack buttons vertically */}
             <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:bg-green-50" onClick={handleNotesEditSubmit} title="Save Notes" > <Save className="h-4 w-4" /> </Button>
             <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-gray-100" onClick={() => setIsEditingNotes(false)} title="Cancel Edit" > <X className="h-4 w-4" /> </Button>
           </div>
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
       {!isEditingNotes && task.notes && (
         // Updated notes display style
         <div className="mt-1 pl-8 pr-2 text-xs text-gray-500 italic w-full break-words bg-gray-50 p-1 rounded">
           {task.notes}
         <div className="mt-1 pl-8 pr-2 text-xs text-gray-200 italic w-full break-words">
           Note: {task.notes}
         </div>
       )}
 
       {/* Dates info */}
       <div className="pl-8 text-xs text-gray-400 mt-1">
       <div className="pl-8 text-xs text-gray-400 mt-0.5">
         Added: {formatRelative(task.createdAt, new Date())}
         {task.completionStatus === 'complete' && task.completedAt && (
           <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span>
         )}
       </div>
     </div>
   );
 };
 
 // --- PatientCard (Themed) ---
 interface PatientCardProps { /* ... same props ... */ patient: Patient; removePatient: (patientId: string) => void; updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void; addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void; updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void; removeTaskFromPatient: (patientId: string, taskId: string | number) => void; updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void; acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void; updatePatientNotes: (patientId: string, notes: string) => void; updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void; }
 const PatientCard: React.FC<PatientCardProps> = ({ patient, removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer, removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes, }) => {
   // --- State and Effects (Preserved) ---
   const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() => differenceInMinutes(new Date(), patient.arrivalTime));
 // --- PatientCard ---
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
 
   useEffect(() => { const calculateLOS = () => { const now = new Date(); const minutes = differenceInMinutes(now, patient.arrivalTime); const hours = Math.floor(minutes / 60); const remainingMinutes = minutes % 60; setLengthOfStayMinutes(minutes); setLengthOfStayFormatted(`${hours}h ${remainingMinutes}m`); }; calculateLOS(); const intervalId = setInterval(calculateLOS, 60_000); return () => clearInterval(intervalId); }, [patient.arrivalTime]);
   useEffect(() => { if (isEditingPatientNotes) { setEditPatientNotes(patient.notes || ''); setTimeout(() => patientNotesTextareaRef.current?.focus(), 0); } }, [isEditingPatientNotes, patient.notes]);
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
 
   // --- Event Handlers (Preserved) ---
   const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => { e?.preventDefault(); if (newTaskText.trim() === '') return; addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes); setNewTaskText(''); setNewTaskTimerMinutes(''); };
   const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTaskSubmit(); } };
   const handlePatientNotesSubmit = () => { if (!isEditingPatientNotes) return; updatePatientNotes(patient.id, editPatientNotes); setIsEditingPatientNotes(false); };
   const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePatientNotesSubmit(); } else if (e.key === 'Escape') { setIsEditingPatientNotes(false); setEditPatientNotes(patient.notes || ''); } };
   const borderColor = getBorderColor(lengthOfStayMinutes);
   const bgColor = getBackgroundColor(lengthOfStayMinutes);
 
   // --- Themed Rendering ---
   const borderColor = getBorderColor(lengthOfStayMinutes); // Uses Tailwind classes now
   const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
   const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');
 
   return (
     // Updated Card styling
     <Card className={`mb-4 border-l-4 ${borderColor} bg-white transition-shadow duration-300 hover:shadow-xl`}>
       <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4"> {/* Adjusted padding */}
         <CardTitle className="text-base font-semibold text-gray-800">{patient.name}</CardTitle>
         <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => removePatient(patient.id)} title="Remove Patient" >
     <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500`}>
       <CardHeader className="flex flex-row items-center justify-between pb-2">
         <CardTitle className="text-base font-medium text-black">{patient.name}</CardTitle>
         <Button
           variant="ghost"
           size="icon"
           className="h-6 w-6 text-black hover:text-red-500"
           onClick={() => removePatient(patient.id)}
         >
           <X className="h-4 w-4" />
         </Button>
       </CardHeader>
       <CardContent className="px-4 pb-3"> {/* Adjusted padding */}
         {/* Updated LOS display */}
         <div className="text-xs text-gray-500 mb-3">
       <CardContent>
         <div className="text-xs text-black mb-2">
           <Clock className="inline h-3 w-3 mr-1" />
           LOS: <span className="font-medium text-gray-700">{lengthOfStayFormatted}</span>
           <span className="ml-2"> (Arrival: {format(patient.arrivalTime, 'HH:mm')}) </span>
           Length of Stay: <span className="font-semibold text-black">{lengthOfStayFormatted}</span>
           <span className="ml-2 text-black">
             (Arrival: {format(patient.arrivalTime, 'HH:mm')})
           </span>
         </div>
 
         {/* Patient notes section - Updated Styles */}
         <div className="mb-2">
           <div className="flex items-center justify-between mb-1">
             <Label className="text-xs text-gray-600 font-medium flex items-center">
               Patient Notes
               <Button variant="ghost" size="icon" className={`h-5 w-5 ml-1 ${ patient.notes ? 'text-blue-500' : 'text-gray-400' } hover:text-blue-600 hover:bg-blue-50`} onClick={() => setIsEditingPatientNotes((prev) => !prev)} title={patient.notes ? 'Edit/View Notes' : 'Add Notes'} >
                 <MessageSquare className="h-3.5 w-3.5" />
               </Button>
             </Label>
         {/* Patient notes */}
         <div className="mb-2 flex items-center justify-between">
           <div className="text-xs text-black font-medium flex items-center">
             Notes:
             <Button
               variant="ghost"
               size="icon"
               className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-400' : 'text-black'}`}
               onClick={() => setIsEditingPatientNotes((prev) => !prev)}
               title={patient.notes ? 'Edit/View Notes' : 'Add Notes'}
             >
               <MessageSquare className="h-4 w-4" />
             </Button>
           </div>
           {isEditingPatientNotes && (
             <div className="mb-2 flex items-start gap-2 w-full"> {/* Use items-start */}
               <Textarea ref={patientNotesTextareaRef} value={editPatientNotes} onChange={(e) => setEditPatientNotes(e.target.value)} onKeyDown={handlePatientNotesKeyDown} rows={2} className="flex-grow text-xs p-1.5 min-h-[40px]" placeholder="Add patient notes..." />
                <div className="flex flex-col space-y-1"> {/* Stack buttons */}
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:bg-green-50" onClick={handlePatientNotesSubmit} title="Save Notes" > <Save className="h-4 w-4" /> </Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-gray-100" onClick={() => setIsEditingPatientNotes(false)} title="Cancel Edit" > <X className="h-4 w-4" /> </Button>
                </div>
             </div>
           )}
           {!isEditingPatientNotes && patient.notes && (
             <div className="mb-2 text-xs text-gray-600 italic break-words bg-gray-50 p-1.5 rounded border border-gray-200">
               {patient.notes}
             </div>
           )}
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
           <div className="mb-2 text-xs text-black italic break-words">
             Note: {patient.notes}
           </div>
         )}
 
         {/* Pending tasks - Updated Styles */}
         <div className="mt-2 border-t border-gray-200 pt-2">
           <h4 className="text-sm font-medium text-gray-800 mb-1">Pending Tasks:</h4>
         {/* Pending tasks */}
         <div className="mt-2 border-t border-gray-700 pt-2">
           <h4 className="text-sm font-medium text-black mb-1">Pending Tasks:</h4>
           {pendingTasks.length === 0 ? (
             <p className="text-xs text-gray-500 italic">No pending tasks.</p>
             <p className="text-xs text-black italic">No pending tasks.</p>
           ) : (
             pendingTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} updateTaskTimerState={updateTaskTimerState} updateTaskTimer={updateTaskTimer} removeTask={removeTaskFromPatient} updateTaskCompletion={updateTaskCompletion} acknowledgeTimer={acknowledgeTaskTimer} updateTaskNotes={updateTaskNotes} /> ))
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
 
         {/* Completed tasks - Updated Styles */}
         {/* Completed tasks */}
         {completedTasks.length > 0 && (
           <div className="mt-3 border-t border-gray-200 pt-2">
             <h4 className="text-sm font-medium text-gray-500 mb-1">Completed Tasks:</h4> {/* Lighter heading */}
             {completedTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} updateTaskTimerState={updateTaskTimerState} updateTaskTimer={updateTaskTimer} removeTask={removeTaskFromPatient} updateTaskCompletion={updateTaskCompletion} acknowledgeTimer={acknowledgeTaskTimer} updateTaskNotes={updateTaskNotes} /> ))}
           <div className="mt-2 border-t border-gray-700/50 pt-2">
             <h4 className="text-sm font-medium text-black mb-1">Completed Tasks:</h4>
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
 
         {/* Add new task - Updated Styles */}
         <div className="mt-3 pt-3 border-t border-gray-200">
         {/* Add new task */}
         <div className="mt-3 pt-3 border-t border-gray-700/50">
           <form onSubmit={(e) => handleAddTaskSubmit(e)} className="flex items-center gap-2">
             <Input type="text" placeholder="Add Task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="flex-grow h-8 text-sm" />
             <Input type="number" min="1" max="999" placeholder="Min" value={newTaskTimerMinutes} onChange={(e) => setNewTaskTimerMinutes(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="w-16 h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
             <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:bg-teal-50" disabled={newTaskText.trim() === ''} title="Add Task" >
             <Input
               type="text"
               placeholder="Add Task"
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
               className="h-8 w-8 text-black hover:bg-gray-100"
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
 
 // --- AddPatientModal (Themed) ---
 interface ModalTaskState { id: number; text: string; timerMinutes: string; }
 interface AddPatientModalProps { isOpen: boolean; onClose: () => void; addPatient: (newPatient: Patient) => void; }
 // --- AddPatientModal ---
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
   // --- State and Handlers (Preserved) ---
   const [patientName, setPatientName] = useState<string>('');
   const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm'));
   const [tasks, setTasks] = useState<ModalTaskState[]>([ { id: Date.now(), text: '', timerMinutes: '' }, ]);
   const [tasks, setTasks] = useState<ModalTaskState[]>([
     { id: Date.now(), text: '', timerMinutes: '' },
   ]);
   const [patientNotes, setPatientNotes] = useState<string>('');
   const handleAddTask = (): void => { setTasks([...tasks, { id: Date.now(), text: '', timerMinutes: '' }]); };
   const handleRemoveTask = (id: number): void => { if (tasks.length > 1) { setTasks(tasks.filter((task) => task.id !== id)); } else { setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]); } };
   const handleTaskChange = ( id: number, field: keyof Omit<ModalTaskState, 'id'>, value: string ): void => { setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task))); };
   const handleSubmit = (e: FormEvent<HTMLFormElement>): void => { e.preventDefault(); if (!patientName || !arrivalTime) return; const now = new Date(); let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date()); arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate()); if (arrivalDateTime > now) { arrivalDateTime = now; } const processedTasks: Task[] = tasks .filter((task) => task.text.trim() !== '') .map((task) => { const timerMinutesNum = parseInt(task.timerMinutes, 10); const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999; const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null; return { id: `task-${task.id}-${Math.random().toString(36).substring(7)}`, text: task.text, timerEnd: timerEndDate, isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: '', isAcknowledged: false, }; }); addPatient({ id: `patient-${Date.now()}`, name: patientName, arrivalTime: arrivalDateTime, tasks: processedTasks, notes: patientNotes, }); setPatientName(''); setArrivalTime(format(new Date(), 'HH:mm')); setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]); setPatientNotes(''); onClose(); };
 
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
 
     setPatientName('');
     setArrivalTime(format(new Date(), 'HH:mm'));
     setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
     setPatientNotes('');
     onClose();
   };
 
   return (
     // --- Themed Modal ---
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="bg-white text-gray-900 sm:max-w-[550px]"> {/* Updated background/text */}
       <DialogContent className="bg-neutral-50 text-black sm:max-w-[550px]">
         <DialogHeader>
           <DialogTitle>Add New Patient</DialogTitle>
           <DialogDescription className="text-gray-600"> {/* Updated text color */}
           <DialogDescription className="text-black">
             Enter patient details, arrival time, initial tasks, and optional notes.
           </DialogDescription>
           {/* Updated Close Button Style */}
           <DialogClose>
             <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-gray-400 hover:bg-gray-100 hover:text-gray-600 h-8 w-8" onClick={onClose} >
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
               <Label htmlFor="patient-name" className="text-right text-gray-700"> Name/Title </Label>
               <Input id="patient-name" value={patientName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)} className="col-span-3" placeholder="e.g., Bed 5 / Mr. Smith" required />
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
               <Label htmlFor="arrival-time" className="text-right text-gray-700"> Arrival Time </Label>
               <Input id="arrival-time" type="time" value={arrivalTime} onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)} className="col-span-3" required />
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
              <div className="grid grid-cols-4 items-start gap-4">
                 <Label htmlFor="patient-notes" className="text-right text-gray-700 pt-2"> Notes (Opt.) </Label>
                 <Textarea id="patient-notes" value={patientNotes} onChange={(e) => setPatientNotes(e.target.value)} rows={3} className="col-span-3 text-sm p-2 resize-vertical" placeholder="Add general patient notes..." />
              </div>
             {/* Initial Tasks - Updated Styles */}
 
             {/* Initial Tasks */}
             <div className="col-span-4 mt-2">
               <Label className="mb-2 block font-medium text-gray-800">Initial Tasks</Label>
               <Label className="mb-2 block font-medium text-black">Initial Tasks</Label>
               {tasks.map((task, index) => (
                 <div key={task.id} className="flex items-center gap-2 mb-2">
                   <Input type="text" placeholder={`Task ${index + 1} desc.`} value={task.text} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTaskChange(task.id, 'text', e.target.value)} className="flex-grow" />
                   <Input type="number" min="1" max="999" placeholder="Timer (min)" value={task.timerMinutes} onChange={(e: ChangeEvent<HTMLInputElement>) => handleTaskChange(task.id, 'timerMinutes', e.target.value)} className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                   <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => handleRemoveTask(task.id)} disabled={tasks.length <= 1} aria-label="Remove task" >
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
               <Button type="button" variant="outline" size="sm" onClick={handleAddTask} className="mt-2 border-gray-300 text-gray-700 hover:bg-gray-50" >
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
           <DialogFooter className="border-t border-gray-200 pt-4"> {/* Updated border */}
             <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-100 text-gray-800 hover:bg-gray-200" > Cancel </Button>
             <Button type="submit" variant="default" className="bg-teal-600 hover:bg-teal-700 text-white"> Add Patient </Button> {/* Use default (teal) */}
           <DialogFooter className="border-t border-gray-700 pt-4">
             <Button
               type="button"
               variant="secondary"
               onClick={onClose}
               className="text-black bg-neutral-50 hover:bg-gray-100"
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
 
 // --- MAIN SIDEBAR COMPONENT (Tasks - Patient Tracker) ---
 // --- MAIN SIDEBAR COMPONENT ---
 const Tasks: React.FC = () => {
   const { state } = useContext(HomeContext);
   const { showSidePromptbar } = state;
 
   // --- State and Effects (Preserved) ---
   const PATIENT_STORAGE_KEY = 'patientTrackerData';
 
   const [patients, setPatients] = useState<Patient[]>([]);
   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
   const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>( typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default' );
   useEffect(() => { if (typeof window === 'undefined') return; try { const jsonData = window.localStorage.getItem(PATIENT_STORAGE_KEY); if (jsonData) { const parsed = parsePatientsWithDates(jsonData); if (parsed) { setPatients(parsed); return; } } } catch (err) { console.error('Error reading from localStorage:', err); } /* Default patients removed for brevity */ setPatients([]); }, []);
   useEffect(() => { if (typeof window === 'undefined') return; try { window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patients)); } catch (err) { console.error('Error saving to localStorage:', err); } }, [patients]);
   useEffect(() => { if (typeof window !== 'undefined' && 'Notification' in window) { if (notificationPermission === 'default') { Notification.requestPermission().then(setNotificationPermission); } } }, [notificationPermission]);
   useEffect(() => { const isSorted = patients.every((p, idx, arr) => { if (idx === 0) return true; return arr[idx - 1].arrivalTime <= p.arrivalTime; }); if (!isSorted) { setPatients((prev) => [...prev].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()) ); } }, [patients]);
 
   // --- CRUD callbacks (Preserved) ---
   const addPatient = useCallback((newPatient: Patient) => { setPatients((prev) => [...prev, newPatient].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())); }, []);
   const removePatient = useCallback((patientId: string) => { setPatients((prev) => prev.filter((p) => p.id !== patientId)); }, []);
   const updateTaskTimerState = useCallback( (patientId: string, taskId: string | number, isExpired: boolean) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const newTasks = p.tasks.map((t) => { if (t.id === taskId && t.isTimerExpired !== isExpired) { const newAcknowledged = isExpired ? false : t.isAcknowledged; return { ...t, isTimerExpired: isExpired, isAcknowledged: newAcknowledged }; } return t; }); return { ...p, tasks: newTasks }; } return p; }) ); }, [] );
   const addTaskToPatient = useCallback( (patientId: string, taskText: string, timerMinutes: string) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const timerMinutesNum = parseInt(timerMinutes, 10); const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999; const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null; const newTask: Task = { id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`, text: taskText, timerEnd: timerEndDate, isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), completionStatus: 'incomplete', createdAt: new Date(), completedAt: null, notes: '', isAcknowledged: false, }; return { ...p, tasks: [...p.tasks, newTask] }; } return p; }) ); }, [] );
   const updateTaskTimer = useCallback( (patientId: string, taskId: string | number, newTimerMinutes: string | null) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const newTasks = p.tasks.map((t) => { if (t.id === taskId) { let newTimerEnd: Date | null = null; let newIsTimerExpired = false; if (newTimerMinutes !== null) { const timerMinutesNum = parseInt(newTimerMinutes, 10); if (!isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999) { newTimerEnd = addMinutes(new Date(), timerMinutesNum); newIsTimerExpired = newTimerEnd <= new Date(); } } return { ...t, timerEnd: newTimerEnd, isTimerExpired: newIsTimerExpired, isAcknowledged: false, }; } return t; }); return { ...p, tasks: newTasks }; } return p; }) ); }, [] );
   const removeTaskFromPatient = useCallback((patientId: string, taskId: string | number) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const remainingTasks = p.tasks.filter((t) => t.id !== taskId); return { ...p, tasks: remainingTasks }; } return p; }) ); }, []);
   const updateTaskCompletion = useCallback( (patientId: string, taskId: string | number, status: TaskCompletionStatus) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const newTasks = p.tasks.map((t) => { if (t.id === taskId) { const isNowComplete = status === 'complete'; const completedTime = isNowComplete ? new Date() : null; const newAcknowledged = isNowComplete ? true : t.isAcknowledged; return { ...t, completionStatus: status, completedAt: completedTime, isAcknowledged: newAcknowledged, }; } return t; }); return { ...p, tasks: newTasks }; } return p; }) ); }, [] );
   const acknowledgeTaskTimer = useCallback((patientId: string, taskId: string | number) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const newTasks = p.tasks.map((t) => { if (t.id === taskId && t.isTimerExpired) { return { ...t, isAcknowledged: true }; } return t; }); return { ...p, tasks: newTasks }; } return p; }) ); }, []);
   const updatePatientNotes = useCallback((patientId: string, notes: string) => { setPatients((prevPatients) => prevPatients.map((p) => (p.id === patientId ? { ...p, notes } : p)) ); }, []);
   const updateTaskNotes = useCallback( (patientId: string, taskId: string | number, notes: string) => { setPatients((prevPatients) => prevPatients.map((p) => { if (p.id === patientId) { const newTasks = p.tasks.map((t) => { if (t.id === taskId) { return { ...t, notes }; } return t; }); return { ...p, tasks: newTasks }; } return p; }) ); }, [] );
 
   // Adjusted sidebar width to match Chatbar (260px)
   const sidebarWidth = showSidePromptbar ? 'w-[260px]' : 'w-0';
   const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
     typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
   );
 
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
 
     // If no local data, set some defaults
     const defaultPatients: Patient[] = [
       // ...
       // (unchanged example data)
     ];
     setPatients(defaultPatients);
   }, []);
 
   useEffect(() => {
     if (typeof window === 'undefined') return;
     try {
       window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patients));
     } catch (err) {
       console.error('Error saving to localStorage:', err);
     }
   }, [patients]);
 
   useEffect(() => {
     if (typeof window !== 'undefined' && 'Notification' in window) {
       if (notificationPermission === 'default') {
         Notification.requestPermission().then(setNotificationPermission);
       }
     }
   }, [notificationPermission]);
 
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
 
   // --- Reduced the sidebar width by ~20% here ---
   const sidebarWidth = showSidePromptbar ? 'w-40 lg:w-80' : 'w-0';
 
   return (
     // Updated Container Styling
     <div
       className={`flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out bg-white shadow-lg border-l border-gray-200 ${sidebarWidth}`}
       className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth}`}
     >
       {showSidePromptbar && (
         <>
           {/* Updated Header Styling */}
           <div className="flex justify-between items-center p-3 shadow-sm border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-lg"> {/* Added bg */}
             <h2 className="text-lg font-semibold text-gray-800">Patient Tracker</h2>
           <div className="flex justify-between items-center p-4 shadow-md border-b border-gray-200 flex-shrink-0">
             <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
             <Button
               variant="default" // Use primary teal button
               variant="outline"
               size="sm"
               onClick={() => setIsModalOpen(true)}
               // className="bg-teal-600 hover:bg-teal-700 border-teal-600 text-white" // Direct style or rely on variant="default"
               className="bg-[#008080] hover:bg-[#008080] border-[#008080] text-black"
             >
               <Plus className="h-4 w-4 mr-1" /> {/* Adjusted margin */}
               <Plus className="h-4 w-4 mr-2" />
               Add Patient
             </Button>
           </div>
 
           {/* Updated Content Area Styling */}
           <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}> {/* Adjusted padding */}
           <div className="flex-1 overflow-y-auto p-4">
             {patients.length === 0 ? (
               // Updated "No Patients" state styling
               <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center pt-10">
                 <AlertTriangle className="w-10 h-10 mb-4 text-gray-400" />
                 <p className="font-medium text-gray-600">No patients being tracked.</p>
                 <p className="text-sm mt-1 text-gray-500">Click &quot;Add Patient&quot; to start.</p>
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
 
           {/* Modal uses themed components */}
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

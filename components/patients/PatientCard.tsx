// components/patients/PatientCard.tsx
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
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
  formatRelative,
  isValid,
} from 'date-fns';

// Import centralized types
import { Patient, Task, TaskCompletionStatus } from '@/types/patient';

// Import centralized UI components (using lowercase filenames)
import { Button } from '@/components/ui/button'; // <= Changed path
import { Input } from '@/components/ui/input';   // <= Changed path
// Label is not used directly in PatientCard or TaskItem as defined previously
// import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'; // <= Assuming Card.tsx uses PascalCase filename

// --- Helper Functions (Moved from Tasks.tsx) ---
const getBorderColor = (minutes: number): string => {
  if (minutes >= 300) return 'border-red-500 animate-pulse-border';
  if (minutes >= 240) return 'border-red-500';
  if (minutes >= 120) return 'border-amber-500';
  return 'border-green-500';
};

const getBackgroundColor = (minutes: number): string => {
  if (minutes >= 300) return 'bg-neutral-50';
  if (minutes >= 240) return 'bg-neutral-50';
  if (minutes >= 120) return 'bg-neutral-50';
  return 'bg-neutral-50';
};


// --- TaskItem component (Internal to this file) ---
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
          if (
            !task.isAcknowledged &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
             new Notification(`Task Timer Expired: ${patientName}`, {
                 body: task.text,
                 tag: `task-${task.id}`,
             });
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
    task.timerEnd, task.id, task.completionStatus, task.isAcknowledged,
    patientId, patientName, task.text, updateTaskTimerState, isTimerExpired,
  ]);

  // Effect for focusing timer input
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

  // Effect for focusing notes textarea
  useEffect(() => {
    if (isEditingNotes) {
      setEditNotes(task.notes || '');
      setTimeout(() => notesTextareaRef.current?.focus(), 0);
    }
  }, [isEditingNotes, task.notes]);

  // Event Handlers
  const handleTimerEditSubmit = () => {
    if (!isEditingTimer) return;
    const minutesToSet = editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes;
    updateTaskTimer(patientId, task.id, minutesToSet);
    setIsEditingTimer(false);
  };
  const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => setEditTimerMinutes(e.target.value);
  const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTimerEditSubmit();
    else if (e.key === 'Escape') setIsEditingTimer(false);
  };
  const handleNotesEditSubmit = () => {
    if (!isEditingNotes) return;
    updateTaskNotes(patientId, task.id, editNotes);
    setIsEditingNotes(false);
  };
  const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => setEditNotes(e.target.value);
  const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNotesEditSubmit(); }
    else if (e.key === 'Escape') { setIsEditingNotes(false); setEditNotes(task.notes || ''); }
  };
  const handleCompletionToggle = () => {
    let nextStatus: TaskCompletionStatus;
    switch (task.completionStatus) {
      case 'incomplete': nextStatus = 'in-progress'; break;
      case 'in-progress': nextStatus = 'complete'; break;
      case 'complete': nextStatus = 'incomplete'; break;
      default: nextStatus = 'incomplete'; break;
    }
    updateTaskCompletion(patientId, task.id, nextStatus);
  };
   const handleSnooze = () => updateTaskTimer(patientId, task.id, '15');
   const getCompletionIcon = () => {
     switch (task.completionStatus) {
       case 'in-progress': return <MinusSquare className="h-4 w-4 text-yellow-400" />;
       case 'complete': return <CheckSquare className="h-4 w-4 text-green-400" />;
       case 'incomplete': default: return <Square className="h-4 w-4 text-gray-500" />;
     }
   };

  // Styling logic
  let taskItemClasses = 'flex flex-col py-1.5 group';
  let taskTextStyle = 'text-sm';
  let timerTextStyle = 'text-xs font-mono';
   if (task.completionStatus === 'complete') {
     taskTextStyle += ' line-through text-gray-500';
     timerTextStyle += ' text-gray-500';
   } else if (isTimerExpired && !task.isAcknowledged) {
     taskItemClasses += ' animate-flash';
     taskTextStyle += ' text-red-500 font-medium';
     timerTextStyle += ' text-red-500 font-semibold';
   } else if (isTimerExpired && task.isAcknowledged) {
     taskTextStyle += ' text-red-700';
     timerTextStyle += ' text-red-700';
   } else if (task.timerEnd) {
      taskTextStyle += ' text-gray-800';
      timerTextStyle += ' text-gray-600';
   } else {
     taskTextStyle += ' text-gray-800';
     timerTextStyle += ' text-gray-400';
   }

  // JSX - Uses PascalCase <Button /> and <Input />
  return (
    <div className={taskItemClasses}>
      {/* Main row */}
      <div className="flex items-center space-x-2 w-full">
        <Button // Usage remains PascalCase
          variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
          onClick={handleCompletionToggle} title={`Status: ${task.completionStatus}. Click to change.`}
        > {getCompletionIcon()} </Button>
        <span className={`flex-1 cursor-default ${taskTextStyle}`}>{task.text}</span>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {isEditingTimer ? (
            <>
              <Input // Usage remains PascalCase
                ref={timerInputRef} type="number" min="0" max="999"
                value={editTimerMinutes} onChange={handleTimerInputChange} onKeyDown={handleTimerInputKeyDown}
                className="w-14 h-6 text-xs px-1" placeholder="Min"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:text-green-600" onClick={handleTimerEditSubmit} title="Save Timer"> <Save className="h-3 w-3" /> </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-600" onClick={() => setIsEditingTimer(false)} title="Cancel Edit"> <X className="h-3 w-3" /> </Button>
            </>
          ) : (
            <>
              {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:text-yellow-600" onClick={() => acknowledgeTimer(patientId, task.id)} title="Acknowledge Timer"> <BellOff className="h-4 w-4" /> </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600" onClick={handleSnooze} title="Snooze 15 min"> <AlarmClockOff className="h-4 w-4" /> </Button>
                </>
              )}
              {task.timerEnd && task.completionStatus !== 'complete' && (
                <span className={timerTextStyle}> <Clock className="inline h-3 w-3 mr-1" /> {isTimerExpired ? 'Expired' : timeRemaining} </span>
              )}
              {task.completionStatus !== 'complete' && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTimer(true)} title={task.timerEnd ? 'Edit Timer' : 'Add Timer'} > {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />} </Button>
              )}
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 flex-shrink-0 ${task.notes ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity`} onClick={() => setIsEditingNotes((prev) => !prev)} title={task.notes ? 'Edit/View Notes' : 'Add Notes'} > <MessageSquare className="h-3 w-3" /> </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeTask(patientId, task.id)} title="Remove Task" > <Trash2 className="h-3 w-3" /> </Button>
      </div>

      {/* Notes editing section */}
      {isEditingNotes && (
        <div className="mt-1.5 pl-8 pr-2 flex items-center gap-2 w-full">
          <textarea ref={notesTextareaRef} value={editNotes} onChange={handleNotesInputChange} onKeyDown={handleNotesKeyDown} placeholder="Add task notes..." rows={2} className="flex-grow text-xs bg-white border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none" />
          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:text-green-600 self-start" onClick={handleNotesEditSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-600 self-start" onClick={() => setIsEditingNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button>
        </div>
      )}
      {!isEditingNotes && task.notes && ( <div className="mt-1 pl-8 pr-2 text-xs text-gray-600 italic w-full break-words"> Note: {task.notes} </div> )}

      {/* Dates info */}
      <div className="pl-8 text-xs text-gray-500 mt-0.5">
         Added: {formatRelative(task.createdAt, new Date())}
         {task.completionStatus === 'complete' && task.completedAt && ( <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span> )}
      </div>
    </div>
  );
};


// --- PatientCard Component ---
export interface PatientCardProps {
  patient: Patient;
  removePatient: (patientId: string) => void;
  updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
  addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void;
  updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
  removeTaskFromPatient: (patientId: string, taskId: string | number) => void;
  updateTaskCompletion: ( patientId: string, taskId: string | number, status: TaskCompletionStatus ) => void;
  acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void;
  updatePatientNotes: (patientId: string, notes: string) => void;
  updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient, removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer,
  removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes,
}) => {
  const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() => differenceInMinutes(new Date(), patient.arrivalTime));
  const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>('');
  const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false);
  const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || '');
  const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Effect for Length of Stay calculation
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

  // Effect for focusing patient notes textarea
  useEffect(() => {
    if (isEditingPatientNotes) {
      setEditPatientNotes(patient.notes || '');
      setTimeout(() => patientNotesTextareaRef.current?.focus(), 0);
    }
  }, [isEditingPatientNotes, patient.notes]);

  // Event Handlers
  const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (newTaskText.trim() === '') return;
    addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes);
    setNewTaskText(''); setNewTaskTimerMinutes('');
  };
  const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTaskSubmit(); }
  };
  const handlePatientNotesSubmit = () => {
    if (!isEditingPatientNotes) return;
    updatePatientNotes(patient.id, editPatientNotes);
    setIsEditingPatientNotes(false);
  };
  const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePatientNotesSubmit(); }
    else if (e.key === 'Escape') { setIsEditingPatientNotes(false); setEditPatientNotes(patient.notes || ''); }
  };

  // Prepare styles and task filtering
  const borderColor = getBorderColor(lengthOfStayMinutes);
  const bgColor = getBackgroundColor(lengthOfStayMinutes);
  const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
  const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');

  // JSX - Uses PascalCase <Button />, <Input />, <Card /> etc.
  return (
    <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500 flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-gray-900">{patient.name}</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-600" onClick={() => removePatient(patient.id)} > <X className="h-4 w-4" /> </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-xs text-gray-700 mb-2">
          <Clock className="inline h-3 w-3 mr-1" />
          Length of Stay: <span className="font-semibold text-gray-900">{lengthOfStayFormatted}</span>
          <span className="ml-2 text-gray-600"> (Arrival: {format(patient.arrivalTime, 'HH:mm')}) </span>
        </div>
        <div className="mb-2">
           <div className="flex items-center justify-between">
                <div className="text-xs text-gray-800 font-medium flex items-center"> Notes:
                   <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600`} onClick={() => setIsEditingPatientNotes((prev) => !prev)} title={patient.notes ? 'Edit/View Notes' : 'Add Notes'} > <MessageSquare className="h-4 w-4" /> </Button>
                </div>
           </div>
           {isEditingPatientNotes && (
              <div className="mt-1 flex items-center gap-2 w-full">
                 <textarea ref={patientNotesTextareaRef} value={editPatientNotes} onChange={(e) => setEditPatientNotes(e.target.value)} onKeyDown={handlePatientNotesKeyDown} rows={2} className="flex-grow text-xs bg-white border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none" placeholder="Add patient notes..." />
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500 hover:text-green-600" onClick={handlePatientNotesSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-600" onClick={() => setIsEditingPatientNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button>
              </div>
           )}
           {!isEditingPatientNotes && patient.notes && ( <div className="mt-1 text-xs text-gray-600 italic break-words"> Note: {patient.notes} </div> )}
        </div>
        <div className="flex-1 mt-2 border-t border-gray-300 pt-2 overflow-y-auto">
           <div>
              <h4 className="text-sm font-medium text-gray-800 mb-1">Pending Tasks:</h4>
              {pendingTasks.length === 0 ? ( <p className="text-xs text-gray-500 italic">No pending tasks.</p> ) : (
                pendingTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} updateTaskTimerState={updateTaskTimerState} updateTaskTimer={updateTaskTimer} removeTask={removeTaskFromPatient} updateTaskCompletion={updateTaskCompletion} acknowledgeTimer={acknowledgeTaskTimer} updateTaskNotes={updateTaskNotes} /> ))
              )}
           </div>
           {completedTasks.length > 0 && (
             <div className="mt-3 border-t border-gray-300/50 pt-3">
                <h4 className="text-sm font-medium text-gray-800 mb-1">Completed Tasks:</h4>
                {completedTasks.map((task) => ( <TaskItem key={task.id} task={task} patientId={patient.id} patientName={patient.name} updateTaskTimerState={updateTaskTimerState} updateTaskTimer={updateTaskTimer} removeTask={removeTaskFromPatient} updateTaskCompletion={updateTaskCompletion} acknowledgeTimer={acknowledgeTaskTimer} updateTaskNotes={updateTaskNotes} /> ))}
             </div>
           )}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-300/50">
          <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
            <Input type="text" placeholder="Add Task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="flex-grow h-8 text-sm" />
            <Input type="number" min="1" max="999" placeholder="Min" value={newTaskTimerMinutes} onChange={(e) => setNewTaskTimerMinutes(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="w-16 h-8 text-xs" />
            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100" disabled={newTaskText.trim() === ''} title="Add Task" > <Plus className="h-4 w-4" /> </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
PatientCard.displayName = 'PatientCard';

export { PatientCard }; // Export only PatientCard

// components/patients/PatientCard.tsx
'use client';

import React, {
  useState, useEffect, useCallback, ChangeEvent, FormEvent, useRef, KeyboardEvent,
} from 'react';
import {
  Plus, Clock, AlertTriangle, X, Edit3, Save, Trash2, CheckSquare, Square, MinusSquare, MessageSquare, BellOff, AlarmClockOff,
} from 'lucide-react';
import {
  format, differenceInMinutes, addMinutes, formatDistanceToNowStrict, formatRelative, isValid,
} from 'date-fns';

// Import centralized types
import { Patient, Task, TaskCompletionStatus } from '@/types/patient';

// Import centralized UI components (using lowercase filenames for button/input)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

// --- Helper Functions (Keep as they were) ---
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
interface TaskItemProps { // Interface remains the same
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

const TaskItem: React.FC<TaskItemProps> = ({ // Component definition remains the same
  task, patientId, patientName, updateTaskTimerState, updateTaskTimer, removeTask, updateTaskCompletion, acknowledgeTimer, updateTaskNotes,
}) => {
  // State and Effects remain the same
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
  // Handlers remain the same
  const handleTimerEditSubmit = () => {/* ... */};
  const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => {/* ... */};
  const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {/* ... */};
  const handleNotesEditSubmit = () => {/* ... */};
  const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {/* ... */};
  const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {/* ... */};
  const handleCompletionToggle = () => {/* ... */};
  const handleSnooze = () => {/* ... */};
  const getCompletionIcon = () => {/* ... */};


  // --- Styling Logic (Revert to original text colors for consistency) ---
  let taskItemClasses = 'flex flex-col py-1.5 group';
  let taskTextStyle = 'text-sm';
  let timerTextStyle = 'text-xs font-mono';
  if (task.completionStatus === 'complete') {
    // Original had text-gray-300 - might be hard to see on light bg? Keep for now.
    taskTextStyle += ' line-through text-gray-300';
    timerTextStyle += ' text-gray-300';
  } else if (isTimerExpired && !task.isAcknowledged) {
    taskItemClasses += ' animate-flash'; // Keep flash animation
    taskTextStyle += ' text-red-400 font-medium'; // Original color
    timerTextStyle += ' text-red-400 font-semibold'; // Original color
  } else if (isTimerExpired && task.isAcknowledged) {
    taskTextStyle += ' text-red-600'; // Original color
    timerTextStyle += ' text-red-600'; // Original color
  } else if (task.timerEnd) {
    taskTextStyle += ' text-black'; // Original color
    timerTextStyle += ' text-black'; // Original color
  } else {
    taskTextStyle += ' text-black'; // Original color
    timerTextStyle += ' text-gray-200'; // Original color (might be hard to see?)
  }

  return (
    <div className={taskItemClasses}>
      {/* Main row */}
      <div className="flex items-center space-x-2 w-full">
        {/* Completion Button - Revert size="icon" attempt, keep className */}
        <Button
          variant="ghost"
          className="h-6 w-6 flex-shrink-0" // Original classes
          onClick={handleCompletionToggle}
          title={`Status: ${task.completionStatus}. Click to change.`}
        >
          {getCompletionIcon()}
        </Button>

        <span className={`flex-1 cursor-default ${taskTextStyle}`}>{task.text}</span>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {isEditingTimer ? ( // Editing Timer View
            <>
              {/* Input, Save, Cancel buttons - styling seems okay from previous state */}
              <Input ref={timerInputRef} type="number" min="0" max="999" value={editTimerMinutes} onChange={handleTimerInputChange} onKeyDown={handleTimerInputKeyDown} className="w-14 h-6 text-xs px-1" placeholder="Min" />
              <Button variant="ghost" size="sm" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={handleTimerEditSubmit} title="Save Timer"> <Save className="h-3 w-3" /> </Button> {/* Original colors */}
              <Button variant="ghost" size="sm" className="h-6 w-6 text-gray-400 hover:text-gray-200" onClick={() => setIsEditingTimer(false)} title="Cancel Edit"> <X className="h-3 w-3" /> </Button> {/* Original colors */}
            </>
          ) : ( // Display/Action Timer View
            <>
              {/* Acknowledge / Snooze Buttons - Revert colors */}
              {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                <>
                  <Button variant="ghost" size="sm" className="h-6 w-6 text-yellow-400 hover:text-yellow-300" onClick={() => acknowledgeTimer(patientId, task.id)} title="Acknowledge Timer"> <BellOff className="h-4 w-4" /> </Button> {/* Original colors */}
                  <Button variant="ghost" size="sm" className="h-6 w-6 text-blue-400 hover:text-blue-300" onClick={handleSnooze} title="Snooze 15 min"> <AlarmClockOff className="h-4 w-4" /> </Button> {/* Original colors */}
                </>
              )}
              {/* Timer Display */}
              {task.timerEnd && task.completionStatus !== 'complete' && (
                <span className={timerTextStyle}> <Clock className="inline h-3 w-3 mr-1" /> {isTimerExpired ? 'Expired' : timeRemaining} </span>
              )}
              {/* Edit/Add Timer Button - === RESTORE ORIGINAL OPACITY STYLING === */}
              {task.completionStatus !== 'complete' && (
                  <Button
                      variant="ghost"
                      size="sm" // Keep compatible size
                      className="h-6 w-6 text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" // Original classes (incl. opacity)
                      onClick={() => setIsEditingTimer(true)}
                      title={task.timerEnd ? 'Edit Timer' : 'Add Timer'}
                  >
                      {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </Button>
              )}
               {/* === END OF OPACITY RESTORE === */}
            </>
          )}
        </div>

        {/* Notes Button - === RESTORE ORIGINAL OPACITY STYLING === */}
        <Button
          variant="ghost"
          size="sm" // Keep compatible size
          className={`h-6 w-6 ml-1 flex-shrink-0 ${task.notes ? 'text-blue-400' : 'text-gray-500'} hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`} // Original classes (incl. opacity, note color logic)
          onClick={() => setIsEditingNotes((prev) => !prev)}
          title={task.notes ? 'Edit/View Notes' : 'Add Notes'}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
        {/* === END OF OPACITY RESTORE === */}

        {/* Remove Task Button - === RESTORE ORIGINAL OPACITY STYLING === */}
        <Button
          variant="ghost"
          size="sm" // Keep compatible size
          className="h-6 w-6 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" // Original classes (incl. opacity)
          onClick={() => removeTask(patientId, task.id)}
          title="Remove Task"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {/* === END OF OPACITY RESTORE === */}
      </div>

      {/* Notes editing section - revert styles if needed */}
      {isEditingNotes && (
        <div className="mt-1.5 pl-8 pr-2 flex items-center gap-2 w-full">
          <textarea
             ref={notesTextareaRef} value={editNotes} onChange={handleNotesInputChange} onKeyDown={handleNotesKeyDown} placeholder="Add task notes..." rows={2}
             className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none" // Original class
          />
          {/* Revert button colors if needed */}
          <Button variant="ghost" size="sm" className="h-6 w-6 text-green-400 hover:text-green-300 self-start" onClick={handleNotesEditSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button> {/* Original colors */}
          <Button variant="ghost" size="sm" className="h-6 w-6 text-gray-400 hover:text-gray-200 self-start" onClick={() => setIsEditingNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button> {/* Original colors */}
        </div>
      )}
      {/* Notes display - revert styles */}
      {!isEditingNotes && task.notes && (
         <div className="mt-1 pl-8 pr-2 text-xs text-gray-200 italic w-full break-words"> {/* Original class */}
            Note: {task.notes}
         </div>
      )}

      {/* Dates info - revert styles */}
      <div className="pl-8 text-xs text-gray-400 mt-0.5"> {/* Original class */}
         Added: {formatRelative(task.createdAt, new Date())}
         {task.completionStatus === 'complete' && task.completedAt && ( <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span> )}
      </div>
    </div>
  );
};


// --- PatientCard Component ---
export interface PatientCardProps { // Interface remains same
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

const PatientCard: React.FC<PatientCardProps> = ({ // Component definition remains same
    patient, removePatient, updateTaskTimerState, addTaskToPatient, updateTaskTimer,
    removeTaskFromPatient, updateTaskCompletion, acknowledgeTaskTimer, updatePatientNotes, updateTaskNotes,
}) => {
    // State, Effects, Handlers remain the same
    const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() => differenceInMinutes(new Date(), patient.arrivalTime));
    const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
    const [newTaskText, setNewTaskText] = useState<string>('');
    const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>('');
    const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false);
    const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || '');
    const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { /* ... LOS effect ... */ }, [patient.arrivalTime]);
    useEffect(() => { /* ... focus notes effect ... */ }, [isEditingPatientNotes, patient.notes]);
    const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => {/* ... */};
    const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {/* ... */};
    const handlePatientNotesSubmit = () => {/* ... */};
    const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {/* ... */};
    // Style vars and task filtering remain same
    const borderColor = getBorderColor(lengthOfStayMinutes);
    const bgColor = getBackgroundColor(lengthOfStayMinutes);
    const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
    const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');


    return (
        <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500 flex flex-col`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium text-black">{patient.name}</CardTitle> {/* Original color */}
                {/* Revert Patient Remove button style */}
                <Button
                    variant="ghost"
                    size="sm" // Keep compatible size
                    className="h-6 w-6 text-black hover:text-red-500" // Original classes
                    onClick={() => removePatient(patient.id)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                 {/* Revert LOS text colors */}
                <div className="text-xs text-black mb-2">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Length of Stay: <span className="font-semibold text-black">{lengthOfStayFormatted}</span>
                    <span className="ml-2 text-black">
                        (Arrival: {format(patient.arrivalTime, 'HH:mm')})
                    </span>
                </div>
                 {/* Patient Notes Section */}
                <div className="mb-2">
                   <div className="flex items-center justify-between">
                        {/* Revert Patient Notes button style */}
                        <div className="text-xs text-black font-medium flex items-center"> Notes:
                           <Button
                               variant="ghost"
                               size="sm" // Keep compatible size
                               className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-400' : 'text-black'}`} // Original class (note color logic)
                               onClick={() => setIsEditingPatientNotes((prev) => !prev)}
                               title={patient.notes ? 'Edit/View Notes' : 'Add Notes'}
                           >
                               <MessageSquare className="h-4 w-4" />
                           </Button>
                        </div>
                   </div>
                   {/* Revert Notes Edit section styles if needed */}
                   {isEditingPatientNotes && (
                      <div className="mt-1 flex items-center gap-2 w-full">
                         <textarea
                             ref={patientNotesTextareaRef} value={editPatientNotes} onChange={(e) => setEditPatientNotes(e.target.value)} onKeyDown={handlePatientNotesKeyDown} rows={2}
                             className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none" // Original class
                             placeholder="Add patient notes..."
                         />
                          {/* Revert button colors */}
                         <Button variant="ghost" size="sm" className="h-6 w-6 text-green-400 hover:text-green-300" onClick={handlePatientNotesSubmit} title="Save Notes"> <Save className="h-4 w-4" /> </Button> {/* Original colors */}
                         <Button variant="ghost" size="sm" className="h-6 w-6 text-gray-400 hover:text-gray-200" onClick={() => setIsEditingPatientNotes(false)} title="Cancel Edit"> <X className="h-4 w-4" /> </Button> {/* Original colors */}
                      </div>
                   )}
                   {/* Revert Notes display style */}
                   {!isEditingPatientNotes && patient.notes && (
                     <div className="mt-1 text-xs text-black italic break-words"> {/* Original class */}
                        Note: {patient.notes}
                     </div>
                   )}
                </div>

                {/* Tasks Section - Revert styles */}
                <div className="flex-1 mt-2 border-t border-gray-700 pt-2 overflow-y-auto"> {/* Original border color */}
                    {/* Pending tasks */}
                    <div>
                        <h4 className="text-sm font-medium text-black mb-1">Pending Tasks:</h4> {/* Original color */}
                        {pendingTasks.length === 0 ? (
                            <p className="text-xs text-black italic">No pending tasks.</p> /* Original color */
                        ) : (
                            pendingTasks.map((task) => ( <TaskItem key={task.id} task={task} /* ...props... */ /> )) // Props remain the same
                        )}
                    </div>
                    {/* Completed tasks */}
                    {completedTasks.length > 0 && (
                        <div className="mt-2 border-t border-gray-700/50 pt-2"> {/* Original border color */}
                            <h4 className="text-sm font-medium text-black mb-1">Completed Tasks:</h4> {/* Original color */}
                            {completedTasks.map((task) => ( <TaskItem key={task.id} task={task} /* ...props... */ /> ))}
                        </div>
                    )}
                </div>

                {/* Add new task Form - Revert styles */}
                <div className="mt-3 pt-3 border-t border-gray-700/50"> {/* Original border color */}
                    <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
                         {/* Inputs seem consistent */}
                        <Input type="text" placeholder="Add Task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="flex-grow h-8 text-sm" />
                        <Input type="number" min="1" max="999" placeholder="Min" value={newTaskTimerMinutes} onChange={(e) => setNewTaskTimerMinutes(e.target.value)} onKeyDown={handleNewTaskKeyDown} className="w-16 h-8 text-xs" />
                         {/* Revert Add Task button style */}
                        <Button
                            type="submit" variant="ghost" size="sm" // Keep compatible size
                            className="h-8 w-8 text-black hover:bg-gray-100" // Original classes
                            disabled={newTaskText.trim() === ''} title="Add Task"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
};
PatientCard.displayName = 'PatientCard';

export { PatientCard }; // Export only PatientCard

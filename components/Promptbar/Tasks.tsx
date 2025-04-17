@@ -1,4 +1,4 @@
 'use client';
 'use client'; // Directive for Next.js App Router
 
 import React, {
   useState,
 @@ -19,48 +19,75 @@ import {
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
   CheckSquare, // Icon for completed task
   Square, // Icon for incomplete task
   MinusSquare, // Icon for in-progress task
   MessageSquare, // Icon for notes
   BellOff, // Icon for acknowledging timer
   AlarmClockOff, // Icon for snoozing timer
 } from 'lucide-react'; // Assuming lucide-react is installed
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
 
   formatRelative, // For displaying relative dates (e.g., "yesterday at 5:00 PM")
   isValid, // To check if parsed dates are valid
   subMinutes, // Import subMinutes for creating past dates easily
 } from 'date-fns'; // Assuming date-fns is installed
 
 // --- Mock HomeContext ---
 // NOTE: This is a mock context. In a real application,
 // you would import this from its actual file path (e.g., '@/pages/api/home/home.context').
 interface HomeContextState {
   showSidePromptbar: boolean;
   // Add other state properties if needed
 }
 const defaultHomeContextState: HomeContextState = {
   showSidePromptbar: true, // Default to showing the sidebar
 };
 const HomeContext = React.createContext<{ state: HomeContextState }>({
   state: defaultHomeContextState,
 });
 // Example of a provider (you'd use this higher up in your component tree)
 // const HomeContextProvider = ({ children }) => {
 //   const [state, setState] = useState(defaultHomeContextState);
 //   // ... logic to update state
 //   return (
 //     <HomeContext.Provider value={{ state }}>{children}</HomeContext.Provider>
 //   );
 // };
 
 // --- Type Definitions ---
 
 // Defines the possible completion states for a task
 type TaskCompletionStatus = 'incomplete' | 'in-progress' | 'complete';
 
 // Enhanced Task interface with new fields
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
   id: string | number; // Unique identifier
   text: string; // Task description
   timerEnd: Date | null; // When the timer (if any) is set to expire
   isTimerExpired: boolean; // Flag indicating if the timer has passed
   completionStatus: TaskCompletionStatus; // Current status of the task
   createdAt: Date; // When the task was created
   completedAt: Date | null; // When the task was marked as complete
   notes: string; // Additional notes specific to the task
   isAcknowledged: boolean; // Flag indicating if an expired timer has been acknowledged by the user
 }
 
 // Enhanced Patient interface with notes field
 interface Patient {
   id: string;
   name: string;
   arrivalTime: Date;
   tasks: Task[];
   notes: string;
   id: string; // Unique identifier
   name: string; // Patient name or identifier (e.g., Bed number)
   arrivalTime: Date; // Time the patient arrived
   tasks: Task[]; // List of tasks associated with the patient
   notes: string; // General notes specific to the patient
 }
 
 // --- Mock shadcn/ui Components ---
 // Basic implementations for demonstration. Assumes Tailwind CSS.
 interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
   size?: 'default' | 'sm' | 'lg' | 'icon';
 @@ -69,28 +96,34 @@ interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 }
 const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
   ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
     // Base styles adjusted slightly for better focus rings on light/dark mix
     const baseStyle =
       'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
       'ring-offset-background transition-colors focus-visible:outline-none ' +
       'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
       'ring-offset-white dark:ring-offset-gray-100 transition-colors focus-visible:outline-none ' + // Adjusted dark ring offset for lighter card backgrounds
       'focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'; // Using teal for focus ring
     const variants = {
       default: 'bg-primary text-primary-foreground hover:bg-primary/90',
       destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
       // Variants suitable for both light (modal, sidebar) and light-colored (card) contexts
       default: 'bg-teal-600 text-white hover:bg-teal-700', // Primary (Teal)
       destructive: 'bg-red-600 text-white hover:bg-red-700', // Destructive
       outline:
         'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
       secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
       ghost: 'hover:bg-accent hover:text-accent-foreground',
       link: 'text-primary underline-offset-4 hover:underline',
         'border border-gray-300 bg-white hover:bg-gray-100 text-gray-800', // Outline on light
       secondary:
         'bg-gray-100 text-gray-800 hover:bg-gray-200', // Secondary on light
       ghost:
         'hover:bg-gray-100 text-gray-800 hover:text-gray-900', // Ghost on light
       link: 'text-teal-600 underline-offset-4 hover:underline hover:text-teal-700', // Link on light
     };
     const sizes = {
       default: 'h-10 px-4 py-2',
       sm: 'h-9 rounded-md px-3',
       lg: 'h-11 rounded-md px-8',
       icon: 'h-10 w-10',
       icon: 'h-10 w-10', // Standard icon button size
     };
     // Combine styles, ensuring className overrides defaults if needed
     const combinedClassName = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className ?? ''}`;
     return (
       <button
         className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
         className={combinedClassName.trim()} // Trim whitespace
         ref={ref}
         {...props}
       />
 @@ -103,13 +136,16 @@ interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
     // Styles for light backgrounds (modal, cards)
     const baseStyle =
       'flex h-10 w-full rounded-md border bg-white px-3 py-2 ' +
       'text-sm text-gray-900 border-gray-300 ring-offset-white ' +
       'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 ' +
       'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ' +
       'disabled:cursor-not-allowed disabled:opacity-50';
   // Combine base style with any provided className
   const combinedClassName = `${baseStyle} ${className ?? ''}`;
   return <input type={type} className={combinedClassName.trim()} ref={ref} {...props} />;
 });
 Input.displayName = 'Input';
 
 @@ -119,165 +155,204 @@ interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
 const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
   <label
     ref={ref}
     className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
     // Label for light backgrounds
     className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 ${className ?? ''}`.trim()}
     {...props}
   />
 ));
 Label.displayName = 'Label';
 
 // Basic Dialog
 // Basic Dialog (Modal) Implementation - Kept light theme for modal clarity
 interface DialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   children: React.ReactNode;
 }
 const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) =>
   open ? (
     // Modal backdrop
     <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
       <div className="bg-card rounded-lg shadow-lg w-full max-w-md">{children}</div>
       {/* Click outside to close */}
       <div className="fixed inset-0" onClick={() => onOpenChange(false)}></div>
       {/* Modal content container - Light theme */}
       <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden text-gray-900">
         {children}
       </div>
     </div>
   ) : null;
 
 // Dialog Content Area
 interface DialogContentProps {
   children: React.ReactNode;
   className?: string;
 }
 const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
   <div className={`p-6 ${className}`}>{children}</div>
   <div className={`p-6 ${className ?? ''}`.trim()}>{children}</div> // Standard padding
 );
 
 // Dialog Header Area
 interface DialogHeaderProps {
   children: React.ReactNode;
   className?: string;
 }
 const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
   <div className={`mb-4 ${className}`}>{children}</div>
   <div className={`mb-4 relative ${className ?? ''}`.trim()}>{children}</div> // Added relative for close button positioning
 );
 
 // Dialog Title
 interface DialogTitleProps {
   children: React.ReactNode;
   className?: string;
 }
 const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
   <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>
   <h2 className={`text-lg font-semibold text-gray-900 ${className ?? ''}`.trim()}>{children}</h2> // Title text color
 );
 
 // Dialog Description
 interface DialogDescriptionProps {
   children: React.ReactNode;
   className?: string;
 }
 const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => (
   <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
   <p className={`text-sm text-gray-600 ${className ?? ''}`.trim()}>{children}</p> // Description text color
 );
 
 // Dialog Footer Area
 interface DialogFooterProps {
   children: React.ReactNode;
   className?: string;
 }
 const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
   <div className={`mt-6 flex justify-end space-x-2 ${className}`}>{children}</div>
   <div className={`mt-6 flex justify-end space-x-2 border-t border-gray-200 pt-4 ${className ?? ''}`.trim()}>{children}</div> // Added border top
 );
 
 // Dialog Close Button Wrapper
 interface DialogCloseProps {
   children: React.ReactElement;
   onClick?: () => void;
   asChild?: boolean;
   asChild?: boolean; // Allows wrapping custom components
 }
 const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick }) =>
   React.cloneElement(children, { onClick });
   React.cloneElement(children, { onClick }); // Clones child and adds onClick
 
 // Basic Card
 
 // Basic Card Implementation
 interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
   className?: string;
 }
 const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
   <div
     ref={ref}
     className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
     // Card base styles - border/text/bg set dynamically by PatientCard
     className={`rounded-lg border text-gray-800 shadow-md ${className ?? ''}`.trim()} // Default to dark text for light backgrounds
     {...props}
   />
 ));
 Card.displayName = 'Card';
 
 // Card Header
 interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
   className?: string;
 }
 const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
   <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className}`} {...props} />
   <div ref={ref} className={`flex flex-col space-y-1.5 p-4 ${className ?? ''}`.trim()} {...props} />
 ));
 CardHeader.displayName = 'CardHeader';
 
 // Card Title
 interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
   className?: string;
 }
 const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
   <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
   <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className ?? ''}`.trim()} {...props} /> // Color set in PatientCard
 ));
 CardTitle.displayName = 'CardTitle';
 
 // Card Content Area
 interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
   className?: string;
 }
 const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
   <div ref={ref} className={`p-4 pt-0 ${className}`} {...props} />
   <div ref={ref} className={`p-4 pt-0 ${className ?? ''}`.trim()} {...props} />
 ));
 CardContent.displayName = 'CardContent';
 
 // --- Helper Functions ---
 // Determines border color based on Length of Stay (LOS) - UPDATED COLORS
 const getBorderColor = (minutes: number): string => {
   if (minutes >= 300) return 'border-red-500 animate-pulse-border'; // Flashing Red >= 5 hours
   if (minutes >= 240) return 'border-red-500'; // Red >= 4 hours
   if (minutes >= 120) return 'border-amber-500'; // Amber >= 2 hours
   return 'border-green-500'; // Green < 2 hours
   if (minutes >= 300) return 'border-rose-500 animate-pulse-border'; // Flashing Rose >= 5 hours
   if (minutes >= 240) return 'border-rose-500'; // Rose >= 4 hours
   if (minutes >= 120) return 'border-orange-500'; // Orange >= 2 hours
   return 'border-emerald-500'; // Emerald < 2 hours
 };
 
 // Determines background color based on LOS - UPDATED COLORS (Lighter)
 const getBackgroundColor = (minutes: number): string => {
   if (minutes >= 300) return 'bg-neutral-50';
   if (minutes >= 240) return 'bg-neutral-50';
   if (minutes >= 120) return 'bg-neutral-50';
   return 'bg-neutral-50';
     // Using lighter, more distinct opaque backgrounds
     if (minutes >= 300) return 'bg-rose-100';    // Light Rose >= 5 hours
     if (minutes >= 240) return 'bg-rose-100';    // Light Rose >= 4 hours
     if (minutes >= 120) return 'bg-orange-100';  // Light Orange >= 2 hours
     return 'bg-emerald-100'; // Light Emerald < 2 hours
 };
 
 // --- LocalStorage Parsing ---
 // Safely parses patient data from JSON string, converting date strings to Date objects
 const parsePatientsWithDates = (jsonData: string): Patient[] | null => {
   try {
     const parsedData = JSON.parse(jsonData);
     if (!Array.isArray(parsedData)) return null;
     if (!Array.isArray(parsedData)) return null; // Ensure it's an array
 
     return parsedData.map((patient: any) => {
     // Map over parsed data to reconstruct Patient and Task objects with Date instances
     return parsedData.map((patient: any): Patient => {
       // Parse arrival time, default to now if invalid/missing
       const arrivalTime = patient.arrivalTime ? new Date(patient.arrivalTime) : new Date();
       // Parse tasks array
       const tasks = Array.isArray(patient.tasks)
         ? patient.tasks.map((t: any) => {
         ? patient.tasks.map((t: any): Task => {
             // Parse task dates, default/nullify if invalid/missing
             const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
             const completedAt = t.completedAt ? new Date(t.completedAt) : null;
             const timerEnd = t.timerEnd ? new Date(t.timerEnd) : null;
 
             // Reconstruct task object with validated dates and defaults
             return {
               ...t,
               createdAt: isValid(createdAt) ? createdAt : new Date(),
               completedAt: completedAt && isValid(completedAt) ? completedAt : null,
               timerEnd: timerEnd && isValid(timerEnd) ? timerEnd : null,
               completionStatus: t.completionStatus || 'incomplete',
               notes: t.notes || '',
               isAcknowledged: t.isAcknowledged || false,
               isTimerExpired: !!timerEnd && timerEnd <= new Date(),
               ...t, // Spread existing properties
               id: t.id || `task-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Ensure ID exists
               text: t.text || 'Untitled Task', // Default text
               createdAt: isValid(createdAt) ? createdAt : new Date(), // Validate createdAt
               completedAt: completedAt && isValid(completedAt) ? completedAt : null, // Validate completedAt
               timerEnd: timerEnd && isValid(timerEnd) ? timerEnd : null, // Validate timerEnd
               completionStatus: t.completionStatus || 'incomplete', // Default status
               notes: t.notes || '', // Default notes
               isAcknowledged: t.isAcknowledged || false, // Default acknowledged state
               // Recalculate expired state based on parsed timerEnd
               isTimerExpired: !!(timerEnd && isValid(timerEnd) && timerEnd <= new Date()),
             };
           })
         : [];
         : []; // Default to empty array if tasks are missing/not an array
 
       // Reconstruct patient object
       return {
         ...patient,
         arrivalTime: isValid(arrivalTime) ? arrivalTime : new Date(),
         tasks,
         notes: patient.notes || '',
         ...patient, // Spread existing properties
         id: patient.id || `patient-${Date.now()}`, // Ensure ID exists
         name: patient.name || 'Unnamed Patient', // Default name
         arrivalTime: isValid(arrivalTime) ? arrivalTime : new Date(), // Validate arrivalTime
         tasks, // Assign parsed tasks
         notes: patient.notes || '', // Default notes
       };
     });
   } catch (error) {
     console.error('Error parsing patient data from localStorage:', error);
     return null;
     return null; // Return null on parsing error
   }
 };
 
 // --- TaskItem component ---
 // Displays a single task with controls for completion, timer, notes, and deletion.
 interface TaskItemProps {
   task: Task;
   patientId: string;
   patientName: string;
   patientName: string; // Needed for notifications
   updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
   updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
   removeTask: (patientId: string, taskId: string | number) => void;
 @@ -301,259 +376,280 @@ const TaskItem: React.FC<TaskItemProps> = ({
   acknowledgeTimer,
   updateTaskNotes,
 }) => {
   // Local state for timer status and editing modes
   const [isTimerExpired, setIsTimerExpired] = useState<boolean>(task.isTimerExpired);
   const [timeRemaining, setTimeRemaining] = useState<string>('');
   const [isEditingTimer, setIsEditingTimer] = useState<boolean>(false);
   const [editTimerMinutes, setEditTimerMinutes] = useState<string>('');
   const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
   const [editNotes, setEditNotes] = useState<string>(task.notes || '');
 
   // Refs for focusing input fields
   const timerInputRef = useRef<HTMLInputElement>(null);
   const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
 
   // Timer check effect
   // Effect to manage timer checking and updates
   useEffect(() => {
     if (!task.timerEnd || task.completionStatus === 'complete') {
       if (isTimerExpired) setIsTimerExpired(false);
     // Stop checking if no timer or task is complete
     if (!task.timerEnd || task.completionStatus === 'complete' || !isValid(task.timerEnd)) {
       if (isTimerExpired) setIsTimerExpired(false); // Reset local expired state if needed
       setTimeRemaining('');
       return;
     }
 
     let intervalId: NodeJS.Timeout | null = null;
 
     // Function to check timer status and update state/notifications
     const checkTimer = () => {
       const now = new Date();
       if (task.timerEnd && now >= task.timerEnd) {
         if (!isTimerExpired) {
       if (task.timerEnd && now >= task.timerEnd) { // Timer has passed
         if (!isTimerExpired) { // Only trigger state update and notification once
           setIsTimerExpired(true);
           setTimeRemaining('Expired');
           updateTaskTimerState(patientId, task.id, true);
           updateTaskTimerState(patientId, task.id, true); // Update parent state
 
           // Fire a desktop notification if not acknowledged
           // Fire desktop notification if permission granted and timer not acknowledged
           if (
             !task.isAcknowledged &&
             typeof window !== 'undefined' &&
             'Notification' in window
             'Notification' in window &&
             Notification.permission === 'granted'
           ) {
             if (Notification.permission === 'granted') {
               new Notification(`Task Timer Expired: ${patientName}`, {
                 body: task.text,
                 tag: `task-${task.id}`,
               });
             }
             new Notification(`Task Timer Expired: ${patientName}`, {
               body: task.text,
               tag: `task-${task.id}`, // Tag prevents duplicate notifications for the same task
               // icon: '/path/to/icon.png' // Optional icon
             });
           }
         }
         if (intervalId) clearInterval(intervalId);
       } else if (task.timerEnd) {
         if (isTimerExpired) {
         if (intervalId) clearInterval(intervalId); // Stop checking once expired
       } else if (task.timerEnd) { // Timer is still running
         if (isTimerExpired) { // Reset if it was previously marked expired
           setIsTimerExpired(false);
           updateTaskTimerState(patientId, task.id, false);
         }
         // Update time remaining string
         setTimeRemaining(`in ${formatDistanceToNowStrict(task.timerEnd)}`);
       }
     };
 
     checkTimer();
     checkTimer(); // Initial check
     // Set interval only if timer is in the future
     if (task.timerEnd && new Date() < task.timerEnd) {
       intervalId = setInterval(checkTimer, 1000 * 30);
       intervalId = setInterval(checkTimer, 1000 * 30); // Check every 30 seconds
     }
 
     // Cleanup interval on unmount or dependency change
     return () => {
       if (intervalId) clearInterval(intervalId);
     };
   }, [
   }, [ // Dependencies that trigger timer re-evaluation
     task.timerEnd,
     task.id,
     patientId,
     updateTaskTimerState,
     isTimerExpired,
     task.isTimerExpired,
     isTimerExpired, // Local state
     task.isTimerExpired, // Prop state
     task.completionStatus,
     task.isAcknowledged,
     patientName,
     task.text,
   ]);
 
   // When editing the timer
   // Effect to focus timer input when editing starts
   useEffect(() => {
     if (isEditingTimer) {
       // Pre-fill with remaining minutes if timer exists and is in the future
       const initialMinutes =
         task.timerEnd && task.timerEnd > new Date()
         task.timerEnd && isValid(task.timerEnd) && task.timerEnd > new Date()
           ? Math.max(0, differenceInMinutes(task.timerEnd, new Date())).toString()
           : '';
       setEditTimerMinutes(initialMinutes);
       setTimeout(() => timerInputRef.current?.focus(), 0);
       setTimeout(() => timerInputRef.current?.focus(), 0); // Focus after render
     }
   }, [isEditingTimer, task.timerEnd]);
 
   // When editing notes
   // Effect to focus notes textarea when editing starts
   useEffect(() => {
     if (isEditingNotes) {
       setEditNotes(task.notes || '');
       setTimeout(() => notesTextareaRef.current?.focus(), 0);
       setEditNotes(task.notes || ''); // Reset edit notes from task prop
       setTimeout(() => notesTextareaRef.current?.focus(), 0); // Focus after render
     }
   }, [isEditingNotes, task.notes]);
 
   // --- Event Handlers ---
 
   // Save edited timer
   const handleTimerEditSubmit = () => {
     if (!isEditingTimer) return;
     // Treat empty or '0' input as removing the timer (null)
     const minutesToSet =
       editTimerMinutes.trim() === '' || editTimerMinutes === '0' ? null : editTimerMinutes;
     updateTaskTimer(patientId, task.id, minutesToSet);
     setIsEditingTimer(false);
     updateTaskTimer(patientId, task.id, minutesToSet); // Call parent update function
     setIsEditingTimer(false); // Exit edit mode
   };
 
   // Update local state for timer input
   const handleTimerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
     setEditTimerMinutes(e.target.value);
   };
 
   // Handle Enter/Escape keys in timer input
   const handleTimerInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter') {
       handleTimerEditSubmit();
     } else if (e.key === 'Escape') {
       setIsEditingTimer(false);
       setIsEditingTimer(false); // Cancel edit
     }
   };
 
   // Save edited notes
   const handleNotesEditSubmit = () => {
     if (!isEditingNotes) return;
     updateTaskNotes(patientId, task.id, editNotes);
     setIsEditingNotes(false);
     updateTaskNotes(patientId, task.id, editNotes); // Call parent update function
     setIsEditingNotes(false); // Exit edit mode
   };
 
   // Update local state for notes textarea
   const handleNotesInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
     setEditNotes(e.target.value);
   };
 
   // Handle Enter (without Shift) / Escape keys in notes textarea
   const handleNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
     if (e.key === 'Enter' && !e.shiftKey) { // Save on Enter (if Shift not pressed)
       e.preventDefault(); // Prevent newline
       handleNotesEditSubmit();
     } else if (e.key === 'Escape') {
     } else if (e.key === 'Escape') { // Cancel on Escape
       setIsEditingNotes(false);
       setEditNotes(task.notes || '');
       setEditNotes(task.notes || ''); // Revert changes
     }
   };
 
   // Cycle through task completion states: incomplete -> in-progress -> complete -> incomplete
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
       case 'incomplete': nextStatus = 'in-progress'; break;
       case 'in-progress': nextStatus = 'complete'; break;
       case 'complete': nextStatus = 'incomplete'; break;
       default: nextStatus = 'incomplete'; break;
     }
     updateTaskCompletion(patientId, task.id, nextStatus);
     updateTaskCompletion(patientId, task.id, nextStatus); // Call parent update function
   };
 
   // Snooze timer by 15 minutes (calls updateTaskTimer)
   const handleSnooze = () => {
     // Quick 15-min extension
     updateTaskTimer(patientId, task.id, '15');
   };
 
   // --- UI Rendering Logic ---
 
   // Get appropriate icon based on completion status
   const getCompletionIcon = () => {
     switch (task.completionStatus) {
       case 'in-progress':
         return <MinusSquare className="h-4 w-4 text-yellow-400" />;
       case 'complete':
         return <CheckSquare className="h-4 w-4 text-green-400" />;
       case 'in-progress': return <MinusSquare className="h-4 w-4 text-orange-600" />; // Adjusted for light bg
       case 'complete': return <CheckSquare className="h-4 w-4 text-emerald-600" />; // Adjusted for light bg
       case 'incomplete':
       default:
         return <Square className="h-4 w-4 text-gray-500" />;
       default: return <Square className="h-4 w-4 text-gray-500" />; // Adjusted for light bg
     }
   };
 
   // --- UPDATED text color logic to ensure readability ---
   let taskItemClasses = 'flex flex-col py-1.5 group';
   let taskTextStyle = 'text-sm';
   let timerTextStyle = 'text-xs font-mono';
   // Dynamically determine CSS classes based on task state
   let taskItemClasses = 'flex flex-col py-1.5 group'; // Base classes, group for hover effects
   let taskTextStyle = 'text-sm'; // Base task text style
   let timerTextStyle = 'text-xs font-mono'; // Base timer text style
 
   if (task.completionStatus === 'complete') {
     // Make completed tasks lighter gray so they’re still visible on dark backgrounds
     taskTextStyle += ' line-through text-gray-300';
     timerTextStyle += ' text-gray-300';
     // Style for completed tasks (lighter text, strikethrough)
     taskTextStyle += ' line-through text-gray-500'; // Adjusted for light bg
     timerTextStyle += ' text-gray-500'; // Adjusted for light bg
   } else if (isTimerExpired && !task.isAcknowledged) {
     taskItemClasses += ' animate-flash';
     taskTextStyle += ' text-red-400 font-medium';
     timerTextStyle += ' text-red-400 font-semibold';
     // Style for expired, unacknowledged timers (flashing, red text)
     // Use background flash on light backgrounds
     taskItemClasses += ' animate-flash-light';
     taskTextStyle += ' text-rose-700 font-medium'; // Adjusted for light bg
     timerTextStyle += ' text-rose-700 font-semibold'; // Adjusted for light bg
   } else if (isTimerExpired && task.isAcknowledged) {
     taskTextStyle += ' text-red-600';
     timerTextStyle += ' text-red-600';
     // Style for expired but acknowledged timers (darker red text, no flash)
     taskTextStyle += ' text-rose-800'; // Adjusted for light bg
     timerTextStyle += ' text-rose-800'; // Adjusted for light bg
   } else if (task.timerEnd) {
     // Previously used black; changed to white for visibility
     taskTextStyle += ' text-black';
     timerTextStyle += ' text-black';
     // Style for active timers (standard dark text color)
     taskTextStyle += ' text-gray-800'; // Dark text for light bg
     timerTextStyle += ' text-gray-600'; // Slightly lighter timer text
   } else {
     // no timer, but still on a dark background => use white
     taskTextStyle += ' text-black';
     timerTextStyle += ' text-gray-200';
     // Style for tasks with no timer (standard dark text color)
     taskTextStyle += ' text-gray-800';
     timerTextStyle += ' text-gray-500'; // Default subtle timer text color
   }
 
   return (
     <div className={taskItemClasses}>
       {/* Main row */}
       {/* --- Main Task Row --- */}
       <div className="flex items-center space-x-2 w-full">
         {/* Completion Status Toggle Button */}
         <Button
           variant="ghost"
           size="icon"
           className="h-6 w-6 flex-shrink-0"
           className="h-6 w-6 flex-shrink-0 hover:bg-gray-200" // Light hover background
           onClick={handleCompletionToggle}
           title={`Status: ${task.completionStatus}. Click to change.`}
         >
           {getCompletionIcon()}
         </Button>
 
         {/* Task text */}
         {/* Task Text */}
         <span className={`flex-1 cursor-default ${taskTextStyle}`}>{task.text}</span>
 
         {/* Timer / Acknowledge / Edit Timer */}
         {/* --- Timer & Action Buttons --- */}
         <div className="flex items-center space-x-1 flex-shrink-0">
           {isEditingTimer ? (
             // Timer Edit Mode UI
             <>
               <Input
                 ref={timerInputRef}
                 type="number"
                 min="0"
                 max="999"
                 max="999" // Allow up to 999 minutes
                 value={editTimerMinutes}
                 onChange={handleTimerInputChange}
                 onKeyDown={handleTimerInputKeyDown}
                 className="w-14 h-6 text-xs"
                 // Input styled for light background
                 className="w-14 h-6 text-xs px-1 bg-white border-gray-300 text-gray-700 placeholder-gray-400"
                 placeholder="Min"
               />
               {/* Save Timer Button */}
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-6 w-6 text-green-400 hover:text-green-300"
                 className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100"
                 onClick={handleTimerEditSubmit}
                 title="Save Timer"
               >
                 <Save className="h-3 w-3" />
               </Button>
               {/* Cancel Edit Button */}
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-6 w-6 text-gray-400 hover:text-gray-200"
                 className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                 onClick={() => setIsEditingTimer(false)}
                 title="Cancel Edit"
               >
                 <X className="h-3 w-3" />
               </Button>
             </>
           ) : (
             // Timer Display / Acknowledge / Edit Trigger UI
             <>
               {/* Acknowledge/Snooze buttons (only if expired, unacknowledged, incomplete) */}
               {isTimerExpired && !task.isAcknowledged && task.completionStatus !== 'complete' && (
                 <>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 text-yellow-400 hover:text-yellow-300"
                     className="h-6 w-6 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100"
                     onClick={() => acknowledgeTimer(patientId, task.id)}
                     title="Acknowledge Timer"
                   >
 @@ -562,7 +658,7 @@ const TaskItem: React.FC<TaskItemProps> = ({
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 text-blue-400 hover:text-blue-300"
                     className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-100"
                     onClick={handleSnooze}
                     title="Snooze 15 min"
                   >
 @@ -571,103 +667,115 @@ const TaskItem: React.FC<TaskItemProps> = ({
                 </>
               )}
 
               {task.timerEnd && task.completionStatus !== 'complete' && (
               {/* Timer display (if timer exists and task not complete) */}
               {task.timerEnd && isValid(task.timerEnd) && task.completionStatus !== 'complete' && (
                 <span className={timerTextStyle}>
                   <Clock className="inline h-3 w-3 mr-1" />
                   {isTimerExpired ? 'Expired' : timeRemaining}
                 </span>
               )}
 
               {/* Edit Timer Button (show on hover, only if task not complete) */}
               {task.completionStatus !== 'complete' && (
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-6 w-6 text-gray-400 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                   // Subtle styling, appears on group hover
                   className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                   onClick={() => setIsEditingTimer(true)}
                   title={task.timerEnd ? 'Edit Timer' : 'Add Timer'}
                 >
                   {/* Show Edit icon if timer exists, Clock icon otherwise */}
                   {task.timerEnd ? <Edit3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                 </Button>
               )}
             </>
           )}
         </div>
 
         {/* Notes icon */}
         {/* Notes Button (show on hover) */}
         <Button
           variant="ghost"
           size="icon"
           className={`h-6 w-6 ml-1 flex-shrink-0 ${
             task.notes ? 'text-blue-400' : 'text-gray-500'
           } hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity`}
           onClick={() => setIsEditingNotes((prev) => !prev)}
             task.notes ? 'text-blue-500' : 'text-gray-400' // Blue if notes exist, dimmer gray otherwise
           } hover:text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity`}
           onClick={() => setIsEditingNotes((prev) => !prev)} // Toggle notes edit mode
           title={task.notes ? 'Edit/View Notes' : 'Add Notes'}
         >
           <MessageSquare className="h-3 w-3" />
         </Button>
 
         {/* Remove task */}
         {/* Remove Task Button (show on hover) */}
         <Button
           variant="ghost"
           size="icon"
           className="h-6 w-6 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
           className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
           onClick={() => removeTask(patientId, task.id)}
           title="Remove Task"
         >
           <Trash2 className="h-3 w-3" />
         </Button>
       </div>
 
       {/* Notes editing */}
       {/* --- Notes Section (Conditional) --- */}
       {/* Notes Editing Area */}
       {isEditingNotes && (
         <div className="mt-1.5 pl-8 pr-2 flex items-center gap-2 w-full">
         <div className="mt-1.5 pl-8 pr-2 flex items-start gap-2 w-full"> {/* Align items start */}
           <textarea
             ref={notesTextareaRef}
             value={editNotes}
             onChange={handleNotesInputChange}
             onKeyDown={handleNotesKeyDown}
             placeholder="Add task notes..."
             rows={2}
             className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
             // Styling for notes textarea in light theme
             className="flex-grow text-xs bg-white border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none resize-none"
           />
           {/* Save Notes Button */}
           <Button
             variant="ghost"
             size="icon"
             className="h-6 w-6 text-green-400 hover:text-green-300 self-start"
             className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 flex-shrink-0" // Added flex-shrink-0
             onClick={handleNotesEditSubmit}
             title="Save Notes"
           >
             <Save className="h-4 w-4" />
           </Button>
           {/* Cancel Notes Edit Button */}
           <Button
             variant="ghost"
             size="icon"
             className="h-6 w-6 text-gray-400 hover:text-gray-200 self-start"
             className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0" // Added flex-shrink-0
             onClick={() => setIsEditingNotes(false)}
             title="Cancel Edit"
           >
             <X className="h-4 w-4" />
           </Button>
         </div>
       )}
       {/* Display Saved Notes (if not editing) */}
       {!isEditingNotes && task.notes && (
         <div className="mt-1 pl-8 pr-2 text-xs text-gray-200 italic w-full break-words">
         <div className="mt-1 pl-8 pr-2 text-xs text-gray-600 italic w-full break-words"> {/* Darker italic text */}
           Note: {task.notes}
         </div>
       )}
 
       {/* Dates info */}
       <div className="pl-8 text-xs text-gray-400 mt-0.5">
         Added: {formatRelative(task.createdAt, new Date())}
         {task.completionStatus === 'complete' && task.completedAt && (
       {/* --- Dates Info --- */}
       <div className="pl-8 text-[10px] text-gray-500 mt-0.5"> {/* Darker date text */}
         Added: {isValid(task.createdAt) ? formatRelative(task.createdAt, new Date()) : 'Invalid Date'} {/* Relative time added */}
         {/* Display completed time if applicable */}
         {task.completionStatus === 'complete' && task.completedAt && isValid(task.completedAt) && (
           <span className="ml-2">Completed: {formatRelative(task.completedAt, new Date())}</span>
         )}
       </div>
     </div>
   );
 };
 
 // --- PatientCard ---
 
 // --- PatientCard component ---
 // Displays patient information, notes, lists of pending/completed tasks, and an input to add new tasks.
 interface PatientCardProps {
   patient: Patient;
   removePatient: (patientId: string) => void;
 @@ -684,6 +792,7 @@ interface PatientCardProps {
   updatePatientNotes: (patientId: string, notes: string) => void;
   updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
 }
 
 const PatientCard: React.FC<PatientCardProps> = ({
   patient,
   removePatient,
 @@ -696,153 +805,184 @@ const PatientCard: React.FC<PatientCardProps> = ({
   updatePatientNotes,
   updateTaskNotes,
 }) => {
   // State for LOS calculation and new task input
   const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() =>
     differenceInMinutes(new Date(), patient.arrivalTime)
     isValid(patient.arrivalTime) ? differenceInMinutes(new Date(), patient.arrivalTime) : 0
   );
   const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
   const [newTaskText, setNewTaskText] = useState<string>('');
   const [newTaskTimerMinutes, setNewTaskTimerMinutes] = useState<string>('');
   // State for editing patient-level notes
   const [isEditingPatientNotes, setIsEditingPatientNotes] = useState<boolean>(false);
   const [editPatientNotes, setEditPatientNotes] = useState<string>(patient.notes || '');
   const patientNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
 
   // Effect to calculate and update LOS every minute
   useEffect(() => {
     const calculateLOS = () => {
       if (!isValid(patient.arrivalTime)) {
           setLengthOfStayFormatted('Invalid Arrival');
           setLengthOfStayMinutes(0); // Set to 0 for color coding if invalid
           return;
       };
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
     calculateLOS(); // Initial calculation
     const intervalId = setInterval(calculateLOS, 60_000); // Update every minute
     return () => clearInterval(intervalId); // Cleanup interval
   }, [patient.arrivalTime]);
 
   // Effect to focus patient notes textarea when editing starts
   useEffect(() => {
     if (isEditingPatientNotes) {
       setEditPatientNotes(patient.notes || '');
       setTimeout(() => patientNotesTextareaRef.current?.focus(), 0);
       setEditPatientNotes(patient.notes || ''); // Reset from prop
       setTimeout(() => patientNotesTextareaRef.current?.focus(), 0); // Focus after render
     }
   }, [isEditingPatientNotes, patient.notes]);
 
   // --- Event Handlers ---
 
   // Add a new task to this patient
   const handleAddTaskSubmit = (e?: FormEvent<HTMLFormElement>) => {
     e?.preventDefault();
     if (newTaskText.trim() === '') return;
     addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes);
     e?.preventDefault(); // Prevent form submission if called from form
     if (newTaskText.trim() === '') return; // Don't add empty tasks
     addTaskToPatient(patient.id, newTaskText, newTaskTimerMinutes); // Call parent function
     // Reset input fields
     setNewTaskText('');
     setNewTaskTimerMinutes('');
   };
 
   // Handle Enter key in the new task input fields to submit
   const handleNewTaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       handleAddTaskSubmit();
     }
   };
 
   // Save edited patient notes
   const handlePatientNotesSubmit = () => {
     if (!isEditingPatientNotes) return;
     updatePatientNotes(patient.id, editPatientNotes);
     setIsEditingPatientNotes(false);
     updatePatientNotes(patient.id, editPatientNotes); // Call parent update function
     setIsEditingPatientNotes(false); // Exit edit mode
   };
 
   // Handle Enter (without Shift) / Escape keys in patient notes textarea
   const handlePatientNotesKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
     if (e.key === 'Enter' && !e.shiftKey) {
     if (e.key === 'Enter' && !e.shiftKey) { // Save on Enter
       e.preventDefault();
       handlePatientNotesSubmit();
     } else if (e.key === 'Escape') {
     } else if (e.key === 'Escape') { // Cancel on Escape
       setIsEditingPatientNotes(false);
       setEditPatientNotes(patient.notes || '');
       setEditPatientNotes(patient.notes || ''); // Revert changes
     }
   };
 
   // --- UI Rendering Logic ---
 
   // Get dynamic border and background colors
   const borderColor = getBorderColor(lengthOfStayMinutes);
   const bgColor = getBackgroundColor(lengthOfStayMinutes);
   const bgColor = getBackgroundColor(lengthOfStayMinutes); // Using updated function for lighter bg
 
   // Separate tasks into pending and completed lists for display
   const pendingTasks = patient.tasks.filter((t) => t.completionStatus !== 'complete');
   const completedTasks = patient.tasks.filter((t) => t.completionStatus === 'complete');
 
   return (
     <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500`}>
     // Apply dynamic border and background styles to the Card, default text is dark now
     <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500 text-gray-800`}>
       {/* Card Header: Patient Name and Remove Button */}
       <CardHeader className="flex flex-row items-center justify-between pb-2">
         <CardTitle className="text-base font-medium text-black">{patient.name}</CardTitle>
         <CardTitle className="text-base font-semibold text-gray-900">{patient.name}</CardTitle> {/* Darker title on light bg */}
         <Button
           variant="ghost"
           size="icon"
           className="h-6 w-6 text-black hover:text-red-500"
           className="h-6 w-6 text-gray-500 hover:text-red-600 hover:bg-red-100" // Adjusted colors for light theme
           onClick={() => removePatient(patient.id)}
           title={`Remove Patient ${patient.name}`}
         >
           <X className="h-4 w-4" />
         </Button>
       </CardHeader>
 
       {/* Card Content: LOS, Notes, Tasks */}
       <CardContent>
         <div className="text-xs text-black mb-2">
         {/* Length of Stay and Arrival Time */}
         <div className="text-xs text-gray-600 mb-2"> {/* Adjusted text color */}
           <Clock className="inline h-3 w-3 mr-1" />
           Length of Stay: <span className="font-semibold text-black">{lengthOfStayFormatted}</span>
           <span className="ml-2 text-black">
             (Arrival: {format(patient.arrivalTime, 'HH:mm')})
           Length of Stay: <span className="font-semibold text-gray-700">{lengthOfStayFormatted}</span> {/* Adjusted text color */}
           <span className="ml-2 text-gray-500"> {/* Adjusted text color */}
             (Arrival: {isValid(patient.arrivalTime) ? format(patient.arrivalTime, 'HH:mm') : 'Invalid Time'})
           </span>
         </div>
 
         {/* Patient notes */}
         {/* Patient Notes Section */}
         <div className="mb-2 flex items-center justify-between">
           <div className="text-xs text-black font-medium flex items-center">
           <div className="text-xs text-gray-700 font-medium flex items-center"> {/* Adjusted text color */}
             Notes:
             {/* Edit/View Notes Button */}
             <Button
               variant="ghost"
               size="icon"
               className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-400' : 'text-black'}`}
               className={`h-6 w-6 ml-1 ${patient.notes ? 'text-blue-500' : 'text-gray-400'} hover:bg-blue-100`} // Adjusted colors
               onClick={() => setIsEditingPatientNotes((prev) => !prev)}
               title={patient.notes ? 'Edit/View Notes' : 'Add Notes'}
             >
               <MessageSquare className="h-4 w-4" />
             </Button>
           </div>
         </div>
         {/* Patient Notes Editing Area */}
         {isEditingPatientNotes && (
           <div className="mb-2 flex items-center gap-2 w-full">
           <div className="mb-2 flex items-start gap-2 w-full"> {/* Align items start */}
             <textarea
               ref={patientNotesTextareaRef}
               value={editPatientNotes}
               onChange={(e) => setEditPatientNotes(e.target.value)}
               onKeyDown={handlePatientNotesKeyDown}
               rows={2}
               className="flex-grow text-xs bg-neutral-50 border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
               className="flex-grow text-xs bg-white border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none resize-none"
               placeholder="Add patient notes..."
             />
             {/* Save Notes Button */}
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6 text-green-400 hover:text-green-300"
               className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 flex-shrink-0"
               onClick={handlePatientNotesSubmit}
               title="Save Notes"
             >
               <Save className="h-4 w-4" />
             </Button>
             {/* Cancel Notes Edit Button */}
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6 text-gray-400 hover:text-gray-200"
               className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
               onClick={() => setIsEditingPatientNotes(false)}
               title="Cancel Edit"
             >
               <X className="h-4 w-4" />
             </Button>
           </div>
         )}
         {/* Display Saved Patient Notes */}
         {!isEditingPatientNotes && patient.notes && (
           <div className="mb-2 text-xs text-black italic break-words">
           <div className="mb-2 text-xs text-gray-600 italic break-words"> {/* Adjusted text color */}
             Note: {patient.notes}
           </div>
         )}
 
         {/* Pending tasks */}
         <div className="mt-2 border-t border-gray-700 pt-2">
           <h4 className="text-sm font-medium text-black mb-1">Pending Tasks:</h4>
         {/* Pending Tasks List */}
         <div className="mt-2 border-t border-gray-200 pt-2"> {/* Adjusted border color */}
           <h4 className="text-sm font-medium text-gray-800 mb-1">Pending Tasks:</h4> {/* Adjusted text color */}
           {pendingTasks.length === 0 ? (
             <p className="text-xs text-black italic">No pending tasks.</p>
             <p className="text-xs text-gray-500 italic">No pending tasks.</p> /* Adjusted text color */
           ) : (
             pendingTasks.map((task) => (
               <TaskItem
 @@ -861,10 +1001,10 @@ const PatientCard: React.FC<PatientCardProps> = ({
           )}
         </div>
 
         {/* Completed tasks */}
         {/* Completed Tasks List (only shown if there are completed tasks) */}
         {completedTasks.length > 0 && (
           <div className="mt-2 border-t border-gray-700/50 pt-2">
             <h4 className="text-sm font-medium text-black mb-1">Completed Tasks:</h4>
           <div className="mt-2 border-t border-gray-200/60 pt-2"> {/* Lighter border */}
             <h4 className="text-sm font-medium text-gray-600 mb-1">Completed Tasks:</h4> {/* Adjusted text color */}
             {completedTasks.map((task) => (
               <TaskItem
                 key={task.id}
 @@ -882,16 +1022,17 @@ const PatientCard: React.FC<PatientCardProps> = ({
           </div>
         )}
 
         {/* Add new task */}
         <div className="mt-3 pt-3 border-t border-gray-700/50">
           <form onSubmit={(e) => handleAddTaskSubmit(e)} className="flex items-center gap-2">
         {/* Add New Task Form */}
         <div className="mt-3 pt-3 border-t border-gray-200/60"> {/* Lighter border */}
           <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
             <Input
               type="text"
               placeholder="Add Task"
               placeholder="Add Task..."
               value={newTaskText}
               onChange={(e) => setNewTaskText(e.target.value)}
               onKeyDown={handleNewTaskKeyDown}
               className="flex-grow h-8 text-sm"
               // Input styled for light background
               className="flex-grow h-8 text-sm px-2 bg-white border-gray-300 text-gray-700 placeholder-gray-400"
             />
             <Input
               type="number"
 @@ -901,14 +1042,15 @@ const PatientCard: React.FC<PatientCardProps> = ({
               value={newTaskTimerMinutes}
               onChange={(e) => setNewTaskTimerMinutes(e.target.value)}
               onKeyDown={handleNewTaskKeyDown}
               className="w-16 h-8 text-xs"
                // Input styled for light background
               className="w-16 h-8 text-xs px-1 bg-white border-gray-300 text-gray-700 placeholder-gray-400"
             />
             <Button
               type="submit"
               variant="ghost"
               size="icon"
               className="h-8 w-8 text-black hover:bg-gray-100"
               disabled={newTaskText.trim() === ''}
               className="h-8 w-8 text-teal-600 hover:bg-teal-100 disabled:text-gray-400 disabled:hover:bg-transparent" // Adjusted colors
               disabled={newTaskText.trim() === ''} // Disable if text is empty
               title="Add Task"
             >
               <Plus className="h-4 w-4" />
 @@ -920,8 +1062,11 @@ const PatientCard: React.FC<PatientCardProps> = ({
   );
 };
 
 // --- AddPatientModal ---
 interface ModalTaskState {
 
 // --- AddPatientModal component ---
 // Modal dialog for adding a new patient with initial details and tasks.
 // Kept with a light theme for better contrast as a modal overlay.
 interface ModalTaskState { // Temporary state for task inputs in the modal
   id: number;
   text: string;
   timerMinutes: string;
 @@ -932,73 +1077,92 @@ interface AddPatientModalProps {
   addPatient: (newPatient: Patient) => void;
 }
 const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatient }) => {
   // State for modal form fields
   const [patientName, setPatientName] = useState<string>('');
   const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm'));
   const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm')); // Default to current time
   const [tasks, setTasks] = useState<ModalTaskState[]>([
     { id: Date.now(), text: '', timerMinutes: '' },
     { id: Date.now(), text: '', timerMinutes: '' }, // Start with one empty task row
   ]);
   const [patientNotes, setPatientNotes] = useState<string>('');
   const [patientNotes, setPatientNotes] = useState<string>(''); // State for patient notes input
 
   // Add another empty task input row
   const handleAddTask = (): void => {
     setTasks([...tasks, { id: Date.now(), text: '', timerMinutes: '' }]);
   };
 
   // Remove a task input row (or clear if only one row left)
   const handleRemoveTask = (id: number): void => {
     if (tasks.length > 1) {
       setTasks(tasks.filter((task) => task.id !== id));
     } else {
       // Clear the last row instead of removing it
       setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
     }
   };
 
   // Update state when task input fields change
   const handleTaskChange = (
     id: number,
     field: keyof Omit<ModalTaskState, 'id'>,
     field: keyof Omit<ModalTaskState, 'id'>, // 'text' or 'timerMinutes'
     value: string
   ): void => {
     setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
   };
 
   // Handle form submission
   const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
     e.preventDefault();
     if (!patientName || !arrivalTime) return;
     e.preventDefault(); // Prevent default submission
     if (!patientName.trim() || !arrivalTime) return; // Basic validation
 
     const now = new Date();
     // Parse arrival time string, default to today's date
     let arrivalDateTime = parse(arrivalTime, 'HH:mm', new Date());
     arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
     if (!isValid(arrivalDateTime)) { // Handle invalid time input
         arrivalDateTime = new Date(); // Default to now if parsing fails
     } else {
         arrivalDateTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate()); // Ensure date part is today
     }
 
 
     // Cap arrival time at the current time if a future time was entered
     if (arrivalDateTime > now) {
       arrivalDateTime = now;
     }
 
     // Process the task input rows into Task objects
     const processedTasks: Task[] = tasks
       .filter((task) => task.text.trim() !== '')
       .filter((task) => task.text.trim() !== '') // Ignore rows with empty text
       .map((task) => {
         const timerMinutesNum = parseInt(task.timerMinutes, 10);
         // Validate timer input (positive number up to 999)
         const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
         // Calculate timer end date if valid
         const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;
 
         // Create the final Task object
         return {
           id: `task-${task.id}-${Math.random().toString(36).substring(7)}`,
           text: task.text,
           id: `task-${task.id}-${Math.random().toString(36).substring(7)}`, // Unique ID
           text: task.text.trim(),
           timerEnd: timerEndDate,
           isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
           completionStatus: 'incomplete',
           createdAt: new Date(),
           completedAt: null,
           notes: '',
           isAcknowledged: false,
           isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()), // Check if already expired
           completionStatus: 'incomplete', // Default status
           createdAt: new Date(), // Set creation time
           completedAt: null, // Not completed yet
           notes: '', // No initial task notes from modal
           isAcknowledged: false, // Not acknowledged yet
         };
       });
 
     // Call the parent function to add the patient
     addPatient({
       id: `patient-${Date.now()}`,
       name: patientName,
       id: `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Unique ID
       name: patientName.trim(),
       arrivalTime: arrivalDateTime,
       tasks: processedTasks,
       notes: patientNotes,
       notes: patientNotes.trim(), // Include patient notes
     });
 
     // Reset form fields and close modal
     setPatientName('');
     setArrivalTime(format(new Date(), 'HH:mm'));
     setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
 @@ -1008,80 +1172,87 @@ const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addP
 
   return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="bg-neutral-50 text-black sm:max-w-[550px]">
       {/* Modal Content with light theme */}
       <DialogContent className="bg-white text-gray-900 sm:max-w-[550px]">
         <DialogHeader>
           <DialogTitle>Add New Patient</DialogTitle>
           <DialogDescription className="text-black">
           <DialogDescription className="text-gray-600">
             Enter patient details, arrival time, initial tasks, and optional notes.
           </DialogDescription>
           {/* Close Button */}
           <DialogClose asChild>
             <Button
               variant="ghost"
               size="icon"
               className="absolute top-4 right-4 text-black hover:text-black"
               className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100" // Adjusted positioning and colors
               onClick={onClose}
               aria-label="Close"
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
               <Label htmlFor="patient-name" className="text-right text-black">
               <Label htmlFor="patient-name" className="text-right text-gray-700">
                 Name/Title
               </Label>
               <Input
                 id="patient-name"
                 value={patientName}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
                 className="col-span-3 bg-neutral-50 border-gray-600 text-black placeholder-black"
                 className="col-span-3" // Uses default Input styling for light theme
                 placeholder="e.g., Bed 5 / Mr. Smith"
                 required
               />
             </div>
             {/* Arrival Time Input */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="arrival-time" className="text-right text-black">
               <Label htmlFor="arrival-time" className="text-right text-gray-700">
                 Arrival Time
               </Label>
               <Input
                 id="arrival-time"
                 type="time"
                 value={arrivalTime}
                 onChange={(e: ChangeEvent<HTMLInputElement>) => setArrivalTime(e.target.value)}
                 className="col-span-3 bg-neutral-50 border-gray-600 text-black"
                 className="col-span-3"
                 required
               />
             </div>
             {/* Patient Notes Input */}
             <div className="grid grid-cols-4 items-start gap-4">
               <Label htmlFor="patient-notes" className="text-right text-black pt-2">
               <Label htmlFor="patient-notes" className="text-right text-gray-700 pt-2">
                 Notes (Opt.)
               </Label>
               <textarea
                 id="patient-notes"
                 value={patientNotes}
                 onChange={(e) => setPatientNotes(e.target.value)}
                 rows={3}
                 className="col-span-3 text-sm bg-neutral-50 border border-gray-600 rounded p-1.5 text-black placeholder-black focus:ring-1 focus:ring-ring focus:outline-none resize-vertical"
                 className="col-span-3 text-sm bg-white border border-gray-300 rounded p-1.5 text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none resize-vertical"
                 placeholder="Add general patient notes..."
               />
             </div>
 
             {/* Initial Tasks */}
             {/* Initial Tasks Section */}
             <div className="col-span-4 mt-2">
               <Label className="mb-2 block font-medium text-black">Initial Tasks</Label>
               <Label className="mb-2 block font-medium text-gray-800">Initial Tasks</Label>
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
                     className="flex-grow bg-neutral-50 border-gray-600 text-black placeholder-black"
                     className="flex-grow h-9" // Slightly smaller height for task inputs
                   />
                   {/* Task Timer Input */}
                   <Input
                     type="number"
                     min="1"
 @@ -1091,42 +1262,47 @@ const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addP
                     onChange={(e: ChangeEvent<HTMLInputElement>) =>
                       handleTaskChange(task.id, 'timerMinutes', e.target.value)
                     }
                     className="w-24 bg-neutral-50 border-gray-600 text-black placeholder-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                     className="w-24 h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Hide number spinners
                   />
                   {/* Remove Task Row Button */}
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     className="text-red-500 hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                     className="text-red-500 hover:bg-red-100 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed" // Adjusted size/colors
                     onClick={() => handleRemoveTask(task.id)}
                     disabled={tasks.length <= 1}
                     disabled={tasks.length <= 1} // Disable removing the last row
                     aria-label="Remove task"
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
               ))}
               {/* Add Task Row Button */}
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={handleAddTask}
                 className="mt-2 border-gray-600 text-black hover:bg-neutral-50"
                 className="mt-2 border-gray-300 text-gray-700 hover:bg-gray-100" // Outline style for light theme
               >
                 <Plus className="h-4 w-4 mr-2" /> Add Task Line
               </Button>
             </div>
           </div>
           <DialogFooter className="border-t border-gray-700 pt-4">
           {/* Modal Footer */}
           <DialogFooter>
             {/* Cancel Button */}
             <Button
               type="button"
               variant="secondary"
               variant="secondary" // Use secondary style for cancel
               onClick={onClose}
               className="text-black bg-neutral-50 hover:bg-gray-100"
               className="text-gray-700 bg-gray-100 hover:bg-gray-200"
             >
               Cancel
             </Button>
             <Button type="submit" className="bg-[#008080] hover:bg-[#008080] text-white">
             {/* Add Patient Button (Submit) */}
             <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
               Add Patient
             </Button>
           </DialogFooter>
 @@ -1136,93 +1312,195 @@ const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addP
   );
 };
 
 
 // --- MAIN SIDEBAR COMPONENT ---
 // Orchestrates the patient list, modal, and state management including localStorage.
 const Tasks: React.FC = () => {
   // Get sidebar visibility state from context
   const { state } = useContext(HomeContext);
   const { showSidePromptbar } = state;
 
   const PATIENT_STORAGE_KEY = 'patientTrackerData';
   // Key for storing data in localStorage
   const PATIENT_STORAGE_KEY = 'patientTrackerData_v2'; // Use a new key for the new structure
 
   const [patients, setPatients] = useState<Patient[]>([]);
   // Main state for the list of patients
   const [patients, setPatients] = useState<Patient[]>([]); // Initialize empty, will be populated by useEffect
   // State for controlling the Add Patient modal visibility
   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
   // State for tracking notification permission status
   const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
     // Check permission status on initial load if Notification API exists
     typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
   );
 
   // Define placeholder data
   const getDefaultPatients = (): Patient[] => {
       const now = new Date();
       return [
           {
               id: 'patient-1-green',
               name: 'Bed 3 - Ankle Injury',
               arrivalTime: subMinutes(now, 90), // Arrived 90 mins ago
               tasks: [
                   { id: 'task-1a', text: 'X-Ray requested', timerEnd: null, isTimerExpired: false, completionStatus: 'in-progress', createdAt: subMinutes(now, 85), completedAt: null, notes: '', isAcknowledged: false },
                   { id: 'task-1b', text: 'Analgesia given', timerEnd: null, isTimerExpired: false, completionStatus: 'complete', createdAt: subMinutes(now, 80), completedAt: subMinutes(now, 75), notes: 'Paracetamol 1g IV', isAcknowledged: false },
               ],
               notes: 'Simple ankle fracture, awaiting X-ray report.',
           },
           {
               id: 'patient-2-amber',
               name: 'Mr. Jones - Chest Pain',
               arrivalTime: subMinutes(now, 150), // Arrived 150 mins ago
               tasks: [
                   { id: 'task-2a', text: 'ECG Done', timerEnd: null, isTimerExpired: false, completionStatus: 'complete', createdAt: subMinutes(now, 145), completedAt: subMinutes(now, 140), notes: 'Sinus rhythm, no acute changes.', isAcknowledged: false },
                   { id: 'task-2b', text: 'Bloods sent', timerEnd: null, isTimerExpired: false, completionStatus: 'in-progress', createdAt: subMinutes(now, 135), completedAt: null, notes: 'FBC, U&E, Trop', isAcknowledged: false },
                   { id: 'task-2c', text: 'Chase Troponin', timerEnd: addMinutes(now, 30), isTimerExpired: false, completionStatus: 'incomplete', createdAt: subMinutes(now, 60), completedAt: null, notes: '', isAcknowledged: false },
               ],
               notes: 'Query ACS. Stable for now.',
           },
           {
               id: 'patient-3-red',
               name: 'Ms. Williams - Fall',
               arrivalTime: subMinutes(now, 250), // Arrived 250 mins ago
               tasks: [
                   { id: 'task-3a', text: 'CT Head requested', timerEnd: null, isTimerExpired: false, completionStatus: 'incomplete', createdAt: subMinutes(now, 240), completedAt: null, notes: 'GCS 14, confused.', isAcknowledged: false },
                   { id: 'task-3b', text: 'Refer to Ortho', timerEnd: subMinutes(now, 10), isTimerExpired: true, completionStatus: 'incomplete', createdAt: subMinutes(now, 180), completedAt: null, notes: 'Possible #NOF', isAcknowledged: false }, // Timer expired 10 mins ago
               ],
               notes: 'Elderly fall, head injury vs hip fracture.',
           },
           {
               id: 'patient-4-flashing',
               name: 'Bed 10 - Query Sepsis',
               arrivalTime: subMinutes(now, 310), // Arrived 310 mins ago
               tasks: [
                   { id: 'task-4a', text: 'Antibiotics Administered', timerEnd: null, isTimerExpired: false, completionStatus: 'complete', createdAt: subMinutes(now, 300), completedAt: subMinutes(now, 290), notes: 'Tazocin 4.5g IV', isAcknowledged: false },
                   { id: 'task-4b', text: 'Review Vitals', timerEnd: addMinutes(now, 5), isTimerExpired: false, completionStatus: 'incomplete', createdAt: subMinutes(now, 15), completedAt: null, notes: 'Check BP and Temp', isAcknowledged: false }, // Timer due soon
               ],
               notes: 'High temp, low BP. Sepsis 6 pathway initiated.',
           },
       ];
   };
 
   // Effect to load patient data from localStorage or use defaults on initial mount
   useEffect(() => {
     if (typeof window === 'undefined') return;
     if (typeof window === 'undefined') return; // Skip on server-side rendering
 
     let loadedPatients: Patient[] | null = null;
     try {
       const jsonData = window.localStorage.getItem(PATIENT_STORAGE_KEY);
       if (jsonData) {
         const parsed = parsePatientsWithDates(jsonData);
         if (parsed) {
           setPatients(parsed);
           return;
         loadedPatients = parsePatientsWithDates(jsonData); // Use safe parsing function
         if (loadedPatients) {
           console.log('Patient data loaded from localStorage.');
         } else {
           console.warn('Failed to parse patient data from localStorage. Using defaults.');
           window.localStorage.removeItem(PATIENT_STORAGE_KEY); // Clear invalid data
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
     // Set state with loaded data or defaults
     setPatients(loadedPatients || getDefaultPatients());
 
   }, []); // Empty dependency array ensures this runs only once on mount
 
   // Effect to save patient data to localStorage whenever the 'patients' state changes
   useEffect(() => {
     if (typeof window === 'undefined') return;
     if (typeof window === 'undefined') return; // Skip on server-side rendering
 
     // Avoid saving the initial empty array before loading/defaults are set
     if (patients.length === 0 && !localStorage.getItem(PATIENT_STORAGE_KEY)) {
         return;
     }
 
     try {
       // console.log('Saving patients to localStorage:', patients); // Debug log
       window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patients));
     } catch (err) {
       console.error('Error saving to localStorage:', err);
       // Handle potential storage errors (e.g., quota exceeded)
     }
   }, [patients]);
   }, [patients]); // Run whenever the patients array changes
 
   // Effect to request notification permission if not already granted or denied
   useEffect(() => {
     if (typeof window !== 'undefined' && 'Notification' in window) {
       if (notificationPermission === 'default') {
         Notification.requestPermission().then(setNotificationPermission);
       if (notificationPermission === 'default') { // Only request if permission is 'default'
         console.log('Requesting notification permission...');
         Notification.requestPermission().then(permission => {
             console.log('Notification permission status:', permission);
             setNotificationPermission(permission);
         });
       }
     }
   }, [notificationPermission]);
   }, [notificationPermission]); // Run when permission status changes
 
   // Effect to ensure patients are always sorted by arrival time
   // This might be redundant if sorting happens on add, but ensures consistency
   useEffect(() => {
     const isSorted = patients.every((p, idx, arr) => {
       if (idx === 0) return true;
       return arr[idx - 1].arrivalTime <= p.arrivalTime;
       // Handle potentially invalid dates during comparison
       const prevTime = arr[idx - 1]?.arrivalTime?.getTime();
       const currentTime = p.arrivalTime?.getTime();
       // If either date is invalid, consider it "sorted" to avoid errors
       if (!prevTime || isNaN(prevTime) || !currentTime || isNaN(currentTime)) return true;
       return prevTime <= currentTime;
     });
     if (!isSorted) {
       console.log("Re-sorting patients by arrival time.");
       setPatients((prev) =>
         [...prev].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())
         [...prev].sort((a, b) => {
              // Handle potentially invalid dates during sort
              const timeA = a.arrivalTime?.getTime();
              const timeB = b.arrivalTime?.getTime();
              if (isNaN(timeA) && isNaN(timeB)) return 0; // Both invalid, keep order
              if (isNaN(timeA)) return 1; // Invalid A goes last
              if (isNaN(timeB)) return -1; // Invalid B goes last
              return timeA - timeB; // Sort valid dates
         })
       );
     }
   }, [patients]);
   }, [patients]); // Run whenever patients array changes
 
   // --- CRUD and State Update Callbacks ---
   // These functions modify the 'patients' state and are passed down to child components.
   // Using useCallback to memoize functions for performance optimization.
 
   // --- CRUD callbacks ---
   const addPatient = useCallback((newPatient: Patient) => {
     setPatients((prev) => [...prev, newPatient].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()));
     setPatients((prev) => [...prev, newPatient].sort((a, b) => {
         const timeA = a.arrivalTime?.getTime();
         const timeB = b.arrivalTime?.getTime();
         if (isNaN(timeA) && isNaN(timeB)) return 0;
         if (isNaN(timeA)) return 1;
         if (isNaN(timeB)) return -1;
         return timeA - timeB;
     }));
   }, []);
 
   const removePatient = useCallback((patientId: string) => {
     // Optional: Add confirmation dialog here
     setPatients((prev) => prev.filter((p) => p.id !== patientId));
   }, []);
 
   // Updates the isTimerExpired state and resets acknowledgement when timer state changes
   const updateTaskTimerState = useCallback(
     (patientId: string, taskId: string | number, isExpired: boolean) => {
       setPatients((prevPatients) =>
         prevPatients.map((p) => {
           if (p.id === patientId) {
             const newTasks = p.tasks.map((t) => {
               if (t.id === taskId && t.isTimerExpired !== isExpired) {
                 // Reset acknowledgement when timer becomes expired, keep it otherwise
                 const newAcknowledged = isExpired ? false : t.isAcknowledged;
                 return { ...t, isTimerExpired: isExpired, isAcknowledged: newAcknowledged };
               }
               return t;
             });
             return { ...p, tasks: newTasks };
             // Only return a new patient object if tasks actually changed
             return p.tasks === newTasks ? p : { ...p, tasks: newTasks };
           }
           return p;
         })
 @@ -1231,6 +1509,7 @@ const Tasks: React.FC = () => {
     []
   );
 
   // Adds a new task to a specific patient
   const addTaskToPatient = useCallback(
     (patientId: string, taskText: string, timerMinutes: string) => {
       setPatients((prevPatients) =>
 @@ -1242,7 +1521,7 @@ const Tasks: React.FC = () => {
 
             const newTask: Task = {
               id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
               text: taskText,
               text: taskText.trim(),
               timerEnd: timerEndDate,
               isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
               completionStatus: 'incomplete',
 @@ -1251,15 +1530,17 @@ const Tasks: React.FC = () => {
               notes: '',
               isAcknowledged: false,
             };
             // Return new patient object with the added task
             return { ...p, tasks: [...p.tasks, newTask] };
           }
           return p;
           return p; // Return unchanged patient
         })
       );
     },
     []
   );
 
   // Updates or removes the timer for a specific task
   const updateTaskTimer = useCallback(
     (patientId: string, taskId: string | number, newTimerMinutes: string | null) => {
       setPatients((prevPatients) =>
 @@ -1269,43 +1550,52 @@ const Tasks: React.FC = () => {
               if (t.id === taskId) {
                 let newTimerEnd: Date | null = null;
                 let newIsTimerExpired = false;
                 // Calculate new end time if minutes are provided
                 if (newTimerMinutes !== null) {
                   const timerMinutesNum = parseInt(newTimerMinutes, 10);
                   if (!isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999) {
                     newTimerEnd = addMinutes(new Date(), timerMinutesNum);
                     newIsTimerExpired = newTimerEnd <= new Date();
                     newIsTimerExpired = newTimerEnd <= new Date(); // Check if immediately expired
                   } else {
                      // Handle invalid input - perhaps keep old timer or clear it? Clearing for now.
                      console.warn("Invalid timer input, clearing timer for task:", taskId);
                   }
                 }
                 // Return updated task, resetting acknowledgement
                 return {
                   ...t,
                   timerEnd: newTimerEnd,
                   isTimerExpired: newIsTimerExpired,
                   isAcknowledged: false,
                   isAcknowledged: false, // Always reset acknowledgement on timer change
                 };
               }
               return t;
               return t; // Return unchanged task
             });
             return { ...p, tasks: newTasks };
              // Only return a new patient object if tasks actually changed
             return p.tasks === newTasks ? p : { ...p, tasks: newTasks };
           }
           return p;
           return p; // Return unchanged patient
         })
       );
     },
     []
   );
 
   // Removes a specific task from a patient
   const removeTaskFromPatient = useCallback((patientId: string, taskId: string | number) => {
     setPatients((prevPatients) =>
       prevPatients.map((p) => {
         if (p.id === patientId) {
           const remainingTasks = p.tasks.filter((t) => t.id !== taskId);
           return { ...p, tasks: remainingTasks };
            // Only return a new patient object if tasks actually changed
           return p.tasks.length === remainingTasks.length ? p : { ...p, tasks: remainingTasks };
         }
         return p;
       })
     );
   }, []);
 
   // Updates the completion status and completedAt time for a task
   const updateTaskCompletion = useCallback(
     (patientId: string, taskId: string | number, status: TaskCompletionStatus) => {
       setPatients((prevPatients) =>
 @@ -1314,18 +1604,20 @@ const Tasks: React.FC = () => {
             const newTasks = p.tasks.map((t) => {
               if (t.id === taskId) {
                 const isNowComplete = status === 'complete';
                 const completedTime = isNowComplete ? new Date() : null;
                 const completedTime = isNowComplete ? new Date() : null; // Set completed time only if status is 'complete'
                 // Acknowledge timer automatically if task is completed
                 const newAcknowledged = isNowComplete ? true : t.isAcknowledged;
                 return {
                   ...t,
                   completionStatus: status,
                   completedAt: completedTime,
                   isAcknowledged: newAcknowledged,
                   isAcknowledged: newAcknowledged, // Auto-acknowledge on complete
                 };
               }
               return t;
             });
             return { ...p, tasks: newTasks };
              // Only return a new patient object if tasks actually changed
             return p.tasks === newTasks ? p : { ...p, tasks: newTasks };
           }
           return p;
         })
 @@ -1334,41 +1626,47 @@ const Tasks: React.FC = () => {
     []
   );
 
   // Marks an expired timer as acknowledged
   const acknowledgeTaskTimer = useCallback((patientId: string, taskId: string | number) => {
     setPatients((prevPatients) =>
       prevPatients.map((p) => {
         if (p.id === patientId) {
           const newTasks = p.tasks.map((t) => {
             // Only acknowledge if the task matches and the timer is actually expired
             if (t.id === taskId && t.isTimerExpired) {
               return { ...t, isAcknowledged: true };
             }
             return t;
           });
           return { ...p, tasks: newTasks };
            // Only return a new patient object if tasks actually changed
           return p.tasks === newTasks ? p : { ...p, tasks: newTasks };
         }
         return p;
       })
     );
   }, []);
 
   // Updates the general notes for a patient
   const updatePatientNotes = useCallback((patientId: string, notes: string) => {
     setPatients((prevPatients) =>
       prevPatients.map((p) => (p.id === patientId ? { ...p, notes } : p))
       prevPatients.map((p) => (p.id === patientId ? { ...p, notes: notes.trim() } : p))
     );
   }, []);
 
   // Updates the notes for a specific task
   const updateTaskNotes = useCallback(
     (patientId: string, taskId: string | number, notes: string) => {
       setPatients((prevPatients) =>
         prevPatients.map((p) => {
           if (p.id === patientId) {
             const newTasks = p.tasks.map((t) => {
               if (t.id === taskId) {
                 return { ...t, notes };
                 return { ...t, notes: notes.trim() }; // Update notes for the specific task
               }
               return t;
             });
             return { ...p, tasks: newTasks };
              // Only return a new patient object if tasks actually changed
             return p.tasks === newTasks ? p : { ...p, tasks: newTasks };
           }
           return p;
         })
 @@ -1377,40 +1675,48 @@ const Tasks: React.FC = () => {
     []
   );
 
   // --- Reduced the sidebar width by ~20% here ---
   const sidebarWidth = showSidePromptbar ? 'w-40 lg:w-80' : 'w-0';
   // --- Sidebar Width ---
   const sidebarWidth = showSidePromptbar ? 'w-80 lg:w-[400px]' : 'w-0'; // Example: wider on large screens
 
   // --- Render Logic ---
   return (
     // Main sidebar container with light background
     <div
       className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 shadow-md border-l border-gray-200 ${sidebarWidth}`}
       className={`flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out bg-white shadow-lg border-l border-gray-200 ${sidebarWidth}`}
     >
       {/* Only render content if sidebar is shown */}
       {showSidePromptbar && (
         <>
           <div className="flex justify-between items-center p-4 shadow-md border-b border-gray-200 flex-shrink-0">
             <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
           {/* Sidebar Header - Adjusted for light theme */}
           <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
             <h2 className="text-lg font-semibold text-gray-800">Patient Tracker</h2> {/* Dark text on light bg */}
             {/* Add Patient Button */}
             <Button
               variant="outline"
               size="sm"
               onClick={() => setIsModalOpen(true)}
               className="bg-[#008080] hover:bg-[#008080] border-[#008080] text-black"
               className="bg-teal-600 hover:bg-teal-700 border-teal-600 text-white" // Primary button style remains suitable
             >
               <Plus className="h-4 w-4 mr-2" />
               Add Patient
             </Button>
           </div>
 
           <div className="flex-1 overflow-y-auto p-4">
           {/* Scrollable Patient List Area */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4"> {/* Added space between cards */}
             {patients.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                 <AlertTriangle className="w-10 h-10 mb-4 text-gray-600" />
               // Placeholder when no patients exist - Adjusted for light theme
               <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center pt-10">
                 <AlertTriangle className="w-10 h-10 mb-4 text-gray-400" />
                 <p className="font-medium">No patients being tracked.</p>
                 <p className="text-sm mt-1">Click &quot;Add Patient&quot; to start.</p>
               </div>
             ) : (
               // Render PatientCard for each patient
               patients.map((patient) => (
                 <PatientCard
                   key={patient.id}
                   patient={patient}
                   // Pass down all necessary callback functions
                   removePatient={removePatient}
                   updateTaskTimerState={updateTaskTimerState}
                   addTaskToPatient={addTaskToPatient}
 @@ -1425,6 +1731,7 @@ const Tasks: React.FC = () => {
             )}
           </div>
 
           {/* Add Patient Modal (Kept light theme for contrast) */}
           <AddPatientModal
             isOpen={isModalOpen}
             onClose={() => setIsModalOpen(false)}
 @@ -1437,3 +1744,33 @@ const Tasks: React.FC = () => {
 };
 
 export default Tasks;
 
 // Add CSS for animations if not using Tailwind's built-in animate-pulse
 // You might need to add this to your global CSS file:
 /*
 @keyframes pulse-border {
   0%, 100% { border-color: rgba(225, 29, 72, 1); } // rose-600
   50% { border-color: rgba(225, 29, 72, 0.4); }
 }
 .animate-pulse-border {
   animation: pulse-border 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
 }
 
 // Flash animation suitable for light backgrounds (inside cards)
 @keyframes flash-light {
   0%, 100% { background-color: rgba(254, 226, 226, 1); } // rose-100
   50% { background-color: transparent; } // Use card's default background
 }
 .animate-flash-light {
   animation: flash-light 1s linear infinite;
 }
 
 // Flash animation suitable for dark backgrounds (if needed elsewhere)
 // @keyframes flash-dark {
 //   0%, 100% { background-color: rgba(153, 27, 27, 0.3); } // semi-transparent dark red (red-900/30)
 //   50% { background-color: transparent; } // Use card's default background
 // }
 // .animate-flash-dark {
 //   animation: flash-dark 1s linear infinite;
 // }
 */

import React, {
    useState,
    useEffect,
    useCallback,
    ChangeEvent,
    FormEvent,
    ForwardedRef,
    useContext,
  } from 'react';
  import { Plus, Clock, AlertTriangle, X } from 'lucide-react';
  import {
    format,
    differenceInMinutes,
    addMinutes,
    formatDistanceToNowStrict,
    parse,
  } from 'date-fns';
  
  import HomeContext from '@/pages/api/home/home.context';
  
  // --- Type Definitions ---
  interface Task {
    id: string | number; // Allow number for initial Date.now() ID
    text: string;
    timerEnd: Date | null;
    isTimerExpired: boolean;
  }
  
  interface Patient {
    id: string;
    name: string;
    arrivalTime: Date;
    tasks: Task[];
  }
  
  // --- Mock shadcn/ui Components (with basic TS types) ---
  // Replace with actual imports from shadcn if you have them:
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    className?: string;
  }
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
      const baseStyle =
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
      const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
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
          className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
          ref={ref}
          {...props}
        />
      );
    },
  );
  Button.displayName = 'Button';
  
  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
  }
  const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    const baseStyle =
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
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
  
  interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
  }
  const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={`h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${className}`}
      {...props}
    />
  ));
  Checkbox.displayName = 'Checkbox';
  
  // Basic Dialog implementation
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
  
  interface DialogTriggerProps {
    children: React.ReactElement;
    onClick: () => void;
  }
  const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, onClick }) =>
    React.cloneElement(children, { onClick });
  
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
  const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick, asChild }) =>
    React.cloneElement(children, { onClick });
  
  // Basic Card implementation
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
    // Using slightly transparent backgrounds for dark mode
    if (minutes >= 300) return 'bg-red-900/50'; // >= 5 hours
    if (minutes >= 240) return 'bg-red-900/50'; // >= 4 hours
    if (minutes >= 120) return 'bg-amber-900/50'; // >= 2 hours
    return 'bg-green-900/50'; // < 2 hours
  };
  
  // --- React Components ---
  
  // Task Item
  interface TaskItemProps {
    task: Task;
    patientId: string;
    updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
  }
  const TaskItem: React.FC<TaskItemProps> = ({ task, patientId, updateTaskTimerState }) => {
    const [isTimerExpired, setIsTimerExpired] = useState<boolean>(task.isTimerExpired);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
  
    useEffect(() => {
      if (!task.timerEnd) {
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
    }, [task.timerEnd, task.id, patientId, updateTaskTimerState, isTimerExpired, task.isTimerExpired]);
  
    const taskStyle = isTimerExpired ? 'animate-flash text-red-400' : 'text-black';
    const checkboxId = `task-${task.id}`;
  
    return (
      <div className={`flex items-center space-x-2 py-1 ${taskStyle}`}>
        <Checkbox
          id={checkboxId}
          className="border-gray-500 data-[state=checked]:bg-[#008080] data-[state=checked]:border-[#008080]"
        />
        <label htmlFor={checkboxId} className="flex-1 text-sm cursor-pointer">
          {task.text}
        </label>
        {task.timerEnd && (
          <span
            className={`text-xs font-mono ${
              isTimerExpired ? 'text-red-400 font-semibold' : 'text-white'
            }`}
          >
            <Clock className="inline h-3 w-3 mr-1" />
            {timeRemaining}
          </span>
        )}
      </div>
    );
  };
  
  // Patient Card
  interface PatientCardProps {
    patient: Patient;
    removePatient: (patientId: string) => void;
    updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
  }
  const PatientCard: React.FC<PatientCardProps> = ({
    patient,
    removePatient,
    updateTaskTimerState,
  }) => {
    const [lengthOfStayMinutes, setLengthOfStayMinutes] = useState<number>(() =>
      differenceInMinutes(new Date(), patient.arrivalTime),
    );
    const [lengthOfStayFormatted, setLengthOfStayFormatted] = useState<string>('');
  
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
      const intervalId = setInterval(calculateLOS, 1000 * 60);
  
      return () => clearInterval(intervalId);
    }, [patient.arrivalTime, patient.name]);
  
    const borderColor = getBorderColor(lengthOfStayMinutes);
    const bgColor = getBackgroundColor(lengthOfStayMinutes);
  
    return (
      <Card className={`mb-4 border-2 ${borderColor} ${bgColor} transition-colors duration-500`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium text-white">{patient.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:text-red-500"
            onClick={() => removePatient(patient.id)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove Patient {patient.name}</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-white mb-2">
            <Clock className="inline h-3 w-3 mr-1" />
            Length of Stay:{' '}
            <span className="font-semibold text-white">{lengthOfStayFormatted}</span>
            <span className="ml-2 text-white">
              (Arrival: {format(patient.arrivalTime, 'HH:mm')})
            </span>
          </div>
          <div className="mt-2 border-t border-gray-700 pt-2">
            <h4 className="text-sm font-medium text-white mb-1">Tasks:</h4>
            {patient.tasks.length === 0 ? (
              <p className="text-xs text-white italic">No tasks added.</p>
            ) : (
              patient.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  patientId={patient.id}
                  updateTaskTimerState={updateTaskTimerState}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Add Patient Modal
  interface AddPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    addPatient: (newPatient: Patient) => void;
  }
  interface ModalTaskState {
    id: number;
    text: string;
    timerMinutes: string;
  }
  const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, addPatient }) => {
    const [patientName, setPatientName] = useState<string>('');
    const [arrivalTime, setArrivalTime] = useState<string>(format(new Date(), 'HH:mm'));
    const [tasks, setTasks] = useState<ModalTaskState[]>([
      { id: Date.now(), text: '', timerMinutes: '' },
    ]);
  
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
      value: string,
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
        arrivalDateTime = now; // Cap at now if future time was entered
      }
  
      const processedTasks: Task[] = tasks
        .filter((task) => task.text.trim() !== '')
        .map((task) => {
          const timerMinutesNum = parseInt(task.timerMinutes, 10);
          const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 250;
          const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;
          return {
            id: `task-${task.id}`,
            text: task.text,
            timerEnd: timerEndDate,
            isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
          };
        });
  
      addPatient({
        id: `patient-${Date.now()}`,
        name: patientName,
        arrivalTime: arrivalDateTime,
        tasks: processedTasks,
      });
  
      // reset form
      setPatientName('');
      setArrivalTime(format(new Date(), 'HH:mm'));
      setTasks([{ id: Date.now(), text: '', timerMinutes: '' }]);
      onClose();
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-neutral-50 text-white sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription className="text-black">
              Enter patient details, arrival time, and tasks.
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPatientName(e.target.value)
                  }
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
              <div className="col-span-4 mt-2">
                <Label className="text-white mb-2 block font-medium">Tasks</Label>
                {tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2 mb-2">
                    <Input
                      type="text"
                      placeholder={`Task ${index + 1} description`}
                      value={task.text}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleTaskChange(task.id, 'text', e.target.value)
                      }
                      className="flex-grow bg-neutral-50 border-gray-600 text-white placeholder-white"
                    />
                    <Input
                      type="number"
                      min="1"
                      max="250"
                      placeholder="Timer (min)"
                      value={task.timerMinutes}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleTaskChange(task.id, 'timerMinutes', e.target.value)
                      }
                      className="w-28 bg-neutral-50 border-gray-600 text-white placeholder-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-red-900/50 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="mt-2 border-gray-600 text-white hover:bg-neutral-50"
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
                className="text-white bg-neutral-50 hover:bg-neutral-50"
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
  
  // Main TasksBar (right Promptbar) Component
  const Tasks: React.FC = () => {
    const { state } = useContext(HomeContext);
    const { showSidePromptbar } = state;
  
    // Toggle open/closed width
    const sidebarWidth = showSidePromptbar ? 'w-80 lg:w-96' : 'w-0';
  
    // Provide the same patient-tracking logic from your original code:
    const [patients, setPatients] = useState<Patient[]>([
      {
        id: 'patient-1-green',
        name: 'Bed 3 - Ankle Injury',
        arrivalTime: addMinutes(new Date(), -90),
        tasks: [
          { id: 'task-1a', text: 'X-Ray requested', timerEnd: null, isTimerExpired: false },
          { id: 'task-1b', text: 'Analgesia given', timerEnd: null, isTimerExpired: false },
        ],
      },
      {
        id: 'patient-2-amber',
        name: 'Mr. Jones - Chest Pain',
        arrivalTime: addMinutes(new Date(), -150),
        tasks: [
          { id: 'task-2a', text: 'ECG Done', timerEnd: null, isTimerExpired: false },
          { id: 'task-2b', text: 'Bloods sent', timerEnd: null, isTimerExpired: false },
          {
            id: 'task-2c',
            text: 'Chase Troponin',
            timerEnd: addMinutes(new Date(), 30),
            isTimerExpired: false,
          },
        ],
      },
      {
        id: 'patient-3-red',
        name: 'Ms. Williams - Fall',
        arrivalTime: addMinutes(new Date(), -250),
        tasks: [
          { id: 'task-3a', text: 'CT Head requested', timerEnd: null, isTimerExpired: false },
          {
            id: 'task-3b',
            text: 'Refer to Ortho',
            timerEnd: addMinutes(new Date(), -10),
            isTimerExpired: true,
          },
        ],
      },
      {
        id: 'patient-4-flashing',
        name: 'Bed 10 - Query Sepsis',
        arrivalTime: addMinutes(new Date(), -310),
        tasks: [
          { id: 'task-4a', text: 'Antibiotics Administered', timerEnd: null, isTimerExpired: false },
        ],
      },
    ]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
    // Add new patient
    const addPatient = useCallback((newPatient: Patient) => {
      setPatients((prev) =>
        [...prev, newPatient].sort(
          (a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime(),
        ),
      );
    }, []);
  
    // Remove a patient
    const removePatient = useCallback((patientId: string) => {
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
    }, []);
  
    // Update a task’s expired state
    const updateTaskTimerState = useCallback(
      (patientId: string, taskId: string | number, isExpired: boolean) => {
        setPatients((prevPatients) =>
          prevPatients.map((p) => {
            if (p.id === patientId) {
              let taskUpdated = false;
              const newTasks = p.tasks.map((t) => {
                if (t.id === taskId && t.isTimerExpired !== isExpired) {
                  taskUpdated = true;
                  return { ...t, isTimerExpired: isExpired };
                }
                return t;
              });
              return taskUpdated ? { ...p, tasks: newTasks } : p;
            }
            return p;
          }),
        );
      },
      [],
    );
  
    // Sort by arrival time once on mount (optional; your call)
    useEffect(() => {
      const isSorted = patients.every((p, idx, arr) => {
        if (idx === 0) return true;
        return arr[idx - 1].arrivalTime <= p.arrivalTime;
      });
      if (!isSorted) {
        setPatients((prev) =>
          [...prev].sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()),
        );
      }
    }, [patients]);
  
    return (
      <div
        className={`flex flex-col h-full overflow-y-auto transition-all duration-300 bg-neutral-50 border-l border-gray-700 ${sidebarWidth}`}
      >
        {/* Only render content if open */}
        {showSidePromptbar && (
          <>
            {/* Sidebar Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-lg font-semibold text-black">Patient Tracker</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-[#008080] hover: bg-[#008080] border-[#008080] text-white"
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
  

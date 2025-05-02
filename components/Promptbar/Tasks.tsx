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
        className={`\${base} \${variants[variant]} \${sizes[size]} \${className ?? ''}`}
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
    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 disabled:opacity-50 \${
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
  <label ref={ref} className={`text-sm font-medium \${className ?? ''}`} {...props} />
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
  <div className={`bg-white rounded-lg shadow-lg p-6 \${className ?? ''}`}>{children}</div>
);
export const DialogHeader: React.FC<DialogSubProps> = ({ className, children }) => (
  <div className={`mb-4 \${className ?? ''}`}>{children}</div>
);
export const DialogTitle: React.FC<DialogSubProps> = ({ className, children }) => (
  <h2 className={`text-lg font-semibold \${className ?? ''}`}>{children}</h2>
);
export const DialogDescription: React.FC<DialogSubProps> = ({ className, children }) => (
  <p className={`text-sm text-muted-foreground \${className ?? ''}`}>{children}</p>
);
export const DialogFooter: React.FC<DialogSubProps> = ({ className, children }) => (
  <div className={`mt-6 flex justify-end space-x-2 \${className ?? ''}`}>{children}</div>
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
    className={`rounded-lg border bg-card text-card-foreground shadow-sm \${
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
  <div ref={ref} className={`p-4 \${className ?? ''}`} {...props} />
));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold \${className ?? ''}`} {...props} />
));
CardTitle.displayName = 'CardTitle';
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-4 pt-0 \${className ?? ''}`} {...props} />
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

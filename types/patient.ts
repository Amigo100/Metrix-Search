// types/patient.ts

/**
 * Defines the possible completion states for a task.
 */
export type TaskCompletionStatus = 'incomplete' | 'in-progress' | 'complete';

/**
 * Represents a single task associated with a patient.
 */
export interface Task {
  /** Unique identifier for the task (can be string or number based on original code) */
  id: string | number;
  /** The description or text of the task */
  text: string;
  /** The date and time when the task timer is set to end, or null if no timer */
  timerEnd: Date | null;
  /** Flag indicating if the timer (if set) has passed its end time */
  isTimerExpired: boolean;
  /** The current completion status of the task */
  completionStatus: TaskCompletionStatus;
  /** The date and time when the task was created */
  createdAt: Date;
  /** The date and time when the task was marked as complete, or null if not complete */
  completedAt: Date | null;
  /** Additional notes or details about the task */
  notes: string;
  /** Flag indicating if an expired timer has been acknowledged by the user */
  isAcknowledged: boolean;
}

/**
 * Represents a patient being tracked.
 */
export interface Patient {
  /** Unique identifier for the patient */
  id: string;
  /** The name or identifier of the patient (e.g., "Bed 5", "Mr. Smith") */
  name: string;
  /** The date and time when the patient arrived */
  arrivalTime: Date;
  /** An array of tasks associated with the patient */
  tasks: Task[];
  /** General notes or details about the patient */
  notes: string;
}

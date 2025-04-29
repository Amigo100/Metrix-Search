// components/patients/PatientCard.tsx
'use client';

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  KeyboardEvent,
} from 'react';
import {
  Plus,
  Clock,
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
  formatDistanceToNowStrict,
  formatRelative,
} from 'date-fns';

import { Patient, Task, TaskCompletionStatus } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const getBorderColor = (m: number) =>
  m >= 300
    ? 'border-red-500 animate-pulse-border'
    : m >= 240
    ? 'border-red-500'
    : m >= 120
    ? 'border-amber-500'
    : 'border-green-500';

/* ------------------------------------------------------------------ */
/* Stub TaskItem (unchanged logic omitted for brevity)                 */
/* ------------------------------------------------------------------ */
interface TaskItemProps {
  task: Task;
  patientId: string;
  patientName: string;
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
  removeTask: (pid: string, tid: string | number) => void;
  updateTaskCompletion: (
    pid: string,
    tid: string | number,
    status: TaskCompletionStatus
  ) => void;
  acknowledgeTimer: (pid: string, tid: string | number) => void;
  updateTaskNotes: (pid: string, tid: string | number, notes: string) => void;
}
const TaskItem: React.FC<TaskItemProps> = () => null;

/* ------------------------------------------------------------------ */
/* PatientCard                                                        */
/* ------------------------------------------------------------------ */
export interface PatientCardProps {
  patient: Patient;
  removePatient: (id: string) => void;
  updateTaskTimerState: (
    pid: string,
    tid: string | number,
    expired: boolean
  ) => void;
  addTaskToPatient: (pid: string, text: string, mins: string) => void;
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

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  removePatient,
  updatePatientStatus,
}) => {
  const minsSinceArrival = differenceInMinutes(new Date(), patient.arrivalTime);

  return (
    <Card className={`mb-4 border-2 ${getBorderColor(minsSinceArrival)} bg-neutral-50`}>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* name */}
          <CardTitle className="text-base font-medium flex-1 break-words whitespace-normal">
            {patient.name}
          </CardTitle>

          {/* status badge & controls */}
          {patient.status !== 'active' && (
            <Badge className="text-xs capitalize" variant="secondary">
              {patient.status}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 text-green-500"
            title="Mark Discharged"
            onClick={() => updatePatientStatus(patient.id, 'discharged')}
          >
            ✓
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 text-blue-500"
            title="Mark Admitted"
            onClick={() => updatePatientStatus(patient.id, 'admitted')}
          >
            ↑
          </Button>
        </div>

        {/* remove card */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 text-black hover:text-red-500"
          onClick={() => removePatient(patient.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* rest of card content (omitted) */}
      <CardContent>
        {/* tasks, notes, etc. */}
      </CardContent>
    </Card>
  );
};
PatientCard.displayName = 'PatientCard';

export { PatientCard };

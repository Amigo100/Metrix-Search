// /frontend/pages/api/home/home.context.tsx
import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

// --- Existing Type Imports ---
import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';

// --- ADDED: Import Patient/Task Types ---
import { Patient, Task, TaskCompletionStatus } from '@/types/patient';

import { HomeInitialState } from './home.state';

/**
 * The interface describing what the context provides.
 */
export interface HomeContextProps {
  /* ------------------------------------------------------------------ */
  /* Core state / dispatch                                              */
  /* ------------------------------------------------------------------ */
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;

  /* ------------------------------------------------------------------ */
  /* Conversation & folder handlers (unchanged)                         */
  /* ------------------------------------------------------------------ */
  handleNewConversation: () => void;
  handleCreateFolder: (name: string, type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void;

  /* ------------------------------------------------------------------ */
  /* Patient / task handlers                                            */
  /* ------------------------------------------------------------------ */
  addPatient: (
    newPatient: Omit<Patient, 'id' | 'tasks'> & {
      tasks: Omit<Task, 'id'>[];
    },
  ) => void;
  removePatient: (patientId: string) => void;
  updateTaskTimerState: (
    patientId: string,
    taskId: string | number,
    isExpired: boolean,
  ) => void;
  addTaskToPatient: (
    patientId: string,
    taskText: string,
    timerMinutes: string,
  ) => void;
  updateTaskTimer: (
    patientId: string,
    taskId: string | number,
    newTimerMinutes: string | null,
  ) => void;
  removeTaskFromPatient: (patientId: string, taskId: string | number) => void;
  updateTaskCompletion: (
    patientId: string,
    taskId: string | number,
    status: TaskCompletionStatus,
  ) => void;
  acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void;
  updatePatientNotes: (patientId: string, notes: string) => void;
  updateTaskNotes: (
    patientId: string,
    taskId: string | number,
    notes: string,
  ) => void;

  /**
   * NEW — change a patient's high‑level status (active / discharged / admitted).
   */
  updatePatientStatus: (
    patientId: string,
    status: 'active' | 'discharged' | 'admitted',
  ) => void;
}

/**
 * Undefined default satisfies TS; Provider supplies the real value.
 */
const HomeContext = createContext<HomeContextProps>(undefined!);
export default HomeContext;

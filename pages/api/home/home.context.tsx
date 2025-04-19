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
 * The interface describing what the context provides:
 * - state: the entire HomeInitialState
 * - dispatch: the reducer's dispatch
 * - plus all the handler functions from home.provider
 */
export interface HomeContextProps {
  // --- Existing Properties ---
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;

  // Existing Chat/Folder Handlers
  handleNewConversation: () => void;
  handleCreateFolder: (name: string, type: FolderType) => void; // Type adjusted based on provided code
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void; // Type adjusted based on provided code

  // === ADDED: Patient/Task Handler Signatures ===
  addPatient: (newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }) => void;
  removePatient: (patientId: string) => void;
  updateTaskTimerState: (patientId: string, taskId: string | number, isExpired: boolean) => void;
  addTaskToPatient: (patientId: string, taskText: string, timerMinutes: string) => void;
  updateTaskTimer: (patientId: string, taskId: string | number, newTimerMinutes: string | null) => void;
  removeTaskFromPatient: (patientId: string, taskId: string | number) => void;
  updateTaskCompletion: (patientId: string, taskId: string | number, status: TaskCompletionStatus) => void;
  acknowledgeTaskTimer: (patientId: string, taskId: string | number) => void;
  updatePatientNotes: (patientId: string, notes: string) => void;
  updateTaskNotes: (patientId: string, taskId: string | number, notes: string) => void;
  // === END OF ADDITIONS ===
}

/**
 * Create the HomeContext with a default value.
 * Using `undefined!` is a common pattern to satisfy TypeScript
 * when you know you'll provide a real value in the Provider.
 */
const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;

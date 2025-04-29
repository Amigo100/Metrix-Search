// /frontend/pages/api/home/home.provider.tsx
import React, { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { ActionType } from '@/hooks/useCreateReducer';

// -------------------------------------------------------------------
// Extend the base reducer action with UPDATE_PATIENT_STATUS
// -------------------------------------------------------------------
export type UpdateStatusAction = {
  type: 'UPDATE_PATIENT_STATUS';
  id: string;
  status: 'active' | 'discharged' | 'admitted';
};

type ExtendedAction = ActionType<HomeInitialState> | UpdateStatusAction;

import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';
import { Patient, Task, TaskCompletionStatus } from '@/types/patient';
import { parsePatientsWithDates } from '@/utils/patientUtils';

const PATIENT_STORAGE_KEY = 'patientTrackerData';

type ReducerAction = ActionType<HomeInitialState> & {
  type:
    | 'reset'
    | 'change'
    | 'UPDATE_PATIENT_STATUS';
  id?: string;
  status?: 'active' | 'discharged' | 'admitted';
};

function homeReducer(
  state: HomeInitialState,
  action: ExtendedAction,
): HomeInitialState: HomeInitialState {
  switch (action.type) {
    case 'reset':
      return { ...initialState, patients: [] };
    case 'change':
      return { ...state, [action.field as keyof HomeInitialState]: action.value } as HomeInitialState;
    /* ------------------------------------------------------------------ */
    /* NEW: change patient.status                                          */
    /* ------------------------------------------------------------------ */
    case 'UPDATE_PATIENT_STATUS':
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.id ? { ...p, status: action.status } : p,
        ),
      } as HomeInitialState;
    default:
      return state;
  }
}

export default function HomeContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(homeReducer, initialState);

  /* ------------------------------------------------------------------ */
  /* Local‑storage load/save (unchanged)                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const json = localStorage.getItem(PATIENT_STORAGE_KEY);
    if (json) {
      const parsed = parsePatientsWithDates(json);
      if (parsed) dispatch({ type: 'change', field: 'patients', value: parsed });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(state.patients));
  }, [state.patients]);

  /* ------------------------------------------------------------------ */
  /* Patient/task handlers (excerpt – most existing functions kept)      */
  /* ------------------------------------------------------------------ */
  const updatePatientStatus = useCallback(
    (id: string, status: 'active' | 'discharged' | 'admitted') => {
      dispatch({ type: 'UPDATE_PATIENT_STATUS', id, status } as UpdateStatusAction);
    },
    [dispatch],
  );

  // existing handlers ... (addPatient, removePatient, etc.)
  const addPatient = useCallback((data: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }) => {
    const newPatient: Patient = {
      ...data,
      id: `patient-${Date.now()}`,
      status: 'active',
      tasks: data.tasks.map((t, i) => ({
        ...t,
        id: `task-${Date.now()}-${i}`,
        isTimerExpired: !!(t.timerEnd && t.timerEnd <= new Date()),
        createdAt: t.createdAt || new Date(),
      })),
    } as Patient;
    const updated = [...state.patients, newPatient];
    dispatch({ type: 'change', field: 'patients', value: updated });
  }, [state.patients, dispatch]);

  /* Other handlers (removePatient, updateTaskTimerState, etc.) would be here – omitted for brevity */

  /* ------------------------------------------------------------------ */
  /* Provider value                                                      */
  /* ------------------------------------------------------------------ */
  const contextValue = {
    state,
    dispatch,
    // conversation handlers (omitted for brevity)
    // patient handlers (only ones relevant for this snippet)
    addPatient,
    removePatient: () => {},
    updateTaskTimerState: () => {},
    addTaskToPatient: () => {},
    updateTaskTimer: () => {},
    removeTaskFromPatient: () => {},
    updateTaskCompletion: () => {},
    acknowledgeTaskTimer: () => {},
    updatePatientNotes: () => {},
    updateTaskNotes: () => {},
    /* NEW */
    updatePatientStatus,
  } as any; // cast for brevity

  return <HomeContext.Provider value={contextValue}>{children}</HomeContext.Provider>;
}

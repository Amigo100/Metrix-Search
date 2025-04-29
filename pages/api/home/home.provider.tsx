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
): HomeInitialState {
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

  /* ------------------------------------------------------------------ */
  /* Remaining patient/task handlers (restored)                        */
  /* ------------------------------------------------------------------ */
  const removePatient = useCallback((id: string) => {
    dispatch({
      type: 'change',
      field: 'patients',
      value: state.patients.filter(p => p.id !== id),
    });
  }, [state.patients, dispatch]);

  const updateTaskTimerState = useCallback(
    (pid: string, tid: string | number, expired: boolean) => {
      const updated = state.patients.map(p =>
        p.id === pid
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === tid ? { ...t, isTimerExpired: expired } : t,
              ),
            }
          : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const addTaskToPatient = useCallback(
    (pid: string, text: string, mins: string) => {
      const m = parseInt(mins, 10);
      const timerEnd = !isNaN(m) && m > 0 ? addMinutes(new Date(), m) : null;
      const updated = state.patients.map(p =>
        p.id === pid
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                {
                  id: `task-${Date.now()}`,
                  text,
                  timerEnd,
                  isTimerExpired: !!(timerEnd && timerEnd <= new Date()),
                  completionStatus: 'incomplete',
                  createdAt: new Date(),
                  completedAt: null,
                  notes: '',
                  isAcknowledged: false,
                },
              ],
            }
          : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const updateTaskTimer = useCallback(
    (pid: string, tid: string | number, mins: string | null) => {
      const newEnd = mins ? addMinutes(new Date(), parseInt(mins, 10)) : null;
      const updated = state.patients.map(p =>
        p.id === pid
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === tid
                  ? {
                      ...t,
                      timerEnd: newEnd,
                      isTimerExpired: !!(newEnd && newEnd <= new Date()),
                      isAcknowledged: false,
                    }
                  : t,
              ),
            }
          : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const removeTaskFromPatient = useCallback(
    (pid: string, tid: string | number) => {
      const updated = state.patients.map(p =>
        p.id === pid ? { ...p, tasks: p.tasks.filter(t => t.id !== tid) } : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const updateTaskCompletion = useCallback(
    (pid: string, tid: string | number, status: TaskCompletionStatus) => {
      const completedAt = status === 'complete' ? new Date() : null;
      const updated = state.patients.map(p =>
        p.id === pid
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === tid ? { ...t, completionStatus: status, completedAt } : t,
              ),
            }
          : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const acknowledgeTaskTimer = useCallback(
    (pid: string, tid: string | number) => {
      const updated = state.patients.map(p =>
        p.id === pid
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === tid ? { ...t, isAcknowledged: true } : t,
              ),
            }
          : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const updatePatientNotes = useCallback(
    (pid: string, notes: string) => {
      const updated = state.patients.map(p =>
        p.id === pid ? { ...p, notes } : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  const updateTaskNotes = useCallback(
    (pid: string, tid: string | number, notes: string) => {
      const updated = state.patients.map(p =>
        p.id === pid
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === tid ? { ...t, notes } : t,
              ),
            }
          : p,
      );
      dispatch({ type: 'change', field: 'patients', value: updated });
    },
    [state.patients, dispatch],
  );

  /* ------------------------------------------------------------------ */
  /* Provider value                                                      */
  /* ------------------------------------------------------------------ */
  const contextValue = {
    state,
    dispatch,
    // conversation handlers (omitted for brevity)
    // patient handlers
    addPatient,
    removePatient,
    updateTaskTimerState,
    addTaskToPatient,
    updateTaskTimer,
    removeTaskFromPatient,
    updateTaskCompletion,
    acknowledgeTaskTimer,
    updatePatientNotes,
    updateTaskNotes,
    updatePatientStatus,
  };

  return (
    <HomeContext.Provider value={contextValue}>{children}</HomeContext.Provider>
  );

  /* ------------------------------------------------------------------ */
  /* END file                                                            */
  /* ------------------------------------------------------------------ */
}

// Provider value                                                      */
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

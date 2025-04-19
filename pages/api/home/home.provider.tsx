// /pages/api/home/home.provider.tsx

import React, { useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns'; // Added date-fns import

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state'; // Assumes patients field added here
import { ActionType } from '@/hooks/useCreateReducer';

// --- Corrected/Centralized Imports ---
import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';
import { Patient, Task, TaskCompletionStatus } from '@/types/patient'; // Corrected path
import { parsePatientsWithDates } from '@/utils/patientUtils'; // Corrected path

// --- CONSTANTS ---
const PATIENT_STORAGE_KEY = 'patientTrackerData'; // Added storage key

function homeReducer(
  state: HomeInitialState,
  action: ActionType<HomeInitialState>,
): HomeInitialState {
  switch (action.type) {
    case 'reset':
      // Ensure reset includes patients
      return { ...initialState, patients: [] }; // Initialize patients on reset

    case 'change':
      // This handles updating 'patients' array as well now
      return {
        ...state,
        [action.field]: action.value,
      };
  }
  return state; // fallback
}

export default function HomeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(homeReducer, initialState);

  // --- EFFECT: Load Patients from LocalStorage on Mount ---
  useEffect(() => {
    console.log('[HomeProvider] Attempting to load patients from localStorage...');
    try {
      const jsonData = window.localStorage.getItem(PATIENT_STORAGE_KEY);
      if (jsonData) {
        const parsed = parsePatientsWithDates(jsonData);
        if (parsed) {
          console.log('[HomeProvider] Patients loaded successfully.');
          dispatch({ type: 'change', field: 'patients', value: parsed });
          return; // Exit early if loaded successfully
        } else {
          console.warn('[HomeProvider] Failed to parse patient data from localStorage.');
        }
      } else {
           console.log('[HomeProvider] No patient data found in localStorage.');
      }
    } catch (err) {
      console.error('[HomeProvider] Error reading patients from localStorage:', err);
    }
  }, [dispatch]); // Run only once on mount

  // --- EFFECT: Save Patients to LocalStorage on Change ---
  useEffect(() => {
    // Basic check to avoid saving initial empty state before load potentially finishes
    // Might need more robust logic if initial state loading is async beyond first render
    if (state.patients && state.patients.length >= 0) { // Check if patients array exists
      console.log('[HomeProvider] Saving patients to localStorage...');
      try {
        window.localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(state.patients));
      } catch (err) {
        console.error('[HomeProvider] Error saving patients to localStorage:', err);
      }
    }
  }, [state.patients]); // Run whenever state.patients changes

  // --- PATIENT & TASK HANDLER FUNCTIONS ---

  const addPatient = useCallback((newPatientData: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }) => {
      // Helper to create full Patient object - consider moving to utils if complex
      const createFullPatient = (data: Omit<Patient, 'id' | 'tasks'> & { tasks: Omit<Task, 'id'>[] }): Patient => {
          const processedTasks: Task[] = data.tasks.map((task, index) => ({
              ...task,
              id: `task-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`,
              isTimerExpired: !!(task.timerEnd && task.timerEnd <= new Date()),
              completionStatus: task.completionStatus || 'incomplete',
              createdAt: task.createdAt || new Date(),
              completedAt: task.completedAt || null,
              notes: task.notes || '',
              isAcknowledged: task.isAcknowledged || false,
          }));
          return {
              ...data,
              id: `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              tasks: processedTasks,
              notes: data.notes || '',
              arrivalTime: data.arrivalTime || new Date(),
          };
      };
      const newPatient = createFullPatient(newPatientData);
      const updatedPatients = [...state.patients, newPatient].sort(
          (a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime()
      );
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
      console.log('[HomeProvider] Added patient:', newPatient.name);
  }, [state.patients, dispatch]);


  const removePatient = useCallback((patientId: string) => {
      const updatedPatients = state.patients.filter((p) => p.id !== patientId);
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
       console.log('[HomeProvider] Removed patient:', patientId);
  }, [state.patients, dispatch]);

  const updateTaskTimerState = useCallback((patientId: string, taskId: string | number, isExpired: boolean) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const newTasks = p.tasks.map((t) => {
                  if (t.id === taskId && t.isTimerExpired !== isExpired) {
                      const newAcknowledged = isExpired ? false : t.isAcknowledged;
                      return { ...t, isTimerExpired: isExpired, isAcknowledged: newAcknowledged };
                  }
                  return t;
              });
              return { ...p, tasks: newTasks };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
  }, [state.patients, dispatch]);

  const addTaskToPatient = useCallback((patientId: string, taskText: string, timerMinutes: string) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const timerMinutesNum = parseInt(timerMinutes, 10);
              const isValidTimer = !isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999;
              const timerEndDate = isValidTimer ? addMinutes(new Date(), timerMinutesNum) : null;
              const newTask: Task = {
                  id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                  text: taskText, timerEnd: timerEndDate,
                  isTimerExpired: !!(timerEndDate && timerEndDate <= new Date()),
                  completionStatus: 'incomplete', createdAt: new Date(),
                  completedAt: null, notes: '', isAcknowledged: false,
              };
              return { ...p, tasks: [...p.tasks, newTask] };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
      console.log('[HomeProvider] Added task to patient:', patientId);
  }, [state.patients, dispatch]);

  const updateTaskTimer = useCallback((patientId: string, taskId: string | number, newTimerMinutes: string | null) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const newTasks = p.tasks.map((t) => {
                  if (t.id === taskId) {
                      let newTimerEnd: Date | null = null;
                      let newIsTimerExpired = false;
                      if (newTimerMinutes !== null) {
                          const timerMinutesNum = parseInt(newTimerMinutes, 10);
                          if (!isNaN(timerMinutesNum) && timerMinutesNum > 0 && timerMinutesNum <= 999) {
                              newTimerEnd = addMinutes(new Date(), timerMinutesNum);
                              newIsTimerExpired = newTimerEnd <= new Date();
                          }
                      }
                      return { ...t, timerEnd: newTimerEnd, isTimerExpired: newIsTimerExpired, isAcknowledged: false };
                  }
                  return t;
              });
              return { ...p, tasks: newTasks };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
  }, [state.patients, dispatch]);

  const removeTaskFromPatient = useCallback((patientId: string, taskId: string | number) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const remainingTasks = p.tasks.filter((t) => t.id !== taskId);
              return { ...p, tasks: remainingTasks };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
       console.log('[HomeProvider] Removed task', taskId, 'from patient:', patientId);
  }, [state.patients, dispatch]);

  const updateTaskCompletion = useCallback((patientId: string, taskId: string | number, status: TaskCompletionStatus) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const newTasks = p.tasks.map((t) => {
                  if (t.id === taskId) {
                      const isNowComplete = status === 'complete';
                      const completedTime = isNowComplete ? new Date() : null;
                      const newAcknowledged = isNowComplete || status === 'incomplete' ? true : t.isAcknowledged;
                      return { ...t, completionStatus: status, completedAt: completedTime, isAcknowledged: newAcknowledged };
                  }
                  return t;
              });
              return { ...p, tasks: newTasks };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
  }, [state.patients, dispatch]);

  const acknowledgeTaskTimer = useCallback((patientId: string, taskId: string | number) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const newTasks = p.tasks.map((t) => {
                  if (t.id === taskId && t.isTimerExpired) {
                      return { ...t, isAcknowledged: true };
                  }
                  return t;
              });
              return { ...p, tasks: newTasks };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
       console.log('[HomeProvider] Acknowledged task timer:', taskId, 'for patient:', patientId);
  }, [state.patients, dispatch]);

  const updatePatientNotes = useCallback((patientId: string, notes: string) => {
      const updatedPatients = state.patients.map((p) => (p.id === patientId ? { ...p, notes } : p));
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
       console.log('[HomeProvider] Updated notes for patient:', patientId);
  }, [state.patients, dispatch]);

  const updateTaskNotes = useCallback((patientId: string, taskId: string | number, notes: string) => {
      const updatedPatients = state.patients.map((p) => {
          if (p.id === patientId) {
              const newTasks = p.tasks.map((t) => {
                  if (t.id === taskId) {
                      return { ...t, notes };
                  }
                  return t;
              });
              return { ...p, tasks: newTasks };
          }
          return p;
      });
      dispatch({ type: 'change', field: 'patients', value: updatedPatients });
       console.log('[HomeProvider] Updated notes for task:', taskId, 'on patient:', patientId);
  }, [state.patients, dispatch]);


  // --- EXISTING CHAT HANDLERS ---
  const handleNewConversation = () => {
    console.log('[HomeProvider] Creating a new conversation...');
    const newConv: Conversation = {
      id: uuidv4(), name: 'New Conversation', messages: [],
      model: OpenAIModels['gpt-3.5-turbo'], // Ensure OpenAIModels is defined/imported correctly
      prompt: '', temperature: 1.0, folderId: null,
    };
    dispatch({ type: 'change', field: 'conversations', value: [...state.conversations, newConv]});
    dispatch({ type: 'change', field: 'selectedConversation', value: newConv });
    // Consider moving localStorage logic to useEffect hook for conversations
    localStorage.setItem('conversationHistory', JSON.stringify([...state.conversations, newConv]));
  };

  const handleCreateFolder = (name: string, folderType: string) => {
    console.log('[HomeProvider] STUB: create folder not implemented yet:', name, folderType);
  };
  const handleDeleteFolder = (folderId: string) => {
    console.log('[HomeProvider] STUB: delete folder not implemented yet:', folderId);
  };
  const handleUpdateFolder = (folderId: string, newName: string) => {
    console.log('[HomeProvider] STUB: update folder not implemented yet:', folderId, newName);
  };
  const handleSelectConversation = (conversation: Conversation) => {
    console.log('[HomeProvider] Selecting conversation:', conversation.name);
    dispatch({ type: 'change', field: 'selectedConversation', value: conversation });
  };
  const handleUpdateConversation = (conversation: Conversation, data: { key: string; value: any }) => {
    console.log('[HomeProvider] STUB: updating conversation not implemented yet:', conversation, data);
     if (data.key === 'name') {
          const updatedConversations = state.conversations.map(conv =>
                conv.id === conversation.id ? { ...conv, name: data.value } : conv
          );
           dispatch({ type: 'change', field: 'conversations', value: updatedConversations });
           if (state.selectedConversation?.id === conversation.id) {
                dispatch({ type: 'change', field: 'selectedConversation', value: { ...conversation, name: data.value } });
           }
     }
  };

  // --- CONTEXT PROVIDER VALUE ---
  return (
    <HomeContext.Provider
      value={{
        // State and Dispatch
        state,
        dispatch,
        // Existing Chat Handlers
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
        // NEW Patient/Task Handlers
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
        // Note: Access patients array via state.patients
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}

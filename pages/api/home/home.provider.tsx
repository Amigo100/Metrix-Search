// file: /pages/api/home/home.provider.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

// Import the exact same ActionType from your custom hook
import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';

/**
 * Home reducer that uses the same union action shape:
 *   - { type: 'reset' }
 *   - { type: 'change'; field: keyof HomeInitialState; value: any }
 */
function homeReducer(
  state: HomeInitialState,
  action: ActionType<HomeInitialState>,
): HomeInitialState {
  switch (action.type) {
    case 'reset':
      return initialState;

    case 'change': {
      // Update the field in question
      const { field, value } = action;
      return { ...state, [field]: value };
    }

    default:
      // If you prefer to allow more advanced logic,
      // you can handle additional 'type' variants here
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export default function HomeContextProvider({ children }: { children: React.ReactNode }) {
  // Now we have a single source of truth for how the action is shaped
  // We can do useReducer or your custom useCreateReducer if we want:
  const [state, dispatch] = React.useReducer(homeReducer, initialState);

  // or if you prefer using your custom hook:
  // const { state, dispatch } = useCreateReducer({ initialState });
  // and skip the local homeReducer code entirely.

  // example function
  const handleNewConversation = () => {
    console.log('[HomeProvider] Creating a new conversation...');

    const newConv: Conversation = {
      id: uuidv4(),
      name: 'New Conversation',
      messages: [],
      model: OpenAIModels['gpt-3.5-turbo'],
      prompt: '',
      temperature: 1.0,
      folderId: null,
    };

    // Update conversations
    dispatch({ type: 'change', field: 'conversations', value: [...state.conversations, newConv] });
    // Also set selectedConversation
    dispatch({ type: 'change', field: 'selectedConversation', value: newConv });

    localStorage.setItem('conversationHistory', JSON.stringify([...state.conversations, newConv]));
  };

  return (
    <HomeContext.Provider
      value={{
        state,
        dispatch,
        handleNewConversation,
        // ... any other functions
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}

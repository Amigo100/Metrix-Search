// file: /pages/api/home/home.provider.tsx
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { ActionType } from '@/hooks/useCreateReducer'; // { type: 'reset' } | { type: 'change'; field: keyof HomeInitialState; value: any }

import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';

function homeReducer(
  state: HomeInitialState,
  action: ActionType<HomeInitialState>,
): HomeInitialState {
  switch (action.type) {
    case 'reset':
      return initialState;

    case 'change': {
      return {
        ...state,
        [action.field]: action.value,
      };
    }
  }
  // no default case, because the union is fully handled

  // Optional safety net (will never execute in practice):
  return state;
}

export default function HomeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(homeReducer, initialState);

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

    dispatch({
      type: 'change',
      field: 'conversations',
      value: [...state.conversations, newConv],
    });
    dispatch({
      type: 'change',
      field: 'selectedConversation',
      value: newConv,
    });

    localStorage.setItem(
      'conversationHistory',
      JSON.stringify([...state.conversations, newConv]),
    );
  };

  return (
    <HomeContext.Provider
      value={{
        state,
        dispatch,
        handleNewConversation,
        // ... other methods
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}

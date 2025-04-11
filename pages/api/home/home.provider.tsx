// /pages/api/home/home.provider.tsx

import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';

function homeReducer(
  state: HomeInitialState,
  action: ActionType<HomeInitialState>,
): HomeInitialState {
  switch (action.type) {
    case 'reset':
      return initialState;

    case 'change':
      return {
        ...state,
        [action.field]: action.value,
      };

    // No default: the union is fully covered by 'reset'|'change'
  }
  return state; // fallback
}

export default function HomeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(homeReducer, initialState);

  // Example: create a new conversation
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

  // STUBS for the missing handlers:
  const handleCreateFolder = (name: string, folderType: string) => {
    console.log('[HomeProvider] create folder not implemented yet:', name, folderType);
  };

  const handleDeleteFolder = (folderId: string) => {
    console.log('[HomeProvider] delete folder not implemented yet:', folderId);
  };

  const handleUpdateFolder = (folderId: string, newName: string) => {
    console.log('[HomeProvider] update folder not implemented yet:', folderId, newName);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    console.log('[HomeProvider] selecting conversation not implemented fully yet:', conversation);
    // For instance, set selectedConversation:
    dispatch({ type: 'change', field: 'selectedConversation', value: conversation });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: { key: string; value: any },
  ) => {
    console.log('[HomeProvider] updating conversation not implemented yet:', conversation, data);
    // You could do local updates to state.conversations, etc.
  };

  return (
    <HomeContext.Provider
      value={{
        state,
        dispatch,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}

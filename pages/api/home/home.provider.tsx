// file: /pages/api/home/home.provider.tsx

import React, { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

// Define your union type right here instead of importing
type ActionType<T> =
  | { type: 'reset' }
  | { field: keyof T; value: T[keyof T] };

import { Conversation } from '@/types/chat';
import { OpenAIModels } from '@/types/openai';

/**
 * homeReducer checks for a "reset" action first.
 * If not "reset", then it's the shape { field, value }.
 */
function homeReducer(
  state: HomeInitialState,
  action: ActionType<HomeInitialState>
): HomeInitialState {
  // 1) If it's a "reset" action, return initialState
  if (action.type === 'reset') {
    return initialState;
  }

  // 2) Otherwise, it's the shape { field, value }
  switch (action.field) {
    case 'apiKey':
      return { ...state, apiKey: action.value };

    case 'openModal':
      // e.g. 'profile', 'templates', 'help', 'settings', or null
      return { ...state, openModal: action.value };

    case 'conversations':
      return { ...state, conversations: action.value };

    case 'selectedConversation':
      return { ...state, selectedConversation: action.value };

    case 'showChatbar':
      return { ...state, showChatbar: action.value };

    // ... handle any other fields here

    default:
      // fallback for unrecognized field name
      return { ...state, [action.field]: action.value };
  }
}

export default function HomeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(homeReducer, initialState);

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

    // add it to our conversation list
    const updated = [...state.conversations, newConv];
    dispatch({ field: 'conversations', value: updated });

    // also select it
    dispatch({ field: 'selectedConversation', value: newConv });
    localStorage.setItem('conversationHistory', JSON.stringify(updated));

    console.log('[HomeProvider] New conversation created:', newConv.id);
  };

  // Example stubs for folder management
  const handleCreateFolder = (name: string, type: string) => {
    console.log('[HomeProvider] create folder not implemented yet', name, type);
  };
  const handleDeleteFolder = (folderId: string) => {
    console.log('[HomeProvider] delete folder not implemented yet', folderId);
  };
  const handleUpdateFolder = (folderId: string, name: string) => {
    console.log('[HomeProvider] update folder not implemented yet', folderId, name);
  };

  // Example: select a conversation
  const handleSelectConversation = (conversation: Conversation) => {
    console.log('[HomeProvider] Selecting conversation:', conversation.id);
    dispatch({ field: 'selectedConversation', value: conversation });
  };

  // Example: update conversation fields
  const handleUpdateConversation = (
    conversation: Conversation,
    data: { key: string; value: any }
  ) => {
    console.log('[HomeProvider] Updating conversation:', conversation.id, data);

    const updatedList = state.conversations.map((c) => {
      if (c.id === conversation.id) {
        return { ...c, [data.key]: data.value };
      }
      return c;
    });

    dispatch({ field: 'conversations', value: updatedList });

    // if updating the currently selected conversation => reflect that
    if (state.selectedConversation?.id === conversation.id) {
      const updatedConv = updatedList.find((c) => c.id === conversation.id);
      dispatch({ field: 'selectedConversation', value: updatedConv });
    }

    localStorage.setItem('conversationHistory', JSON.stringify(updatedList));
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

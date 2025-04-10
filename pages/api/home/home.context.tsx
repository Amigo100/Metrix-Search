// /frontend/pages/api/home/home.context.tsx

import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';

import { HomeInitialState } from './home.state';

/**
 * The interface describing what the context provides:
 *  - state: the entire HomeInitialState
 *  - dispatch: the reducer's dispatch
 *  - plus all the handler functions from home.provider
 */
export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;

  // Additional handlers
  handleNewConversation: () => void;
  handleCreateFolder: (name: string, type: FolderType) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdateFolder: (folderId: string, name: string) => void;
  handleSelectConversation: (conversation: Conversation) => void;
  handleUpdateConversation: (conversation: Conversation, data: KeyValuePair) => void;
}

/**
 * Create the HomeContext with a default value.
 * Using `undefined!` is a common pattern to satisfy TypeScript
 * when you know you'll provide a real value in the Provider.
 */
const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;

// /frontend/pages/api/home/home.state.tsx
import { Conversation, Message } from '@/types/chat';
import { ErrorMessage } from '@/types/error';
import { FolderInterface } from '@/types/folder';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';
import { PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

console.log('home.state.tsx file loaded, initializing global state.');

export interface HomeInitialState {
  apiKey: string;
  pluginKeys: PluginKey[];
  loading: boolean;
  lightMode: 'light' | 'dark';
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  models: OpenAIModel[];
  folders: FolderInterface[];
  conversations: Conversation[];
  selectedConversation: Conversation | undefined;
  currentMessage: Message | undefined;
  prompts: Prompt[];
  temperature: number;
  showChatbar: boolean;
  showSidePromptbar: boolean;
  currentFolder: FolderInterface | undefined;
  messageError: boolean;
  searchTerm: string;
  defaultModelId: OpenAIModelID | undefined;
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  promptModalVisible: boolean;
  activePromptIndex: number;
  promptVariables: any;
  textInputContent: string;
  recording: boolean;
  transcribingAudio: boolean;

  /** which modal is open */
  openModal:
    | 'profile'
    | 'templates'
    | 'help'
    | 'predictive analytics'
    | 'settings'
    | null;

  /** personalised data */
  userContext: string;   // NEW – free‑text context string
  userSignOff: string;   // credentials appended to documents

  hasChatOutput?: boolean;
}

export const initialState: HomeInitialState = {
  apiKey: '',
  pluginKeys: [],
  loading: false,
  lightMode: 'dark',
  messageIsStreaming: false,
  modelError: null,
  models: [],
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [
    /* … your template objects stay unchanged … */
  ],
  temperature: 1,
  showChatbar: true,
  showSidePromptbar: false,
  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  defaultModelId: undefined,
  serverSideApiKeyIsSet: false,
  serverSidePluginKeysSet: false,
  promptModalVisible: false,
  activePromptIndex: 0,
  promptVariables: [],
  textInputContent: '',
  recording: false,
  transcribingAudio: false,
  openModal: null,

  /* NEW fields */
  userContext: '',
  userSignOff: '',

  hasChatOutput: false,
};

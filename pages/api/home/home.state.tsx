// /frontend/pages/api/home/home.state.tsx

import { Conversation, Message } from '@/types/chat';
import { ErrorMessage } from '@/types/error';
import { FolderInterface } from '@/types/folder';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';
import { PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

console.log('home.state.tsx file loaded, initializing global state.');

/**
 * Defines the shape of your global "home" state.
 * Adjust or remove fields as needed.
 */
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

  /** Whether left Chatbar is open or closed */
  showChatbar: boolean;

  /** Whether the right-hand “Promptbar” is open or closed */
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

  /** track which modal is open */
  openModal: 'profile' | 'templates' | 'help' | 'predictive analytics' | 'settings' | null;

  /** user sign-off or credentials */
  userSignOff: string;

  /** only show analytics once we have at least one assistant output */
  hasChatOutput?: boolean;
}

/**
 * Default initial state for your global state.
 */
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
    {
      id: 'temp-1-discharge-summary',
      name: 'Discharge Summary',
      description: 'A structured template for detailed discharge summary documentation.',
      content: `Chief Complaint: 

Duration (If Applicable):

History of Presenting Complaint:

Past Medical History: (Generate as a list)

Drug History: (Generate as a list)

Assessment
Vitals:
General:
Examination Findings:

Review of Systems
Airway:
Breathing:
Cardiovascular:
Abdomen:
Neurological:
Head and Neck:
Dental:
Musculoskeletal:
Pelvis:
Skin:
Other:

Investigations:
Imaging:
Bloods:
Urinalysis:
Wound Swab:
Primary Diagnosis:
Management in Department:

Clinical Status at Discharge:

Discharge Plan
Medications:
Advice:
Wound Care (If Applicable):
Referrals:
Follow-Up:
Advised to return to the Emergency Department if:`,
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    },
    {
      id: 'temp-2-ed-triage-note',
      name: 'ED Triage Note',
      description: 'A structured triage template for initial ED triage documentation.',
      content: `Arrival Time:
Mode of Arrival:
Patient ID/Triage ID:
Presenting Complaint:
Initial Vitals:
Triage Category:
Brief History:
Immediate Concerns (ABCD):
Allergies:
Initial Plan:`,
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    },
    {
      id: 'temp-3-ed-clerking-note',
      name: 'ED Clerking Note',
      description: 'A comprehensive ED clerking template capturing HPC, exam, and plan.',
      content: `Chief Complaint:
History of Present Illness:
Past Medical History:
Drug History:
Allergies:

Examination
Vitals:
General Appearance:
Focused Exam Findings:

Assessment/Diagnosis:

Plan/Disposition:
Investigations Ordered:
Medications Given:
Referrals:
Follow-Up or Admission Plan:`,
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    },
    {
      id: 'temp-4-soap-note',
      name: 'SOAP Note',
      description: 'A standard SOAP note template for thorough documentation.',
      content: `Subjective:

Objective:

Assessment:

Plan:`,
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    },
    {
      id: 'temp-5-gp-consultation-note',
      name: 'GP Consultation Note',
      description: 'Template for a typical GP consultation or family physician visit.',
      content: `Chief Complaint:
History of Present Illness:
Examination:
Assessment:
Plan & Follow-up:`,
      model: {
        id: 'gpt-4',
        name: 'GPT-4',
        maxLength: 24000,
        tokenLimit: 8000,
      },
      folderId: null,
    },
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
  userSignOff: '',
  hasChatOutput: false,
};

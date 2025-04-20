// /frontend/pages/api/home/home.state.tsx
// ———————————————————————————————————————————————————————————————
// Global “home” state used by Chat, modals, etc.
// Restored template logic + added userContext / userSignOff fields
// Added patient tracking state
// ———————————————————————————————————————————————————————————————

import { Conversation, Message } from '@/types/chat';
import { ErrorMessage } from '@/types/error';
import { FolderInterface } from '@/types/folder';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';
import { PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import { Patient } from '@/types/patient'; // <= ADDED: Import Patient type

console.log('home.state.tsx file loaded, initialising global state.');

/* ---------------------------------------------------------------- types */
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
  patients: Patient[]; // <= ADDED: Field for patient tracking data

  /* UI panes */
  showChatbar: boolean;
  showSidePromptbar: boolean; // This likely controls the visibility of the Tasks.tsx component
  currentFolder: FolderInterface | undefined;

  /* misc flags / values */
  messageError: boolean;
  searchTerm: string;
  defaultModelId: OpenAIModelID | undefined;
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;

  /* Prompt‑injection workflow */
  promptModalVisible: boolean;
  activePromptIndex: number;
  promptVariables: any;

  /* Chat‑input */
  textInputContent: string;

  /* Audio recording */
  recording: boolean;
  transcribingAudio: boolean;

  /* modal routing */
  openModal: 'profile' | 'templates' | 'help' | 'predictive analytics' | 'settings' | null;

  /* 🔹 NEW 🔹 personalised context  */
  userContext: string;   // e.g. "ED Registrar @ Whanganui; concise notes preferred"
  userSignOff: string;   // e.g. "Dr James Deighton MBBS"

  /* analytics */
  hasChatOutput?: boolean;
}

/* ---------------------------------------------------------------- initial */
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
  patients: [], // <= ADDED: Initial empty array for patients

  /* ---------------- templates (unchanged) --------------- */
  prompts: [
    {
      id: 'temp-1-discharge-summary',
      name: 'Discharge Summary',
      description: 'A structured template for detailed discharge summary documentation.',
      content: `History:
- [Patient's age (only if mentioned in transcript or patient details, otherwise omit completely)]
- [Current issues, reasons for visit, history of presenting complaints etc] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Mention duration, timing, location, quality, severity and/or context of complaint, if relevant and mentioned] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [List anything that worsens or alleviates the symptoms, including self-treatment attempts and their effectiveness] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Progression: describe how the symptoms have changed or evolved over time] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Previous episodes: detail any past occurrences of similar symptoms, including when they occurred, how they were managed, and the outcomes] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Impact on daily activities: explain how the symptoms affect the patient's daily life, work, and activities] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Associated symptoms: any other symptoms (focal and systemic) that accompany the reasons for visit &amp; chief complaints] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)

Past Medical History:
- [Medical history: including past medical and surgical history relevant to the current complaints] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Family history that may be relevant to the reasons for visit and chief complaints] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Social history: any relevant social factors, including smoking, alcohol, drug use, or occupational exposures] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Allergies, including details on reactions] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Medications, including current prescribed medications, over-the-counter drugs, and supplements] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Immunization history and status] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Other relevant history or contributing factors] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)

Physical Examination:
- [Vital signs] (e.g. pulse, blood pressure, temperature etc, but only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Physical or mental state examination findings, including system specific examination(s)] (make sure each systems examination findings are separated line by line, and only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)

Investigations:
- [Completed investigations with results, including diagnostic imaging results, blood test results, microbiology/serology results, urinalysis, diagnostic procedure results, and other formal investigation findings.] (you must only include completed investigations with results if they have been explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely. Planned or ordered investigations should be documented under the Management Plan section.)

Impression and Plan:
[1. Issue, problem, or request 1 (issue, request or condition name only)]
- [Impression, likely diagnosis for Issue 1 (condition name only)] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Differential diagnosis for Issue 1] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Investigations planned for Issue 1] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Treatment planned for Issue 1] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Relevant referrals for Issue 1] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)

[2. Issue, problem, or request 2 (issue, request or condition name only)]
- [Impression, likely diagnosis for Issue 2 (condition name only)] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Differential diagnosis for Issue 2] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Investigations planned for Issue 2] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Treatment planned for Issue 2] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Relevant referrals for Issue 2] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)

[3. Issue, problem, or request 3, 4, 5 etc. (issue, request or condition name only)]
- [Impression, likely diagnosis for Issue 3, 4, 5 etc. (condition name only)] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Differential diagnosis for Issue 3, 4, 5 etc.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Investigations planned for Issue 3, 4, 5 etc.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Treatment planned for Issue 3, 4, 5 etc.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)
- [Relevant referrals for Issue 3, 4, 5 etc.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise omit completely)

(Never come up with your own patient details, assessment, plan, interventions, evaluation, and plan for continuing care - use only the transcript, contextual notes or clinical note as a reference for the information included in your note.
If any information related to a placeholder has not been explicitly mentioned in the transcript, contextual notes or clinical note, you must not state the information has not been explicitly mentioned in your output, just leave the relevant placeholder or section blank.)`,
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

  /* LLM controls */
  temperature: 1,

  /* UI flags */
  showChatbar: true,
  showSidePromptbar: false, // Note: This likely controls the visibility of Tasks.tsx

  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  defaultModelId: undefined,
  serverSideApiKeyIsSet: false,
  serverSidePluginKeysSet: false,

  /* prompt‑injection */
  promptModalVisible: false,
  activePromptIndex: 0,
  promptVariables: [],

  /* chat input */
  textInputContent: '',

  /* audio */
  recording: false,
  transcribingAudio: false,

  /* modal routing */
  openModal: null,

  /* 🔹  personalised fields (empty by default) */
  userContext: '',
  userSignOff: '',

  /* analytics flag */
  hasChatOutput: false,
};

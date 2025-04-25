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
      content: `CHIEF COMPLAINT:

HISTORY OF PRESENTING COMPLAINT: (This should include details of the main symptom(s), including duration, severity, exacerbating factors, ameliorating factors, and time-course, as well as signs or symptoms explivity stated as not present, and other information related to the presenting complaint - as reported by the patient Use short senteces and start each new line with a fixed indent of three spaces.)

PAST MEDICAL HISTORY: (Generate as a list, and start each new line with a fixed indent of three spaces.)

DRUG HISTORY: (Generate as a list, and start each new line with a fixed indent of three spaces.)

ALLERGIES: (Generate as a list, and start each new line with a fixed indent of three spaces.)

REVIEW OF SYSTEMS: (This should include information reported by the patient, and should not include examination findings. Only show system headers if symptoms for thay system have been stated))
Airway:
Breathing:
Circulation:
Abdominal:
Pelvic:
Musculoskeletal:
Neurological:
Head and neck:
Dental:
Skin:

EXAMINATION FINDINGS: (should not include aspects of medical history - only clinical findings noted during the current ED-based examination)
Systemic findings (if stated):
Abdominal findings (if stated):
Cardiovascular findings (if stated):
Neurological findings (if stated):
Integumentary findings (if stated):
Gastrointestinal symptoms (if stated):
Urological and genitourinary symptoms (if stated):
Respiratory symptoms (if stated):
Psychological symptoms (if stated):
Ophthalmic symptoms (if stated):
Musculoskeletal symptoms (if stated):

INVESTIGATIONS: (should only include investigation results from diagnostic studies performed during the current hospital visit)
Vital signs:
Imaging findings (including x-rays, computed tomography scans, MRI scans, and ultrasound scans:
Blood test results:
Urinalysis:
Microbiology results (such as culture and sensitivity results):
Cerebrospinal fluid results (if stated):

PRIMARY DIAGNOSIS (if stated): (Never infer a primary diagnosis. This should only be included if explicitly stated)
DIFFERENTIAL DIAGNOSES (if stated): (Never infer a differential diagnosis. This should only be included if explicitly stated)

MANAGEMENT IN DEPARTMENT (outlining steps taken during the ED stay to manage or solve the presenting complaint):

DISCHARGE PLAN:
Medications given for use after discharge:
Advice on post-discharge management and care (such as wound care, dietary advice, cast care, weightbearing status, and recommended actions):
Referrals made to other healthcare destinations (such as district nurses, medical specialists, dentists, allied healthcare professionals, and/or the patient's GP):
Follow-Up (advice on when the patient should be next reviewed):
Return advice (criteria for seeking medical attention or returning to the Emergency Department):`,
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

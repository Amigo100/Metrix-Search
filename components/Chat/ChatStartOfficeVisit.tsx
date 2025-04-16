import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed
import { Message, Role } from '@/types/chat'; // Adjust path
import { Plugin } from '@/types/plugin'; // Adjust path
import { IconUsers, IconLoader2 } from '@tabler/icons-react'; // Using Tabler icons

let RecordRTC: any; // Needs to be loaded dynamically

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
}

export const ChatStartOfficeVisit = ({ onSend }: Props) => {
  const { t } = useTranslation('chat');
  const recordRTC = useRef<any>(null);

  const {
    state: { recording, transcribingAudio },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // --- Logic (Preserved) ---
  const handleStartRecording = () => {
    console.log('[ChatStartOfficeVisit] Starting consultation recording...');
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!RecordRTC) { console.error("RecordRTC not loaded yet"); return; }
          recordRTC.current = RecordRTC(stream, { type: 'audio', mimeType: 'audio/webm' });
          if (recordRTC.current?.startRecording) { recordRTC.current.startRecording(); }
          homeDispatch({ type: 'change', field: 'recording', value: true });
          console.log('[ChatStartOfficeVisit] Recording started.');
        })
        .catch((error) => { console.error('[ChatStartOfficeVisit] Error accessing microphone:', error); });
    } else { console.error('[ChatStartOfficeVisit] Audio recording not supported.'); }
  };

  const handleStopRecording = () => {
    console.log('[ChatStartOfficeVisit] Stopping consultation recording...');
    homeDispatch({ type: 'change', field: 'recording', value: false });
    if (recordRTC.current?.stopRecording) {
      recordRTC.current.stopRecording(async () => {
        console.log('[ChatStartOfficeVisit] RecordRTC stop callback fired.');
        homeDispatch({ type: 'change', field: 'transcribingAudio', value: true });
        if (recordRTC.current?.getBlob) {
          const blob = recordRTC.current.getBlob();
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');
          try {
            console.log('[ChatStartOfficeVisit] Sending audio to server...');
            const response = await axios.post( 'http://localhost:8000/rag/transcribe_audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });
            // Updated message content slightly for clarity
            const messageContent = `Consultation Recorded. Please generate a structured clinical summary based on the following transcription, including potential ICD-10 codes and CPT codes where applicable:\n\n${response.data.text}`;
            const message: Message = { role: 'user' as Role, content: messageContent };
            console.log('[ChatStartOfficeVisit] Passing office visit message to onSend:', message);
            onSend(message, null);
          } catch (error) {
            console.error('[ChatStartOfficeVisit] Error fetching transcription:', error);
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });
          }
        } else {
             homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); // Ensure state reset
        }
      });
    } else {
         homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); // Ensure state reset if stopRecording fails
    }
  };

  useEffect(() => { import('recordrtc').then((R) => { RecordRTC = R.default || R; console.log('[ChatStartOfficeVisit] RecordRTC loaded'); }); }, []);

  return (
    // --- Updated Button Styling ---
     <button
      className={`
        flex flex-col items-center justify-center w-full h-full min-h-[100px] p-4
        rounded-lg border-2 transition-colors duration-200 ease-in-out
        ${recording
          ? 'border-red-500 bg-red-50 ring-2 ring-red-300 animate-pulse' // Recording state style
          : transcribingAudio
          ? 'border-gray-300 bg-gray-100 cursor-not-allowed' // Transcribing state style
          : 'border-teal-500 bg-teal-50 hover:bg-teal-100 hover:border-teal-600' // Default state style
        }
      `}
      onClick={recording ? handleStopRecording : handleStartRecording}
      disabled={transcribingAudio} // Disable button while transcribing
      title={recording ? "Stop Recording Consultation" : transcribingAudio ? "Processing..." : "Start Consultation Recording"}
    >
      {transcribingAudio ? (
        // Updated Loading Indicator
        <div className="flex flex-col items-center text-center text-gray-600">
           <IconLoader2 size={36} className="animate-spin text-teal-600" />
           <span className="mt-2 text-sm font-medium">Processing...</span>
        </div>
      ) : (
         // Updated Content Layout
        <div className="flex flex-col items-center text-center">
          {/* Replaced image with Tabler icon */}
          <IconUsers size={36} className={recording ? "text-red-600" : "text-teal-600"} />
          <h3 className={`text-sm font-semibold mt-2 ${recording ? 'text-red-700' : 'text-gray-800'}`}>
             {recording ? 'Recording Consultation...' : 'Consultations'}
          </h3>
           {!recording && (
             <p className="text-xs text-gray-500 mt-1 px-2">
                {t('Record a patient consultation for automated summary')}
             </p>
           )}
        </div>
      )}
    </button>
  );
};

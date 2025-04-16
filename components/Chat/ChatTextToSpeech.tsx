// /components/Chat/ChatTextToSpeech.tsx
// (Using the updated version provided in the prompt - appears consistent with the redesign)

import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context'; // Adjust path as needed
import { Message, Role } from '@/types/chat'; // Adjust path
import { Plugin } from '@/types/plugin'; // Adjust path
import { IconMicrophone, IconLoader2 } from '@tabler/icons-react'; // Using Tabler icons

type RecordRTCInstance = any;
let RecordRTC: any; // Needs to be loaded dynamically

interface Props {
  onSend: (message: Message, plugin?: Plugin | null) => void; // Made plugin optional
}

export const ChatTextToSpeech = ({ onSend }: Props) => {
  const { t } = useTranslation('chat');
  const recordRTC = useRef<RecordRTCInstance | null>(null);

  const {
    state: { recording, transcribingAudio },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // --- Logic (Preserved) ---
  const handleStartRecording = () => {
    console.log('[ChatTextToSpeech] Starting recording...');
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!RecordRTC) { console.error("RecordRTC not loaded yet"); return; }
          recordRTC.current = RecordRTC(stream, { type: 'audio', mimeType: 'audio/webm' });
          recordRTC.current?.startRecording();
          homeDispatch({ type: 'change', field: 'recording', value: true });
          console.log('[ChatTextToSpeech] Recording started.');
        })
        .catch((error) => { console.error('[ChatTextToSpeech] Error accessing mic:', error); });
    } else { console.error('[ChatTextToSpeech] Audio recording not supported.'); }
  };

  const handleStopRecording = () => {
    console.log('[ChatTextToSpeech] Stopping recording...');
    homeDispatch({ type: 'change', field: 'recording', value: false });
    if (recordRTC.current?.stopRecording) {
      recordRTC.current.stopRecording(async () => {
        console.log('[ChatTextToSpeech] RecordRTC stop callback fired.');
        homeDispatch({ type: 'change', field: 'transcribingAudio', value: true });
        if (recordRTC.current?.getBlob) {
          const blob = recordRTC.current.getBlob();
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');
          try {
            console.log('[ChatTextToSpeech] Sending audio for transcription...');
            const response = await axios.post( 'http://localhost:8000/rag/transcribe_audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });
            console.log('[ChatTextToSpeech] Transcription response:', response.data);
            const transcribedText = response.data.text || ''; // Ensure text exists
             if (transcribedText) {
                const userMessage: Message = { role: 'user' as Role, content: transcribedText };
                console.log('[ChatTextToSpeech] Passing message to onSend:', userMessage);
                onSend(userMessage, null); // Send message
             } else {
                 console.log('[ChatTextToSpeech] Received empty transcription.');
                 // Optionally show an error to the user here
             }
          } catch (error) {
            console.error('[ChatTextToSpeech] Error fetching transcription:', error);
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });
            // Optionally show an error to the user here
          }
        } else {
            console.error('[ChatTextToSpeech] Could not get blob from recording.');
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); // Ensure state reset
        }
      });
    } else {
        console.error('[ChatTextToSpeech] stopRecording function not available.');
        homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); // Ensure state reset if stopRecording fails
    }
  };

  // Load RecordRTC dynamically on the client-side
  useEffect(() => {
    import('recordrtc').then((R) => {
        RecordRTC = R.default || R;
        console.log('[ChatTextToSpeech] RecordRTC loaded');
    }).catch(err => console.error("Failed to load RecordRTC", err));
  }, []);


  return (
    // --- Updated Button Styling (from prompt) ---
    <button
      className={`
        flex flex-col items-center justify-center w-full h-full min-h-[100px] p-4
        rounded-lg border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400
        ${recording
          ? 'border-red-500 bg-red-50 ring-2 ring-red-300 animate-pulse' // Recording state style
          : transcribingAudio
          ? 'border-gray-300 bg-gray-100 cursor-wait opacity-70' // Transcribing state style
          : 'border-teal-500 bg-teal-50 hover:bg-teal-100 hover:border-teal-600' // Default state style
        }
      `}
      onClick={recording ? handleStopRecording : handleStartRecording}
      disabled={transcribingAudio} // Disable button while transcribing
      title={recording ? "Stop Recording" : transcribingAudio ? "Processing..." : "Start Dictation"}
    >
      {transcribingAudio ? (
        // Updated Loading Indicator
        <div className="flex flex-col items-center text-center text-gray-600">
           <IconLoader2 size={36} className="animate-spin text-teal-600" />
           <span className="mt-2 text-sm font-medium">Transcribing...</span>
        </div>
      ) : (
        // Updated Content Layout
        <div className="flex flex-col items-center text-center">
          <IconMicrophone size={36} className={recording ? "text-red-600" : "text-teal-600"} />
          <h3 className={`text-base font-semibold mt-2 ${recording ? 'text-red-700' : 'text-gray-800'}`}>
            {recording ? 'Recording...' : 'Dictation'}
          </h3>
          {!recording && (
             <p className="text-xs text-gray-500 mt-1 px-2 max-w-[200px]">
               {t('Click to dictate clerking notes, summaries, etc.')}
             </p>
          )}
        </div>
      )}
    </button>
  );
};

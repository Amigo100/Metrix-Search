// file: /components/Chat/ChatStartOfficeVisit.tsx

import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Message, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';

let RecordRTC: any;

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

  const handleStartRecording = () => {
    console.log('[ChatStartOfficeVisit] Starting consultation recording...');
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          recordRTC.current = RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
          });
          if (recordRTC.current?.startRecording) {
            recordRTC.current.startRecording();
          }
          // IMPORTANT: add `type: 'change'`
          homeDispatch({ type: 'change', field: 'recording', value: true });
          console.log('[ChatStartOfficeVisit] Recording started.');
        })
        .catch((error) => {
          console.error('[ChatStartOfficeVisit] Error accessing microphone:', error);
        });
    } else {
      console.error('[ChatStartOfficeVisit] Audio recording not supported.');
    }
  };

  const handleStopRecording = () => {
    console.log('[ChatStartOfficeVisit] Stopping consultation recording...');
    // Add `type: 'change'`
    homeDispatch({ type: 'change', field: 'recording', value: false });

    if (recordRTC.current?.stopRecording) {
      recordRTC.current.stopRecording(async () => {
        console.log('[ChatStartOfficeVisit] RecordRTC stop callback fired.');
        // Add `type: 'change'`
        homeDispatch({ type: 'change', field: 'transcribingAudio', value: true });

        if (recordRTC.current?.getBlob) {
          const blob = recordRTC.current.getBlob();
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');

          try {
            console.log('[ChatStartOfficeVisit] Sending audio to server...');
            const response = await axios.post(
              'http://localhost:8000/rag/transcribe_audio',
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            // Add `type: 'change'`
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });

            const messageContent = `Automated transcription of office visit. Write a progress note for the visit. Include ICD10 and CPT codes. Here is the transcription: ${response.data.text}`;

            const message: Message = {
              role: 'user' as Role,
              content: messageContent,
            };

            console.log('[ChatStartOfficeVisit] Passing office visit message to onSend:', message);
            onSend(message, null);

          } catch (error) {
            console.error('[ChatStartOfficeVisit] Error fetching transcription:', error);
            // Add `type: 'change'`
            homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });
          }
        }
      });
    }
  };

  useEffect(() => {
    import('recordrtc').then((R) => {
      RecordRTC = R.default || R;
      console.log('[ChatStartOfficeVisit] RecordRTC loaded, version:', RecordRTC.version);
    });
  }, []);

  return (
    <div
      className={`
        flex items-center justify-center w-64 h-24 
        rounded-lg border border-neutral-200 
        bg-[#008080] bg-opacity-100
        cursor-pointer 
        hover:bg-[#008080] hover:bg-opacity-70
        record-button 
        ${recording ? 'is-recording' : ''}
      `}
      onClick={recording ? handleStopRecording : handleStartRecording}
    >
      {transcribingAudio ? (
        <div className="flex items-center justify-center">
          <div className="flex space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 px-2">
          <img
            src="/diagnosis.png"
            alt="Start Office Visit"
            className="w-6 h-6 object-contain"
          />
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-white">
              {t('Consultations')}
            </h3>
            <p className="text-[10px] text-white">
              {t('Have Metrix produce a structured consultation summary')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

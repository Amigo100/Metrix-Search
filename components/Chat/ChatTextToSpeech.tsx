// file: /components/Chat/ChatTextToSpeech.tsx

import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';
import { Message, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { IconMicrophone } from '@tabler/icons-react';

type RecordRTCInstance = any;
let RecordRTC: any;

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
}

export const ChatTextToSpeech = ({ onSend }: Props) => {
  const { t } = useTranslation('chat');
  const recordRTC = useRef<RecordRTCInstance | null>(null);

  const {
    state: { recording, transcribingAudio },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // ---------------------------
  // Start Recording
  // ---------------------------
  const handleStartRecording = () => {
    console.log('[ChatTextToSpeech] Starting recording...');
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          recordRTC.current = RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
          });
          recordRTC.current?.startRecording();

          // IMPORTANT: add type: 'change'
          homeDispatch({
            type: 'change',
            field: 'recording',
            value: true,
          });

          console.log('[ChatTextToSpeech] Recording started.');
        })
        .catch((error) => {
          console.error('[ChatTextToSpeech] Error accessing mic:', error);
        });
    } else {
      console.error('[ChatTextToSpeech] Audio recording not supported in this environment.');
    }
  };

  // ---------------------------
  // Stop Recording + Send Audio
  // ---------------------------
  const handleStopRecording = () => {
    console.log('[ChatTextToSpeech] Stopping recording...');
    homeDispatch({
      type: 'change',
      field: 'recording',
      value: false,
    });

    if (recordRTC.current?.stopRecording) {
      recordRTC.current.stopRecording(async () => {
        console.log('[ChatTextToSpeech] RecordRTC stop callback fired.');

        homeDispatch({
          type: 'change',
          field: 'transcribingAudio',
          value: true,
        });

        if (recordRTC.current?.getBlob) {
          const blob = recordRTC.current.getBlob();
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');

          try {
            console.log('[ChatTextToSpeech] Sending audio to server for transcription...');
            const response = await axios.post(
              'http://localhost:8000/rag/transcribe_audio',
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            homeDispatch({
              type: 'change',
              field: 'transcribingAudio',
              value: false,
            });

            console.log('[ChatTextToSpeech] Transcription response:', response.data);

            // Turn transcription into a user message
            const transcribedText = response.data.text;
            const userMessage: Message = {
              role: 'user' as Role,
              content: transcribedText,
            };

            console.log('[ChatTextToSpeech] Passing message to onSend:', userMessage);
            onSend(userMessage, null);

          } catch (error) {
            console.error('[ChatTextToSpeech] Error fetching transcription:', error);
            homeDispatch({
              type: 'change',
              field: 'transcribingAudio',
              value: false,
            });
          }
        }
      });
    }
  };

  // ---------------------------
  // Load RecordRTC lazily
  // ---------------------------
  useEffect(() => {
    import('recordrtc').then((R) => {
      RecordRTC = R.default || R;
      console.log('[ChatTextToSpeech] RecordRTC loaded, version:', RecordRTC.version);
    });
  }, []);

  return (
    <div
      className={`
        flex items-center justify-center w-64 h-24 
        rounded-lg border border-neutral-200 
        bg-gray-100 bg-opacity-100
        cursor-pointer 
        hover:bg-gray-100 hover:bg-opacity-70
        record-button 
        ${recording ? 'is-recording' : ''}
      `}
      onClick={recording ? handleStopRecording : handleStartRecording}
    >
      {transcribingAudio ? (
        <div className="flex items-center justify-center">
          <div className="flex space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 px-2">
          <IconMicrophone size={36} className="text-white" />
          <div className="flex flex-col text-left">
            <h3 className="text-sm font-semibold text-white">Dictation</h3>
            <p className="text-[10px] text-white">
              {t('Dictate Clerking Notes, SOAP Notes and Discharge Summaries')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

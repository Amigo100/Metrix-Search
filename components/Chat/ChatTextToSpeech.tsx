// file: /components/Chat/ChatTextToSpeech.tsx
import { useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Message, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { IconMicrophone, IconLoader2 } from '@tabler/icons-react';

type RecordRTCInstance = any;
let RecordRTC: any;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const TRANSCRIBE_URL = `${API_BASE_URL}/rag/transcribe_audio`;

interface Props {
  onSend: (message: Message, plugin?: Plugin | null) => void;
}

export const ChatTextToSpeech = ({ onSend }: Props) => {
  const { t } = useTranslation('chat');
  const recordRTC = useRef<RecordRTCInstance | null>(null);

  const {
    state: { recording, transcribingAudio },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const handleStartRecording = () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!RecordRTC) return;
        recordRTC.current = RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
        });
        recordRTC.current.startRecording();
        homeDispatch({ type: 'change', field: 'recording', value: true });
      })
      .catch((err) => console.error('[TTS] mic error', err));
  };

  const handleStopRecording = () => {
    homeDispatch({ type: 'change', field: 'recording', value: false });
    recordRTC.current?.stopRecording(async () => {
      homeDispatch({ type: 'change', field: 'transcribingAudio', value: true });
      const blob = recordRTC.current?.getBlob?.();
      if (!blob) return;
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      try {
        const res = await axios.post(TRANSCRIBE_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const text = res.data.text || '';
        if (text) onSend({ role: 'user' as Role, content: text }, null);
      } catch (e) {
        console.error('[TTS] transcription error', e);
      } finally {
        homeDispatch({ type: 'change', field: 'transcribingAudio', value: false });
      }
    });
  };

  useEffect(() => {
    import('recordrtc')
      .then((R) => (RecordRTC = R.default || R))
      .catch((e) => console.error('RecordRTC load error', e));
  }, []);

  return (
    <button
      className={`flex flex-col items-center justify-center w-full h-full min-h-[100px] p-4 rounded-lg border-2 transition-all ${
        recording
          ? 'border-red-500 bg-red-50 animate-pulse'
          : transcribingAudio
          ? 'border-gray-300 bg-gray-100 cursor-wait opacity-70'
          : 'border-teal-500 bg-teal-50 hover:bg-teal-100'
      }`}
      onClick={recording ? handleStopRecording : handleStartRecording}
      disabled={transcribingAudio}
    >
      {transcribingAudio ? (
        <div className="flex flex-col items-center text-gray-600">
          <IconLoader2 size={36} className="animate-spin text-teal-600" />
          <span className="mt-2 text-sm font-medium">Transcribing...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <IconMicrophone
            size={36}
            className={recording ? 'text-red-600' : 'text-teal-600'}
          />
          <h3
            className={`mt-2 font-semibold ${
              recording ? 'text-red-700' : 'text-gray-800'
            }`}
          >
            {recording ? 'Recording…' : 'Dictation'}
          </h3>
        </div>
      )}
    </button>
  );
};

import React, { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { IconLoader2, IconMicrophone } from '@tabler/icons-react';

import { HomeContext } from '@/contexts/HomeContext';
import type { Message, Role } from '@/types/chat';
import type { Plugin } from '@/types/plugin';

let RecordRTC_TTS: any;

export const ChatTextToSpeech = ({
  onSend,
}: {
  onSend: (message: Message, plugin: Plugin | null) => void;
}) => {
  const { t } = useTranslation('chat');
  const {
    state: { recording, transcribingAudio },
    dispatch,
  } = useContext(HomeContext);
  const recordRef = useRef<any>(null);

  // ---------------------------------------------------------------------------
  const handleStart = () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!RecordRTC_TTS) {
          console.error('RecordRTC (TTS) not loaded yet');
          return;
        }
        recordRef.current = new RecordRTC_TTS(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
        });
        recordRef.current.startRecording();
        dispatch({ type: 'change', field: 'recording', value: true });
      })
      .catch((err) => console.error('[TTS] mic error →', err));
  };

  const handleStop = () => {
    dispatch({ type: 'change', field: 'recording', value: false });

    if (!recordRef.current?.stopRecording) return;

    recordRef.current.stopRecording(async () => {
      dispatch({ type: 'change', field: 'transcribingAudio', value: true });
      const blob = recordRef.current.getBlob?.();
      if (!blob) return;

      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'}/rag/transcribe_audio`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        const text = res.data.text as string;
        const userMsg: Message = { role: 'user' as Role, content: text };
        onSend(userMsg, null);
      } catch (err) {
        console.error('[TTS] transcription error →', err);
      } finally {
        dispatch({ type: 'change', field: 'transcribingAudio', value: false });
      }
    });
  };

  useEffect(() => {
    import('recordrtc').then((R) => {
      RecordRTC_TTS = R.default || R;
    });
  }, []);

  // ---------------------------------------------------------------------------
  return (
    <button
      className={`flex flex-col items-center justify-center w-full h-full min-h-[150px] p-6 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
        ${recording ? 'border-red-400 bg-red-50 animate-pulse' : transcribingAudio ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-teal-500 bg-teal-50 hover:bg-teal-100'}`}
      onClick={recording ? handleStop : handleStart}
      disabled={transcribingAudio}
      title={recording ? 'Stop Recording' : transcribingAudio ? 'Processing…' : 'Start Dictation'}
    >
      {transcribingAudio ? (
        <div className="flex flex-col items-center text-gray-600">
          <IconLoader2 size={40} className="animate-spin text-teal-600" />
          <span className="mt-3 text-sm font-medium">Transcribing…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <IconMicrophone size={40} className={recording ? 'text-red-600' : 'text-teal-600'} />
          <h3 className={`text-lg font-semibold mt-3 ${recording ? 'text-red-700' : 'text-gray-800'}`}>
            {recording ? 'Recording…' : 'Dictation'}
          </h3>
          {!recording && (
            <p className="text-xs text-gray-500 mt-1 px-2">
              {t('Dictate clerking notes, SOAP notes, etc.')}
            </p>
          )}
        </div>
      )}
    </button>
  );
};

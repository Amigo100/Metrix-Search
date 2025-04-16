import React, { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import {
  IconLoader2,
  IconUsers,
} from '@tabler/icons-react';

import { HomeContext } from '@/contexts/HomeContext';
import type { Message, Role } from '@/types/chat';
import type { Plugin } from '@/types/plugin';

let RecordRTC_SOV: any;

export const ChatStartOfficeVisit = ({
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
        if (!RecordRTC_SOV) {
          console.error('RecordRTC (SOV) not loaded yet');
          return;
        }
        recordRef.current = new RecordRTC_SOV(stream, {
          type: 'audio',
          mimeType: 'audio/webm',
        });
        recordRef.current.startRecording();
        dispatch({ type: 'change', field: 'recording', value: true });
      })
      .catch((err) => console.error('[SOV] mic error →', err));
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
        const messageContent = `Consultation Recorded. Please generate a structured clinical summary including potential ICD‑10 and CPT codes.\n\n${res.data.text}`;
        const userMsg: Message = { role: 'user' as Role, content: messageContent };
        onSend(userMsg, null);
      } catch (err) {
        console.error('[SOV] transcription error →', err);
      } finally {
        dispatch({ type: 'change', field: 'transcribingAudio', value: false });
      }
    });
  };

  useEffect(() => {
    import('recordrtc').then((R) => {
      RecordRTC_SOV = R.default || R;
    });
  }, []);

  // ---------------------------------------------------------------------------
  return (
    <button
      className={`flex flex-col items-center justify-center w-full h-full min-h-[150px] p-6 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
        ${recording ? 'border-red-400 bg-red-50 animate-pulse' : transcribingAudio ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-purple-500 bg-purple-50 hover:bg-purple-100'}`}
      onClick={recording ? handleStop : handleStart}
      disabled={transcribingAudio}
      title={recording ? 'Stop Recording Consultation' : transcribingAudio ? 'Processing…' : 'Start Consultation Recording'}
    >
      {transcribingAudio ? (
        <div className="flex flex-col items-center text-gray-600">
          <IconLoader2 size={40} className="animate-spin text-purple-600" />
          <span className="mt-3 text-sm font-medium">Processing…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <IconUsers size={40} className={recording ? 'text-red-600' : 'text-purple-600'} />
          <h3 className={`text-lg font-semibold mt-3 ${recording ? 'text-red-700' : 'text-gray-800'}`}>
            {recording ? 'Recording…' : 'Consultation'}
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
```

// components/Chat/ChatInputMicButton.tsx

import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import HomeContext from '@/pages/api/home/home.context';
import { IconMicrophone } from '@tabler/icons-react';
import { Message, Role } from '@/types/chat';
import { Plugin } from '@/types/plugin';

// Uncomment and define if you actually have this type file.
// import { MediaStreamRecorder } from '@/types/mediaStreamRecorder';

let RecordRTC: any;

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void;
  messageIsStreaming: boolean;
}

export const ChatInputMicButton = ({ onSend, messageIsStreaming }: Props) => {
  // Reference to the RecordRTC instance:
  const recordRTC = useRef<any>(null);

  // Pull recording/transcribing state from context:
  const {
    state: { recording, transcribingAudio },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  // ---------------------------
  // Start Recording
  // ---------------------------
  const handleStartRecording = () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          recordRTC.current = RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
          });
          recordRTC.current?.startRecording();
          homeDispatch({ field: 'recording', value: true });
        })
        .catch((err) => console.error('Microphone access error:', err));
    }
  };

  // ---------------------------
  // Stop Recording + Transcribe
  // ---------------------------
  const handleStopRecording = () => {
    homeDispatch({ field: 'recording', value: false });

    if (recordRTC.current?.stopRecording) {
      recordRTC.current.stopRecording(async () => {
        homeDispatch({ field: 'transcribingAudio', value: true });

        const blob = recordRTC.current?.getBlob();
        if (blob) {
          const formData = new FormData();
          // Use .mp3 if the recording is truly MP3. This example is .webm.
          formData.append('file', blob, 'audio.webm');
          formData.append('model', 'whisper-1');

          try {
            // Retrieve API key from localStorage (or any other secure source)
            const apiKey = localStorage.getItem('apiKey');
            const response = await axios.post(
              'https://api.openai.com/v1/audio/transcriptions',
              formData,
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  'Content-Type': 'multipart/form-data',
                },
              },
            );

            homeDispatch({ field: 'transcribingAudio', value: false });

            const message = {
              role: 'user' as Role,
              content: response.data.text,
            };
            onSend(message, null);
          } catch (error) {
            console.error('Error fetching transcription:', error);
            homeDispatch({ field: 'transcribingAudio', value: false });
          }
        }
      });
    }
  };

  // ---------------------------
  // Spacebar Press to Talk
  // ---------------------------
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If user is pressing space outside of an input/textarea, start recording:
      if (event.code === 'Space' && !event.repeat) {
        const activeEl = document.activeElement;
        if (
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement
        ) {
          return; // do nothing if user is typing in a field
        }
        if (!recording) {
          event.preventDefault();
          handleStartRecording();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // On spacebar release, stop if recording:
      if (event.code === 'Space' && recording) {
        event.preventDefault();
        handleStopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup: remove listeners and stop recording if currently active.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (recording) {
        handleStopRecording();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  // ---------------------------
  // Lazy-load RecordRTC
  // ---------------------------
  useEffect(() => {
    import('recordrtc').then((R) => {
      RecordRTC = R.default || R;
    });
  }, []);

  // ---------------------------
  // Component Render
  // ---------------------------
  return (
    <button
      className={`ml-1 rounded-sm p-1
        ${recording ? 'bg-red-500 text-white' : 'text-neutral-800 opacity-60'}
        dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200
      `}
      onClick={recording ? handleStopRecording : handleStartRecording}
      disabled={messageIsStreaming}
    >
      <IconMicrophone size={18} />
    </button>
  );
};

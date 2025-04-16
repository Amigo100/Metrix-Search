// ============================================================
// file: /components/Chat/ChatTextToSpeech.tsx - Add Export
// ============================================================
let RecordRTC_TTS: any;
// *** ADDED EXPORT HERE ***
export const ChatTextToSpeech = ({ onSend }: { onSend: (message: Message, plugin: Plugin | null) => void }) => {
  const { t } = useTranslation('chat');
  const recordRTC_TTS_Ref = useRef<any>(null);
  const { state: { recording, transcribingAudio }, dispatch: homeDispatch } = useContext(HomeContext);

  // --- Logic (Preserved) ---
  const handleStartRecording = () => { /* ... preserved logic ... */ if (typeof window !== 'undefined' && navigator.mediaDevices) { navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => { if (!RecordRTC_TTS) { console.error("RecordRTC (TTS) not loaded yet"); return; } recordRTC_TTS_Ref.current = RecordRTC_TTS(stream, { type: 'audio', mimeType: 'audio/webm' }); recordRTC_TTS_Ref.current?.startRecording(); homeDispatch({ type: 'change', field: 'recording', value: true }); }).catch((error) => { console.error('[TTS] Error accessing mic:', error); }); } };
  const handleStopRecording = () => { /* ... preserved logic ... */ homeDispatch({ type: 'change', field: 'recording', value: false }); if (recordRTC_TTS_Ref.current?.stopRecording) { recordRTC_TTS_Ref.current.stopRecording(async () => { homeDispatch({ type: 'change', field: 'transcribingAudio', value: true }); if (recordRTC_TTS_Ref.current?.getBlob) { const blob = recordRTC_TTS_Ref.current.getBlob(); const formData = new FormData(); formData.append('file', blob, 'audio.webm'); try { const response = await axios.post( `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/rag/transcribe_audio`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); const transcribedText = response.data.text; const userMessage: Message = { role: 'user' as Role, content: transcribedText }; onSend(userMessage, null); } catch (error) { console.error('[TTS] Error fetching transcription:', error); homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); } } else { homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); } }); } else { homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); } };
  useEffect(() => { import('recordrtc').then((R) => { RecordRTC_TTS = R.default || R; }); }, []);

  return (
    // --- Redesigned Button Card ---
    <button
      className={` group flex flex-col items-center justify-center w-full h-full min-h-[200px] p-6 rounded-xl border-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${ recording ? 'border-red-400 bg-red-50 ring-2 ring-red-200 animate-pulse shadow-inner' : transcribingAudio ? 'border-gray-300 bg-gray-100 cursor-not-allowed shadow-inner' : 'border-teal-500 bg-teal-50 hover:bg-teal-100 hover:border-teal-600 hover:shadow-lg' } `}
      onClick={recording ? handleStopRecording : handleStartRecording}
      disabled={transcribingAudio}
      title={recording ? "Stop Recording" : transcribingAudio ? "Processing..." : "Start Dictation"}
    >
      {transcribingAudio ? (
        <div className="flex flex-col items-center text-center text-gray-600">
          <IconLoader2 size={48} className="animate-spin text-teal-600" />
          <span className="mt-4 text-base font-medium">Transcribing...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full transition-colors duration-200 ${recording ? 'bg-red-100' : 'bg-teal-100 group-hover:bg-teal-200'}`}>
             <IconMicrophone size={40} className={recording ? "text-red-600" : "text-teal-600"} />
          </div>
          <h3 className={`text-xl font-semibold mt-4 mb-1 ${recording ? 'text-red-700' : 'text-gray-900'}`}>
            {recording ? 'Recording...' : 'Dictation'}
          </h3>
          {!recording && (
             <p className="text-sm text-gray-500 group-hover:text-gray-600 px-2">
                {t('Record quick notes, SOAP notes, or discharge summaries.')}
             </p>
           )}
        </div>
      )}
    </button>
  );
};

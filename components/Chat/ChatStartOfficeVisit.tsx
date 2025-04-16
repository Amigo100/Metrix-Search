let RecordRTC_SOV: any; // Use separate variable
const ChatStartOfficeVisit = ({ onSend }: { onSend: (message: Message, plugin: Plugin | null) => void }) => {
  const { t } = useTranslation('chat');
  const recordRTC_SOV_Ref = useRef<any>(null);
  const { state: { recording, transcribingAudio }, dispatch: homeDispatch } = useContext(HomeContext);

  // --- Logic (Preserved) ---
  const handleStartRecording = () => { /* ... preserved logic ... */ if (typeof window !== 'undefined' && navigator.mediaDevices) { navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => { if (!RecordRTC_SOV) { console.error("RecordRTC (SOV) not loaded yet"); return; } recordRTC_SOV_Ref.current = RecordRTC_SOV(stream, { type: 'audio', mimeType: 'audio/webm' }); if (recordRTC_SOV_Ref.current?.startRecording) { recordRTC_SOV_Ref.current.startRecording(); } homeDispatch({ type: 'change', field: 'recording', value: true }); }).catch((error) => { console.error('[SOV] Error accessing microphone:', error); }); } };
  const handleStopRecording = () => { /* ... preserved logic ... */ homeDispatch({ type: 'change', field: 'recording', value: false }); if (recordRTC_SOV_Ref.current?.stopRecording) { recordRTC_SOV_Ref.current.stopRecording(async () => { homeDispatch({ type: 'change', field: 'transcribingAudio', value: true }); if (recordRTC_SOV_Ref.current?.getBlob) { const blob = recordRTC_SOV_Ref.current.getBlob(); const formData = new FormData(); formData.append('file', blob, 'audio.webm'); try { const response = await axios.post( `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/rag/transcribe_audio`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); const messageContent = `Consultation Recorded. Please generate a structured clinical summary based on the following transcription, including potential ICD-10 codes and CPT codes where applicable:\n\n${response.data.text}`; const message: Message = { role: 'user' as Role, content: messageContent }; onSend(message, null); } catch (error) { console.error('[SOV] Error fetching transcription:', error); homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); } } else { homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); } }); } else { homeDispatch({ type: 'change', field: 'transcribingAudio', value: false }); } };
  useEffect(() => { import('recordrtc').then((R) => { RecordRTC_SOV = R.default || R; }); }, []);

  return (
    // --- Redesigned Button Card ---
     <button
      className={` group flex flex-col items-center justify-center w-full h-full min-h-[200px] p-6 rounded-xl border-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${ recording ? 'border-red-400 bg-red-50 ring-2 ring-red-200 animate-pulse shadow-inner' : transcribingAudio ? 'border-gray-300 bg-gray-100 cursor-not-allowed shadow-inner' : 'border-purple-500 bg-purple-50 hover:bg-purple-100 hover:border-purple-600 hover:shadow-lg' // Different base color for distinction } `}
      onClick={recording ? handleStopRecording : handleStartRecording}
      disabled={transcribingAudio}
      title={recording ? "Stop Recording Consultation" : transcribingAudio ? "Processing..." : "Start Consultation Recording"}
    >
      {transcribingAudio ? (
        <div className="flex flex-col items-center text-center text-gray-600">
           <IconLoader2 size={48} className="animate-spin text-purple-600" />
           <span className="mt-4 text-base font-medium">Processing...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
           <div className={`p-4 rounded-full transition-colors duration-200 ${recording ? 'bg-red-100' : 'bg-purple-100 group-hover:bg-purple-200'}`}>
               <IconUsers size={40} className={recording ? "text-red-600" : "text-purple-600"} />
           </div>
          <h3 className={`text-xl font-semibold mt-4 mb-1 ${recording ? 'text-red-700' : 'text-gray-900'}`}>
             {recording ? 'Recording Consultation...' : 'Consultation'}
          </h3>
           {!recording && (
             <p className="text-sm text-gray-500 group-hover:text-gray-600 px-2">
                {t('Record a full patient consultation for automated summary.')}
             </p>
           )}
        </div>
      )}
    </button>
  );
};

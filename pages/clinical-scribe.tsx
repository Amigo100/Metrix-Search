// /pages/clinical-scribe.tsx

import React, { useRef } from 'react';
import { Chat } from '@/components/Chat/Chat';

export default function ClinicalScribePage() {
  // The Chat component expects a stopConversationRef
  const stopRef = useRef<boolean>(false);

  return <Chat stopConversationRef={stopRef} />;
}

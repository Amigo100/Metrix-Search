import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, chat_history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Python server URL from env or fallback
    const RAG_SERVER_URL = process.env.RAG_PYTHON_URL || 'http://127.0.0.1:8000';

    // POST to /ask_rag
    const response = await axios.post(`${RAG_SERVER_URL}/ask_rag`, {
      message,
      history: chat_history, // pass entire conversation array
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error in send_message API route:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini client with recommended User-Agent header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/test', (req, res) => {
    console.log('Received /api/test body:', req.body);
    res.json({ received: req.body });
  });

  // AI analysis endpoint: generate exactly three-sentence summary using strictly calculated numbers
  app.post('/api/analyze-variance', async (req, res) => {
    console.log('Received /api/analyze-variance request');
    try {
      const { calculatedData } = req.body;

      if (!calculatedData) {
        return res.status(400).json({ error: 'Missing calculatedData in request body.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not set on the server. Please check your configuration.',
        });
      }

      const prompt = `
You are an executive sales data analyst summarizing performance.
The application has calculated the following exact numbers regarding regional sales performance from Q2 to Q3.

CALCULATED METRICS (USE ONLY THESE NUMBERS):
${JSON.stringify(calculatedData, null, 2)}

TASK:
Write a three-sentence summary of which region changed the most from Q2 to Q3, and why.

STRICT CONSTRAINTS:
1. Output EXACTLY THREE SENTENCES. Count your sentences carefully. Do not write two sentences; do not write four sentences.
2. Use ONLY the exact numbers, product names, and channel names given in the CALCULATED METRICS above. DO NOT fabricate, hallucinate, extrapolate, or round differently from the provided numbers.
3. Sentence 1: Explicitly identify the region that changed the most in revenue from Q2 to Q3, including its Q2 revenue, Q3 revenue, and the exact dollar change and/or percentage change.
4. Sentence 2: Explain why this region changed the most by citing the calculated product and channel drivers (e.g. which product or channel drove the increase or decrease in revenue or units).
5. Sentence 3: Provide context by mentioning the secondary factor (such as unit volume or discount rate shifts) or comparing it directly to the changes in other regions using their calculated numbers.
6. Return only the three sentences of text. Do not include markdown headers, bullet points, or prefatory notes like "Here is the summary:".
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a strict, precise financial sales analyst. You never invent figures. You strictly follow sentence count constraints and only use provided numbers.',
          temperature: 0.1, // very low temperature for deterministic adherence to calculated numbers
        },
      });

      const summaryText = response.text?.trim() || '';

      return res.json({
        summary: summaryText,
        promptUsed: prompt,
      });
    } catch (error: any) {
      console.error('Error in /api/analyze-variance:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate AI summary.',
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

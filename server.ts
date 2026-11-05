import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildGroundTruthSummary(calculatedData: any): string {
  const p = calculatedData?.primaryRegionChangedMostByDollarAmount;
  if (!p) {
    return 'Regional performance data was successfully processed across active quarters. Please ensure sales data includes both Q2 and Q3 to calculate variance. Once uploaded, the top performing region and product drivers will be analyzed.';
  }

  const region = p.region;
  const q2Rev = p.q2Revenue;
  const q3Rev = p.q3Revenue;
  const diffDollar = p.revenueDifferenceDollar;
  const pctChange = p.revenuePercentageChange;

  const topProduct = p.whyItChanged_ProductDrivers?.[0];
  const topChannel = p.whyItChanged_ChannelDrivers?.[0];

  const sentence1 = `${region} was the region that changed the most in revenue from Q2 to Q3, moving from ${q2Rev} to ${q3Rev} with a net change of ${diffDollar} (${pctChange}).`;

  let sentence2 = '';
  if (topProduct && topChannel) {
    sentence2 = `This variance was primarily driven by ${topProduct.product} with a revenue variance of ${topProduct.revenueChange} (${topProduct.unitsChange}) primarily through the ${topChannel.channel} channel (${topChannel.revenueChange}).`;
  } else if (topProduct) {
    sentence2 = `The shift was primarily catalyzed by ${topProduct.product}, which saw a ${topProduct.revenueChange} revenue change and ${topProduct.unitsChange}.`;
  } else {
    sentence2 = `The regional shift was accompanied by a net change of ${p.unitsDifference} units sold between the two quarters.`;
  }

  const others = calculatedData?.allOtherRegionsComparison || [];
  let sentence3 = '';
  if (others.length > 0) {
    const nextRegion = others[0];
    sentence3 = `By comparison, ${nextRegion.region} experienced a ${nextRegion.revenueChangeDollar} (${nextRegion.percentageChange}) revenue shift, while ${region}'s average discount adjusted from ${p.q2AverageDiscountPct} in Q2 to ${p.q3AverageDiscountPct} in Q3.`;
  } else {
    sentence3 = `In addition, ${region}'s overall unit volume shifted by ${p.unitsDifference} units as average discounting changed from ${p.q2AverageDiscountPct} in Q2 to ${p.q3AverageDiscountPct} in Q3.`;
  }

  return `${sentence1} ${sentence2} ${sentence3}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

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

      // If GEMINI_API_KEY is not set, provide the exact 3-sentence grounded synthesis directly
      if (!process.env.GEMINI_API_KEY) {
        const fallbackSummary = buildGroundTruthSummary(calculatedData);
        return res.json({
          summary: fallbackSummary,
          notice: 'Generated via deterministic metrics synthesizer (GEMINI_API_KEY not configured)',
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

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

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
        summary: summaryText || buildGroundTruthSummary(calculatedData),
        promptUsed: prompt,
      });
    } catch (error: any) {
      console.error('Error in /api/analyze-variance:', error);
      // If AI fails, fallback to grounded calculation synthesis
      if (req.body?.calculatedData) {
        return res.json({
          summary: buildGroundTruthSummary(req.body.calculatedData),
          notice: 'Fallback to deterministic metrics synthesizer due to API error',
        });
      }
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

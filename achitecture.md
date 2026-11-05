# Application Architecture & Overview

SalesPulse is an executive-grade sales performance and variance analysis platform that allows commercial leaders and finance teams to upload regional sales order data (via CSV) and instantly transform raw transactions into actionable revenue intelligence. The application automatically aggregates total revenue, unit volume, and discount distributions across geographic territories and calendar quarters, highlighting the highest-variance regions between Quarter 2 and Quarter 3 with pinpoint accuracy. Crucially, the platform synthesizes a strict three-sentence executive brief powered by Google's Gemini models—or an automated ground-truth deterministic calculation engine—grounded 100% in mathematically verified figures to eliminate AI hallucinations and equip leadership with immediate, audit-ready operational drivers.

---

## File Directory & Functional Descriptions

| File Path | Description |
| :--- | :--- |
| `.env.example` | Template documenting the required environment variables, including the server port, environment mode, and server-side Gemini API key. |
| `.gitignore` | Specifies untracked files and directories, such as dependencies, build artifacts, and local environment files, that Git should ignore. |
| `index.html` | Entry-point HTML document that sets page metadata, social sharing cards, and mounts the React application into the browser DOM. |
| `metadata.json` | Platform configuration file defining the application identity, descriptive metadata, and required system capabilities such as server-side Gemini access. |
| `package.json` | Project manifest defining application scripts, metadata, and all production and development dependencies needed to run the client and server. |
| `server.ts` | Node.js Express backend server that serves the frontend, provides health checks, and securely interfaces with the Gemini API to generate variance summaries without exposing keys to the client. |
| `src/App.tsx` | Main React application layout orchestrating data uploads, calculation pipelines, KPI cards, AI briefs, and interactive visual charts. |
| `src/components/AiSummaryCard.tsx` | UI card presenting the synthesized three-sentence executive variance brief, copy-to-clipboard functionality, and an inspectable audit drawer of calculated metrics. |
| `src/components/CsvUploader.tsx` | Interactive file upload component enabling users to drag-and-drop CSV sales order datasets or instantly load realistic sample data. |
| `src/components/OrdersDataTable.tsx` | Filterable and searchable data table component that allows users to inspect raw individual sales order records. |
| `src/components/RevenueChart.tsx` | Responsive bar chart visualizing comparative quarterly revenue performance segmented by geographic sales region. |
| `src/components/RevenueTable.tsx` | Tabular financial matrix breaking down revenue, units sold, and average discount percentages by region and quarter alongside Q2-to-Q3 shift metrics. |
| `src/index.css` | Global stylesheet initializing Tailwind CSS utility classes and setting base styling across the application. |
| `src/main.tsx` | Client-side entry point that initializes the React application root and renders the primary application component. |
| `src/types/sales.ts` | TypeScript definitions specifying the data models for sales orders, calculation matrices, variance summaries, and driver breakdowns. |
| `src/utils/salesCalculator.ts` | Mathematical and statistical calculation engine that parses raw CSV records, aggregates regional metrics, and determines top quarter-over-quarter variance drivers. |
| `src/utils/sampleData.ts` | Bundled sample CSV dataset containing representative multi-quarter, multi-region sales transactions for immediate application demonstration. |
| `tsconfig.json` | TypeScript compiler configuration specifying language targets, strict type-checking flags, module resolution rules, and path aliases. |
| `vite.config.ts` | Vite build tool configuration defining React and Tailwind plugins, development server proxy settings, and module resolution aliases. |

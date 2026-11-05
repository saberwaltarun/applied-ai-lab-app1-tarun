import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, Sparkles, RefreshCw } from 'lucide-react';
import { downloadSampleCsvFile } from '../utils/sampleData';

interface CsvUploaderProps {
  onDataLoaded: (csvText: string, fileName: string) => void;
  onLoadSample: () => void;
  orderCount: number;
  fileName: string | null;
  errors: string[];
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onDataLoaded,
  onLoadSample,
  orderCount,
  fileName,
  errors,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onDataLoaded(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            Upload Sales Orders CSV
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Expected columns: <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">quarter</code>,{' '}
            <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">region</code>,{' '}
            <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">channel</code>,{' '}
            <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">product</code>,{' '}
            <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">units</code>,{' '}
            <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">discount_pct</code>,{' '}
            <code className="text-indigo-300 font-mono text-xs bg-slate-800/80 px-1.5 py-0.5 rounded">revenue</code>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Dataset
          </button>
          <button
            type="button"
            onClick={downloadSampleCsvFile}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
            title="Download CSV template"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
            isDragging
              ? 'border-indigo-400 bg-indigo-950/30'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Drag &amp; drop your CSV file here, or{' '}
            <span className="text-indigo-400 underline decoration-indigo-400/40 underline-offset-2">browse files</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Supports standard CSV with headers (comma-separated)</p>
        </div>

        {/* Current File / Status Card */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span>Active Dataset</span>
              {fileName && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Replace
                </button>
              )}
            </div>

            {fileName ? (
              <div className="flex items-start gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {orderCount.toLocaleString()} orders loaded
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No CSV file loaded yet. Upload your sales orders or click "Load Sample Dataset".
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-3 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5 text-xs text-amber-200/90 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <p className="font-semibold text-amber-300">File Notice:</p>
                <p className="truncate">{errors[0]}</p>
                {errors.length > 1 && (
                  <p className="text-[11px] text-amber-400/80 mt-0.5">+{errors.length - 1} more minor notice(s)</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

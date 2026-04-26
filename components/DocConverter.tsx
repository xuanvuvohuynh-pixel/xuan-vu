import React, { useState, useRef, useEffect } from 'react';
import { convertImageToStructuredLatex } from '../services/geminiService';
import { FileText, X, RefreshCw, Clipboard, BookOpenCheck, FileType } from 'lucide-react';
import LatexPreview from './LatexPreview';

const DocConverter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Paste Event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          // Accept images or PDFs
          if (item.type.indexOf('image') !== -1 || item.type === 'application/pdf') {
            const file = item.getAsFile();
            if (file) {
              processFile(file);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert("Vui lòng chỉ tải lên file Ảnh (JPG, PNG) hoặc PDF.");
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL only for images to save memory, or for PDF to verify it exists
    if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
    } else {
        setPreviewUrl(null); // No visual preview for PDF, we render a card instead
    }
    
    setResult('');
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    if (!process.env.API_KEY) {
      alert("Thiếu API Key.");
      return;
    }

    setIsProcessing(true);
    try {
      const latex = await convertImageToStructuredLatex(selectedFile, includeSolutions);
      setResult(latex);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi chuyển đổi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isPdf = selectedFile?.type === 'application/pdf';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-22rem)] min-h-[600px]">
      {/* Left: Input */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-2 mb-2 text-slate-800">
          <div className="bg-indigo-100 p-2 rounded-lg">
             <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold">Chuyển đổi Tài liệu</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
           Tải lên file đề thi (PDF) hoặc ảnh chụp (JPG/PNG). Hỗ trợ <strong>Ctrl+V</strong>.
        </p>

        {!selectedFile ? (
          <div 
            className="flex-shrink-0 h-48 border-2 border-dashed border-indigo-300 rounded-xl bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-center p-6 cursor-pointer hover:from-indigo-100 hover:to-indigo-50 hover:border-indigo-500 transition-all group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-white p-4 rounded-full shadow-md mb-3 group-hover:scale-110 transition-transform ring-4 ring-indigo-50">
              <Clipboard className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-indigo-800 font-bold text-center text-sm">
              Dán (Ctrl+V) hoặc Click tải lên
            </p>
            <p className="text-indigo-400 text-xs mt-1">Hỗ trợ: PDF, JPG, PNG</p>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex-shrink-0 h-48 flex flex-col relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200 group shadow-md">
            {isPdf ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-700">
                    <FileType className="w-16 h-16 mb-2 opacity-80" />
                    <span className="font-bold text-sm px-4 text-center truncate w-full">{selectedFile.name}</span>
                    <span className="text-xs text-red-500 uppercase font-bold mt-1">Tài liệu PDF</span>
                </div>
            ) : (
                <>
                    <img 
                    src={previewUrl!} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-contain bg-slate-900"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </>
            )}
            
            <button 
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors z-10 backdrop-blur-sm shadow-sm"
              title="Xóa file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Options */}
        <div className="mt-4 mb-2">
            <label className="flex items-center space-x-3 p-3 border border-indigo-100 rounded-lg bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                <input
                    type="checkbox"
                    checked={includeSolutions}
                    onChange={(e) => setIncludeSolutions(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex items-center text-indigo-900 font-medium select-none">
                    <BookOpenCheck className="w-5 h-5 mr-2 text-indigo-600" />
                    Tự động tạo lời giải (AI Solve)
                </div>
            </label>
        </div>

        <button
          onClick={handleConvert}
          disabled={!selectedFile || isProcessing}
          className={`w-full mt-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white flex items-center justify-center transition-all transform active:scale-95
            ${!selectedFile || isProcessing
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
            }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang AI Phân tích...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Chuyển sang LaTeX
            </>
          )}
        </button>
      </div>

      {/* Right: Output */}
      <div className="lg:col-span-7 h-full">
         <LatexPreview content={result} />
      </div>
    </div>
  );
};

export default DocConverter;
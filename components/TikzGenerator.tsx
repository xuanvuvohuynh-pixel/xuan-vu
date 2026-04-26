import React, { useState, useRef, useEffect } from 'react';
import { generateTikZ } from '../services/geminiService';
import { PenTool, Image as ImageIcon, X, Loader2, Play, Eraser } from 'lucide-react';
import LatexPreview from './LatexPreview';

const TikzGenerator: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Paste (Images)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) handleFileSelect(file);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Chỉ hỗ trợ file ảnh (JPG, PNG, WebP).");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!selectedFile && !description.trim()) {
      alert("Vui lòng nhập mô tả hoặc tải lên hình ảnh.");
      return;
    }
    if (!process.env.API_KEY) {
        alert("Thiếu API Key.");
        return;
    }

    setIsGenerating(true);
    setResult(""); // Clear previous
    try {
      const tikzCode = await generateTikZ(selectedFile, description);
      setResult(tikzCode);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo mã TikZ.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-22rem)] min-h-[600px]">
      {/* Left Column: Inputs */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-2 mb-4 text-slate-800">
          <div className="bg-rose-100 p-2 rounded-lg">
             <PenTool className="w-5 h-5 text-rose-600" />
          </div>
          <h2 className="text-lg font-bold">Vẽ Hình TikZ</h2>
        </div>

        <div className="space-y-6 flex-grow">
          {/* Image Input Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. Hình ảnh mẫu (Dán Ctrl+V hoặc chọn file)
            </label>
            
            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all group min-h-[160px]"
              >
                <ImageIcon className="w-10 h-10 text-slate-400 group-hover:text-rose-500 mb-2" />
                <p className="text-sm text-slate-500 font-medium group-hover:text-rose-600">
                  Tải ảnh lên
                </p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG</p>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleInputChange} 
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                <img 
                  src={previewUrl!} 
                  alt="Preview" 
                  className="w-full h-48 object-contain bg-slate-50" 
                />
                <button 
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-500 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. Mô tả / Yêu cầu thêm
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Vẽ tam giác ABC vuông tại A, đường cao AH. Hoặc: Vẽ đồ thị hàm số y = x^3 - 3x..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent min-h-[120px] text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
             <button
                onClick={() => {
                    handleClearImage();
                    setDescription('');
                    setResult('');
                }}
                disabled={isGenerating}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm flex items-center justify-center transition-colors"
            >
                <Eraser className="w-4 h-4 mr-2" />
                Xóa
            </button>
            <button
                onClick={handleGenerate}
                disabled={isGenerating || (!selectedFile && !description.trim())}
                className={`flex-grow py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white flex items-center justify-center transition-all
                ${isGenerating || (!selectedFile && !description.trim())
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
            >
                {isGenerating ? (
                <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Đang AI Vẽ hình...
                </>
                ) : (
                <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Tạo TikZ Code
                </>
                )}
            </button>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-7 h-full">
        <LatexPreview content={result} />
      </div>
    </div>
  );
};

export default TikzGenerator;

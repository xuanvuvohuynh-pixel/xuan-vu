import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import ExamConfigForm from './components/ExamConfigForm';
import LatexPreview from './components/LatexPreview';
import QuickSolver from './components/QuickSolver';
import DocConverter from './components/DocConverter';
import TikzGenerator from './components/TikzGenerator';
import SearchTab from './components/SearchTab';
import WordConverter from './components/WordConverter';
import { parseLatexFiles } from './services/parserService';
import { generateExamContent } from './services/geminiService';
import { Question, ExamConfig } from './types';
import { FileText, BrainCircuit, ScanText, PenTool, GraduationCap, Search, FileType } from 'lucide-react';

type Tab = 'exam' | 'solver' | 'converter' | 'tikz' | 'search' | 'word';

const AppLogo = () => (
  <div className="h-16 w-16 flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
    <GraduationCap className="h-10 w-10 text-white" strokeWidth={1.5} />
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('exam');
  
  // Exam Generator State
  const [files, setFiles] = useState<File[]>([]);
  const [mcqs, setMcqs] = useState<Question[]>([]);
  const [essays, setEssays] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState<string>("");
  const [config, setConfig] = useState<ExamConfig>({
    mcqCount: 5,
    essayCount: 2,
    requirements: "",
    includeHeader: true,
    examVariations: 1,
    includeSolutions: false,
  });

  // Handle file parsing
  useEffect(() => {
    if (files.length === 0) return;

    const processFiles = async () => {
      setIsProcessing(true);
      try {
        const { mcqs: parsedMcqs, essays: parsedEssays } = await parseLatexFiles(files);
        setMcqs(parsedMcqs);
        setEssays(parsedEssays);
        
        // Reset config counts to safe defaults if parsed count is lower
        setConfig(prev => ({
            ...prev,
            mcqCount: Math.min(prev.mcqCount, parsedMcqs.length),
            essayCount: Math.min(prev.essayCount, parsedEssays.length)
        }));

      } catch (err) {
        console.error("Failed to parse files", err);
        alert("Lỗi khi đọc file.");
      } finally {
        setIsProcessing(false);
      }
    };

    processFiles();
  }, [files]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleGenerate = async () => {
    if (!process.env.API_KEY) {
      alert("Thiếu API Key. Vui lòng kiểm tra biến môi trường.");
      return;
    }

    setIsGenerating(true);
    setGeneratedLatex(""); // clear previous
    try {
      const result = await generateExamContent(mcqs, essays, config);
      setGeneratedLatex(result);
    } catch (error) {
      console.error(error);
      alert("Tạo đề thi thất bại.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogo />
            <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent uppercase tracking-tight">
                AI XUÂN VŨ
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Nhanh chóng - Chính xác - Hiệu quả</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 space-x-2 overflow-x-auto">
             <button
                onClick={() => setActiveTab('exam')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                   activeTab === 'exam' 
                   ? 'bg-teal-600 text-white shadow-md shadow-teal-200 translate-y-[-1px]' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
             >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Tạo Đề Thi</span>
             </button>
             <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                   activeTab === 'search' 
                   ? 'bg-sky-600 text-white shadow-md shadow-sky-200 translate-y-[-1px]' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
             >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Tìm Kiếm</span>
             </button>
             <button
                onClick={() => setActiveTab('word')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                   activeTab === 'word' 
                   ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 translate-y-[-1px]' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
             >
                <FileType className="w-4 h-4" />
                <span className="hidden sm:inline">Chuyển đổi Word</span>
             </button>
             <button
                onClick={() => setActiveTab('solver')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                   activeTab === 'solver' 
                   ? 'bg-amber-500 text-white shadow-md shadow-amber-200 translate-y-[-1px]' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
             >
                <BrainCircuit className="w-4 h-4" />
                <span className="hidden sm:inline">Giải & Vẽ Hình</span>
             </button>
             <button
                onClick={() => setActiveTab('converter')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                   activeTab === 'converter' 
                   ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-y-[-1px]' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
             >
                <ScanText className="w-4 h-4" />
                <span className="hidden sm:inline">Chuyển đổi</span>
             </button>
             <button
                onClick={() => setActiveTab('tikz')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                   activeTab === 'tikz' 
                   ? 'bg-rose-600 text-white shadow-md shadow-rose-200 translate-y-[-1px]' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
             >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Vẽ Hình TikZ</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'exam' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* File Upload Section */}
                <section className="mb-8">
                <FileUploader onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
                
                {(mcqs.length > 0 || essays.length > 0) && (
                    <div className="mt-4 flex gap-4 text-sm text-slate-600 animate-fade-in">
                        <span className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-teal-700 font-medium">
                        ✓ Tìm thấy {mcqs.length} câu trắc nghiệm
                        </span>
                        <span className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm text-indigo-700 font-medium">
                        ✓ Tìm thấy {essays.length} câu tự luận
                        </span>
                    </div>
                )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-22rem)] min-h-[500px]">
                {/* Left: Configuration */}
                <section className="lg:col-span-4 h-full">
                    <ExamConfigForm 
                        config={config} 
                        setConfig={setConfig} 
                        parsedCounts={{ mcqs: mcqs.length, essays: essays.length }}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                    />
                </section>

                {/* Right: Preview */}
                <section className="lg:col-span-8 h-full">
                    <LatexPreview content={generatedLatex} />
                </section>
                </div>
            </div>
        )}

        {activeTab === 'search' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <SearchTab 
                    mcqs={mcqs} 
                    essays={essays} 
                    onFilesSelected={handleFilesSelected} 
                    isProcessing={isProcessing} 
                />
            </div>
        )}

        {activeTab === 'word' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <WordConverter />
            </div>
        )}

        {activeTab === 'solver' && <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><QuickSolver /></div>}
        
        {activeTab === 'converter' && <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><DocConverter /></div>}

        {activeTab === 'tikz' && <div className="animate-in fade-in slide-in-from-bottom-2 duration-500"><TikzGenerator /></div>}

      </main>
    </div>
  );
};

export default App;
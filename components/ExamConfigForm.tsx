import React from 'react';
import { ExamConfig, Question } from '../types';
import { Settings, Sparkles, FileText, Copy, BookOpenCheck } from 'lucide-react';

interface Props {
  config: ExamConfig;
  setConfig: React.Dispatch<React.SetStateAction<ExamConfig>>;
  parsedCounts: { mcqs: number; essays: number };
  onGenerate: () => void;
  isGenerating: boolean;
}

const ExamConfigForm: React.FC<Props> = ({ config, setConfig, parsedCounts, onGenerate, isGenerating }) => {
  
  const handleChange = (field: keyof ExamConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const isValid = parsedCounts.mcqs > 0 || parsedCounts.essays > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-6 text-slate-800">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Cấu hình Đề thi</h2>
      </div>

      <div className="space-y-6 flex-grow">
        
        {/* Count Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số câu Trắc nghiệm (ex)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={parsedCounts.mcqs}
                value={config.mcqCount}
                onChange={(e) => handleChange('mcqCount', parseInt(e.target.value) || 0)}
                className="block w-full bg-white rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border"
              />
              <span className="absolute right-2 top-2 text-xs text-slate-400">
                / {parsedCounts.mcqs}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số câu Tự luận (bt)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={parsedCounts.essays}
                value={config.essayCount}
                onChange={(e) => handleChange('essayCount', parseInt(e.target.value) || 0)}
                className="block w-full bg-white rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border"
              />
              <span className="absolute right-2 top-2 text-xs text-slate-400">
                / {parsedCounts.essays}
              </span>
            </div>
          </div>
        </div>

        {/* Variations Input */}
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">
              Số lượng đề muốn tạo
           </label>
           <div className="relative">
             <input
               type="number"
               min="1"
               max="10"
               value={config.examVariations}
               onChange={(e) => handleChange('examVariations', Math.max(1, parseInt(e.target.value) || 1))}
               className="block w-full bg-white rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-2 border"
             />
             <div className="absolute right-2 top-2">
                <Copy className="w-4 h-4 text-slate-400" />
             </div>
           </div>
           <p className="mt-1 text-xs text-slate-500">
             AI sẽ tạo ra các phiên bản đề thi khác nhau.
           </p>
        </div>

        {/* Text Area */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
             Yêu cầu tùy chỉnh cho AI
          </label>
          <textarea
            rows={4}
            className="block w-full bg-white rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 sm:text-sm p-3 border resize-none"
            placeholder="Ví dụ: Tập trung vào Hình học và Lượng giác. Sắp xếp câu hỏi từ dễ đến khó. Đảm bảo có 2 bài toán vector khó."
            value={config.requirements}
            onChange={(e) => handleChange('requirements', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Để trống để chọn ngẫu nhiên.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
            <div className="flex items-center">
                <input
                    id="includeHeader"
                    type="checkbox"
                    checked={config.includeHeader}
                    onChange={(e) => handleChange('includeHeader', e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded bg-white"
                />
                <label htmlFor="includeHeader" className="ml-2 block text-sm text-slate-900">
                    Kèm tiêu đề/chân trang chuẩn LaTeX
                </label>
            </div>
            
            <div className="flex items-center">
                <input
                    id="includeSolutions"
                    type="checkbox"
                    checked={config.includeSolutions}
                    onChange={(e) => handleChange('includeSolutions', e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded bg-white"
                />
                <label htmlFor="includeSolutions" className="ml-2 flex items-center text-sm text-slate-900 font-medium text-primary">
                    <BookOpenCheck className="w-4 h-4 mr-1.5 text-primary" />
                    Kèm lời giải chi tiết (AI)
                </label>
            </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={onGenerate}
          disabled={!isValid || isGenerating}
          className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all
            ${!isValid || isGenerating 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            }`}
        >
          {isGenerating ? (
            <>
              <Sparkles className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Đang tạo đề...
            </>
          ) : (
            <>
              <FileText className="-ml-1 mr-2 h-5 w-5" />
              Tạo Đề Thi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExamConfigForm;
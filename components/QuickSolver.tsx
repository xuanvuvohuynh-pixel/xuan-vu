import React, { useState } from 'react';
import { solveSpecificProblem } from '../services/geminiService';
import { Sparkles, Send, Eraser } from 'lucide-react';
import LatexPreview from './LatexPreview';

const QuickSolver: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isSolving, setIsSolving] = useState(false);

  const handleSolve = async () => {
    if (!input.trim()) return;
    if (!process.env.API_KEY) {
        alert("Thiếu API Key. Vui lòng kiểm tra biến môi trường.");
        return;
    }

    setIsSolving(true);
    try {
      const solution = await solveSpecificProblem(input);
      setResult(solution);
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi giải bài toán.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleClear = () => {
      setInput('');
      setResult('');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-22rem)] min-h-[600px]">
      {/* Input Section */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4 text-slate-800">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-bold">Nhập đề bài</h2>
        </div>
        
        <div className="flex-grow flex flex-col space-y-4">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập nội dung bài toán vào đây (ví dụ: Cho tam giác ABC vuông tại A...)"
                className="flex-grow w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-slate-700 leading-relaxed bg-slate-50"
            />
            
            <div className="flex space-x-3">
                 <button
                    onClick={handleClear}
                    disabled={isSolving}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm flex items-center justify-center transition-colors"
                >
                    <Eraser className="w-4 h-4 mr-2" />
                    Xóa
                </button>
                <button
                    onClick={handleSolve}
                    disabled={isSolving || !input.trim()}
                    className={`flex-grow py-2 px-4 rounded-lg shadow-sm text-sm font-medium text-white flex items-center justify-center transition-all
                        ${isSolving || !input.trim()
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-secondary hover:bg-yellow-500 text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary'
                        }`}
                >
                    {isSolving ? (
                        <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                        Đang giải...
                        </>
                    ) : (
                        <>
                        <Send className="w-4 h-4 mr-2" />
                        Giải ngay
                        </>
                    )}
                </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
                AI sẽ tự động sinh mã TikZ cho bài hình học/đồ thị.
            </p>
        </div>
      </div>

      {/* Result Section */}
      <div className="lg:col-span-8 h-full">
         <LatexPreview content={result} />
      </div>
    </div>
  );
};

export default QuickSolver;
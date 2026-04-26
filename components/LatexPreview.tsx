import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface Props {
  content: string;
}

const LatexPreview: React.FC<Props> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "exam.tex";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!content) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <p>Mã LaTeX được tạo sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 text-sm">Xem trước Kết quả</h3>
        <div className="flex space-x-2">
            <button
                onClick={handleDownload}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
                <Download className="w-3.5 h-3.5" />
                <span>Lưu .tex</span>
            </button>
            <button
                onClick={handleCopy}
                className={`flex items-center space-x-1 px-3 py-1.5 border rounded text-xs font-medium transition-colors ${
                copied
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
            >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto p-0 relative">
        <pre className="p-4 text-xs sm:text-sm font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
};

export default LatexPreview;
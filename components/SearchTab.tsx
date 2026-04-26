import React, { useState, useMemo } from 'react';
import { Search, FileText, Filter, Copy, Check, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { Question } from '../types';
import FileUploader from './FileUploader';

interface SearchTabProps {
  mcqs: Question[];
  essays: Question[];
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const SearchTab: React.FC<SearchTabProps> = ({ mcqs, essays, onFilesSelected, isProcessing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mcq' | 'essay'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allQuestions = useMemo(() => [...mcqs, ...essays], [mcqs, essays]);

  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return allQuestions.filter(q => {
      const matchesType = filterType === 'all' || 
                          (filterType === 'mcq' && q.type === 'ex') || 
                          (filterType === 'essay' && q.type === 'bt');
      const matchesSearch = q.content.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [allQuestions, searchTerm, filterType]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allContent = filteredQuestions.map(q => q.content).join('\n\n');
    navigator.clipboard.writeText(allContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Nguồn dữ liệu
        </h2>
        <FileUploader onFilesSelected={onFilesSelected} isProcessing={isProcessing} />
        {(mcqs.length > 0 || essays.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-medium">
                Tổng số câu hỏi: {allQuestions.length}
                </span>
                <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-100 font-medium">
                Trắc nghiệm: {mcqs.length}
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 font-medium">
                Tự luận: {essays.length}
                </span>
            </div>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="text-slate-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer"
            >
              <option value="all">Tất cả loại câu hỏi</option>
              <option value="mcq">Trắc nghiệm</option>
              <option value="essay">Tự luận</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {!searchTerm ? (
             <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nhập từ khóa để bắt đầu tìm kiếm</p>
             </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            Không tìm thấy kết quả nào phù hợp.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <p className="text-sm text-slate-500 font-medium">
                    Tìm thấy {filteredQuestions.length} kết quả
                </p>
                <button
                    onClick={handleCopyAll}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        copiedAll
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                >
                    {copiedAll ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                    <span>{copiedAll ? 'Đã sao chép tất cả!' : 'Sao chép tất cả'}</span>
                </button>
            </div>
            {filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                            q.type === 'ex' 
                            ? 'bg-teal-50 text-teal-700 border-teal-100' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                            {q.type === 'ex' ? 'Trắc nghiệm' : 'Tự luận'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono truncate max-w-[150px] sm:max-w-[300px]" title={q.sourceFile}>
                            {q.sourceFile}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleCopy(q.content, q.id)}
                            className={`p-2 rounded-lg transition-colors ${
                                copiedId === q.id 
                                ? 'text-emerald-600 bg-emerald-50' 
                                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                            }`}
                            title="Sao chép LaTeX"
                        >
                            {copiedId === q.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => toggleExpand(q.id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {expandedId === q.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                
                <div className={`p-4 overflow-x-auto transition-all duration-300 ${expandedId === q.id ? '' : 'max-h-40 relative'}`}>
                    <pre className="text-xs sm:text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {q.content}
                    </pre>
                    {expandedId !== q.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTab;

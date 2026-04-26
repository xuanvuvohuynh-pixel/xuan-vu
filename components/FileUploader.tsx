import React, { useRef, useState } from 'react';
import { Upload, FileText, Folder, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleFiles = (files: File[]) => {
    const texFiles = files.filter(f => f.name.endsWith('.tex'));
    if (texFiles.length > 0) {
      setFileCount(texFiles.length);
      onFilesSelected(texFiles);
    } else {
      alert("Không tìm thấy file .tex trong lựa chọn của bạn.");
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative group border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center flex flex-col items-center justify-center ${
          dragActive
            ? "border-primary bg-teal-50"
            : fileCount > 0
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-300 hover:border-primary hover:bg-slate-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          accept=".tex"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          onChange={handleInputChange}
          className="hidden"
          accept=".tex"
        />

        <div className="flex flex-col items-center justify-center space-y-4 w-full">
          {isProcessing ? (
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          ) : fileCount > 0 ? (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-500" />
              <div className="text-emerald-700 font-medium text-lg">
                Đã tải {fileCount} file .tex
              </div>
              <p className="text-sm text-emerald-600 mb-2">Kéo thả hoặc dùng nút bên dưới để chọn lại</p>
            </>
          ) : (
            <>
              <div className="relative mb-2">
                <Folder className="w-16 h-16 text-slate-300" />
                <FileText className="w-12 h-12 text-slate-400 absolute bottom-0 -right-2 bg-white rounded-lg p-1 border border-slate-200" />
              </div>
              <div className="text-slate-700 font-semibold text-lg">
                Tải lên nguồn LaTeX
              </div>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Kéo thả file vào đây, hoặc chọn file/thư mục bên dưới
              </p>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                <FileText className="w-4 h-4" />
                <span>Chọn File</span>
            </button>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">hoặc</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                <Folder className="w-4 h-4" />
                <span>Chọn Thư mục</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
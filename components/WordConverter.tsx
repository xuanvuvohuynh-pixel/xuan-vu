import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle, Download, X, Play, Copy, Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, ImageRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { analyzeDocumentImage, ContentBlock } from '../services/wordGeminiService';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PageData {
  id: string;
  image: string; // Base64
  width: number;
  height: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  results?: ContentBlock[];
  croppedImages?: { src: string; originalBox: number[] }[];
}

const WordConverter: React.FC = () => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'results'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // --- Upload Handling ---
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newPages: PageData[] = [];

    for (const file of acceptedFiles) {
      if (file.type === 'application/pdf') {
        const pdfPages = await convertPdfToImages(file);
        newPages.push(...pdfPages);
      } else if (file.type.startsWith('image/')) {
        const imagePage = await convertImageToPage(file);
        newPages.push(imagePage);
      }
    }

    setPages(prev => [...prev, ...newPages]);
    if (newPages.length > 0) {
      setActiveTab('preview');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf']
    }
  });

  // Handle Paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== 'upload') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const imagePage = await convertImageToPage(blob);
            setPages(prev => [...prev, imagePage]);
            setActiveTab('preview');
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  // --- Helpers ---
  const convertPdfToImages = async (file: File): Promise<PageData[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: PageData[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // High quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        pages.push({
          id: `pdf-${file.name}-${i}-${Date.now()}`,
          image: canvas.toDataURL('image/jpeg'),
          width: viewport.width,
          height: viewport.height,
          status: 'pending'
        });
      }
    }
    return pages;
  };

  const convertImageToPage = (file: File): Promise<PageData> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: `img-${file.name}-${Date.now()}`,
            image: e.target?.result as string,
            width: img.width,
            height: img.height,
            status: 'pending'
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // --- Processing ---
  const handleStartProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    const processedPages = [...pages];
    let completedCount = 0;

    for (let i = 0; i < processedPages.length; i++) {
      processedPages[i].status = 'processing';
      setPages([...processedPages]);

      try {
        // 1. Analyze with Gemini
        const base64Data = processedPages[i].image.split(',')[1];
        const results = await analyzeDocumentImage(base64Data);
        
        // 2. Crop Images
        const croppedImages = await cropImagesFromPage(processedPages[i].image, results);

        processedPages[i].results = results;
        processedPages[i].croppedImages = croppedImages;
        processedPages[i].status = 'completed';
      } catch (error) {
        console.error("Error processing page", i, error);
        processedPages[i].status = 'error';
      }

      completedCount++;
      setProgress(Math.round((completedCount / processedPages.length) * 100));
      setPages([...processedPages]);
    }

    setIsProcessing(false);
    setActiveTab('results');
  };

  const cropImagesFromPage = async (base64Image: string, blocks: ContentBlock[]): Promise<{ src: string; originalBox: number[] }[]> => {
    const img = new Image();
    img.src = base64Image;
    await new Promise(resolve => { img.onload = resolve; });

    const cropped: { src: string; originalBox: number[] }[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return [];

    // 0.5mm padding logic
    // Assuming standard 96 DPI for display, but image might be higher res.
    // Let's use a relative padding based on image width.
    // 0.5mm is roughly 0.2% of an A4 width (210mm).
    // Let's use 0.5% padding to be safe.
    const paddingX = img.width * 0.005;
    const paddingY = img.height * 0.005;

    for (const block of blocks) {
      if (block.type === 'image' && block.boundingBox) {
        const [ymin, xmin, ymax, xmax] = block.boundingBox;
        
        // Convert 0-1000 scale to pixels
        let x = (xmin / 1000) * img.width;
        let y = (ymin / 1000) * img.height;
        let w = ((xmax - xmin) / 1000) * img.width;
        let h = ((ymax - ymin) / 1000) * img.height;

        // Apply padding
        x = Math.max(0, x - paddingX);
        y = Math.max(0, y - paddingY);
        w = Math.min(img.width - x, w + paddingX * 2);
        h = Math.min(img.height - y, h + paddingY * 2);

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        
        cropped.push({
          src: canvas.toDataURL('image/png'),
          originalBox: block.boundingBox
        });
      }
    }
    return cropped;
  };

  // --- Export ---
  const handleCopyAll = async () => {
    let htmlToCopy = '<div style="font-family: sans-serif;">';
    let textToCopy = '';

    pages.forEach((page, index) => {
      if (page.results && page.results.length > 0) {
        page.results.forEach(block => {
          if (block.type === 'heading') {
            htmlToCopy += `<h3>${block.content}</h3>`;
            textToCopy += `${block.content}\n\n`;
          } else if (block.type === 'text') {
            const formattedHtml = (block.content || '').replace(/\n/g, '<br>');
            htmlToCopy += `<p>${formattedHtml}</p>`;
            textToCopy += `${block.content}\n\n`;
          } else if (block.type === 'table' && block.tableData) {
            htmlToCopy += '<table border="1" style="border-collapse: collapse; margin-bottom: 16px;"><tbody>';
            block.tableData.forEach(row => {
              htmlToCopy += '<tr>';
              row.forEach(cell => {
                htmlToCopy += `<td style="padding: 8px; border: 1px solid #ccc;">${cell}</td>`;
              });
              htmlToCopy += '</tr>';
              textToCopy += row.join(' | ') + '\n';
            });
            htmlToCopy += '</tbody></table>';
            textToCopy += '\n';
          } else if (block.type === 'image' && block.boundingBox) {
            const cropped = page.croppedImages?.find(c => 
              JSON.stringify(c.originalBox) === JSON.stringify(block.boundingBox)
            );
            if (cropped) {
              htmlToCopy += `<div style="margin: 16px 0;"><img src="${cropped.src}" style="max-width: 100%; height: auto; border-radius: 4px;" /></div>`;
            }
            textToCopy += `[Hình ảnh]\n\n`;
          }
        });
      }
    });

    htmlToCopy += '</div>';

    try {
      const htmlBlob = new Blob([htmlToCopy], { type: 'text/html' });
      const textBlob = new Blob([textToCopy.trim()], { type: 'text/plain' });
      
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy rich text, falling back to plain text: ', err);
      navigator.clipboard.writeText(textToCopy.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportDocx = async () => {
    const docChildren: any[] = [];

    for (const page of pages) {
      if (!page.results) continue;

      for (const block of page.results) {
        if (block.type === 'heading') {
          docChildren.push(new Paragraph({
            text: block.content || '',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }));
        } else if (block.type === 'text') {
          const lines = (block.content || '').split('\n');
          const textRuns = lines.map((line, index) => new TextRun({
            text: line,
            break: index > 0 ? 1 : undefined
          }));
          docChildren.push(new Paragraph({
            children: textRuns,
            spacing: { after: 200 }
          }));
        } else if (block.type === 'table' && block.tableData) {
          const tableRows = block.tableData.map(row => 
            new TableRow({
              children: row.map(cell => 
                new TableCell({
                  children: [new Paragraph(cell)],
                  width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
                })
              )
            })
          );
          docChildren.push(new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          }));
          docChildren.push(new Paragraph({ text: "" })); // Spacing
        } else if (block.type === 'image' && block.boundingBox) {
          // Find the cropped image
          const cropped = page.croppedImages?.find(c => 
            JSON.stringify(c.originalBox) === JSON.stringify(block.boundingBox)
          );
          
          if (cropped) {
            const response = await fetch(cropped.src);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            
            docChildren.push(new Paragraph({
              children: [
                new ImageRun({
                  data: buffer,
                  transformation: { width: 400, height: 300 }, // Default size, maybe adjust based on aspect ratio
                }),
              ],
            }));
          }
        }
      }
      // Page break between original pages? Maybe not necessary for continuous flow.
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "converted_document.docx");
  };

  // --- Render ---
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => !isProcessing && setActiveTab('upload')}
          disabled={isProcessing}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            activeTab === 'upload' ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          1. Tải lên
        </button>
        <button
          onClick={() => !isProcessing && pages.length > 0 && setActiveTab('preview')}
          disabled={isProcessing || pages.length === 0}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            activeTab === 'preview' ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          2. Xem trước
        </button>
        <button
          onClick={() => !isProcessing && pages.some(p => p.status === 'completed') && setActiveTab('results')}
          disabled={isProcessing || !pages.some(p => p.status === 'completed')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            activeTab === 'results' ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          3. Kết quả
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] p-6">
        
        {activeTab === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center space-y-6 py-12">
            <div 
              {...getRootProps()} 
              className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="bg-teal-100 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-teal-600" />
              </div>
              <p className="text-lg font-medium text-slate-700">Kéo thả file PDF hoặc ảnh vào đây</p>
              <p className="text-sm text-slate-500 mt-2">Hỗ trợ PDF, JPG, PNG, WEBP</p>
              <p className="text-xs text-slate-400 mt-4">Hoặc dán ảnh trực tiếp (Ctrl+V)</p>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Danh sách trang ({pages.length})</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPages([])}
                  disabled={isProcessing}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium disabled:opacity-50"
                >
                  Xóa tất cả
                </button>
                <button 
                  onClick={handleStartProcessing}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý {progress}%
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Bắt đầu chuyển đổi
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page, index) => (
                <div key={page.id} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="aspect-[3/4] relative">
                    <img src={page.image} alt={`Page ${index + 1}`} className="w-full h-full object-contain" />
                    {page.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                    )}
                    {page.status === 'completed' && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                    {page.status === 'error' && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                        <X className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200 flex justify-between items-center bg-white">
                    <span className="font-medium text-slate-600">Trang {index + 1}</span>
                    <span className="text-xs text-slate-400 capitalize">{page.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-teal-50 p-4 rounded-xl border border-teal-100">
              <div>
                <h2 className="text-xl font-bold text-teal-900">Kết quả chuyển đổi</h2>
                <p className="text-teal-700 text-sm">Đã xử lý thành công {pages.filter(p => p.status === 'completed').length} trang</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleCopyAll}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-50'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép văn bản'}
                </button>
                <button 
                  onClick={handleExportDocx}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Download className="w-5 h-5" />
                  Tải xuống Word (.docx)
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {pages.map((page, index) => (
                <div key={page.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-6 space-y-4 bg-white">
                    {page.results?.map((block, i) => (
                      <div key={i} className="group relative hover:bg-slate-50 p-2 rounded-lg transition-colors">
                        {block.type === 'heading' && (
                          <h3 className="text-lg font-bold text-slate-900">{block.content}</h3>
                        )}
                        {block.type === 'text' && (
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{block.content}</p>
                        )}
                        {block.type === 'table' && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-slate-300 text-sm">
                              <tbody>
                                {block.tableData?.map((row, rI) => (
                                  <tr key={rI}>
                                    {row.map((cell, cI) => (
                                      <td key={cI} className="border border-slate-300 p-2">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {block.type === 'image' && (
                          <div className="flex flex-col items-center py-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                            <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-500 mb-2">Hình ảnh được trích xuất</span>
                            {page.croppedImages?.find(c => JSON.stringify(c.originalBox) === JSON.stringify(block.boundingBox)) && (
                              <img 
                                src={page.croppedImages.find(c => JSON.stringify(c.originalBox) === JSON.stringify(block.boundingBox))?.src} 
                                alt="Extracted" 
                                className="max-w-full h-auto rounded shadow-sm max-h-64"
                              />
                            )}
                          </div>
                        )}
                        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] uppercase font-bold text-slate-300 bg-white px-1 rounded border border-slate-200">
                          {block.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordConverter;

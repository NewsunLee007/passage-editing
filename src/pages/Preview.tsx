import React, { useEffect, useRef, useState } from 'react';
import { useWorksheetStore } from '../store/worksheet';
import { useSettingsStore } from '../store/settings';
import Button from '../components/ui/Button';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ArticleLayout {
  lineHeight: number;
  fontSize: number;
  imagePositionY: number;
  pagePadding: number;
  paragraphSpacing: number;
}

const DEFAULT_LAYOUT: ArticleLayout = {
  lineHeight: 1.2,
  fontSize: 14,
  imagePositionY: 20,
  pagePadding: 0,
  paragraphSpacing: 8,
};

const Preview: React.FC = () => {
  const { 
    htmlContent, 
    history, 
    currentHistoryIndex, 
    setHistoryIndex,
    draft,
    updateDraftArticle
  } = useWorksheetStore();

  const {
      previewLineHeight,
      previewFontSize,
      previewImagePosition,
      previewPagePadding,
      previewParagraphSpacing,
      updateSettings
  } = useSettingsStore();

  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [lineHeight, setLineHeight] = useState(previewLineHeight || 1.2);
  const [fontSize, setFontSize] = useState(previewFontSize || 14);
  const [imagePositionY, setImagePositionY] = useState(previewImagePosition || 20);
  const [pagePadding, setPagePadding] = useState(previewPagePadding || 0);
  const [paragraphSpacing, setParagraphSpacing] = useState(previewParagraphSpacing || 8);

  const currentItem = htmlContent 
    ? { htmlContent, timestamp: Date.now(), id: 'current', originalText: '', settings: {} }
    : (currentHistoryIndex !== null && history[currentHistoryIndex] 
        ? history[currentHistoryIndex] 
        : null);

  const displayContent = currentItem?.htmlContent || htmlContent;

  const articleCount = React.useMemo(() => {
    if (!displayContent) return 0;
    const matches = displayContent.match(/data-article-index="(\d+)"/g);
    if (!matches) return 0;
    const indices = matches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
    return Math.max(...indices) + 1;
  }, [displayContent]);

  const applySettings = () => {
    const layoutSettings = {
      lineHeight,
      fontSize,
      imagePositionY,
      pagePadding,
      paragraphSpacing,
    };

    for (let i = 0; i < articleCount; i++) {
      updateDraftArticle(i, layoutSettings);
    }

    updateSettings({
      previewLineHeight: lineHeight,
      previewFontSize: fontSize,
      previewImagePosition: imagePositionY,
      previewPagePadding: pagePadding,
      previewParagraphSpacing: paragraphSpacing,
    });
  };

  const currentLayout = { lineHeight, fontSize, imagePositionY, pagePadding, paragraphSpacing };

  useEffect(() => {
    if (iframeRef.current && displayContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(displayContent);

        const articleStyles = `
          .page { padding: ${pagePadding}mm !important; }
          .page-body { line-height: ${lineHeight} !important; font-size: ${fontSize}px !important; }
          .page-body p { line-height: ${lineHeight} !important; font-size: ${fontSize}px !important; margin-bottom: ${paragraphSpacing}px !important; }
          .hero-img { object-position: center ${imagePositionY}% !important; }
        `;

        const style = doc.createElement('style');
        style.innerHTML = `
          ${articleStyles}
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        `;
        doc.head.appendChild(style);
        doc.close();
      }
    }
  }, [displayContent, currentLayout]);

  useEffect(() => {
     if (history.length > 0 && currentHistoryIndex === null) {
         setHistoryIndex(0);
     }
  }, [history.length, currentHistoryIndex, setHistoryIndex]);

  const handleDownload = () => {
    const blob = new Blob([displayContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worksheet-${currentItem?.id || 'generated'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  if (!displayContent) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-slate-950/50">
        <div className="text-center">
          <p className="text-gray-500 dark:text-slate-400 mb-4">暂无内容可预览</p>
          <Button onClick={() => navigate('/')}>返回生成</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden font-sans dark:bg-slate-950/50 dark:text-slate-100">
      {/* Top Bar */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-2 flex items-center gap-2 shadow-sm shrink-0 dark:bg-slate-950/70 dark:border-slate-800/70">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  返回
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1.5" />
                  打印
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1.5" />
                  下载
              </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 shrink-0"></div>

          {/* Layout Controls - Apply to all pages (horizontal) */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 shrink-0">
              <span className="shrink-0">页边距</span>
              <input
                  type="range"
                  min="0" max="30" step="1"
                  value={pagePadding}
                  onChange={(e) => setPagePadding(parseInt(e.target.value))}
                  className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
              />
              <span className="w-4 shrink-0">+{pagePadding}</span>

              <span className="shrink-0 ml-2">段</span>
              <input
                  type="range"
                  min="0" max="20" step="1"
                  value={paragraphSpacing}
                  onChange={(e) => setParagraphSpacing(parseInt(e.target.value))}
                  className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
              />
              <span className="w-4 shrink-0">{paragraphSpacing}</span>

              <span className="shrink-0 ml-2">行</span>
              <input
                  type="range"
                  min="0.5" max="2.5" step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
              />
              <span className="w-6 shrink-0">{lineHeight}</span>

              <span className="shrink-0 ml-2">字</span>
              <input
                  type="range"
                  min="12" max="24" step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
              />
              <span className="w-5 shrink-0">{fontSize}</span>

              <span className="shrink-0 ml-2">图</span>
              <input
                  type="range"
                  min="0" max="100" step="5"
                  value={imagePositionY}
                  onChange={(e) => setImagePositionY(parseInt(e.target.value))}
                  className="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
              />
              <span className="w-5 shrink-0">{imagePositionY}%</span>

              <button
                  onClick={applySettings}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors dark:bg-blue-900/40 dark:text-blue-300 shrink-0 ml-2"
              >
                  保存
              </button>
          </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 flex justify-center custom-scrollbar dark:bg-slate-950/40">
           <div className="relative w-full min-w-[210mm] max-w-[210mm] min-h-[297mm] bg-white shadow-2xl transition-all duration-300 ease-in-out dark:shadow-black/40">
              <iframe 
                  ref={iframeRef} 
                  className="w-full h-[297mm] border-0" 
                  title="Worksheet Preview"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              />
           </div>
      </div>
    </div>
  );
};

export default Preview;

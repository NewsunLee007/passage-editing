import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settings';
import TextArea from '../components/ui/TextArea';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Wand2, Image as ImageIcon, Link as LinkIcon, FileText, FolderInput, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

import { generateDraft, extractTextFromImage, extractTextFromFile } from '../services/ai';
import { useWorksheetStore } from '../store/worksheet';

type InputMode = 'text' | 'url' | 'file' | 'image';

// Grade options based on category
const gradeCategoryOptions = [
  { value: 'elementary', label: '小学 (Elementary)' },
  { value: 'middle', label: '初中 (Middle School)' },
  { value: 'high', label: '高中 (High School)' },
];

const getGradeOptions = (category: string) => {
  switch (category) {
    case 'elementary':
      return [
        { value: 'elementary-1', label: '一年级 (Grade 1)' },
        { value: 'elementary-2', label: '二年级 (Grade 2)' },
        { value: 'elementary-3', label: '三年级 (Grade 3)' },
        { value: 'elementary-4', label: '四年级 (Grade 4)' },
        { value: 'elementary-5', label: '五年级 (Grade 5)' },
        { value: 'elementary-6', label: '六年级 (Grade 6)' },
      ];
    case 'middle':
      return [
        { value: 'middle-7', label: '七年级 (Grade 7)' },
        { value: 'middle-8', label: '八年级 (Grade 8)' },
        { value: 'middle-9', label: '九年级 (Grade 9)' },
      ];
    case 'high':
      return [
        { value: 'high-10', label: '高一 (Grade 10)' },
        { value: 'high-11', label: '高二 (Grade 11)' },
        { value: 'high-12', label: '高三 (Grade 12)' },
      ];
    default:
      return [{ value: 'middle-7', label: '七年级 (Grade 7)' }];
  }
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  
  const { 
    setHtmlContent, 
    originalText, 
    setOriginalText,
    grade, 
    cefrLevel, 
    grammarDifficulty, 
    imageUrl, 
    setImageUrl,
    paperSize,
    setPaperSize,
    orientation,
    setOrientation,
    articleCount,
    setArticleCount,
    articles,
    updateArticleConfig,
    isGenerating,
    setIsGenerating,
    showCoverImage,
    setShowCoverImage,
    showExercises,
    setShowExercises,
    showLanguageToolkit,
    setShowLanguageToolkit,
    showGrammarSection,
    setShowGrammarSection,
    showGoldenSentences,
    setShowGoldenSentences,
    setDraft
  } = useWorksheetStore();
  
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [urlInput, setUrlInput] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('内容读取成功！(Content Loaded Successfully)');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.md')) {
        const text = await file.text();
        setOriginalText(text);
        setInputMode('text');
      } else if (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // Use OCR service to extract text from PDF/Word files
        const settings = useSettingsStore.getState();
        const ocrEndpoint = settings.ocrEndpoint;

        if (!ocrEndpoint) {
          alert('请先配置 OCR 服务地址（设置页面）');
          return;
        }

        setIsProcessingFile(true);
        try {
          const result = await extractTextFromFile({ file, ocrEndpoint });
          if (result.success && result.text) {
            setOriginalText(result.text);
            setInputMode('text');
          } else {
            alert(result.error || '文件解析失败，请检查 OCR 服务配置');
          }
        } catch (e) {
          alert('文件解析出错: ' + (e instanceof Error ? e.message : '未知错误'));
        } finally {
          setIsProcessingFile(false);
        }
      } else {
        alert('不支持的文件格式');
      }
    }
  };

  const handleUrlFetch = async () => {
      if (!urlInput) {
          alert('请输入网址');
          return;
      }

      setIsFetchingUrl(true);

      const extractFromMarkdown = (md: string) => {
        // Filter out navigation, footer, and other non-content elements
        const cleaned = md
          .replace(/```[\s\S]*?```/g, '')
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/^\s*[-*_]{3,}\s*$/gm, '');

        const lines = cleaned.split(/\r?\n/);
        const firstHeading = lines.find((l) => /^#\s+/.test(l.trim()));
        const title = (firstHeading ? firstHeading.trim().replace(/^#\s+/, '') : (lines.find((l) => l.trim().length > 0)?.trim() || '')).slice(0, 160);

        // Enhanced filtering for navigation and junk content
        const bodyLines = lines
          .map((l) => l.trimEnd())
          .filter((l) => l.trim().length > 0)
          .filter((l) => !/^#{1,6}\s+/.test(l.trim()))
          .filter((l) => !/^\|/.test(l.trim()))
          .filter((l) => !/^[-*_]{3,}$/.test(l.trim()))
          .filter((l) => !/^\s*(?:\*|-|\+)\s+/.test(l.trim()) || l.trim().length > 80)
          // Filter out navigation and menu items
          .filter((l) => !/^(Home|World|Business|Lifestyle|Culture|Travel|Sports|Opinion|Regional|Newspaper|Mobile|Video|Photo|Gallery|About|Contact|Login|Register|Search|Menu|Navigation)\s*$/i.test(l.trim()))
          // Filter out pagination
          .filter((l) => !/\d+\s*\/\s*\d+|Next\s*>>|Previous|Page\s*\d+/i.test(l.trim()))
          // Filter out copyright and legal text
          .filter((l) => !/Copyright|All rights reserved|Privacy Policy|Terms of Use|Disclaimer/i.test(l))
          // Filter out social media and sharing
          .filter((l) => !/Share|WeChat|Facebook|Twitter|LinkedIn|Weibo/i.test(l))
          // Filter out related stories and most viewed sections
          .filter((l) => !/Related Stories|Most Viewed|Recommended|Trending|Hot News/i.test(l))
          // Filter out short lines that look like navigation
          .filter((l) => !(l.trim().length < 30 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(l.trim())));

        const body = bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        return { title: title.trim(), body };
      };

      try {
          const response = await fetch(`https://r.jina.ai/${urlInput}`);

          if (!response.ok) {
              throw new Error('Fetch failed');
          }

          const text = await response.text();

          const { title, body } = extractFromMarkdown(text);
          setOriginalText([title, body].filter(Boolean).join('\n\n').trim());
          setInputMode('text');

          setToastMessage('内容读取成功！(Content Loaded Successfully)');
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);

      } catch (error) {
          console.error(error);
          try {
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`;
              const response = await fetch(proxyUrl);
              const data = await response.json();

              if (data.contents) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(data.contents, 'text/html');

                  const title = doc.querySelector('title')?.innerText || '';

                  doc.querySelectorAll('script, style, nav, footer, header, aside, iframe, object, embed, .ad, .advertisement, .social-share, .comments, .related, .most-viewed, .pagination, .breadcrumb').forEach(el => el.remove());

                  doc.querySelectorAll('a').forEach(a => {
                      const span = document.createElement('span');
                      span.innerText = a.innerText;
                      a.replaceWith(span);
                  });

                  doc.querySelectorAll('img').forEach(img => img.remove());

                  const mainEl =
                    doc.querySelector('article') ||
                    doc.querySelector('main') ||
                    doc.querySelector('[role="main"]') ||
                    doc.body;

                  const body = mainEl.innerText;

                  // Enhanced cleaning
                  const cleanBody = body
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    // Filter out navigation and junk content
                    .filter((l) => !/^(Home|World|Business|Lifestyle|Culture|Travel|Sports|Opinion|Regional|Newspaper|Mobile|Video|Photo|Gallery|About|Contact|Login|Register|Search|Menu|Navigation)\s*$/i.test(l))
                    .filter((l) => !/\d+\s*\/\s*\d+|Next\s*>>|Previous|Page\s*\d+/i.test(l))
                    .filter((l) => !/Copyright|All rights reserved|Privacy Policy|Terms of Use|Disclaimer/i.test(l))
                    .filter((l) => !/Share|WeChat|Facebook|Twitter|LinkedIn|Weibo/i.test(l))
                    .filter((l) => !/Related Stories|Most Viewed|Recommended|Trending|Hot News/i.test(l))
                    .join('\n\n');

                  setOriginalText([title, cleanBody].filter(Boolean).join('\n\n').trim());
                  setInputMode('text');

                  setToastMessage('内容读取成功！(Content Loaded Successfully)');
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 3000);
              } else {
                 throw new Error('No content');
              }
          } catch (fallbackError) {
              alert('无法读取该网页。请检查链接是否有效，或手动复制内容。');
          }
      } finally {
          setIsFetchingUrl(false);
      }
  };

  const [contentImage, setContentImage] = useState<string>('');

  const handleContentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setContentImage(base64);
        
        setIsExtracting(true);
        try {
            const result = await extractTextFromImage({
                aiProvider: settings.aiProvider,
                apiKey: settings.apiKey,
                model: settings.aiProvider === 'custom' ? (settings.customModelName || settings.model) : settings.model,
                customEndpoint: settings.customEndpoint,
                ocrEndpoint: settings.ocrEndpoint,
                contentImage: base64
            });
            if (result.success && result.text) {
                setOriginalText(result.text);
                setInputMode('text');
                setToastMessage('图片内容识别成功！(OCR Success)');
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);
            } else {
                alert('OCR 识别失败: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('OCR 发生错误，请检查配置。');
        } finally {
            setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalText && !contentImage && inputMode !== 'file' && inputMode !== 'url') {
      alert('请输入或粘贴文本，或上传图片');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const primaryArticle = (articles && articles.length > 0) ? articles[0] : undefined;
      const result = await generateDraft({
        originalText,
        studentGrade: primaryArticle?.grade || grade,
        cefrLevel: primaryArticle?.cefrLevel || cefrLevel,
        grammarDifficulty: primaryArticle?.grammarDifficulty || grammarDifficulty,
        imageUrl: showCoverImage ? imageUrl : undefined,
        aiProvider: settings.aiProvider,
        apiKey: settings.apiKey,
        model: settings.aiProvider === 'custom' ? (settings.customModelName || settings.model) : settings.model,
        customEndpoint: settings.customEndpoint,
        exerciseTypes: [],
        paperSize,
        orientation,
        articleCount,
        articles,
        contentImage: inputMode === 'image' ? contentImage : undefined,
        showCoverImage,
        showExercises,
        showLanguageToolkit,
        showGrammarSection,
        showGoldenSentences,
      });

      if (result.success && result.draft) {
        setDraft(result.draft);
        setHtmlContent(null);
        setToastMessage('生成完成！(Generation Complete)');
        setShowSuccessToast(true);
        setTimeout(() => {
            navigate('/edit');
        }, 1500);
      } else {
        alert(result.error || 'Failed to generate worksheet');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate worksheet');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full bg-transparent text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Panel: Configuration */}
      <div className="w-full md:w-1/3 min-w-[320px] bg-white/80 backdrop-blur border-r-0 md:border-r border-b md:border-b-0 border-gray-200 p-4 md:p-8 overflow-y-auto custom-scrollbar shadow-sm z-0 dark:bg-slate-950/60 dark:border-slate-800/70">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 dark:text-slate-100">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Wand2 className="w-5 h-5 text-blue-600" />
          </div>
          生成配置 (Configuration)
        </h2>
        
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 dark:text-slate-200 dark:border-slate-800/70">内容设置 (Content Settings)</h3>
            
            {/* Visibility Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2 mb-4">
                <div 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                    onClick={() => setShowCoverImage(!showCoverImage)}
                >
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">封面图片</span>
                    {showCoverImage ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </div>
                <div 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                    onClick={() => setShowLanguageToolkit(!showLanguageToolkit)}
                >
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">语言工具箱</span>
                    {showLanguageToolkit ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </div>
                <div 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                    onClick={() => setShowExercises(!showExercises)}
                >
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">读后练习</span>
                    {showExercises ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                  文章数量 (Article Count)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={articleCount}
                  onChange={(e) => setArticleCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white/90 text-slate-900 dark:bg-slate-950/40 dark:text-slate-100 dark:border-slate-700"
                />
             </div>

            {/* Article Configurations */}
            <div className="space-y-6 mt-4">
              {(articles || []).map((article, index) => (
                <div key={article.id || index} className={clsx("p-4 rounded-lg border", articleCount > 1 ? "bg-gray-50 border-gray-200 dark:bg-slate-900/30 dark:border-slate-800" : "bg-white border-transparent p-0 dark:bg-transparent")}>
                  {articleCount > 1 && (
                    <h4 className="text-sm font-medium text-gray-800 mb-3 dark:text-slate-200">文章 {index + 1} (Article {index + 1})</h4>
                  )}
                  
                  <div className="space-y-4">
                    {/* Grade Category Selection */}
                    <Select
                        label="学段 (Grade Category)"
                        value={article.gradeCategory}
                        onChange={(e) => {
                          const newCategory = e.target.value as 'elementary' | 'middle' | 'high';
                          // Auto-select first grade in the new category
                          const newGrade = getGradeOptions(newCategory)[0].value;
                          updateArticleConfig(index, { 
                            gradeCategory: newCategory, 
                            grade: newGrade as any
                          });
                        }}
                        options={gradeCategoryOptions}
                    />
                    
                    {/* Detailed Grade Selection */}
                    <Select
                        label="年级 (Grade)"
                        value={article.grade}
                        onChange={(e) => updateArticleConfig(index, { grade: e.target.value as any })}
                        options={getGradeOptions(article.gradeCategory)}
                    />
                    
                    <Select
                        label="CEFR 等级 (CEFR Level)"
                        value={article.cefrLevel}
                        onChange={(e) => updateArticleConfig(index, { cefrLevel: e.target.value })}
                        options={[
                        { value: 'A1', label: 'A1 - 入门级 (Beginner)' },
                        { value: 'A2', label: 'A2 - 基础级 (Elementary)' },
                        { value: 'B1', label: 'B1 - 进阶级 (Intermediate)' },
                        { value: 'B2', label: 'B2 - 高阶级 (Upper Intermediate)' },
                        { value: 'C1', label: 'C1 - 流利级 (Advanced)' },
                        { value: 'C2', label: 'C2 - 精通级 (Mastery)' },
                        ]}
                    />
                    
                    <Select
                        label="语法难度 (Grammar Difficulty)"
                        value={article.grammarDifficulty}
                        onChange={(e) => updateArticleConfig(index, { grammarDifficulty: e.target.value })}
                        options={[
                        { value: 'basic', label: '基础 (Basic)' },
                        { value: 'intermediate', label: '中级 (Intermediate)' },
                        { value: 'advanced', label: '高级 (Advanced)' },
                        ]}
                    />

                    {/* Per-article Word Count Control */}
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 dark:bg-slate-900/30 dark:border-slate-700">
                      <div 
                        className="flex items-center justify-between mb-2 cursor-pointer"
                        onClick={() => updateArticleConfig(index, { enableWordCount: !article.enableWordCount })}
                      >
                        <span className="text-xs font-semibold text-blue-800 dark:text-sky-300">字数控制 (Word Count)</span>
                        <div className={clsx(
                          'w-8 h-4 rounded-full relative transition-colors',
                          article.enableWordCount ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'
                        )}>
                          <div className={clsx(
                            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                            article.enableWordCount ? 'left-4' : 'left-0.5'
                          )} />
                        </div>
                      </div>
                      
                      {article.enableWordCount && (
                        <div className="space-y-2 mt-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1 dark:text-slate-400">
                              目标字数: {article.targetWordCount || 300}
                            </label>
                            <input
                              type="range"
                              min="100"
                              max="1000"
                              step="50"
                              value={article.targetWordCount || 300}
                              onChange={(e) => updateArticleConfig(index, { targetWordCount: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1 dark:text-slate-400">
                              容差: ±{article.wordCountTolerance || 20}%
                            </label>
                            <input
                              type="range"
                              min="5"
                              max="50"
                              step="5"
                              value={article.wordCountTolerance || 20}
                              onChange={(e) => updateArticleConfig(index, { wordCountTolerance: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-500">
                            范围: {Math.round((article.targetWordCount || 300) * (1 - (article.wordCountTolerance || 20) / 100))} - {Math.round((article.targetWordCount || 300) * (1 + (article.wordCountTolerance || 20) / 100))} 字
                          </p>
                        </div>
                      )}
                      {!article.enableWordCount && (
                        <p className="text-xs text-gray-500 mt-1 dark:text-slate-500">AI将根据语言等级自动确定字数</p>
                      )}
                    </div>

                    {/* Per-article Tense Control */}
                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 dark:bg-slate-900/30 dark:border-slate-700">
                      <div 
                        className="flex items-center justify-between mb-2 cursor-pointer"
                        onClick={() => updateArticleConfig(index, { enableTenseControl: !article.enableTenseControl })}
                      >
                        <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">时态控制 (Tense Control)</span>
                        <div className={clsx(
                          'w-8 h-4 rounded-full relative transition-colors',
                          article.enableTenseControl ? 'bg-purple-500' : 'bg-gray-300 dark:bg-slate-600'
                        )}>
                          <div className={clsx(
                            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                            article.enableTenseControl ? 'left-4' : 'left-0.5'
                          )} />
                        </div>
                      </div>
                      
                      {article.enableTenseControl && (
                        <div className="space-y-2 mt-2">
                          <label className="block text-xs text-gray-600 dark:text-slate-400">选择时态 (可多选):</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { value: 'present_simple', label: '一般现在时' },
                              { value: 'past_simple', label: '一般过去时' },
                              { value: 'future_simple', label: '一般将来时' },
                              { value: 'present_continuous', label: '现在进行时' },
                              { value: 'past_continuous', label: '过去进行时' },
                              { value: 'present_perfect', label: '现在完成时' },
                              { value: 'past_perfect', label: '过去完成时' },
                              { value: 'mixed', label: '混合时态' },
                            ].map((tense) => (
                              <label
                                key={tense.value}
                                className={clsx(
                                  'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors',
                                  (article.selectedTenses || []).includes(tense.value as any)
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={(article.selectedTenses || []).includes(tense.value as any)}
                                  onChange={(e) => {
                                    const currentTenses = article.selectedTenses || ['mixed'];
                                    let newTenses: string[];
                                    if (e.target.checked) {
                                      newTenses = [...currentTenses, tense.value];
                                    } else {
                                      newTenses = currentTenses.filter(t => t !== tense.value);
                                    }
                                    if (newTenses.length === 0) newTenses = ['mixed'];
                                    updateArticleConfig(index, { selectedTenses: newTenses as any });
                                  }}
                                  className="w-3 h-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>{tense.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {!article.enableTenseControl && (
                        <p className="text-xs text-gray-500 mt-1 dark:text-slate-500">AI将根据内容自动选择时态</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout Settings */}
          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 dark:text-slate-200 dark:border-slate-800/70">布局设置 (Layout)</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                    label="纸张大小 (Size)"
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as any)}
                    options={[
                        { value: 'a4', label: 'A4' },
                        { value: 'a3', label: 'A3' },
                    ]}
                />
                 <Select
                    label="方向 (Orientation)"
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    options={[
                        { value: 'portrait', label: '纵向 (Portrait)' },
                        { value: 'landscape', label: '横向 (Landscape)' },
                    ]}
                />
             </div>
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 dark:text-slate-300">
              封面图片 (Cover Image)
            </label>
            
            {/* Image URL Input */}
             <div className="mb-2">
                <Input 
                    label="" 
                    placeholder="输入图片链接 (https://...)" 
                    value={imageUrl.startsWith('blob') ? '' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />
             </div>

            <div
              role="button"
              tabIndex={0}
              className="group mt-1 flex justify-center px-6 pt-6 pb-6 border-2 border-gray-200 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:hover:border-sky-500/70 dark:hover:bg-slate-900/30"
              onClick={() => coverInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  coverInputRef.current?.click();
                }
              }}
            >
              <div className="space-y-3 text-center">
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="Preview" className="mx-auto h-32 object-cover rounded-lg shadow-md" />
                    <div className="pointer-events-none absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-sm font-medium">
                      点击更换图片
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative cursor-pointer font-medium text-blue-600 hover:text-blue-500">
                        <span>点击上传</span>
                        <input ref={coverInputRef} id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

           <Button 
            className="w-full mt-6 h-12 text-base font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all" 
            size="lg" 
            onClick={handleGenerate}
            isLoading={isGenerating}
          >
            {isGenerating ? '正在生成...' : '生成阅读材料 (Generate Reading Material)'}
          </Button>
        </div>
      </div>

      {/* Right Panel: Content Input */}
      <div
        className={clsx(
          "flex-1 bg-gradient-to-br from-white to-blue-50/30 h-full flex flex-col overflow-hidden relative z-10 dark:from-slate-950 dark:to-slate-900"
        )}
      >
        <div className={clsx("flex-1 flex flex-col h-full w-full p-4 sm:p-6 md:p-8")}>
          <div className="flex items-center justify-between mb-6 shrink-0">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 dark:text-slate-100">
                内容输入 (Input Source)
             </h2>
             <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1 shadow-inner dark:bg-slate-900/60">
                  <button 
                      onClick={() => setInputMode('text')}
                      className={clsx("px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1", inputMode === 'text' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50 dark:text-slate-200/80 dark:hover:bg-slate-900/60")}
                  >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">文本</span>
                  </button>
                  <button 
                      onClick={() => setInputMode('url')}
                      className={clsx("px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1", inputMode === 'url' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50 dark:text-slate-200/80 dark:hover:bg-slate-900/60")}
                  >
                      <LinkIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">链接</span>
                  </button>
                  <button 
                      onClick={() => setInputMode('file')}
                      className={clsx("px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1", inputMode === 'file' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50 dark:text-slate-200/80 dark:hover:bg-slate-900/60")}
                  >
                      <FolderInput className="w-4 h-4" />
                      <span className="hidden sm:inline">文件</span>
                  </button>
                  <button 
                      onClick={() => setInputMode('image')}
                      className={clsx("px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1", inputMode === 'image' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50 dark:text-slate-200/80 dark:hover:bg-slate-900/60")}
                  >
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">图片</span>
                  </button>
                </div>
             </div>
          </div>

          <div className="flex-1 relative group flex flex-col gap-4 min-h-0">
              {inputMode === 'url' && (
                  <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input 
                          label="" 
                          placeholder="输入网页 URL..." 
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleUrlFetch}
                        disabled={isFetchingUrl}
                        className={clsx(
                          "relative shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all overflow-hidden",
                          isFetchingUrl
                            ? "bg-blue-100 text-blue-700 cursor-wait"
                            : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:bg-slate-900/70"
                        )}
                      >
                        {isFetchingUrl && (
                          <span className="absolute inset-0 rounded-md animate-pulse-ring bg-blue-400/30"></span>
                        )}
                        <span className="relative flex items-center gap-1.5">
                          {isFetchingUrl ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              读取中...
                            </>
                          ) : (
                            '读取'
                          )}
                        </span>
                      </button>
                  </div>
              )}
              
              {inputMode === 'file' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                       onClick={() => document.getElementById('text-file-upload')?.click()}
                  >
                      <FolderInput className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">点击导入文件 (.txt, .md, .docx, .pdf)</p>
                      <p className="text-xs text-gray-400 mt-2">支持拖拽上传</p>
                      <input id="text-file-upload" type="file" className="sr-only" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileUpload} />
                  </div>
              )}

              {inputMode === 'image' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                       onClick={() => document.getElementById('content-image-upload')?.click()}
                  >
                      {contentImage ? (
                          <div className="relative">
                              <img src={contentImage} alt="Content" className="mx-auto h-48 object-contain rounded-lg" />
                              <div className="mt-4 text-sm text-blue-600">点击更换图片</div>
                              {isExtracting && (
                                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                                    <span className="text-sm font-medium text-blue-800">正在识别文字... (OCR Processing)</span>
                                </div>
                              )}
                          </div>
                      ) : (
                          <>
                              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 font-medium">点击上传图片进行 OCR 识别</p>
                              <p className="text-xs text-gray-400 mt-2">支持 PNG, JPG</p>
                          </>
                      )}
                      <input id="content-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleContentImageUpload} />
                  </div>
              )}

              <div className="relative flex-1 min-h-0">
                <div className="absolute inset-0 bg-white/70 rounded-xl shadow-sm border border-gray-200 transition-all group-hover:shadow-md group-focus-within:ring-2 group-focus-within:ring-blue-500/20 group-focus-within:border-blue-400 pointer-events-none dark:bg-slate-950/40 dark:border-slate-800"></div>
                <TextArea
                    className="w-full h-full p-6 font-mono text-base text-slate-800 bg-transparent border-none shadow-none rounded-none resize-none focus:ring-0 relative z-10 dark:text-slate-100 dark:bg-transparent dark:border-none dark:shadow-none dark:rounded-none"
                    placeholder="在此粘贴英语文章、新闻或故事内容... (Paste your English text here...)"
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end shrink-0">
                <span className="text-sm font-normal text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                    {originalText.length} 字符
                </span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

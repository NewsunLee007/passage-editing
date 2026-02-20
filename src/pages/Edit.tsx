import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import Input from '../components/ui/Input';
import { useWorksheetStore } from '../store/worksheet';
import { renderWorksheetHtml } from '../services/render';
import { DraftQuestion, DraftToolkitGroup, DraftToolkitItem, DraftGrammarPoint, DraftGoldenSentence } from '../types';
import { FileText, Plus, Trash2, Edit3, ImageIcon, Eye, EyeOff, BookOpen, Sparkles, Quote, EyeIcon } from 'lucide-react';

const splitParagraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

const joinParagraphs = (paragraphs: string[]) => (paragraphs || []).join('\n\n');

// 词汇编辑器组件
const VocabEditor: React.FC<{
  toolkit: DraftToolkitGroup[];
  onChange: (toolkit: DraftToolkitGroup[]) => void;
}> = ({ toolkit, onChange }) => {
  const groups = toolkit || [];

  const addGroup = () => {
    onChange([...groups, { title: 'New Group', items: [{ word: '', phonetic: '', pos: '', meaning: '' }] }]);
  };

  const removeGroup = (groupIndex: number) => {
    const newGroups = groups.filter((_, i) => i !== groupIndex);
    onChange(newGroups);
  };

  const updateGroupTitle = (groupIndex: number, title: string) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], title };
    onChange(newGroups);
  };

  const addItem = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      items: [...(newGroups[groupIndex].items || []), { word: '', phonetic: '', pos: '', meaning: '' }]
    };
    onChange(newGroups);
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      items: newGroups[groupIndex].items.filter((_, i) => i !== itemIndex)
    };
    onChange(newGroups);
  };

  const updateItem = (groupIndex: number, itemIndex: number, field: keyof DraftToolkitItem, value: string) => {
    const newGroups = [...groups];
    const newItems = [...newGroups[groupIndex].items];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    newGroups[groupIndex] = { ...newGroups[groupIndex], items: newItems };
    onChange(newGroups);
  };

  // Check if word is a phrase (contains space)
  const isPhrase = (word: string) => word.trim().includes(' ');

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/30 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Input
              label=""
              value={group.title}
              onChange={(e) => updateGroupTitle(groupIndex, e.target.value)}
              placeholder="分组标题 (Group Title)"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeGroup(groupIndex)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {(group.items || []).map((item, itemIndex) => {
              const phrase = isPhrase(item.word);
              return (
                <div key={itemIndex} className="flex gap-2 items-center">
                  <Input
                    label=""
                    value={item.word}
                    onChange={(e) => updateItem(groupIndex, itemIndex, 'word', e.target.value)}
                    placeholder="单词/短语"
                    className="w-[140px]"
                  />
                  <Input
                    label=""
                    value={item.phonetic || ''}
                    onChange={(e) => updateItem(groupIndex, itemIndex, 'phonetic', e.target.value)}
                    placeholder={phrase ? '—' : '音标'}
                    className="w-[100px]"
                    disabled={phrase}
                  />
                  <Input
                    label=""
                    value={item.pos || ''}
                    onChange={(e) => updateItem(groupIndex, itemIndex, 'pos', e.target.value)}
                    placeholder="词性"
                    className="w-[70px] text-center"
                  />
                  <Input
                    label=""
                    value={item.meaning}
                    onChange={(e) => updateItem(groupIndex, itemIndex, 'meaning', e.target.value)}
                    placeholder="中文释义"
                    className="flex-1 min-w-[100px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(groupIndex, itemIndex)}
                    className="shrink-0 text-red-600 hover:bg-red-50 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(groupIndex)}
              className="w-full mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> 添加条目 (Add Item)
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={addGroup}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" /> 添加分组 (Add Group)
      </Button>
    </div>
  );
};

// 语法要点编辑器组件
const GrammarEditor: React.FC<{
  grammarPoints: DraftGrammarPoint[];
  onChange: (points: DraftGrammarPoint[]) => void;
}> = ({ grammarPoints, onChange }) => {
  const points = grammarPoints || [];

  const addPoint = () => {
    onChange([...points, { title: '', explanation: '', example: '' }]);
  };

  const removePoint = (index: number) => {
    onChange(points.filter((_, i) => i !== index));
  };

  const updatePoint = (index: number, field: keyof DraftGrammarPoint, value: string) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: value };
    onChange(newPoints);
  };

  return (
    <div className="space-y-4">
      {points.map((point, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/30 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
              语法 {index + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removePoint(index)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              label="标题 (Title)"
              value={point.title}
              onChange={(e) => updatePoint(index, 'title', e.target.value)}
              placeholder="例如：一般过去时"
            />
            <TextArea
              label="解释 (Explanation)"
              value={point.explanation}
              onChange={(e) => updatePoint(index, 'explanation', e.target.value)}
              placeholder="用中文解释语法点..."
              rows={2}
            />
            <Input
              label="例句 (Example)"
              value={point.example}
              onChange={(e) => updatePoint(index, 'example', e.target.value)}
              placeholder="来自文章的例句..."
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={addPoint}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" /> 添加语法要点 (Add Grammar Point)
      </Button>
    </div>
  );
};

// 金句编辑器组件
const GoldenSentencesEditor: React.FC<{
  sentences: DraftGoldenSentence[];
  onChange: (sentences: DraftGoldenSentence[]) => void;
}> = ({ sentences, onChange }) => {
  const items = sentences || [];

  const addSentence = () => {
    onChange([...items, { sentence: '', translation: '' }]);
  };

  const removeSentence = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateSentence = (index: number, field: keyof DraftGoldenSentence, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/30 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30 dark:text-amber-300">
              金句 {index + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeSentence(index)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <TextArea
              label="英文句子 (English Sentence)"
              value={item.sentence}
              onChange={(e) => updateSentence(index, 'sentence', e.target.value)}
              placeholder="输入优美的英文句子..."
              rows={2}
            />
            <Input
              label="中文翻译 (Chinese Translation)"
              value={item.translation}
              onChange={(e) => updateSentence(index, 'translation', e.target.value)}
              placeholder="中文翻译..."
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={addSentence}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" /> 添加金句 (Add Golden Sentence)
      </Button>
    </div>
  );
};

// 练习题编辑器组件
const ExercisesEditor: React.FC<{
  exercises: DraftQuestion[];
  onChange: (exercises: DraftQuestion[]) => void;
}> = ({ exercises, onChange }) => {
  const questions = exercises || [];

  const addQuestion = (type: DraftQuestion['type']) => {
    const newQuestion: DraftQuestion = {
      type,
      prompt: '',
      ...(type === 'mcq' ? { options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }] } : {}),
      ...(type === 'true_false' ? {} : {}),
    };
    onChange([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<DraftQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...questions];
    const newOptions = [...(newQuestions[qIndex].options || [])];
    newOptions[oIndex] = { ...newOptions[oIndex], text };
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    onChange(newQuestions);
  };

  const getQuestionTypeLabel = (type: DraftQuestion['type']) => {
    switch (type) {
      case 'mcq': return '选择题 (MCQ)';
      case 'true_false': return '判断题 (T/F)';
      case 'blank': return '填空题 (Blank)';
      case 'short_answer': return '简答题 (Short Answer)';
      default: return type;
    }
  };

  const questionCount = questions.length;
  const minQuestions = 5;

  return (
    <div className="space-y-4">
      {questionCount < minQuestions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-300">
          提示：建议至少添加 {minQuestions} 道题目（当前 {questionCount} 道）
        </div>
      )}
      {questions.map((q, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-900/30 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-sky-900/30 dark:text-sky-300">
              Q{index + 1} · {getQuestionTypeLabel(q.type)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeQuestion(index)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <TextArea
            label="题目 (Question)"
            value={q.prompt}
            onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
            placeholder="输入题目内容..."
            rows={2}
          />
          {q.type === 'mcq' && (
            <div className="mt-3 space-y-2">
              {(q.options || []).map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-xs font-bold text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                    {opt.label}
                  </span>
                  <Input
                    label=""
                    value={opt.text}
                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                    placeholder={`选项 ${opt.label}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => addQuestion('mcq')}>
          <Plus className="w-4 h-4 mr-1" /> 选择题
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('true_false')}>
          <Plus className="w-4 h-4 mr-1" /> 判断题
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('blank')}>
          <Plus className="w-4 h-4 mr-1" /> 填空题
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('short_answer')}>
          <Plus className="w-4 h-4 mr-1" /> 简答题
        </Button>
      </div>
    </div>
  );
};

// 图片编辑器组件
const ImageEditor: React.FC<{
  imageUrl: string;
  showCoverImage: boolean;
  onImageChange: (url: string) => void;
  onToggleShowImage: (show: boolean) => void;
}> = ({ imageUrl, showCoverImage, onImageChange, onToggleShowImage }) => {
  const [urlInput, setUrlInput] = useState(imageUrl.startsWith('blob') ? '' : imageUrl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onImageChange(url);
      setUrlInput('');
    }
    e.target.value = '';
  };

  const handleUrlChange = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Show/Hide Toggle */}
      <div
        className={clsx(
          'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
          showCoverImage
            ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
            : 'bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/50'
        )}
        onClick={() => onToggleShowImage(!showCoverImage)}
      >
        <div className="flex items-center gap-3">
          {showCoverImage ? (
            <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400 dark:text-slate-500" />
          )}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {showCoverImage ? '显示封面图片' : '隐藏封面图片'}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {showCoverImage ? '图片将在排版时显示' : '图片将被隐藏，不会出现在输出中'}
            </div>
          </div>
        </div>
        <div className={clsx(
          'w-10 h-6 rounded-full relative transition-colors',
          showCoverImage ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
        )}>
          <div className={clsx(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            showCoverImage ? 'left-5' : 'left-1'
          )} />
        </div>
      </div>

      {showCoverImage && (
        <>
          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              label="图片链接 (Image URL)"
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1"
            />
            <Button variant="secondary" size="sm" onClick={handleUrlChange}>
              应用
            </Button>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer dark:bg-slate-950/40 dark:border-slate-700 dark:hover:bg-slate-900/30"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Cover" className="mx-auto h-32 object-contain rounded-lg" />
                <div className="mt-2 text-sm text-blue-600 dark:text-sky-400">点击更换图片</div>
              </div>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium text-sm">点击上传图片</p>
                <p className="text-xs text-gray-400 mt-1">支持 PNG, JPG</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>
        </>
      )}
    </div>
  );
};

const Edit: React.FC = () => {
  const navigate = useNavigate();
  const {
    draft,
    setDraftParagraphs,
    updateDraftArticle,
    setDraftToolkit,
    setDraftExercises,
    paperSize,
    orientation,
    imageUrl,
    showCoverImage,
    showExercises,
    showLanguageToolkit,
    htmlContent,
    setHtmlContent,
    addToHistory,
    originalText,
    setImageUrl,
    setShowCoverImage,
  } = useWorksheetStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'content' | 'toolkit' | 'exercises' | 'image'>('content');
  const [toolkitSubTab, setToolkitSubTab] = useState<'vocab' | 'grammar' | 'golden'>('vocab');

  const active = draft?.articles?.[activeIndex];

  const resetEditors = (idx: number) => {
    setActiveTab('content');
    setToolkitSubTab('vocab');
  };

  const canRender = Boolean(draft && draft.articles && draft.articles.length > 0);

  const titleValue = active?.title ?? '';
  const cefrValue = active?.cefrLevel ?? '';
  const paragraphsValue = useMemo(() => joinParagraphs(active?.paragraphs || []), [active?.paragraphs]);

  // Initialize toolkit visibility flags if not set
  const showVocab = active?.showToolkitVocab !== false;
  const showGrammar = active?.showToolkitGrammar !== false;
  const showGolden = active?.showToolkitGolden !== false;

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50/50 dark:bg-slate-950/40">
        <div className="bg-white/90 p-8 rounded-2xl shadow-sm text-center max-w-md mx-4 dark:bg-slate-950/60 dark:border dark:border-slate-800">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-slate-100">暂无可编辑草稿</h3>
          <p className="text-gray-500 mb-6 dark:text-slate-400">请先生成草稿，再进入编辑与排版。</p>
          <Button onClick={() => navigate('/')} size="lg">返回生成</Button>
        </div>
      </div>
    );
  }

  const handleRender = () => {
    if (!canRender) return;
    const html = renderWorksheetHtml({
      draft,
      paperSize,
      orientation,
      imageUrl,
      showExercises,
      showLanguageToolkit,
    });
    setHtmlContent(html);
    // Extract title from first article
    const firstArticle = draft.articles[0];
    const title = firstArticle?.title || firstArticle?.paragraphs?.[0]?.substring(0, 50) || '未命名练习单';

    addToHistory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      htmlContent: html,
      originalText,
      settings: {
        paperSize,
        orientation,
        articleCount: draft.articles.length,
        articles: draft.articles.map((a, idx) => ({
          id: `${idx}`,
          grade: 'middle-7' as const,
          gradeCategory: 'middle' as const,
          cefrLevel: a.cefrLevel,
          grammarDifficulty: 'custom',
        })),
      },
      metadata: {
        title: title.length > 50 ? title.substring(0, 50) + '...' : title,
        grade: draft.articles[0]?.gradeCategory || 'middle',
        cefrLevel: draft.articles[0]?.cefrLevel,
        articleSummaries: draft.articles.map((a, idx) => ({
          title: a.title || a.paragraphs?.[0]?.substring(0, 40) || `文章 ${idx + 1}`,
          cefrLevel: a.cefrLevel,
          wordCount: a.paragraphs?.join(' ').split(/\s+/).length || 0,
        })),
      },
    });
    navigate('/preview');
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Top Bar - Stats & Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-md">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">人工编辑</h2>
        </div>
        
        {/* Article Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {draft.articles.map((a, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                resetEditors(idx);
              }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shadow-sm',
                idx === activeIndex
                  ? 'bg-blue-600 text-white shadow-blue-200 dark:bg-blue-500 dark:shadow-none'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
              type="button"
            >
              文章{idx + 1}: {a.cefrLevel}
            </button>
          ))}
        </div>

        {/* Compact Stats with better visibility */}
        {active && (
          <div className="flex items-center gap-4 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-slate-400 font-medium">字数</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
                {(active.paragraphs || []).join(' ').split(/\s+/).filter(Boolean).length}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-slate-600" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-slate-400 font-medium">段落</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-base">
                {(active.paragraphs || []).length}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-slate-600" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-slate-400 font-medium">词汇</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 text-base">
                {(active.toolkit || []).reduce((sum, g) => sum + (g.items?.length || 0), 0)}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-slate-600" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 dark:text-slate-400 font-medium">练习</span>
              <span className={clsx(
                'font-bold text-base',
                ((active.exercises || []).length) < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'
              )}>
                {(active.exercises || []).length}
              </span>
            </div>
          </div>
        )}

        {/* Preview Button */}
        <button
          onClick={handleRender}
          disabled={!canRender}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md',
            canRender
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
          )}
        >
          <EyeIcon className="w-4 h-4" />
          预览
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {active && (
          <div className="h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('content')}
                className={clsx(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                正文内容
              </button>
              <button
                onClick={() => setActiveTab('toolkit')}
                className={clsx(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'toolkit'
                    ? 'border-blue-500 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                语言工具箱
              </button>
              <button
                onClick={() => setActiveTab('exercises')}
                className={clsx(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'exercises'
                    ? 'border-blue-500 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                读后练习
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={clsx(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'image'
                    ? 'border-blue-500 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                封面图片
              </button>
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <Input
                  label="标题 (Title)"
                  value={titleValue}
                  onChange={(e) => updateDraftArticle(activeIndex, { title: e.target.value })}
                  placeholder="输入标题"
                />

                <Input
                  label="等级 (CEFR)"
                  value={cefrValue}
                  onChange={(e) => updateDraftArticle(activeIndex, { cefrLevel: e.target.value.toUpperCase() })}
                  placeholder="例如：B1"
                />

                <div className="flex-1">
                  <TextArea
                    label="正文 (Paragraphs)"
                    value={paragraphsValue}
                    onChange={(e) => setDraftParagraphs(activeIndex, splitParagraphs(e.target.value))}
                    placeholder="用空行分隔段落"
                    className="min-h-[300px]"
                  />
                </div>
              </div>
            )}

            {/* Toolkit Tab */}
            {activeTab === 'toolkit' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Sub-module toggles */}
                <div className="flex gap-2 px-4 pt-2 pb-2 shrink-0">
                  <button
                    onClick={() => updateDraftArticle(activeIndex, { showToolkitVocab: !showVocab })}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      showVocab
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    单词解析
                    {showVocab ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => updateDraftArticle(activeIndex, { showToolkitGrammar: !showGrammar })}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      showGrammar
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    语法要点
                    {showGrammar ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => updateDraftArticle(activeIndex, { showToolkitGolden: !showGolden })}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      showGolden
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <Quote className="w-4 h-4" />
                    金句背诵
                    {showGolden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex border-b border-gray-200 mb-4 dark:border-slate-700">
                  {showVocab && (
                    <button
                      onClick={() => setToolkitSubTab('vocab')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        toolkitSubTab === 'vocab'
                          ? 'border-blue-500 text-blue-600 dark:border-sky-400 dark:text-sky-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
                      )}
                    >
                      单词解析
                    </button>
                  )}
                  {showGrammar && (
                    <button
                      onClick={() => setToolkitSubTab('grammar')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        toolkitSubTab === 'grammar'
                          ? 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
                      )}
                    >
                      语法要点
                    </button>
                  )}
                  {showGolden && (
                    <button
                      onClick={() => setToolkitSubTab('golden')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        toolkitSubTab === 'golden'
                          ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
                      )}
                    >
                      金句背诵
                    </button>
                  )}
                </div>

                {/* Sub-module content */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {toolkitSubTab === 'vocab' && showVocab && (
                    <VocabEditor
                      toolkit={active.toolkit || []}
                      onChange={(toolkit) => setDraftToolkit(activeIndex, toolkit.length ? toolkit : undefined)}
                    />
                  )}
                  {toolkitSubTab === 'grammar' && showGrammar && (
                    <GrammarEditor
                      grammarPoints={active.grammarPoints || []}
                      onChange={(points) => updateDraftArticle(activeIndex, { grammarPoints: points.length ? points : undefined })}
                    />
                  )}
                  {toolkitSubTab === 'golden' && showGolden && (
                    <GoldenSentencesEditor
                      sentences={active.goldenSentences || []}
                      onChange={(sentences) => updateDraftArticle(activeIndex, { goldenSentences: sentences.length ? sentences : undefined })}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Exercises Tab */}
            {activeTab === 'exercises' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">读后练习 (Exercises)</h3>
                </div>
                <ExercisesEditor
                  exercises={active.exercises || []}
                  onChange={(exercises) => setDraftExercises(activeIndex, exercises.length ? exercises : undefined)}
                />
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">封面图片 (Cover Image)</h3>
                </div>
                <ImageEditor
                  imageUrl={imageUrl}
                  showCoverImage={active.showCoverImage !== false}
                  onImageChange={setImageUrl}
                  onToggleShowImage={(show) => updateDraftArticle(activeIndex, { showCoverImage: show })}
                />
              </div>
            )}


          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-white/80 dark:bg-slate-950/60 dark:border-slate-800/70 shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>返回生成</Button>
          <Button variant="primary" className="flex-1" onClick={handleRender} disabled={!canRender}>排版预览</Button>
        </div>
      </div>
    </div>
  );
};

export default Edit;

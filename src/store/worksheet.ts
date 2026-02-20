import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HistoryItem, ArticleConfig, WorksheetDraft, DraftArticle, DraftToolkitGroup, DraftQuestion, GradeLevel } from '../types';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

interface WorksheetState {
  // Output
  htmlContent: string | null;
  isGenerating: boolean;
  
  // Input State (Persisted during session)
  originalText: string;
  grade: string;
  cefrLevel: string;
  grammarDifficulty: string;
  imageUrl: string;
  
  // Layout Settings
  paperSize: 'a4' | 'a3';
  orientation: 'portrait' | 'landscape';
  articleCount: number;
  articles: ArticleConfig[];
  
  // Visibility Settings
  showCoverImage: boolean;
  showExercises: boolean;
  showLanguageToolkit: boolean;
  showGrammarSection: boolean;
  showGoldenSentences: boolean;

  // Word Count Control
  enableWordCount: boolean;
  targetWordCount: number;
  wordCountTolerance: number;

  // Draft (Structured)
  draft: WorksheetDraft | null;

  // History
  history: HistoryItem[];
  currentHistoryIndex: number | null;

  // Actions
  setHtmlContent: (content: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setOriginalText: (text: string) => void;
  setGrade: (grade: string) => void;
  setCefrLevel: (level: string) => void;
  setGrammarDifficulty: (difficulty: string) => void;
  setImageUrl: (url: string) => void;
  setPaperSize: (size: 'a4' | 'a3') => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setArticleCount: (count: number) => void;
  
  // Visibility Actions
  setShowCoverImage: (show: boolean) => void;
  setShowExercises: (show: boolean) => void;
  setShowLanguageToolkit: (show: boolean) => void;
  setShowGrammarSection: (show: boolean) => void;
  setShowGoldenSentences: (show: boolean) => void;

  // Word Count Actions
  setEnableWordCount: (enable: boolean) => void;
  setTargetWordCount: (count: number) => void;
  setWordCountTolerance: (tolerance: number) => void;

  // Draft Actions
  setDraft: (draft: WorksheetDraft | null) => void;
  updateDraftArticle: (index: number, article: Partial<DraftArticle>) => void;
  setDraftParagraphs: (index: number, paragraphs: string[]) => void;
  setDraftToolkit: (index: number, toolkit: DraftToolkitGroup[] | undefined) => void;
  setDraftExercises: (index: number, exercises: DraftQuestion[] | undefined) => void;
  
  // New Actions
  updateArticleConfig: (index: number, config: Partial<ArticleConfig>) => void;
  addToHistory: (item: HistoryItem) => void;
  setHistoryIndex: (index: number | null) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
  removeHistoryItems: (ids: string[]) => void;
}

const createDefaultArticle = (): ArticleConfig => ({
  id: generateId(),
  grade: 'middle-7',
  gradeCategory: 'middle',
  cefrLevel: 'A1',
  grammarDifficulty: 'basic',
  enableWordCount: false,
  targetWordCount: 300,
  wordCountTolerance: 20,
  enableTenseControl: false,
  selectedTenses: ['mixed'],
});

export const useWorksheetStore = create<WorksheetState>()(
  persist(
    (set) => ({
      // Initial Values
      htmlContent: null,
      isGenerating: false,
      originalText: '',
      grade: 'elementary',
      cefrLevel: 'A1',
      grammarDifficulty: 'basic',
      imageUrl: '',
      paperSize: 'a4',
      orientation: 'portrait',
      articleCount: 1,
      articles: [createDefaultArticle()],
      showCoverImage: true,
      showExercises: true,
      showLanguageToolkit: true,
      showGrammarSection: true,
      showGoldenSentences: true,
      enableWordCount: false,
      targetWordCount: 300,
      wordCountTolerance: 20,
      draft: null,
      history: [],
      currentHistoryIndex: null,

      // Setters
      setHtmlContent: (content) => set({ htmlContent: content }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setOriginalText: (text) => set({ originalText: text }),
      setGrade: (grade) => set((state) => {
        // Sync first article with global state for backward compatibility
        const newArticles = [...state.articles];
        if (newArticles.length > 0) {
          newArticles[0] = { ...newArticles[0], grade: grade as GradeLevel };
        }
        return { grade, articles: newArticles };
      }),
      setCefrLevel: (level) => set((state) => {
        const newArticles = [...state.articles];
        if (newArticles.length > 0) {
          newArticles[0] = { ...newArticles[0], cefrLevel: level };
        }
        return { cefrLevel: level, articles: newArticles };
      }),
      setGrammarDifficulty: (difficulty) => set((state) => {
        const newArticles = [...state.articles];
        if (newArticles.length > 0) {
          newArticles[0] = { ...newArticles[0], grammarDifficulty: difficulty };
        }
        return { grammarDifficulty: difficulty, articles: newArticles };
      }),
      setImageUrl: (url) => set({ imageUrl: url }),
      setPaperSize: (size) => set({ paperSize: size }),
      setOrientation: (orientation) => set({ orientation }),
      setArticleCount: (count) => set((state) => {
        const currentArticles = state.articles;
        let newArticles: ArticleConfig[] = [];

        if (count > currentArticles.length) {
          // Add new articles
          const toAdd = count - currentArticles.length;
          const added = Array(toAdd).fill(null).map(() => createDefaultArticle());
          newArticles = [...currentArticles, ...added];
        } else {
          // Remove articles
          newArticles = currentArticles.slice(0, count);
        }

        return { articleCount: count, articles: newArticles };
      }),
      setShowCoverImage: (show) => set({ showCoverImage: show }),
      setShowExercises: (show) => set({ showExercises: show }),
      setShowLanguageToolkit: (show) => set({ showLanguageToolkit: show }),
      setShowGrammarSection: (show) => set({ showGrammarSection: show }),
      setShowGoldenSentences: (show) => set({ showGoldenSentences: show }),

      setEnableWordCount: (enable) => set({ enableWordCount: enable }),
      setTargetWordCount: (count) => set({ targetWordCount: count }),
      setWordCountTolerance: (tolerance) => set({ wordCountTolerance: tolerance }),

      setDraft: (draft) => set({ draft }),
      updateDraftArticle: (index, article) => set((state) => {
        if (!state.draft) return state;
        const next = { ...state.draft };
        const articles = [...(next.articles || [])];
        if (index < 0 || index >= articles.length) return state;
        articles[index] = { ...articles[index], ...article };
        next.articles = articles;
        return { draft: next };
      }),
      setDraftParagraphs: (index, paragraphs) => set((state) => {
        if (!state.draft) return state;
        const next = { ...state.draft };
        const articles = [...(next.articles || [])];
        if (index < 0 || index >= articles.length) return state;
        articles[index] = { ...articles[index], paragraphs };
        next.articles = articles;
        return { draft: next };
      }),
      setDraftToolkit: (index, toolkit) => set((state) => {
        if (!state.draft) return state;
        const next = { ...state.draft };
        const articles = [...(next.articles || [])];
        if (index < 0 || index >= articles.length) return state;
        articles[index] = { ...articles[index], toolkit };
        next.articles = articles;
        return { draft: next };
      }),
      setDraftExercises: (index, exercises) => set((state) => {
        if (!state.draft) return state;
        const next = { ...state.draft };
        const articles = [...(next.articles || [])];
        if (index < 0 || index >= articles.length) return state;
        articles[index] = { ...articles[index], exercises };
        next.articles = articles;
        return { draft: next };
      }),

      updateArticleConfig: (index, config) => set((state) => {
        const newArticles = [...state.articles];
        if (index >= 0 && index < newArticles.length) {
          newArticles[index] = { ...newArticles[index], ...config };
          
          // If updating first article, sync with global state
          if (index === 0) {
            return { 
              articles: newArticles,
              ...(config.grade ? { grade: config.grade } : {}),
              ...(config.cefrLevel ? { cefrLevel: config.cefrLevel } : {}),
              ...(config.grammarDifficulty ? { grammarDifficulty: config.grammarDifficulty } : {}),
            };
          }
        }
        return { articles: newArticles };
      }),

      addToHistory: (item) => set((state) => ({ 
        history: [item, ...state.history],
        currentHistoryIndex: 0 // View the new item immediately
      })),

      setHistoryIndex: (index) => set({ currentHistoryIndex: index }),
      
      clearHistory: () => set({ history: [], currentHistoryIndex: null }),
      
      removeHistoryItem: (id) => set((state) => ({
        history: state.history.filter(item => item.id !== id),
        currentHistoryIndex: state.currentHistoryIndex !== null && state.history[state.currentHistoryIndex]?.id === id ? null : state.currentHistoryIndex
      })),
      removeHistoryItems: (ids) => set((state) => ({
        history: state.history.filter(item => !ids.includes(item.id)),
        currentHistoryIndex: state.currentHistoryIndex !== null && state.history[state.currentHistoryIndex] && ids.includes(state.history[state.currentHistoryIndex].id) ? null : state.currentHistoryIndex
      })),
    }),
    {
      name: 'worksheet_storage',
      partialize: (state) => ({ 
        originalText: state.originalText,
        grade: state.grade,
        cefrLevel: state.cefrLevel,
        grammarDifficulty: state.grammarDifficulty,
        imageUrl: state.imageUrl,
        paperSize: state.paperSize,
        orientation: state.orientation,
        articleCount: state.articleCount,
        articles: state.articles,
        showCoverImage: state.showCoverImage,
        showExercises: state.showExercises,
        showLanguageToolkit: state.showLanguageToolkit,
        showGrammarSection: state.showGrammarSection,
        showGoldenSentences: state.showGoldenSentences,
        enableWordCount: state.enableWordCount,
        targetWordCount: state.targetWordCount,
        wordCountTolerance: state.wordCountTolerance,
        draft: state.draft,
        history: state.history,
        htmlContent: state.htmlContent
      }),
    }
  )
);

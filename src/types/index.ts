export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'moonshot' | 'qwen' | 'zhipu' | 'custom';

export interface UserSettings {
  aiProvider: AIProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
  customModelName?: string;
  defaultGrade: string;
  defaultCefrLevel: string;
  defaultGrammarDifficulty: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  aiProvider: 'openai',
  apiKey: '',
  model: 'gpt-4o',
  defaultGrade: 'middle',
  defaultCefrLevel: 'A1',
  defaultGrammarDifficulty: 'basic',
};

export interface GenerateWorksheetRequest {
  originalText: string;
  studentGrade: string;
  cefrLevel: string;
  grammarDifficulty: string;
  exerciseTypes: string[];
  imageUrl?: string;
  aiProvider: AIProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string; // For custom provider

  // Layout Settings
  paperSize?: 'a4' | 'a3';
  orientation?: 'portrait' | 'landscape';
  articleCount?: number;
  articles?: ArticleConfig[];

  // Visibility Settings
  showCoverImage?: boolean;
  showExercises?: boolean;
  showLanguageToolkit?: boolean;
  showGrammarSection?: boolean;  // Grammar section toggle
  showGoldenSentences?: boolean; // Golden sentences toggle

  // Word Count Control (global defaults)
  enableWordCount?: boolean;
  targetWordCount?: number;
  wordCountTolerance?: number; // Percentage, e.g., 20 means ±20%

  // New: Image Content Source (Base64)
  contentImage?: string;
}

// Detailed grade levels
export type GradeLevel = 
  | 'elementary-1' | 'elementary-2' | 'elementary-3' 
  | 'elementary-4' | 'elementary-5' | 'elementary-6'
  | 'middle-7' | 'middle-8' | 'middle-9'
  | 'high-10' | 'high-11' | 'high-12';

// Grade category for first-level selection
export type GradeCategory = 'elementary' | 'middle' | 'high';

export type TenseOption = 'present_simple' | 'past_simple' | 'future_simple' | 'present_continuous' | 'past_continuous' | 'present_perfect' | 'past_perfect' | 'mixed';

export const TENSE_OPTIONS: { value: TenseOption; label: string }[] = [
  { value: 'present_simple', label: '一般现在时 (Present Simple)' },
  { value: 'past_simple', label: '一般过去时 (Past Simple)' },
  { value: 'future_simple', label: '一般将来时 (Future Simple)' },
  { value: 'present_continuous', label: '现在进行时 (Present Continuous)' },
  { value: 'past_continuous', label: '过去进行时 (Past Continuous)' },
  { value: 'present_perfect', label: '现在完成时 (Present Perfect)' },
  { value: 'past_perfect', label: '过去完成时 (Past Perfect)' },
  { value: 'mixed', label: '混合时态 (Mixed)' },
];

export interface ArticleConfig {
  id: string;
  grade: GradeLevel;  // Detailed grade like 'middle-7', 'high-10'
  gradeCategory: GradeCategory;  // 'elementary', 'middle', 'high'
  cefrLevel: string;
  grammarDifficulty: string;
  // Word Count Control (per article)
  enableWordCount?: boolean;
  targetWordCount?: number;
  wordCountTolerance?: number;
  // Tense Control (per article)
  enableTenseControl?: boolean;
  selectedTenses?: TenseOption[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  htmlContent: string;
  originalText: string;
  settings: {
    paperSize: 'a4' | 'a3';
    orientation: 'portrait' | 'landscape';
    articleCount: number;
    articles: ArticleConfig[];
  };
  // Enhanced metadata for display
  metadata?: {
    title?: string;
    grade?: string;
    cefrLevel?: string;
    articleSummaries?: Array<{
      title?: string;
      cefrLevel?: string;
      wordCount?: number;
    }>;
  };
}

export interface GenerateWorksheetResponse {
  success: boolean;
  htmlContent?: string;
  error?: string;
  metadata?: {
    wordCount: number;
    exerciseCount: number;
    estimatedTime: number;
  };
}

export type DraftQuestionType = 'mcq' | 'blank' | 'true_false' | 'short_answer';

export interface DraftQuestionOption {
  label: string;
  text: string;
}

export interface DraftQuestion {
  type: DraftQuestionType;
  prompt: string;
  options?: DraftQuestionOption[];
  answer?: string;
}

export interface DraftToolkitItem {
  word: string;
  phonetic?: string;
  pos?: string; // part of speech
  meaning: string;
}

export interface DraftToolkitGroup {
  title: string;
  items: DraftToolkitItem[];
}

export interface DraftGrammarPoint {
  title: string;
  explanation: string;
  example: string;
}

export interface DraftGoldenSentence {
  sentence: string;
  translation: string;
}

export interface DraftArticle {
  title: string;
  cefrLevel: string;
  gradeCategory?: 'elementary' | 'middle' | 'high';
  paragraphs: string[];
  // Language Toolkit - three sub-modules
  toolkit?: DraftToolkitGroup[];  // Vocabulary analysis (words/phrases with phonetic, pos, meaning)
  grammarPoints?: DraftGrammarPoint[];  // Grammar highlights
  goldenSentences?: DraftGoldenSentence[];  // Golden sentences to memorize
  // Visibility flags for toolkit sub-modules (for editing)
  showToolkitVocab?: boolean;
  showToolkitGrammar?: boolean;
  showToolkitGolden?: boolean;
  exercises?: DraftQuestion[];
  coverImageLayout?: 'banner' | 'side' | 'inline';
  // Word count per article
  enableWordCount?: boolean;
  targetWordCount?: number;
  wordCountTolerance?: number;
  // Cover image visibility per article
  showCoverImage?: boolean;
  // Layout settings per article (for preview)
  lineHeight?: number;
  fontSize?: number;
  imagePositionY?: number;
  pagePadding?: number;
  paragraphSpacing?: number;
}

export interface WorksheetDraft {
  articles: DraftArticle[];
}

export interface GenerateDraftResponse {
  success: boolean;
  draft?: WorksheetDraft;
  error?: string;
}

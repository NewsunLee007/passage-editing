import { GenerateDraftResponse, GenerateWorksheetRequest, GenerateWorksheetResponse, WorksheetDraft } from '../types';
import { DRAFT_SYSTEM_PROMPT, DRAFT_USER_PROMPT_TEMPLATE, SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from './prompts';
import { PROVIDER_ENDPOINTS } from '../constants/endpoints';

function extractJsonObject(text: string): string | null {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return cleaned.slice(first, last + 1);
}

function normalizeDraft(params: {
  draft: WorksheetDraft;
  articleCount: number;
  levels: string[];
  showExercises: boolean;
  showLanguageToolkit: boolean;
}): WorksheetDraft {
  const { draft, articleCount, levels, showExercises, showLanguageToolkit } = params;
  const targetCount = Math.max(1, articleCount || 1);
  const requestedLevels = (levels && levels.length > 0 ? levels : ['A1']).map((l) => (l || 'A1').toUpperCase());

  const srcArticles = Array.isArray(draft.articles) ? draft.articles : [];
  const next = srcArticles.slice(0, targetCount).map((a, idx) => {
    const lvl = requestedLevels[idx] || requestedLevels[0] || 'A1';
    const base = {
      title: (a?.title || '').toString().trim() || 'Untitled',
      cefrLevel: (a?.cefrLevel || lvl).toString().trim().toUpperCase() || lvl,
      paragraphs: Array.isArray(a?.paragraphs) ? a.paragraphs.map((p) => (p || '').toString().trim()).filter(Boolean) : [],
      coverImageLayout: a?.coverImageLayout,
    } as any;

    if (base.cefrLevel !== lvl) base.cefrLevel = lvl;
    
    // Language Toolkit with three sub-modules
    if (showLanguageToolkit) {
      // Vocabulary toolkit
      if (Array.isArray(a?.toolkit) && a.toolkit.length > 0) {
        base.toolkit = a.toolkit;
      } else {
        // Create default vocabulary based on level
        base.toolkit = generateDefaultToolkit(lvl);
      }
      
      // Grammar points
      if (Array.isArray(a?.grammarPoints) && a.grammarPoints.length > 0) {
        base.grammarPoints = a.grammarPoints;
      } else {
        // Create default grammar points based on level
        base.grammarPoints = generateDefaultGrammarPoints(lvl);
      }
      
      // Golden sentences
      if (Array.isArray(a?.goldenSentences) && a.goldenSentences.length > 0) {
        base.goldenSentences = a.goldenSentences;
      } else {
        // Create default golden sentences
        base.goldenSentences = generateDefaultGoldenSentences();
      }
    } else {
      delete base.toolkit;
      delete base.grammarPoints;
      delete base.goldenSentences;
    }
    
    if (showExercises && Array.isArray(a?.exercises)) base.exercises = a.exercises;
    if (!showExercises) delete base.exercises;
    return base;
  });

  while (next.length < targetCount) {
    const idx = next.length;
    const lvl = requestedLevels[idx] || requestedLevels[0] || 'A1';
    const article: any = { title: 'Untitled', cefrLevel: lvl, paragraphs: [] };
    if (showLanguageToolkit) {
      article.toolkit = generateDefaultToolkit(lvl);
      article.grammarPoints = generateDefaultGrammarPoints(lvl);
      article.goldenSentences = generateDefaultGoldenSentences();
    }
    next.push(article);
  }

  return { articles: next };
}

// Generate default vocabulary toolkit based on CEFR level
function generateDefaultToolkit(level: string) {
  const levelUpper = level.toUpperCase();
  if (levelUpper === 'A1' || levelUpper === 'A2') {
    return [{
      title: 'Key Vocabulary',
      items: [
        { word: 'example', phonetic: '/ɪɡˈzæmpl/', pos: 'n.', meaning: '例子；实例' },
        { word: 'practice', phonetic: '/ˈpræktɪs/', pos: 'v.', meaning: '练习；实践' },
        { word: 'learn', phonetic: '/lɜːrn/', pos: 'v.', meaning: '学习' },
      ]
    }];
  } else if (levelUpper === 'B1' || levelUpper === 'B2') {
    return [{
      title: 'Key Vocabulary',
      items: [
        { word: 'significant', phonetic: '/sɪɡˈnɪfɪkənt/', pos: 'adj.', meaning: '重要的；有意义的' },
        { word: 'opportunity', phonetic: '/ˌɑːpərˈtuːnəti/', pos: 'n.', meaning: '机会；时机' },
        { word: 'contribute', phonetic: '/kənˈtrɪbjuːt/', pos: 'v.', meaning: '贡献；有助于' },
      ]
    }];
  } else {
    return [{
      title: 'Key Vocabulary',
      items: [
        { word: 'sophisticated', phonetic: '/səˈfɪstɪkeɪtɪd/', pos: 'adj.', meaning: '复杂的；精密的' },
        { word: 'controversial', phonetic: '/ˌkɑːntrəˈvɜːrʃl/', pos: 'adj.', meaning: '有争议的' },
        { word: 'implementation', phonetic: '/ˌɪmplɪmenˈteɪʃn/', pos: 'n.', meaning: '实施；执行' },
      ]
    }];
  }
}

// Generate default grammar points based on CEFR level
function generateDefaultGrammarPoints(level: string) {
  const levelUpper = level.toUpperCase();
  if (levelUpper === 'A1' || levelUpper === 'A2') {
    return [
      { title: '一般现在时', explanation: '表示经常性、习惯性的动作或状态', example: 'I read English every day.' },
      { title: '一般过去时', explanation: '表示过去发生的动作或状态', example: 'She visited Beijing last year.' },
    ];
  } else if (levelUpper === 'B1' || levelUpper === 'B2') {
    return [
      { title: '现在完成时', explanation: '表示过去发生的动作对现在造成的影响', example: 'I have finished my homework.' },
      { title: '被动语态', explanation: '强调动作的承受者而非执行者', example: 'The book was written by him.' },
      { title: '条件句', explanation: '表示假设情况及其结果', example: 'If it rains, we will stay at home.' },
    ];
  } else {
    return [
      { title: '虚拟语气', explanation: '表示与事实相反的假设或愿望', example: 'If I were you, I would accept the offer.' },
      { title: '倒装句', explanation: '将谓语的一部分或全部置于主语之前', example: 'Never have I seen such a beautiful sunset.' },
      { title: '独立主格', explanation: '表示伴随情况或原因', example: 'Weather permitting, we will go hiking.' },
    ];
  }
}

// Generate default golden sentences
function generateDefaultGoldenSentences() {
  return [
    { sentence: 'The journey of a thousand miles begins with a single step.', translation: '千里之行，始于足下。' },
    { sentence: 'Knowledge is power.', translation: '知识就是力量。' },
    { sentence: 'Practice makes perfect.', translation: '熟能生巧。' },
  ];
}

function sanitizeGeneratedHtml(params: {
  html: string;
  articleCount: number;
  levels: string[];
  showCoverImage: boolean;
  showExercises: boolean;
  showLanguageToolkit: boolean;
}): string {
  const { html, articleCount, levels, showCoverImage, showExercises, showLanguageToolkit } = params;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const pages = Array.from(doc.querySelectorAll<HTMLElement>('.page'));
    const allowedArticleIndexes = new Set<number>();
    for (let i = 0; i < Math.max(1, articleCount); i++) allowedArticleIndexes.add(i);
    if (pages.length > 0) {
      pages.forEach((p) => {
        const idxRaw = p.getAttribute('data-article-index');
        if (idxRaw == null) return;
        const idx = Number.parseInt(idxRaw, 10);
        if (!Number.isFinite(idx) || !allowedArticleIndexes.has(idx)) {
          p.remove();
        }
      });
    }

    const ensureMetaRowCss = () => {
      const existing = doc.querySelector('style[data-worksheet-meta-row="true"]');
      if (existing) return;
      const style = doc.createElement('style');
      style.setAttribute('data-worksheet-meta-row', 'true');
      style.textContent =
        '.meta-row{display:flex;gap:18px;align-items:flex-end;justify-content:space-between;flex-wrap:nowrap}' +
        '.meta-item{flex:1;min-width:0;display:flex;gap:8px;align-items:flex-end;white-space:nowrap}' +
        '.meta-item[data-key="score"]{flex:0 0 200px;justify-content:flex-end}' +
        '.meta-label{font-weight:700}' +
        '.meta-line{flex:1;min-width:80px;border-bottom:2px solid rgba(0,0,0,.65);height:1.05em}' +
        '.meta-suffix{font-weight:600;margin-left:6px}';
      doc.head.appendChild(style);
    };

    const ensureMetaRow = (page: HTMLElement) => {
      const scope = (page.querySelector('.page-header') as HTMLElement | null) || page;
      const candidates = Array.from(scope.querySelectorAll<HTMLElement>('p,div,span')).filter((el) => {
        if (el.closest('.level-badge, .badge-level, [data-level-badge="true"]')) return false;
        const t = (el.textContent || '').trim();
        if (!t) return false;
        return /^(Name|Date|Score)\s*:/i.test(t);
      });

      const pick = (key: 'Name' | 'Date' | 'Score') => {
        const re = new RegExp(`^${key}\\s*:`, 'i');
        return candidates.find((el) => re.test(((el.textContent || '').trim())));
      };

      const nameEl = pick('Name');
      const dateEl = pick('Date');
      const scoreEl = pick('Score');

      if (!nameEl || !dateEl || !scoreEl) return;

      const parent = (nameEl.parentElement === dateEl.parentElement && dateEl.parentElement === scoreEl.parentElement)
        ? (nameEl.parentElement as HTMLElement)
        : scope;

      const extractScoreSuffix = (raw: string) => {
        const m = raw.match(/\/\s*\d+/);
        return m ? m[0].replace(/\s+/g, '') : '';
      };

      const row = doc.createElement('div');
      row.className = 'meta-row';

      const buildItem = (key: 'Name' | 'Date' | 'Score', suffix?: string) => {
        const item = doc.createElement('div');
        item.className = 'meta-item';
        item.setAttribute('data-key', key.toLowerCase());

        const label = doc.createElement('span');
        label.className = 'meta-label';
        label.textContent = `${key}:`;

        const line = doc.createElement('span');
        line.className = 'meta-line';

        item.appendChild(label);
        item.appendChild(line);

        if (suffix) {
          const s = doc.createElement('span');
          s.className = 'meta-suffix';
          s.textContent = suffix;
          item.appendChild(s);
        }

        return item;
      };

      const scoreSuffix = extractScoreSuffix((scoreEl.textContent || '').trim());
      row.appendChild(buildItem('Name'));
      row.appendChild(buildItem('Date'));
      row.appendChild(buildItem('Score', scoreSuffix));

      nameEl.remove();
      dateEl.remove();
      scoreEl.remove();

      parent.insertBefore(row, parent.firstChild);
    };

    const removeByHeading = (re: RegExp) => {
      const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      headings.forEach((h) => {
        const text = (h.textContent || '').trim();
        if (!text) return;
        if (!re.test(text)) return;
        const container = h.closest('section,article,div') || h.parentElement;
        if (container) container.remove();
      });
    };

    if (!showCoverImage) {
      Array.from(doc.querySelectorAll('img')).forEach((img) => img.remove());
    }

    if (!showExercises) {
      Array.from(doc.querySelectorAll('.exercises-section, [class*="exercise"], [class*="question"], [data-section="exercises"]')).forEach((el) => el.remove());
      removeByHeading(/Exercises|练习|Questions|Comprehension|阅读理解/i);
    }

    if (!showLanguageToolkit) {
      Array.from(doc.querySelectorAll('.language-toolkit, .toolkit, [class*="toolkit"], [data-section="toolkit"], [data-section="language-toolkit"]')).forEach((el) => el.remove());
      removeByHeading(/Language Toolkit|Language Focus|Toolkit|语言工具箱|工具箱|词汇|语法/i);
    }

    ensureMetaRowCss();
    pages.forEach((p) => ensureMetaRow(p));

    const normalizeLevel = (value: string) => {
      const v = value.trim().toUpperCase();
      return v;
    };

    const setBadge = (page: Element, level: string) => {
      const desired = `${normalizeLevel(level)} LEVEL`;

      const direct = page.querySelector<HTMLElement>('.level-badge, .badge-level, [data-level-badge="true"]');
      if (direct) {
        direct.textContent = desired;
        return;
      }

      const candidates = Array.from(page.querySelectorAll<HTMLElement>('span,div,strong,em,p'));
      for (const el of candidates) {
        const t = (el.textContent || '').trim();
        if (!/LEVEL/i.test(t)) continue;
        if (!/(A1|A2|B1|B2|C1|C2)\s*LEVEL/i.test(t)) continue;
        el.textContent = desired;
        return;
      }
    };

    if (pages.length > 0) {
      const byArticle = new Map<number, HTMLElement[]>();
      pages.forEach((p) => {
        const idxRaw = p.getAttribute('data-article-index');
        const idx = idxRaw == null ? 0 : Number.parseInt(idxRaw, 10);
        const safeIdx = Number.isFinite(idx) ? idx : 0;
        const list = byArticle.get(safeIdx) || [];
        list.push(p);
        byArticle.set(safeIdx, list);
      });

      const requested = levels.length > 0 ? levels : ['A1'];

      if (Math.max(1, articleCount) === 1) {
        const level = requested[0] || 'A1';
        pages.forEach((p) => setBadge(p, level));
      } else {
        Array.from(byArticle.entries()).forEach(([idx, list]) => {
          const level = requested[idx] || requested[0] || 'A1';
          list.forEach((p) => setBadge(p, level));
        });
      }
    }

    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  } catch {
    return html;
  }
}

export async function generateDraft(request: GenerateWorksheetRequest): Promise<GenerateDraftResponse> {
  const {
    aiProvider,
    apiKey,
    model,
    customEndpoint,
    originalText,
    studentGrade,
    cefrLevel,
    grammarDifficulty,
    paperSize,
    orientation,
    articleCount = 1,
    articles,
    showCoverImage = true,
    showExercises = true,
    showLanguageToolkit = true,
    enableWordCount = false,
    targetWordCount = 300,
    wordCountTolerance = 20,
  } = request;

  if (!apiKey) {
    return { success: false, error: 'API Key is missing. Please configure it in Settings.' };
  }

  const effectiveArticleCount = Math.max(1, articleCount || 1);
  const effectiveArticles = Array.isArray(articles) ? articles.slice(0, effectiveArticleCount) : undefined;
  const levels = (effectiveArticles && effectiveArticles.length > 0)
    ? effectiveArticles.map((a) => a.cefrLevel).filter(Boolean)
    : [cefrLevel].filter(Boolean);

  const prompt = DRAFT_USER_PROMPT_TEMPLATE({
    text: originalText,
    articleCount: effectiveArticleCount,
    articles: effectiveArticles,
    studentGrade,
    cefrLevel,
    grammarDifficulty,
    showExercises,
    showLanguageToolkit,
    showCoverImage,
  });

  try {
    let endpoint = '';
    if (aiProvider === 'custom') {
      endpoint = customEndpoint || 'https://api.openai.com/v1';
    } else if (PROVIDER_ENDPOINTS[aiProvider]) {
      endpoint = PROVIDER_ENDPOINTS[aiProvider];
    }

    if (aiProvider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: DRAFT_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const json = extractJsonObject(text);
      if (!json) throw new Error('Invalid JSON draft output');
      const draft = JSON.parse(json) as WorksheetDraft;
      const normalized = normalizeDraft({ draft, articleCount: effectiveArticleCount, levels, showExercises, showLanguageToolkit });
      return { success: true, draft: normalized };
    }

    if (aiProvider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${DRAFT_SYSTEM_PROMPT}\n\n${prompt}` }] }],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const json = extractJsonObject(text);
      if (!json) throw new Error('Invalid JSON draft output');
      const draft = JSON.parse(json) as WorksheetDraft;
      const normalized = normalizeDraft({ draft, articleCount: effectiveArticleCount, levels, showExercises, showLanguageToolkit });
      return { success: true, draft: normalized };
    }

    if (!endpoint) endpoint = 'https://api.openai.com/v1';
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: DRAFT_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more stable JSON
        max_tokens: 8000, // Increased to prevent cut-offs for DeepSeek/Qwen
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const json = extractJsonObject(text);
    if (!json) throw new Error('Invalid JSON draft output');
    const draft = JSON.parse(json) as WorksheetDraft;
    const normalized = normalizeDraft({ draft, articleCount: effectiveArticleCount, levels, showExercises, showLanguageToolkit });
    return { success: true, draft: normalized };
  } catch (error) {
    console.error('AI Draft Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

export async function generateWorksheet(request: GenerateWorksheetRequest): Promise<GenerateWorksheetResponse> {
  const { 
    aiProvider, apiKey, model, customEndpoint, 
    originalText, studentGrade, cefrLevel, grammarDifficulty, imageUrl,
    paperSize = 'a4', orientation = 'portrait', articleCount = 1,
    contentImage, // New
    articles, // New: Multi-article config
    showCoverImage = true,
    showExercises = true,
    showLanguageToolkit = true
  } = request;

  if (!apiKey) {
    return { success: false, error: 'API Key is missing. Please configure it in Settings.' };
  }

  const effectiveArticleCount = Math.max(1, articleCount || 1);
  const effectiveArticles = Array.isArray(articles) ? articles.slice(0, effectiveArticleCount) : undefined;
  const levels = (effectiveArticles && effectiveArticles.length > 0)
    ? effectiveArticles.map((a) => a.cefrLevel).filter(Boolean)
    : [cefrLevel].filter(Boolean);
  const effectiveImageUrl = showCoverImage ? imageUrl : undefined;

  // If contentImage is present, the "Original Text" in the prompt will be minimal or a placeholder,
  // and the image will be sent as a separate message part.
  const prompt = USER_PROMPT_TEMPLATE(
    originalText || (contentImage ? "Please extract text from the provided image and use it as the source material." : "No text provided"), 
    studentGrade, 
    cefrLevel, 
    grammarDifficulty, 
    effectiveImageUrl,
    paperSize,
    orientation,
    effectiveArticleCount,
    effectiveArticles,
    showCoverImage,
    showExercises,
    showLanguageToolkit
  );

  try {
    let htmlContent = '';
    let endpoint = '';
    
    // Determine Endpoint
    if (aiProvider === 'custom') {
      endpoint = customEndpoint || 'https://api.openai.com/v1';
    } else if (PROVIDER_ENDPOINTS[aiProvider]) {
      endpoint = PROVIDER_ENDPOINTS[aiProvider];
    } else if (aiProvider === 'anthropic') {
      // Anthropic Logic
      const messages: any[] = [{ role: 'user', content: prompt }];
      
      // Add image if present (Anthropic format)
      if (contentImage) {
        // Remove data:image/xxx;base64, prefix
        const base64Data = contentImage.split(',')[1];
        const mediaType = contentImage.split(';')[0].split(':')[1];
        
        messages[0].content = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: prompt
          }
        ];
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true' 
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      htmlContent = data.content[0].text;
      htmlContent = htmlContent.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
      htmlContent = sanitizeGeneratedHtml({
        html: htmlContent,
        articleCount: effectiveArticleCount,
        levels,
        showCoverImage,
        showExercises,
        showLanguageToolkit,
      });
      return { success: true, htmlContent };

    } else if (aiProvider === 'gemini') {
      // Gemini Logic
      const parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }];
      
      if (contentImage) {
          // Remove prefix
          const base64Data = contentImage.split(',')[1];
          // Gemini expects inline data
          parts.unshift({
              inline_data: {
                  mime_type: contentImage.split(';')[0].split(':')[1],
                  data: base64Data
              }
          });
      }

       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      htmlContent = data.candidates[0].content.parts[0].text;
      htmlContent = htmlContent.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
      htmlContent = sanitizeGeneratedHtml({
        html: htmlContent,
        articleCount: effectiveArticleCount,
        levels,
        showCoverImage,
        showExercises,
        showLanguageToolkit,
      });
      return { success: true, htmlContent };

    } else {
       // OpenAI Compatible Logic (OpenAI, DeepSeek, Moonshot, Qwen, Zhipu)
       if (!endpoint) endpoint = 'https://api.openai.com/v1'; // Fallback
    }

    // OpenAI Format (including Vision)
    const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (contentImage) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { 
                    type: 'image_url', 
                    image_url: { 
                        url: contentImage 
                    } 
                }
            ]
        });
    } else {
        messages.push({ role: 'user', content: prompt });
    }

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    htmlContent = data.choices[0]?.message?.content || '';

    if (!htmlContent) {
      throw new Error('No content generated');
    }

    htmlContent = htmlContent.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    htmlContent = sanitizeGeneratedHtml({
      html: htmlContent,
      articleCount: effectiveArticleCount,
      levels,
      showCoverImage,
      showExercises,
      showLanguageToolkit,
    });

    return { success: true, htmlContent };
  } catch (error) {
    console.error('AI Generation Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

export async function extractTextFromImage(request: {
    aiProvider: string;
    apiKey: string;
    model: string;
    customEndpoint?: string;
    ocrEndpoint?: string;
    contentImage: string;
  }): Promise<{ success: boolean; text?: string; error?: string }> {
    const { aiProvider, apiKey, model, customEndpoint, ocrEndpoint, contentImage } = request;

    // Check if AI is configured
    if (!apiKey) {
        return { success: false, error: '请先配置 AI API 密钥（设置页面）' };
    }

    const prompt = "Please OCR this image. Extract ALL text from the provided image exactly as it appears. Do not add any commentary, just the text.";

    // Use AI Vision for OCR
    try {
        let textContent = '';
        let endpoint = '';

        if (aiProvider === 'custom') {
            endpoint = customEndpoint || 'https://api.openai.com/v1';
        } else if (PROVIDER_ENDPOINTS[aiProvider]) {
            endpoint = PROVIDER_ENDPOINTS[aiProvider];
        } else if (aiProvider === 'anthropic') {
            const base64Data = contentImage.split(',')[1];
            const mediaType = contentImage.split(';')[0].split(':')[1];
            const messages = [{
                role: 'user',
                content: [
                    { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
                    { type: 'text', text: prompt }
                ]
            }];
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'dangerously-allow-browser': 'true' },
                body: JSON.stringify({ model, max_tokens: 4096, messages })
            });
            if (!response.ok) throw new Error('Anthropic Error');
            const data = await response.json();
            return { success: true, text: data.content[0].text };
        } else if (aiProvider === 'gemini') {
            const base64Data = contentImage.split(',')[1];
            const parts = [
                { inline_data: { mime_type: contentImage.split(';')[0].split(':')[1], data: base64Data } },
                { text: prompt }
            ];
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts }] })
            });
            if (!response.ok) throw new Error('Gemini Error');
            const data = await response.json();
            return { success: true, text: data.candidates[0].content.parts[0].text };
        } else {
             if (!endpoint) endpoint = 'https://api.openai.com/v1';
        }

        const messages = [
            { role: 'system', content: "You are a helpful OCR assistant." },
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: contentImage } }
                ]
            }
        ];

        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages, max_tokens: 4000 })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return { success: true, text: data.choices[0]?.message?.content || '' };
    } catch (error) {
        console.error('AI Vision OCR Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'AI识别失败' };
    }
}

// Extract text from PDF/Word files using AI Vision
export async function extractTextFromFile(request: {
    file: File;
    ocrEndpoint: string;
}): Promise<{ success: boolean; text?: string; error?: string }> {
    const { file, ocrEndpoint } = request;

    try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Call OCR endpoint
        const response = await fetch(ocrEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file: base64,
                filename: file.name,
                fileType: file.type
            })
        });

        if (!response.ok) {
            throw new Error(`OCR服务返回错误: ${response.status}`);
        }

        const data = await response.json();

        // Try to find text in common response fields
        const text = data.text || data.content || data.result || data.data?.text ||
                    (Array.isArray(data) && data[0]?.text) ||
                    (data.markdown) || (data.html);

        if (text) {
            return { success: true, text };
        } else {
            return { success: false, error: 'OCR服务未能提取文本，请检查服务配置' };
        }
    } catch (e) {
        console.error('File OCR error:', e);
        return { success: false, error: e instanceof Error ? e.message : '文件解析失败' };
    }
}

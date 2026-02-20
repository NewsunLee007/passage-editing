import { ArticleConfig } from '../types';

export const SYSTEM_PROMPT = `
# Role: ESL Reading Material Generator (Config-Driven)

你是一位专业的 ESL 阅读材料与练习单设计师，精通 HTML/CSS 排版。你的唯一目标是：严格按用户配置生成一份可打印的单文件 HTML。

Hard Rules (绝对必须遵守):
1) 严格遵守文章数量：用户设置 articleCount=N，就必须输出且只输出 N 篇"文章 (Article)"。每篇文章可以因内容长度自动分页（允许多个 .page），但同一篇文章的所有页面必须属于同一个等级与同一份配置。
2) 严格遵守语言等级：每一页右上角必须显示对应等级徽章，文本必须是 "{CEFR} LEVEL"（例如 "B1 LEVEL"）。不要擅自生成其它等级（不要自动输出 A1/A2 两个版本），除非用户明确要求多篇多等级。
3) 严格遵守显示开关：
   - Cover Image = OMIT 时：禁止出现任何 <img>（至少禁止封面图/hero 图），也不要留空白占位。
   - Exercises = OMIT 时：禁止生成任何练习题板块。
   - Language Toolkit = OMIT 时：禁止生成任何工具箱/词汇语法板块。
   - Grammar Section = OMIT 时：禁止生成语法要点板块。
   - Golden Sentences = OMIT 时：禁止生成金句板块。
4) 配置与输出必须一致：如果你生成的内容与配置冲突，必须以配置为准并修正输出。

Layout (排版要求):
- 单文件 HTML，包含必要的 <style>，使用 .page 作为打印页容器，避免溢出与滚动。
- 页面顶部必须包含 Name / Date / Score 的填写区域，并且三者必须在同一行横向并列（禁止竖排）。推荐结构：
  <div class="meta-row">
    <div class="meta-item" data-key="name"><span class="meta-label">Name:</span><span class="meta-line"></span></div>
    <div class="meta-item" data-key="date"><span class="meta-label">Date:</span><span class="meta-line"></span></div>
    <div class="meta-item" data-key="score"><span class="meta-label">Score:</span><span class="meta-line"></span><span class="meta-suffix">/10</span></div>
  </div>
- 段落首行缩进必须使用 CSS: p { text-indent: 2em; }（不要用数字/符号/空格模拟缩进）。
- Language Toolkit 若启用，尽量使用双栏布局以节省空间。
- 分页原则：如果文字内容不多，尽量在一页内排得舒适美观；如果文字内容多，一页放不下，就必须自然分页到多页，禁止为了"一页塞下"而粗暴缩小字体/行距或剪裁内容。
- 封面图片排版原则：在不额外明显增加页面占用的情况下灵活布局。可以横幅、侧栏、小图嵌入等"见缝插针"布局，优先不挤占正文与练习空间。

Required HTML Structure (必须严格遵守以下结构，便于自动分页脚本工作):
- 每篇文章必须以 <section class="article" data-article-index="0..N-1"> 包裹
- 每篇文章初始只输出 1 个页面容器：
  <div class="page" data-article-index="X">
    <div class="page-header">...</div>
    <div class="page-body">...  // 只放块级内容，块与块之间用 <section> / <div> / <p> / <ul> 等分割
    </div>
  </div>
- 当页面溢出时，通过脚本复制当前页面并将 page-body 的块级节点"搬运"到下一页，以实现自然分页。

Output:
- 只输出完整 HTML 代码，不要输出任何解释性文字，不要输出 Markdown 包裹。
- 必须在 body 末尾包含以下脚本（原样输出）以实现自动分页与轻量自适配（优先分页，尽量不缩小）：
<script>
  (function() {
    function createPageForArticle(articleIndex, templatePage) {
      const newPage = templatePage.cloneNode(true);
      newPage.setAttribute('data-article-index', String(articleIndex));
      const body = newPage.querySelector('.page-body');
      if (body) body.innerHTML = '';
      return newPage;
    }

    function paginateArticle(articleEl) {
      const articleIndex = Number.parseInt(articleEl.getAttribute('data-article-index') || '0', 10) || 0;
      const firstPage = articleEl.querySelector('.page[data-article-index="' + articleIndex + '"]') || articleEl.querySelector('.page');
      if (!firstPage) return;
      const templatePage = firstPage;
      const maxIterations = 50;

      let currentPage = firstPage;
      for (let iter = 0; iter < maxIterations; iter++) {
        const body = currentPage.querySelector('.page-body');
        if (!body) break;

        if (currentPage.scrollHeight <= currentPage.clientHeight + 1) break;

        const blocks = Array.from(body.children);
        if (blocks.length <= 1) break;

        const nextPage = createPageForArticle(articleIndex, templatePage);
        const nextBody = nextPage.querySelector('.page-body');
        if (!nextBody) break;

        for (let moveGuard = 0; moveGuard < 200; moveGuard++) {
          if (currentPage.scrollHeight <= currentPage.clientHeight + 1) break;
          const last = body.lastElementChild;
          if (!last) break;
          nextBody.insertBefore(last, nextBody.firstChild);
          if (body.children.length <= 1) break;
        }

        articleEl.appendChild(nextPage);
        currentPage = nextPage;
      }
    }

    function applyPrintCss() {
      const style = document.createElement('style');
      style.textContent =
        '@page { size: A4; margin: 0; }\\n' +
        'html, body { margin: 0; padding: 0; }\\n' +
        '.article { break-after: page; }\\n' +
        '.page {\\n' +
        '  width: 210mm;\\n' +
        '  height: 297mm;\\n' +
        '  box-sizing: border-box;\\n' +
        '  padding: 12mm 15mm;\\n' +
        '  margin: 0 auto 10mm auto;\\n' +
        '  background: white;\\n' +
        '  position: relative;\\n' +
        '  overflow: hidden;\\n' +
        '  display: flex;\\n' +
        '  flex-direction: column;\\n' +
        '}\\n' +
        '.page-header { flex: 0 0 auto; }\\n' +
        '.page-body { flex: 1 1 auto; min-height: 0; }\\n' +
        '@media print {\\n' +
        '  body { background: white; }\\n' +
        '  .page { margin: 0; break-after: page; box-shadow: none; overflow: visible !important; }\\n' +
        '}\\n';
      document.head.appendChild(style);
    }

    window.addEventListener('load', function() {
      applyPrintCss();
      const articles = Array.from(document.querySelectorAll('.article'));
      articles.forEach(paginateArticle);
    });
  })();
</script>
`;

export const DRAFT_SYSTEM_PROMPT = `
You generate structured worksheet content as JSON only. Do NOT output HTML.

Return a single JSON object matching this TypeScript-like schema:
{
  "articles": Array<{
    "title": string,
    "cefrLevel": "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|string,
    "paragraphs": string[],
    "toolkit"?: Array<{ 
      "title": string, 
      "items": Array<{ 
        "word": string, 
        "phonetic"?: string, 
        "pos"?: string, 
        "meaning": string 
      }> 
    }>,
    "grammarPoints"?: Array<{
      "title": string,
      "explanation": string,
      "example": string
    }>,
    "goldenSentences"?: Array<{
      "sentence": string,
      "translation": string
    }>,
    "exercises"?: Array<{
      "type": "mcq"|"blank"|"true_false"|"short_answer",
      "prompt": string,
      "options"?: Array<{ "label": "A"|"B"|"C"|"D"|string, "text": string }>
    }>,
    "coverImageLayout"?: "banner"|"side"|"inline"
  }>
}

Hard rules:
1) articles.length must equal the requested articleCount exactly.
2) Each article.cefrLevel must match the requested CEFR for that article exactly.
3) If showLanguageToolkit is false, omit toolkit, grammarPoints, and goldenSentences entirely.
4) If showLanguageToolkit is true, you MUST include ALL THREE sub-modules with NON-EMPTY arrays:
   - "toolkit": must contain at least 1 group with vocabulary items
   - "grammarPoints": must contain 2-3 grammar points
   - "goldenSentences": must contain 2-3 sentences
   NEVER return empty arrays or omit these fields when Language Toolkit is enabled.
5) If showExercises is false, omit exercises entirely.
6) Do not include any fields outside the schema. Output must be valid JSON, no markdown fences.

Language Toolkit Requirements (when enabled):
- The toolkit consists of THREE sub-modules: Vocabulary Analysis, Grammar Points, and Golden Sentences.
- Vocabulary Analysis: Include key words and phrases from the article.
  - For single words: include word, phonetic transcription (IPA), part of speech, and Chinese translation.
    Example: { "word": "legacy", "phonetic": "/ˈleɡəsi/", "pos": "n.", "meaning": "遗产；遗留物" }
  - For phrases/chunks (2+ words): include phrase, part of speech, and Chinese translation. OMIT phonetic field.
    Example: { "word": "boost tourism", "pos": "v. phrase", "meaning": "促进旅游业" }
    Example: { "word": "ski resort", "pos": "n. phrase", "meaning": "滑雪度假村" }
- Group vocabulary by categories (e.g., "Key Vocabulary", "Useful Phrases").

Grammar Points Requirements (when enabled):
- EXTRACT 2-3 key grammar points FROM THE GENERATED ARTICLE CONTENT.
- Analyze the article paragraphs and identify actual grammar structures used in the text.
- CRITICAL: The example sentence MUST ACTUALLY USE the grammar structure being explained.
- For example:
  - If explaining "There be" structure, the example MUST contain "There is/are/was/were..."
  - If explaining "Comparative Adjectives", the example MUST contain comparative forms like "-er" or "more + adj"
  - If explaining "Passive Voice", the example MUST contain "be + past participle" structure
- DO NOT force a grammar point if the article doesn't contain clear examples of it.
- It's better to have fewer accurate grammar points than incorrect ones.
- Format: { "title": "语法名称", "explanation": "中文解释", "example": "必须使用文章中包含该语法的原句" }

Golden Sentences Requirements (when enabled):
- EXTRACT 2-3 excellent sentences DIRECTLY FROM THE GENERATED ARTICLE.
- Choose sentences that are well-written, meaningful, or demonstrate good language use.
- Each MUST be an exact quote from the article with Chinese translation.
- Format: { "sentence": "Exact sentence from article", "translation": "中文翻译" }

Exercise Requirements (when enabled):
- Each article MUST have at least 5 exercises (minimum 5 questions).
- Group questions by type: arrange same-type questions consecutively (e.g., all MCQs together, then all T/F questions).
- Suggested order: MCQs first (1-3), then True/False (4-5), then Blank Filling (6-7), then Short Answer (8+).
- Questions should test comprehension of the article content.

Exercise Layout Requirements:
- Exercises MUST use a 2-column grid layout that fills the entire width.
- Each question card should have consistent height and fill the grid cell completely.
- Do NOT leave empty space on the right side - ensure both columns are equally filled.
- Use CSS: display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
- Each question should be in a card with border and padding, taking full width of its grid cell.
`;

export const DRAFT_USER_PROMPT_TEMPLATE = (params: {
  text: string;
  articleCount: number;
  articles?: ArticleConfig[];
  studentGrade: string;
  cefrLevel: string;
  grammarDifficulty: string;
  showExercises: boolean;
  showLanguageToolkit: boolean;
  showCoverImage: boolean;
}) => {
  const {
    text,
    articleCount,
    articles,
    studentGrade,
    cefrLevel,
    grammarDifficulty,
    showExercises,
    showLanguageToolkit,
    showCoverImage,
  } = params;

  const formatTenses = (tenses?: string[]) => {
    if (!tenses || tenses.length === 0) return 'mixed';
    const tenseMap: Record<string, string> = {
      'present_simple': '一般现在时',
      'past_simple': '一般过去时',
      'future_simple': '一般将来时',
      'present_continuous': '现在进行时',
      'past_continuous': '过去进行时',
      'present_perfect': '现在完成时',
      'past_perfect': '过去完成时',
      'mixed': '混合时态',
    };
    return tenses.map(t => tenseMap[t] || t).join(', ');
  };

  const perArticle =
    articleCount > 1 && articles && articles.length > 0
      ? articles
          .slice(0, articleCount)
          .map((a, idx) => {
            let config = `- Article ${idx + 1}: Grade ${a.grade}, CEFR ${a.cefrLevel}, Grammar ${a.grammarDifficulty}`;
            if (a.enableWordCount) {
              const min = Math.round((a.targetWordCount || 300) * (1 - (a.wordCountTolerance || 20) / 100));
              const max = Math.round((a.targetWordCount || 300) * (1 + (a.wordCountTolerance || 20) / 100));
              config += `, Word Count: ${min}-${max} words`;
            }
            if (a.enableTenseControl && a.selectedTenses && a.selectedTenses.length > 0) {
              config += `, Tense: ${formatTenses(a.selectedTenses)}`;
            }
            return config;
          })
          .join('\n')
      : `- Grade: ${studentGrade}\n- CEFR: ${cefrLevel}\n- Grammar: ${grammarDifficulty}`;

  return `
Source Text:
${text}

Requested Articles:
${perArticle}

Visibility:
- Cover Image: ${showCoverImage ? 'ON (choose layout banner/side/inline)' : 'OFF'}
- Language Toolkit: ${showLanguageToolkit ? 'ON (MUST include vocabulary, grammar points, and golden sentences)' : 'OFF'}
- Exercises: ${showExercises ? 'ON' : 'OFF'}

CRITICAL REQUIREMENT for Language Toolkit:
When Language Toolkit is ON, you MUST generate ALL THREE sub-modules in the JSON output:
1. "toolkit" - Array of vocabulary groups with words/phrases
2. "grammarPoints" - Array of 2-3 grammar points with title, explanation, example
3. "goldenSentences" - Array of 2-3 sentences with translation

DO NOT omit grammarPoints or goldenSentences. All three fields must be present and non-empty.

Quality:
- Keep paragraphs clear and coherent; do not truncate.
- If the text is short, keep paragraphs concise.
- If the text is long, keep logical paragraph breaks.

Now output JSON only.
`;
};

export const USER_PROMPT_TEMPLATE = (
  text: string, 
  grade: string, 
  cefr: string, 
  difficulty: string, 
  imageUrl?: string,
  paperSize: 'a4' | 'a3' = 'a4',
  orientation: 'portrait' | 'landscape' = 'portrait',
  articleCount: number = 1,
  articles?: ArticleConfig[],
  showCoverImage: boolean = true,
  showExercises: boolean = true,
  showLanguageToolkit: boolean = true,
  showGrammarSection: boolean = true,
  showGoldenSentences: boolean = true
) => {
  let articleInstructions = '';
  
  if (articleCount > 1 && articles && articles.length > 0) {
    articleInstructions = `\nDetailed Configuration per Article:\n`;
    articles.slice(0, articleCount).forEach((art, index) => {
      articleInstructions += `- Article ${index + 1}: Grade ${art.grade}, CEFR ${art.cefrLevel}, Grammar ${art.grammarDifficulty}`;
      if (art.enableWordCount) {
        const min = Math.round((art.targetWordCount || 300) * (1 - (art.wordCountTolerance || 20) / 100));
        const max = Math.round((art.targetWordCount || 300) * (1 + (art.wordCountTolerance || 20) / 100));
        articleInstructions += `, Word Count: ${min}-${max} words`;
      }
      articleInstructions += '\n';
    });
    articleInstructions += `\nPlease generate ${articleCount} distinct articles/worksheets in the same HTML file, separated by page breaks. Each article should follow its specific configuration above.\n`;
  } else {
    articleInstructions = `- Target Student Grade: ${grade}\n- Base CEFR Level: ${cefr}\n- Grammar Difficulty: ${difficulty}\n`;
    articleInstructions += `\n**IMPORTANT**: Generate ONLY ONE article version matching exactly the CEFR ${cefr} level requested. Do NOT generate multiple levels (e.g. A1, A2) unless explicitly requested. The Top-Right Badge MUST display "${cefr} LEVEL".\n`;
  }

  // Construct Visibility Instructions
  let visibilityInstructions = `
Visibility Settings (APPLY TO ALL ARTICLES/PAGES):
- Cover Image: ${showCoverImage ? 'INCLUDE (If image provided)' : 'OMIT (DO NOT generate any cover image)'}
- Post-Reading Exercises: ${showExercises ? 'INCLUDE' : 'OMIT (DO NOT generate any exercises)'}
- Language Toolkit (Vocab/Grammar): ${showLanguageToolkit ? 'INCLUDE' : 'OMIT (DO NOT generate any toolkit)'}
- Grammar Points Section: ${showGrammarSection ? 'INCLUDE' : 'OMIT (DO NOT generate grammar section)'}
- Golden Sentences Section: ${showGoldenSentences ? 'INCLUDE' : 'OMIT (DO NOT generate golden sentences)'}
`;

  // Remove Image URL from config if hidden
  const coverImageConfig = (showCoverImage && imageUrl) ? `- Cover Image URL: ${imageUrl}` : '';

  // Toolkit Layout Instruction
  let toolkitInstructions = showLanguageToolkit ? `
- **Language Toolkit Layout**: Use a 2-column grid layout (CSS grid-cols-2) to save vertical space.
- Each vocabulary item should display: word + phonetic + part of speech + Chinese meaning.
` : '';

  // Exercise Layout Instruction
  let exerciseInstructions = showExercises ? `
- **Exercise Layout CRITICAL**: Use a 2-column grid that fills the ENTIRE width. 
- CSS: display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
- Each question card must fill its grid cell completely - NO empty space on the right.
- Group questions by type: all MCQs together, then all T/F, then blank filling, then short answer.
- Number questions sequentially without gaps.
` : '';

  // Paragraph Indentation Instruction
  let indentationInstructions = `
- **Paragraph Indentation**: Use CSS \`text-indent: 2em;\` for all paragraphs. Do NOT use non-breaking spaces (&nbsp;) or explicit numbers/symbols for indentation.
`;

  return `
Original Text:
${text}

Configuration:
${articleInstructions}
${coverImageConfig}
${visibilityInstructions}

Layout Requirements:
- Paper Size: ${paperSize.toUpperCase()} (${paperSize === 'a4' ? '210mm x 297mm' : '297mm x 420mm'})
- Orientation: ${orientation}
- Number of Articles: ${articleCount}

Design Constraints:
- Output must be a single HTML file for printing to PDF.
- **Do NOT clip content**: Avoid \`overflow:hidden\` that causes truncation in the final PDF. If a page is full, continue on the next printed page.
- **Pagination rule**: If the text is short, keep it on one page and make it look balanced; if the text is long, naturally continue across multiple pages. Do NOT force it into one page by shrinking fonts or cutting sections.
- Use \`.article\` sections with \`data-article-index\` and \`.page\` containers with matching \`data-article-index\` so that the client-side pagination script can auto-split content.
- Use CSS Flexbox/Grid to distribute content evenly within a page, but never at the cost of content loss.
${showCoverImage && imageUrl ? `- Cover Image Layout: You MAY place the cover image as a banner, side image, or small inline image depending on available space. Prefer layouts that do not push content onto extra pages. If you use an image, include \`<img src="${imageUrl}" class="hero-img" />\` within the article's first page.` : '- **MANDATORY**: DO NOT include any <img> tags for cover images.'}
${toolkitInstructions}
${exerciseInstructions}
${indentationInstructions}
- Ensure all text is visible and legible.

Please generate the HTML worksheet now.
`;
};

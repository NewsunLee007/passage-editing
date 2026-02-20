import { DraftArticle, WorksheetDraft } from '../types';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeLevel = (level: string) => (level || 'A1').trim().toUpperCase();

const countWords = (text: string) => (text || '').trim().split(/\s+/).filter(Boolean).length;

const chooseCoverLayout = (article: DraftArticle, showExercises: boolean, showToolkit: boolean) => {
  // Always use banner layout for consistent full-width display
  return 'banner';
};

const renderMetaRow = (level: string) => `
  <div class="meta-row">
    <div class="meta-item" data-key="name"><span class="meta-label">Name:</span><span class="meta-line"></span></div>
    <div class="meta-item" data-key="date"><span class="meta-label">Date:</span><span class="meta-line"></span></div>
    <div class="meta-item" data-key="score"><span class="meta-label">Score:</span><span class="meta-line"></span><span class="meta-suffix">/10</span></div>
    <div class="level-badge-inline" data-level-badge="true">${level} LEVEL</div>
  </div>
`;

const renderToolkit = (article: DraftArticle) => {
  const groups = article.toolkit || [];
  if (groups.length === 0) {
    return `
      <section class="toolkit" data-section="language-toolkit">
        <div class="toolkit-grid">
          <div class="toolkit-card">
            <div class="toolkit-card-title">Key Items</div>
            <ul class="toolkit-list">
              <li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>
              <li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>
              <li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>
            </ul>
          </div>
          <div class="toolkit-card">
            <div class="toolkit-card-title">Key Phrases</div>
            <ul class="toolkit-list">
              <li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>
              <li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>
              <li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  const cards = groups.slice(0, 6).map((g) => {
    const items = (g.items || []).slice(0, 12);
    const lis = items.length
      ? items
          .map((it) => {
            // Handle new format: word, phonetic, pos, meaning
            const word = escapeHtml(it.word || '');
            const phonetic = escapeHtml(it.phonetic || '');
            // Remove 'phrase' from pos to avoid redundancy (e.g., 'n. phrase' -> 'n.')
            const pos = escapeHtml((it.pos || '').replace(/\s*phrase\s*/gi, '').trim());
            const meaning = escapeHtml(it.meaning || '');
            const displayWord = word + (phonetic ? ` ${phonetic}` : '') + (pos ? ` ${pos}` : '');
            return `<li class="toolkit-li"><span class="toolkit-left">${displayWord || '&nbsp;'}</span><span class="toolkit-right">${meaning || '&nbsp;'}</span></li>`;
          })
          .join('')
      : `<li class="toolkit-li"><span class="toolkit-left">&nbsp;</span><span class="toolkit-right">&nbsp;</span></li>`;
    return `
      <div class="toolkit-card">
        <div class="toolkit-card-title">${escapeHtml(g.title || 'Toolkit')}</div>
        <ul class="toolkit-list">${lis}</ul>
      </div>
    `;
  });

  return `
    <section class="toolkit" data-section="language-toolkit">
      <div class="toolkit-grid">
        ${cards.join('')}
      </div>
    </section>
  `;
};

const renderGrammarAndGolden = (article: DraftArticle) => {
  const points = article.grammarPoints || [];
  const sentences = article.goldenSentences || [];
  
  if (points.length === 0 && sentences.length === 0) return '';

  const grammarItems = points.map((p, idx) => `
    <div class="grammar-item">
      <div class="grammar-title">${idx + 1}. ${escapeHtml(p.title || '')}</div>
      <div class="grammar-explanation">${escapeHtml(p.explanation || '')}</div>
      <div class="grammar-example">${escapeHtml(p.example || '')}</div>
    </div>
  `).join('');

  const goldenItems = sentences.map((s, idx) => `
    <div class="golden-item">
      <div class="golden-number">${idx + 1}</div>
      <div class="golden-content">
        <div class="golden-sentence">${escapeHtml(s.sentence || '')}</div>
        <div class="golden-translation">${escapeHtml(s.translation || '')}</div>
      </div>
    </div>
  `).join('');

  return `
    <section class="grammar-golden-section" data-section="grammar-golden">
      <div class="grammar-golden-grid">
        ${points.length > 0 ? `
          <div class="grammar-column">
            <div class="column-title">Grammar Points</div>
            <div class="grammar-list">
              ${grammarItems}
            </div>
          </div>
        ` : ''}
        ${sentences.length > 0 ? `
          <div class="golden-column">
            <div class="column-title">Golden Sentences</div>
            <div class="golden-list">
              ${goldenItems}
            </div>
          </div>
        ` : ''}
      </div>
    </section>
  `;
};

const renderExercises = (article: DraftArticle) => {
  const questions = article.exercises || [];
  
  // Generate question HTML
  const generateQuestionHtml = (q: typeof questions[0], idx: number) => {
    const num = idx + 1;
    const prompt = escapeHtml(q.prompt || '');
    if (q.type === 'mcq') {
      const options = (q.options || []).slice(0, 4);
      const opts = options
        .map((o) => `<div class="opt"><span class="opt-label">${escapeHtml(o.label)}</span><span class="opt-text">${escapeHtml(o.text)}</span></div>`)
        .join('');
      return `
        <div class="q">
          <div class="q-title"><span class="q-num">Q${num}.</span><span class="q-text">${prompt}</span></div>
          <div class="opts">${opts}</div>
        </div>
      `;
    }
    if (q.type === 'true_false') {
      return `
        <div class="q">
          <div class="q-title"><span class="q-num">Q${num}.</span><span class="q-text">${prompt}</span></div>
          <div class="tf"><span class="box"></span> True <span class="box"></span> False</div>
        </div>
      `;
    }
    if (q.type === 'blank') {
      return `
        <div class="q">
          <div class="q-title"><span class="q-num">Q${num}.</span><span class="q-text">${prompt}</span></div>
          <div class="line"></div>
        </div>
      `;
    }
    return `
      <div class="q">
        <div class="q-title"><span class="q-num">Q${num}.</span><span class="q-text">${prompt}</span></div>
        <div class="lines">
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </div>
    `;
  };
  
  // Split questions into two columns for better layout
  const leftQuestions: string[] = [];
  const rightQuestions: string[] = [];
  
  if (questions.length > 0) {
    // Distribute questions evenly between left and right columns
    questions.forEach((q, idx) => {
      const html = generateQuestionHtml(q, idx);
      if (idx % 2 === 0) {
        leftQuestions.push(html);
      } else {
        rightQuestions.push(html);
      }
    });
  } else {
    // Placeholder when no questions
    leftQuestions.push(`
      <div class="q">
        <div class="q-title"><span class="q-num">Q1.</span><span class="q-text">&nbsp;</span></div>
        <div class="line"></div>
      </div>
    `);
  }

  return `
    <section class="exercises" data-section="exercises">
      <h3 class="section-title">Exercises</h3>
      <div class="exercise-grid">
        <div class="exercise-col">
          ${leftQuestions.join('')}
        </div>
        <div class="exercise-col">
          ${rightQuestions.join('')}
        </div>
      </div>
    </section>
  `;
};

const renderArticleFirstPage = (params: {
  article: DraftArticle;
  articleIndex: number;
  imageUrl?: string;
  showExercises: boolean;
  showLanguageToolkit: boolean;
}) => {
  const { article, articleIndex, imageUrl, showExercises, showLanguageToolkit } = params;
  // Use per-article showCoverImage setting, default to true if not set
  const articleShowCoverImage = article.showCoverImage !== false;
  const level = normalizeLevel(article.cefrLevel);
  const title = escapeHtml(article.title || 'Untitled');
  const layout = articleShowCoverImage && imageUrl ? chooseCoverLayout(article, showExercises, showLanguageToolkit) : null;

  const paragraphs = (article.paragraphs || []).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join('');

  const cover =
    articleShowCoverImage && imageUrl
      ? layout === 'side'
        ? `<div class="cover cover-side"><img class="hero-img" alt="Cover" src="${escapeHtml(imageUrl)}" /></div>`
        : layout === 'inline'
          ? `<div class="cover cover-inline"><img class="hero-img" alt="Cover" src="${escapeHtml(imageUrl)}" /></div>`
          : `<div class="cover cover-banner"><img class="hero-img" alt="Cover" src="${escapeHtml(imageUrl)}" /></div>`
      : '';

  const toolkit = showLanguageToolkit ? renderToolkit(article) : '';
  const grammarAndGolden = showLanguageToolkit ? renderGrammarAndGolden(article) : '';
  const exercises = showExercises ? renderExercises(article) : '';

  // Get per-article layout settings with defaults
  const articleLineHeight = article.lineHeight ?? 1.2;
  const articleFontSize = article.fontSize ?? 14;
  const articleImagePositionY = article.imagePositionY ?? 20;
  const articlePagePadding = article.pagePadding ?? 0;
  const articleParagraphSpacing = article.paragraphSpacing ?? 8;

  return `
    <section class="article" data-article-index="${articleIndex}">
      <div class="page" data-article-index="${articleIndex}" style="padding: ${articlePagePadding}mm;">
        <div class="page-header">
          ${renderMetaRow(level)}
          <h1 class="title">${title}</h1>
        </div>
        <div class="page-body" style="line-height: ${articleLineHeight}; font-size: ${articleFontSize}px;">
          ${cover ? cover.replace('hero-img', `hero-img" style="object-position: center ${articleImagePositionY}%;`) : ''}
          <section class="reading" data-section="reading" style="line-height: ${articleLineHeight}; font-size: ${articleFontSize}px;">
            ${(article.paragraphs || []).map((p) => `<p style="margin-bottom: ${articleParagraphSpacing}px; line-height: ${articleLineHeight}; font-size: ${articleFontSize}px;">${escapeHtml(p)}</p>`).join('') || `<p style="margin-bottom: ${articleParagraphSpacing}px;">&nbsp;</p>`}
          </section>
          ${toolkit}
          ${grammarAndGolden}
          ${exercises}
        </div>
      </div>
    </section>
  `;
};

const PAGINATION_SCRIPT = `
<script>
  (function() {
    function createPageForArticle(articleIndex, templatePage) {
      var newPage = templatePage.cloneNode(true);
      newPage.setAttribute('data-article-index', String(articleIndex));
      var body = newPage.querySelector('.page-body');
      if (body) body.innerHTML = '';
      return newPage;
    }
    function paginateArticle(articleEl) {
      var articleIndex = parseInt(articleEl.getAttribute('data-article-index') || '0', 10) || 0;
      var firstPage = articleEl.querySelector('.page[data-article-index="' + articleIndex + '"]') || articleEl.querySelector('.page');
      if (!firstPage) return;
      var templatePage = firstPage;
      var maxIterations = 60;
      var currentPage = firstPage;
      for (var iter = 0; iter < maxIterations; iter++) {
        var body = currentPage.querySelector('.page-body');
        if (!body) break;
        if (currentPage.scrollHeight <= currentPage.clientHeight + 1) break;
        var blocks = Array.prototype.slice.call(body.children);
        if (blocks.length <= 1) break;
        var nextPage = createPageForArticle(articleIndex, templatePage);
        var nextBody = nextPage.querySelector('.page-body');
        if (!nextBody) break;
        for (var moveGuard = 0; moveGuard < 240; moveGuard++) {
          if (currentPage.scrollHeight <= currentPage.clientHeight + 1) break;
          var last = body.lastElementChild;
          if (!last) break;
          nextBody.insertBefore(last, nextBody.firstChild);
          if (body.children.length <= 1) break;
        }
        articleEl.appendChild(nextPage);
        currentPage = nextPage;
      }
    }
    function applyPrintCss() {
      var style = document.createElement('style');
      style.textContent =
        '@page { margin: 0; }\\n' +
        'html, body { margin: 0; padding: 0; }\\n' +
        '.page { break-after: page; }\\n' +
        '@media print { body { background: white; } .page { margin: 0; box-shadow: none; overflow: visible !important; } }\\n';
      document.head.appendChild(style);
    }
    window.addEventListener('load', function() {
      applyPrintCss();
      var articles = Array.prototype.slice.call(document.querySelectorAll('.article'));
      articles.forEach(paginateArticle);
    });
  })();
</script>
`;

export function renderWorksheetHtml(params: {
  draft: WorksheetDraft;
  paperSize: 'a4' | 'a3';
  orientation: 'portrait' | 'landscape';
  imageUrl?: string;
  showExercises: boolean;
  showLanguageToolkit: boolean;
}): string {
  const { draft, paperSize, orientation, imageUrl, showExercises, showLanguageToolkit } = params;
  const width = paperSize === 'a3' ? 297 : 210;
  const height = paperSize === 'a3' ? 420 : 297;
  const pageW = orientation === 'landscape' ? height : width;
  const pageH = orientation === 'landscape' ? width : height;

  const articles = (draft.articles || []).map((a, idx) =>
    renderArticleFirstPage({
      article: a,
      articleIndex: idx,
      imageUrl,
      showExercises,
      showLanguageToolkit,
    })
  );

  const css = `
    :root { --page-w: ${pageW}mm; --page-h: ${pageH}mm; --pad-x: 15mm; --pad-y: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 14px; background: #f3f4f6; color: #0f172a; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
    .article { margin: 0 auto 18px auto; width: var(--page-w); }
    .page { width: var(--page-w); height: var(--page-h); background: #fff; padding: var(--pad-y) var(--pad-x); overflow: hidden; position: relative; border-radius: 10px; box-shadow: 0 14px 40px rgba(15, 23, 42, 0.10); display: flex; flex-direction: column; }
    .page-header { flex: 0 0 auto; }
    .page-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
    .level-badge { position: absolute; top: 10mm; right: 12mm; padding: 6px 12px; border-radius: 999px; background: #1f7a3a; color: #fff; font-weight: 800; font-size: 12px; letter-spacing: 0.04em; }
    .title { margin: 10px 0 6px 0; font-size: 26px; line-height: 1.1; font-weight: 900; letter-spacing: -0.02em; }
    p { margin: 0 0 8px 0; line-height: 1.55; font-size: 14px; text-indent: 2em; }
    .meta-row{display:flex;gap:12px;align-items:flex-end;justify-content:space-between;flex-wrap:nowrap}
    .meta-item{flex:1;min-width:0;display:flex;gap:8px;align-items:flex-end;white-space:nowrap}
    .meta-item[data-key="score"]{flex:0 0 160px;justify-content:flex-end}
    .meta-label{font-weight:800}
    .meta-line{flex:1;min-width:60px;border-bottom:2px solid rgba(15,23,42,.55);height:1.05em}
    .meta-suffix{font-weight:700;margin-left:6px}
    .level-badge-inline{flex:0 0 auto;padding:4px 10px;border-radius:999px;background:#1f7a3a;color:#fff;font-weight:800;font-size:11px;letter-spacing:0.04em;white-space:nowrap}
    .cover { border-radius: 12px; overflow: hidden; background: #eef2ff; }
    .hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; display: block; }
    .cover-banner { height: 90px; }
    .cover-inline { height: 70px; }
    .cover-side { float: right; width: 42%; height: 120px; margin: 0 0 8px 12px; }
    .reading { }
    .section-title { margin: 2px 0 6px 0; font-size: 14px; font-weight: 900; text-transform: none; letter-spacing: 0.01em; color: #334155; }
    .toolkit { border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .toolkit-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .toolkit-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #f8fafc; }
    .toolkit-card-title { font-size: 12px; font-weight: 900; color: #0f172a; margin-bottom: 6px; }
    .toolkit-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
    .toolkit-li { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: #0f172a; }
    .toolkit-left { font-weight: 700; }
    .toolkit-right { color: #475569; text-align: right; }
    .exercises { border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .exercise-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: start; }
    .exercise-col { display: flex; flex-direction: column; gap: 10px; }
    .q { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #fff; }
    .q-title { display: flex; gap: 8px; align-items: baseline; font-size: 12px; }
    .q-num { font-weight: 900; color: #0f172a; }
    .q-text { color: #0f172a; }
    .opts { margin-top: 8px; display: grid; gap: 6px; }
    .opt { display: flex; gap: 8px; font-size: 12px; color: #334155; }
    .opt-label { width: 18px; font-weight: 900; }
    .tf { margin-top: 8px; display: flex; gap: 12px; align-items: center; font-size: 12px; color: #334155; }
    .box { width: 12px; height: 12px; border: 1px solid #94a3b8; border-radius: 3px; display: inline-block; }
    .line { margin-top: 10px; border-bottom: 2px solid rgba(15,23,42,.45); height: 14px; }
    .lines { display: grid; gap: 8px; margin-top: 8px; }
    .grammar-golden-section { border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .grammar-golden-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .grammar-column { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #faf5ff; }
    .golden-column { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #fffbeb; }
    .column-title { font-size: 12px; font-weight: 900; color: #0f172a; margin-bottom: 8px; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 6px; }
    .grammar-list { display: grid; gap: 8px; }
    .grammar-item { border: 1px solid rgba(107, 33, 168, 0.2); border-radius: 8px; padding: 8px; background: rgba(255,255,255,0.5); }
    .grammar-title { font-size: 11px; font-weight: 900; color: #6b21a8; margin-bottom: 3px; }
    .grammar-explanation { font-size: 10px; color: #334155; margin-bottom: 3px; }
    .grammar-example { font-size: 10px; color: #475569; font-style: italic; }
    .golden-list { display: grid; gap: 8px; }
    .golden-item { display: flex; gap: 8px; border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 8px; background: rgba(255,255,255,0.5); }
    .golden-number { width: 20px; height: 20px; border-radius: 50%; background: #f59e0b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; flex-shrink: 0; }
    .golden-content { flex: 1; }
    .golden-sentence { font-size: 11px; color: #0f172a; font-weight: 600; margin-bottom: 2px; }
    .golden-translation { font-size: 10px; color: #475569; }
    @media print {
      body { background: #fff; padding: 0; }
      .page { border-radius: 0; box-shadow: none; }
    }
  `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Worksheet</title>
    <style>${css}</style>
  </head>
  <body>
    ${articles.join('')}
    ${PAGINATION_SCRIPT}
  </body>
</html>`;
}


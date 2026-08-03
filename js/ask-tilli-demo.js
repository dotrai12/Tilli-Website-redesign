/* ═══════════════════════════════════════════════════════════════════════
   ASK-TILLI · LIVE DEMO  (js/ask-tilli-demo.js)
   ------------------------------------------------------------------------
   Powers the interactive "Ask Tilli anything about your school" section.
   Everything here is a scripted stand-in so the experience is testable on a
   static host with NO API key. Two things a developer will care about:

     1. window.AskTilli.school   — the dummy dataset. Swap in real data.
     2. window.AskTilli.respond  — THE SEAM. Currently returns scripted,
        keyword-matched answers. Replace its body with a fetch() to your
        own backend/LLM endpoint (must return a Promise<string>; HTML is
        allowed, e.g. <b>…</b>). Nothing else needs to change — the UI just
        awaits whatever this resolves to.

   Config knobs (window.AskTilli):
     maxPrompts  how many questions a visitor gets           (default 2)
     maxChars    character cap on the input box              (default 220)
     minThink / maxThink   typing-indicator delay window, ms
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Dummy dataset — a developer replaces this with the real school ──── */
  const school = {
    name: 'Sunrise Academy',
    grades: ['Pre-K', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
    studentsPerClass: 15,
    get totalStudents() { return this.grades.length * this.studentsPerClass; },
    // one illustrative snapshot per grade
    snapshots: {
      'Pre-K':   { focus: 'emotional regulation', strong: 'empathy',              child: 'Aanya',  note: 'settling into routines; big feelings peak after lunch.' },
      'Grade 1': { focus: 'attention',            strong: 'empathy',              child: 'Kabir',  note: 'attention dips in the last period; mornings are strongest.' },
      'Grade 2': { focus: 'attention',            strong: 'working memory',       child: 'Meera',  note: 'the class needs the most support with sustained focus.' },
      'Grade 3': { focus: 'self-control',         strong: 'cognitive flexibility',child: 'Rehan',  note: 'quick to switch tasks, but interrupts during group work.' },
      'Grade 4': { focus: 'planning',             strong: 'attention',            child: 'Isha',   note: 'strong focus; needs scaffolding to plan multi-step tasks.' },
      'Grade 5': { focus: 'working memory',       strong: 'planning',             child: 'Dhruv',  note: 'attention at Learner, working memory at Expert — leads recall well.' }
    },
    // 12 skills Tilli measures (for skill-specific questions)
    skills: ['attention', 'working memory', 'cognitive flexibility', 'inhibition',
             'self-control', 'planning', 'organisation', 'empathy', 'emotional regulation',
             'social awareness', 'perseverance', 'self-awareness']
  };

  /* ── Tiny language detector ─────────────────────────────────────────────
     Good enough for a demo: Unicode-script blocks first, then a few keyword
     sets for Latin-script languages. Returns a short code used to pick a
     translated answer (falls back to 'en'). */
  function detectLang(t) {
    if (/[ऀ-ॿ]/.test(t)) return 'hi';   // Devanagari → Hindi
    if (/[஀-௿]/.test(t)) return 'ta';   // Tamil
    if (/[؀-ۿ]/.test(t)) return 'ar';   // Arabic
    const s = ' ' + t.toLowerCase() + ' ';
    if (/(\bhola\b|cuánto|cuantos|cuántos|niños|escuela|grado|cómo|qué\b|gracias)/.test(s)) return 'es';
    if (/(bonjour|combien|élèves|eleves|école|ecole|quelle|comment|merci|classe\b)/.test(s)) return 'fr';
    if (/(hallo|wie viele|schüler|schule|klasse|danke)/.test(s)) return 'de';
    return 'en';
  }

  /* Pick the right translation for an intent, English as the safety net. */
  const pick = (obj, lang) => obj[lang] || obj.en;

  /* ── Scripted answer bank (the part a real LLM would replace) ─────────── */
  function scriptedAnswer(raw, lang) {
    const q = raw.toLowerCase();
    const has = (...w) => w.some((x) => q.includes(x));

    // greeting
    if (has('hello', 'hi ', 'hey', 'namaste', 'hola', 'bonjour', 'hallo') && q.length < 24) {
      return pick({
        en: `Hi! I'm Ask-Tilli for <b>${school.name}</b>. Ask me about a grade, a class, a skill, or a child.`,
        es: `¡Hola! Soy Ask-Tilli de <b>${school.name}</b>. Pregúntame por un grado, una clase, una habilidad o un niño.`,
        fr: `Bonjour ! Je suis Ask-Tilli pour <b>${school.name}</b>. Posez-moi une question sur une classe, une compétence ou un enfant.`,
        hi: `नमस्ते! मैं <b>${school.name}</b> के लिए Ask-Tilli हूँ। किसी कक्षा, कौशल या बच्चे के बारे में पूछें।`
      }, lang);
    }

    // how many students / total
    if (has('how many', 'number of', 'total', 'cuánto', 'cuantos', 'combien', 'wie viele', 'कितने') &&
        has('student', 'kid', 'child', 'children', 'niñ', 'élève', 'eleve', 'schüler', 'बच्च', 'छात्र')) {
      return pick({
        en: `<b>${school.name}</b> has <b>${school.totalStudents} students</b> — ${school.grades.length} grades (Pre-K to Grade 5), with ${school.studentsPerClass} children in each class.`,
        es: `<b>${school.name}</b> tiene <b>${school.totalStudents} estudiantes</b>: ${school.grades.length} grados (Pre-K a Grado 5), con ${school.studentsPerClass} niños por clase.`,
        fr: `<b>${school.name}</b> compte <b>${school.totalStudents} élèves</b> : ${school.grades.length} niveaux (de Pre-K au Grade 5), avec ${school.studentsPerClass} enfants par classe.`,
        hi: `<b>${school.name}</b> में <b>${school.totalStudents} छात्र</b> हैं — ${school.grades.length} कक्षाएँ (Pre-K से Grade 5), हर कक्षा में ${school.studentsPerClass} बच्चे।`
      }, lang);
    }

    // grades / classes overview
    if (has('grade', 'grades', 'class', 'classes', 'grado', 'classe', 'klasse', 'कक्षा') &&
        !school.grades.some((g) => q.includes(g.toLowerCase()))) {
      return pick({
        en: `${school.name} runs <b>${school.grades.length} grades</b>: ${school.grades.join(', ')}. Each is a single class of ${school.studentsPerClass}. Want a snapshot of a specific grade?`,
        es: `${school.name} tiene <b>${school.grades.length} grados</b>: ${school.grades.join(', ')}. Cada uno es una clase de ${school.studentsPerClass}. ¿Quieres ver un grado en detalle?`,
        fr: `${school.name} compte <b>${school.grades.length} niveaux</b> : ${school.grades.join(', ')}. Chacun est une classe de ${school.studentsPerClass}. Voulez-vous le détail d'un niveau ?`,
        hi: `${school.name} में <b>${school.grades.length} कक्षाएँ</b> हैं: ${school.grades.join(', ')}। हर कक्षा में ${school.studentsPerClass} बच्चे। किसी कक्षा का विवरण चाहिए?`
      }, lang);
    }

    // a specific grade named?
    const namedGrade = school.grades.find((g) => q.includes(g.toLowerCase()) ||
      (g === 'Pre-K' && has('pre-k', 'prek', 'pre k', 'kindergarten')));
    if (namedGrade) {
      const s = school.snapshots[namedGrade];
      return pick({
        en: `<b>${namedGrade}</b> (${school.studentsPerClass} children): strongest in <b>${s.strong}</b>, needs the most support with <b>${s.focus}</b>. ${cap(s.note)} A child to watch: <b>${s.child}</b>.`,
        es: `<b>${namedGrade}</b> (${school.studentsPerClass} niños): más fuerte en <b>${s.strong}</b>, necesita más apoyo en <b>${s.focus}</b>. Un niño a observar: <b>${s.child}</b>.`,
        fr: `<b>${namedGrade}</b> (${school.studentsPerClass} enfants) : plus fort en <b>${s.strong}</b>, a besoin de soutien en <b>${s.focus}</b>. Un enfant à suivre : <b>${s.child}</b>.`,
        hi: `<b>${namedGrade}</b> (${school.studentsPerClass} बच्चे): <b>${s.strong}</b> में सबसे मजबूत, <b>${s.focus}</b> में सबसे अधिक सहायता चाहिए। ध्यान देने योग्य बच्चा: <b>${s.child}</b>।`
      }, lang);
    }

    // attention / focus — which grade needs most help
    if (has('attention', 'focus', 'atención', 'concentr', 'ध्यान')) {
      const needy = Object.entries(school.snapshots).filter(([, s]) => s.focus === 'attention').map(([g]) => g);
      return pick({
        en: `Across ${school.name}, <b>${needy.join(' and ')}</b> need the most support with <b>attention</b> — focus tends to dip later in the day. Grade 2's ${school.snapshots['Grade 2'].child} is a good example. Try a 2-minute attention warm-up before group tasks.`,
        es: `En ${school.name}, <b>${needy.join(' y ')}</b> necesitan más apoyo con la <b>atención</b> — la concentración baja al final del día. Prueba un calentamiento de atención de 2 minutos antes de las tareas en grupo.`,
        fr: `À ${school.name}, <b>${needy.join(' et ')}</b> ont le plus besoin de soutien en <b>attention</b> — la concentration baisse en fin de journée. Essayez un échauffement d'attention de 2 minutes avant les activités de groupe.`,
        hi: `${school.name} में, <b>${needy.join(' और ')}</b> को <b>ध्यान</b> में सबसे अधिक सहायता चाहिए — दिन के अंत में एकाग्रता कम होती है। समूह कार्य से पहले 2 मिनट का ध्यान वार्म-अप आज़माएँ।`
      }, lang);
    }

    // any other named skill
    const namedSkill = school.skills.find((sk) => q.includes(sk.split(' ')[0]));
    if (namedSkill) {
      const cls = Object.entries(school.snapshots).find(([, s]) => s.strong === namedSkill || s.focus === namedSkill);
      const where = cls ? `${cls[0]} stands out here` : `it's tracked in every grade`;
      return `Across ${school.name}, <b>${namedSkill}</b> is one of the 12 skills Tilli measures — ${where}. On real data I'd show you each child's level (Emerging → Expert) and a suggested activity.`;
    }

    // what can you do / what is this
    if (has('what can you', 'what is tilli', 'help me', 'what do you', 'qué puedes', 'que peux')) {
      return pick({
        en: `I answer questions about ${school.name} using each child's data — grade and class summaries, individual skill levels, and what to try next. Ask about a grade, a skill like attention, or a child.`,
        es: `Respondo preguntas sobre ${school.name} usando los datos de cada niño — resúmenes por grado, niveles de habilidad y qué hacer después.`,
        fr: `Je réponds aux questions sur ${school.name} à partir des données de chaque enfant — résumés par niveau, compétences et pistes d'action.`,
        hi: `मैं ${school.name} के बारे में हर बच्चे के डेटा का उपयोग करके सवालों के जवाब देता हूँ — कक्षा सारांश, कौशल स्तर और आगे क्या करें।`
      }, lang);
    }

    // fallback — still answers in the detected language
    return pick({
      en: `In this demo I know sample data for <b>${school.name}</b> — its ${school.grades.length} grades, ${school.totalStudents} students, and the 12 skills Tilli measures. Try asking about a grade, attention, or a child like Dhruv.`,
      es: `En esta demo conozco datos de ejemplo de <b>${school.name}</b> — sus ${school.grades.length} grados, ${school.totalStudents} estudiantes y las 12 habilidades que mide Tilli. Prueba a preguntar por un grado, la atención o un niño.`,
      fr: `Dans cette démo, je connais des données d'exemple pour <b>${school.name}</b> — ses ${school.grades.length} niveaux, ${school.totalStudents} élèves et les 12 compétences mesurées par Tilli. Essayez une question sur un niveau, l'attention ou un enfant.`,
      hi: `इस डेमो में मुझे <b>${school.name}</b> का नमूना डेटा पता है — इसकी ${school.grades.length} कक्षाएँ, ${school.totalStudents} छात्र, और Tilli द्वारा मापे जाने वाले 12 कौशल। किसी कक्षा, ध्यान या किसी बच्चे के बारे में पूछें।`
    }, lang);
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ── Public config + the swappable respond() seam ───────────────────── */
  window.AskTilli = {
    school,
    maxPrompts: 2,
    maxChars: 220,
    minThink: 700,
    maxThink: 1300,

    /* DEVELOPER SEAM ----------------------------------------------------
       Replace the body below with a call to your own endpoint, e.g.:

         respond: async function (prompt, ctx) {
           const r = await fetch('/api/ask-tilli', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ prompt, lang: ctx.lang })
           });
           return (await r.json()).answer;   // HTML string
         }

       ctx = { lang } — best-guess language of the question. Return a
       Promise that resolves to the answer (plain text or simple HTML). */
    respond: function (prompt, ctx) {
      return new Promise((resolve) => resolve(scriptedAnswer(prompt, ctx.lang)));
    }
  };

  /* ── UI wiring ───────────────────────────────────────────────────────── */
  function boot() {
    const root = document.getElementById('askTilliLive');
    if (!root) return;
    const A = window.AskTilli;
    const $ = (sel) => root.querySelector(sel);
    const log     = $('[data-atl-log]');
    const hint    = $('[data-atl-hint]');
    const input   = $('[data-atl-input]');
    const sendBtn = $('[data-atl-send]');
    const micBtn  = $('[data-atl-mic]');
    const bar     = $('[data-atl-inputbar]');
    const meta    = root.querySelector('.atl-meta');
    const countEl = $('[data-atl-count]');
    const charsEl = $('[data-atl-chars]');
    const locked  = $('[data-atl-locked]');

    let used = 0;
    let busy = false;
    input.setAttribute('maxlength', String(A.maxChars));
    charsEl.textContent = `0 / ${A.maxChars}`;

    /* grow the textarea with its content, then let it scroll (CSS max-height) */
    function autosize() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    function refresh() {
      const len = input.value.length;
      charsEl.textContent = `${len} / ${A.maxChars}`;
      charsEl.classList.toggle('over', len >= A.maxChars);
      sendBtn.disabled = busy || !input.value.trim();
    }
    input.addEventListener('input', () => { autosize(); refresh(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    // let the log/textarea scroll internally without the page hijacking the wheel
    [log, input].forEach((el) => el.addEventListener('wheel', (e) => {
      const canScroll = el.scrollHeight > el.clientHeight;
      if (canScroll) e.stopPropagation();
    }, { passive: true }));

    function addMsg(cls, html) {
      const el = document.createElement('div');
      el.className = 'atl-msg ' + cls;
      el.innerHTML = html;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }

    async function send() {
      const text = input.value.trim();
      if (!text || busy || used >= A.maxPrompts) return;
      busy = true;
      if (hint) { hint.remove(); }               // clear the intro on first send
      addMsg('user', escapeHtml(text));
      input.value = ''; autosize(); refresh();
      sendBtn.disabled = true;

      // typing indicator — same three bouncing dots as the "Any AI" cards
      const typing = document.createElement('div');
      typing.className = 'atl-typing';
      typing.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
      log.appendChild(typing);
      log.scrollTop = log.scrollHeight;

      const ctx = { lang: detectLang(text) };
      let answer;
      try { answer = await A.respond(text, ctx); }
      catch (err) { answer = 'Something went wrong reaching Ask-Tilli. Please try again.'; }

      const think = A.minThink + Math.random() * (A.maxThink - A.minThink);
      await wait(think);
      typing.remove();
      addMsg('bot', answer);

      used += 1;
      busy = false;
      const left = A.maxPrompts - used;
      countEl.textContent = left === 1 ? '1 question left' : `${left} questions left`;
      if (used >= A.maxPrompts) lock();
      else refresh();
    }

    function lock() {
      bar.style.display = 'none';
      meta.style.display = 'none';
      locked.style.display = 'block';
      log.scrollTop = log.scrollHeight;
    }

    sendBtn.addEventListener('click', send);

    // example chips prefill the box — they now live OUTSIDE the card, so query
    // the whole document rather than the card root.
    document.querySelectorAll('[data-atl-example]').forEach((chip) => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent.trim();
        autosize(); refresh(); input.focus();
      });
    });

    /* ── Speech-to-text (Web Speech API) — shown only where supported ──── */
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      micBtn.style.display = 'flex';
      let rec = null, listening = false;
      micBtn.addEventListener('click', () => {
        if (listening) { rec && rec.stop(); return; }
        rec = new SR();
        rec.lang = navigator.language || 'en-US';
        rec.interimResults = true;
        rec.continuous = false;
        const base = input.value ? input.value + ' ' : '';
        rec.onstart = () => { listening = true; micBtn.classList.add('rec'); };
        rec.onresult = (e) => {
          let t = '';
          for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
          input.value = (base + t).slice(0, A.maxChars);
          autosize(); refresh();
        };
        rec.onerror = () => { listening = false; micBtn.classList.remove('rec'); };
        rec.onend  = () => { listening = false; micBtn.classList.remove('rec'); refresh(); input.focus(); };
        rec.start();
      });
    }
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

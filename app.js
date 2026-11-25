/* Professional Arabic for Expatriates — static SPA */
(function () {
  const app = document.getElementById('app');
  const cache = {};
  let manifest = null;

  const bnDigits = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hasAr = s => /[؀-ۿ]/.test(s || '');
  const arSpan = s => hasAr(s) ? `<span class="ar" dir="rtl">${esc(s)}</span>` : esc(s);
  // mixed text: wrap Arabic runs
  const mixed = s => esc(s).replace(/([؀-ۿ][؀-ۿً-ٟ\s،؟.!:]*[؀-ۿً-ٟ؟])/g, '<span class="ar" dir="rtl">$1</span>');

  // ---------- storage (light per-viewer progress) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const done = () => store.get('pae-done', {});
  const markDone = (id, v) => { const d = done(); if (v) d[id] = 1; else delete d[id]; store.set('pae-done', d); };

  // ---------- display toggles ----------
  const prefs = store.get('pae-prefs', { tr: true, fu: true, mn: true });
  function applyPrefs() {
    document.body.classList.toggle('hide-tr', !prefs.tr);
    document.body.classList.toggle('hide-fu', !prefs.fu);
    document.body.classList.toggle('hide-mn', !prefs.mn);
  }
  applyPrefs();

  // ---------- speech (browser Arabic voice) ----------
  let arVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    arVoice = vs.find(v => /ar[-_]SA/i.test(v.lang)) || vs.find(v => /^ar/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!('speechSynthesis' in window)) { alertMsg('এই ব্রাউজারে শোনার সুবিধা নেই।'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA'; u.rate = 0.85;
    if (arVoice) u.voice = arVoice;
    speechSynthesis.speak(u);
  }
  function alertMsg(m) { const d = document.createElement('div'); d.textContent = m; d.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#10232b;color:#fff;padding:10px 16px;border-radius:10px;z-index:99'; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
  const spk = t => t ? `<button class="speak" data-say="${esc(t)}" title="শুনুন" aria-label="শুনুন">🔊</button>` : '';

  // ---------- data ----------
  async function getManifest() {
    if (manifest) return manifest;
    const r = await fetch('data/index.json'); manifest = await r.json(); return manifest;
  }
  async function getLevel(file) {
    if (file in cache) return cache[file];
    try {
      const r = await fetch(`data/${file}.json`);
      cache[file] = r.ok ? await r.json() : null;
    } catch (e) { cache[file] = null; }
    return cache[file];
  }
  const allLessons = lv => (lv.modules || []).flatMap(m => (m.lessons || []).map(l => ({ ...l, _m: m })));
  const countLessons = lv => lv ? allLessons(lv).length : 0;

  // ---------- views ----------
  async function home() {
    const mf = await getManifest();
    const levels = await Promise.all(mf.levels.map(l => getLevel(l.file)));
    const total = levels.reduce((a, l) => a + countLessons(l), 0);
    app.innerHTML = `
    <section class="hero">
      <div>
        <span class="eyebrow">সৌদি আরব ও মধ্যপ্রাচ্যের প্রবাসীদের জন্য</span>
        <h1>কাজের জায়গায়, দোকানে, অফিসে — <em>আত্মবিশ্বাসে আরবি বলুন</em></h1>
        <p class="lead">প্রফেশনাল অ্যারাবিক ফর এক্সপ্যাট্রিয়েট: রিয়াদের কথ্য (নজদি) আরবিতে বাস্তব কথোপকথন, পাশে শুদ্ধ ফুসহা আর নিয়ম মাফিক বাংলা উচ্চারণ। ছোট ছোট পাঠ, মোবাইলে শোনার উপযোগী।</p>
        <div class="btns">
          <a class="btn btn-primary" href="#/course">কোর্স দেখুন</a>
          <a class="btn btn-ghost" href="#/level/l1a">প্রথম পাঠ চেষ্টা করুন</a>
        </div>
      </div>
      <div class="hero-card">
        <div class="line"><span class="ar">وش تبغى؟</span><span class="tag">নজদি</span><div class="tr">উশ তাবগা? — আপনি কী চান?</div></div>
        <div class="line"><span class="ar">ماذا تريد؟</span><span class="tag">ফুসহা</span><div class="tr">মা-যা তুরীদ? — একই অর্থ, শুদ্ধ রূপে</div></div>
        <div class="line"><span class="ar">يعطيك العافية</span><span class="tag">নজদি</span><div class="tr">ইয়া‘তীক আল-‘আফিয়াহ — আল্লাহ আপনাকে সুস্থ রাখুন (ধন্যবাদ জানাতে)</div></div>
      </div>
    </section>
    <div class="stats">
      <div class="stat"><b>${bnDigits(mf.levels.length)}</b><span>কোর্স অংশ</span></div>
      <div class="stat"><b>${bnDigits(total)}</b><span>প্রস্তুত পাঠ</span></div>
      <div class="stat"><b>১০–১৫</b><span>মিনিট প্রতি পাঠ</span></div>
      <div class="stat"><b>শুক্রবার</b><span>লাইভ ক্লাস ও স্পিকিং ক্লাব</span></div>
    </div>
    <section class="block">
      <div class="section-title"><h2>শেখার পথ</h2></div>
      <div class="journey">
        <div class="step"><div class="num">০</div><h3>প্রস্তুতি</h3><p>ট্র্যাক A: পড়ে শেখা · ট্র্যাক B: শুনে-বলে শেখা</p><span class="dur">৪ সপ্তাহ</span></div>
        <div class="step"><div class="num">১</div><h3>সার্ভাইভাল ও প্রবাস জীবন</h3><p>দোকান, রাস্তা, ক্লিনিক, জাওয়াজাত, বেতন</p><span class="dur">৮ সপ্তাহ</span></div>
        <div class="step"><div class="num">২</div><h3>পেশাভিত্তিক ট্র্যাক</h3><p>চাকরিজীবী, ব্যবসায়ী, ম্যানেজার, শিক্ষক</p><span class="dur">২–৩ মাস</span></div>
        <div class="step"><div class="num">৩</div><h3>স্পিকিং ক্লাব</h3><p>রোল-প্লে আর সৌদি কণ্ঠে লিসেনিং ল্যাব</p><span class="dur">চলমান</span></div>
      </div>
    </section>
    <section class="block">
      <div class="section-title"><h2>কোর্সসমূহ</h2><a href="#/course">সব দেখুন →</a></div>
      ${levelCards(mf, levels)}
    </section>
    <section class="block">
      <div class="section-title"><h2>কেন এই কোর্স</h2></div>
      <div class="grid">
        <div class="card"><span class="kicker">বাস্তব ভাষা</span><h3>রিয়াদে যেভাবে বলে</h3><p>কথোপকথন নজদি আরবিতে — দোকানদার, ড্রাইভার, সুপারভাইজার যেভাবে বলেন। পাশে ফুসহা, তাই দুটোই শেখা হয়।</p></div>
        <div class="card"><span class="kicker">ব্যস্ত মানুষের জন্য</span><h3>ছোট পাঠ, মোবাইলে</h3><p>প্রতিটি পাঠ ১০–১৫ মিনিট। বাসে, বিরতিতে শুনে শুনে শেখা যায়।</p></div>
        <div class="card"><span class="kicker">নিয়ম মাফিক উচ্চারণ</span><h3>বাংলা উচ্চারণ গাইড</h3><p>প্রতিটি শব্দে একই নিয়মে বাংলা উচ্চারণ — <a href="#/guide">গাইড দেখুন</a>।</p></div>
        <div class="card"><span class="kicker">ফলাফল-কেন্দ্রিক</span><h3>সার্টিফিকেটে দক্ষতা</h3><p>প্রতিটি মডিউল শেষে লেখা থাকে আপনি কী পারেন — যেমন "ক্লিনিকে নিজের সমস্যা বলতে পারে"।</p></div>
      </div>
    </section>`;
  }

  function levelCards(mf, levels, group) {
    const d = done();
    let html = '', last = '';
    mf.levels.forEach((meta, i) => {
      if (group && meta.group !== group) return;
      const lv = levels[i];
      const n = countLessons(lv);
      const c = lv ? allLessons(lv).filter(l => d[l.id]).length : 0;
      const pct = n ? Math.round(c / n * 100) : 0;
      html += `<a class="card ${lv ? '' : 'soon'}" href="${lv ? '#/level/' + meta.file : '#/course'}">
        <span class="kicker">${esc(meta.kicker)}</span><h3>${esc(meta.title)}</h3><p>${esc(meta.desc)}</p>
        <div class="meta"><span>${esc(meta.dur)}</span><span>${lv ? bnDigits(n) + ' পাঠ' : 'শীঘ্রই আসছে'}</span></div>
        ${lv ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
      </a>`;
    });
    return `<div class="grid">${html}</div>`;
  }

  async function course() {
    const mf = await getManifest();
    const levels = await Promise.all(mf.levels.map(l => getLevel(l.file)));
    const groups = [...new Set(mf.levels.map(l => l.group))];
    app.innerHTML = `<div class="crumbs"><a href="#/">হোম</a> › কোর্স</div>
      <h1 style="font-size:34px">পুরো কোর্স</h1>
      <p class="muted">সবাই লেভেল ০ ও ১ করবেন, তারপর নিজের পেশার ট্র্যাক বেছে নেবেন। স্পিকিং ক্লাব চলবে পুরো সময় ধরে।</p>
      ${groups.map(g => `<section class="block"><div class="section-title"><h2>${esc(g)}</h2></div>${levelCards(mf, levels, g)}</section>`).join('')}`;
  }

  async function level(file) {
    const mf = await getManifest();
    const meta = mf.levels.find(l => l.file === file);
    const lv = await getLevel(file);
    if (!lv) { app.innerHTML = `<div class="loading">এই অংশ এখনো প্রস্তুত হয়নি। <a href="#/course">কোর্সে ফিরুন</a></div>`; return; }
    const d = done();
    app.innerHTML = `<div class="crumbs"><a href="#/">হোম</a> › <a href="#/course">কোর্স</a> › ${esc(lv.title)}</div>
      <div class="level-head"><div class="kicker">${esc(lv.level || meta.kicker)}</div><h1>${esc(lv.title)}</h1><p>${esc(lv.subtitle || meta.desc)}</p></div>
      ${(lv.modules || []).map(m => `<div class="module">
        <div class="module-head"><h2>${esc(m.title)}</h2>${m.situation ? `<div class="muted" style="font-size:15px">${esc(m.situation)}</div>` : ''}${m.outcome ? `<div class="outcome">🎯 ${esc(m.outcome)}</div>` : ''}</div>
        ${(m.lessons || []).map(l => `<a class="lesson-row" href="#/lesson/${file}/${encodeURIComponent(l.id)}">
          <span class="check ${d[l.id] ? 'done' : ''}">${d[l.id] ? '✓' : ''}</span>
          <span class="t">${esc(l.title)}<small>${esc(l.objective || '')}</small></span>
          <span class="muted" style="font-size:13.5px">${esc(l.duration || '')}</span></a>`).join('')}
      </div>`).join('')}`;
  }

  async function lesson(file, id) {
    const lv = await getLevel(file);
    if (!lv) return level(file);
    const list = allLessons(lv);
    const i = list.findIndex(l => l.id === id);
    if (i < 0) return level(file);
    const L = list[i], prev = list[i - 1], next = list[i + 1];
    const parts = [];
    const sec = (key, ic, title, body, cls = '') => { parts.push({ key, title }); return `<section id="s-${key}" class="${cls}"><h2><span class="ic">${ic}</span>${title}</h2>${body}</section>`; };
    let html = '';

    if (L.sections && L.sections.length) {
      html += sec('notes', '📘', 'পাঠ', L.sections.map(s => `
        ${s.heading ? `<h3 style="font-size:18px;margin-top:10px">${esc(s.heading)}</h3>` : ''}
        ${s.body ? `<div class="sec-body">${String(s.body).split(/\n+/).map(p => `<p>${mixed(p)}</p>`).join('')}</div>` : ''}
        ${s.table ? `<div class="tbl-wrap"><table class="t"><thead><tr>${(s.table.cols || []).map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${(s.table.rows || []).map(r => `<tr>${r.map(c => hasAr(c) && !/[ঀ-৿]/.test(c) ? `<td class="arc">${esc(c)}</td>` : `<td>${mixed(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}`).join(''));
    }
    if (L.dialogue && L.dialogue.lines) {
      html += sec('dialogue', '💬', 'কথোপকথন', `
        ${L.dialogue.setting ? `<p class="dlg-setting">${mixed(L.dialogue.setting)}</p>` : ''}
        <div class="btns" style="margin:0 0 12px"><button class="btn btn-ghost" data-sayall="1">🔊 পুরো কথোপকথন শুনুন</button></div>
        <div class="dlg">${L.dialogue.lines.map(x => `<div class="bubble"><span class="who">${esc(x.speaker)}</span><div class="say">
          <span class="ar">${esc(x.najdi)}${spk(x.najdi)}</span>
          ${x.najdi_bn ? `<div class="tr">${esc(x.najdi_bn)}</div>` : ''}
          ${x.fusha && x.fusha !== x.najdi ? `<div class="fu"><span class="lbl f">ফুসহা</span><span class="ar">${esc(x.fusha)}</span></div>` : ''}
          ${x.meaning ? `<div class="mn">${mixed(x.meaning)}</div>` : ''}
        </div></div>`).join('')}</div>`);
    }
    if (L.vocab && L.vocab.length) {
      html += sec('vocab', '🧩', 'নতুন শব্দ', `<div class="vocab">${L.vocab.map(v => `<div class="vcard">
        <span class="ar">${esc(v.najdi || v.fusha)}</span>${spk(v.najdi || v.fusha)}
        ${v.najdi_bn ? `<div class="tr">${esc(v.najdi_bn)}</div>` : ''}
        <div class="mn">${mixed(v.meaning)}</div>
        ${v.fusha && v.najdi && v.fusha !== v.najdi ? `<div class="fu">ফুসহা: <span class="ar">${esc(v.fusha)}</span>${v.fusha_bn ? ` · ${esc(v.fusha_bn)}` : ''}</div>` : ''}
      </div>`).join('')}</div>`);
    }
    if (L.phrases && L.phrases.length) {
      html += sec('phrases', '🗣️', 'কাজের বাক্যাংশ', L.phrases.map(p => `<div class="phrase">
        <div><span class="ar">${esc(p.najdi || p.fusha)}</span>${spk(p.najdi || p.fusha)}
        ${p.najdi_bn ? `<div class="tr">${esc(p.najdi_bn)}</div>` : ''}<div class="mn">${mixed(p.meaning)}</div>
        ${p.fusha && p.najdi && p.fusha !== p.najdi ? `<div class="fu"><span class="lbl f">ফুসহা</span><span class="ar" style="font-size:1.1em">${esc(p.fusha)}</span></div>` : ''}</div>
        ${p.use ? `<div class="use">কখন: ${mixed(p.use)}</div>` : ''}</div>`).join(''));
    }
    if (L.culture) html += sec('culture', '🌴', 'সৌদি সংস্কৃতি টিপস', `<p style="margin:0">${mixed(L.culture)}</p>`, 'culture');
    if (L.practice && L.practice.length) {
      html += sec('practice', '🎯', 'অনুশীলন', L.practice.map(t => `<div class="task"><span class="ty">${esc(t.type || 'কাজ')}</span><div>${mixed(t.task)}${t.model ? `<div class="model"><span class="ar">${esc(t.model)}</span>${spk(t.model)}</div>` : ''}</div></div>`).join(''));
    }
    if (L.quiz && L.quiz.length) {
      html += sec('quiz', '✅', 'কুইজ', `<div id="quiz">${L.quiz.map((q, qi) => `<div class="q" data-a="${q.answer}"><p>${bnDigits(qi + 1)}. ${mixed(q.q)}</p>
        <div class="opts">${(q.options || []).map((o, oi) => `<button class="opt" data-i="${oi}">${mixed(o)}</button>`).join('')}</div>
        ${q.explain ? `<div class="explain">${mixed(q.explain)}</div>` : ''}</div>`).join('')}</div>
        <p class="score" id="score"></p>`);
    }

    const isDone = !!done()[L.id];
    app.innerHTML = `<div class="crumbs"><a href="#/">হোম</a> › <a href="#/level/${file}">${esc(lv.title)}</a> › ${esc(L._m.title)}</div>
      <div class="lesson-wrap">
        <div class="lesson-main">
          <div class="lesson-title"><span class="eyebrow">${esc(L._m.title)}</span><h1>${esc(L.title)}</h1>
          <span class="muted">${esc(L.duration || '')}</span></div>
          ${L.objective ? `<div class="objective">🎯 ${mixed(L.objective)}</div>` : ''}
          ${html}
          <div class="lesson-nav">
            ${prev ? `<a class="btn btn-ghost" href="#/lesson/${file}/${encodeURIComponent(prev.id)}">→ আগের পাঠ</a>` : '<span></span>'}
            <button class="btn ${isDone ? 'btn-ghost' : 'btn-gold'}" id="mark">${isDone ? '✓ সম্পন্ন (আবার খুলুন)' : 'পাঠ সম্পন্ন করুন'}</button>
            ${next ? `<a class="btn btn-primary" href="#/lesson/${file}/${encodeURIComponent(next.id)}">পরের পাঠ ←</a>` : `<a class="btn btn-primary" href="#/course">কোর্সে ফিরুন</a>`}
          </div>
        </div>
        <aside class="side">
          <h4>দেখানো হবে</h4>
          <div class="toggles">
            <label class="toggle">বাংলা উচ্চারণ <input type="checkbox" data-pref="tr" ${prefs.tr ? 'checked' : ''}></label>
            <label class="toggle">ফুসহা রূপ <input type="checkbox" data-pref="fu" ${prefs.fu ? 'checked' : ''}></label>
            <label class="toggle">বাংলা অর্থ <input type="checkbox" data-pref="mn" ${prefs.mn ? 'checked' : ''}></label>
          </div>
          <p class="muted" style="font-size:13.5px;margin-top:-4px">টিপ: অর্থ লুকিয়ে আগে নিজে বোঝার চেষ্টা করুন।</p>
          <h4>এই পাঠে</h4>
          <div class="toc">${parts.map(p => `<a href="javascript:void(0)" data-jump="s-${p.key}">${p.title}</a>`).join('')}</div>
          <p class="muted" style="font-size:13px;margin-top:12px">${bnDigits(i + 1)} / ${bnDigits(list.length)} পাঠ</p>
        </aside>
      </div>`;

    // quiz handlers
    app.querySelectorAll('.q').forEach(q => {
      q.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
        if (q.classList.contains('answered')) return;
        q.classList.add('answered');
        const a = +q.dataset.a, pick = +b.dataset.i;
        q.querySelectorAll('.opt')[a] && q.querySelectorAll('.opt')[a].classList.add('right');
        if (pick !== a) b.classList.add('wrong');
        q.dataset.ok = pick === a ? 1 : 0;
        const qs = app.querySelectorAll('.q'), ans = app.querySelectorAll('.q.answered');
        if (qs.length === ans.length) {
          const ok = [...qs].filter(x => x.dataset.ok === '1').length;
          document.getElementById('score').textContent = `ফলাফল: ${bnDigits(ok)} / ${bnDigits(qs.length)}` + (ok === qs.length ? ' — চমৎকার! ممتاز' : '');
        }
      }));
    });
    document.getElementById('mark').addEventListener('click', () => { markDone(L.id, !isDone); lesson(file, id); });
    const sayAll = app.querySelector('[data-sayall]');
    if (sayAll) sayAll.addEventListener('click', () => speak(L.dialogue.lines.map(x => x.najdi).join(' ... ')));
  }

  function guide() {
    const rows = [['ا','আলিফ','আ / অ'],['ب','বা','ব'],['ت','তা','ত'],['ث','ছা','ছ'],['ج','জীম','জ'],['ح','হ়া','হ় (গলার ভেতর থেকে)'],['خ','খা','খ'],['د','দাল','দ'],['ذ','যাল','য'],['ر','রা','র'],['ز','যা','য'],['س','সীন','স'],['ش','শীন','শ'],['ص','সোয়াদ','স (ভারী)'],['ض','দোয়াদ','দ (ভারী)'],['ط','ত্বা','ত (ভারী)'],['ظ','যোয়া','য (ভারী)'],['ع','‘আইন','‘ (গলার চাপ)'],['غ','গ়াইন','গ়'],['ف','ফা','ফ'],['ق','ক়াফ','ক় — নজদিতে গ'],['ك','কাফ','ক'],['ل','লাম','ল'],['م','মীম','ম'],['ن','নূন','ন'],['ه','হা','হ'],['و','ওয়াও','ও / ঊ / ওয়া'],['ي','ইয়া','ই / ঈ / য়'],['ء','হামযা','’']];
    app.innerHTML = `<div class="crumbs"><a href="#/">হোম</a> › উচ্চারণ গাইড</div>
      <h1 style="font-size:34px">বাংলা উচ্চারণ গাইড</h1>
      <p class="lead muted">পুরো কোর্সে প্রতিটি আরবি শব্দের বাংলা উচ্চারণ এই একই নিয়মে লেখা। দীর্ঘ স্বর পূর্ণ চিহ্নে (া, ী, ূ), তাশদীদে অক্ষর দ্বিগুণ (মুদাররিস)।</p>
      <section class="block"><div class="letters">${rows.map(r => `<div class="letter"><span class="ar">${r[0]}</span><b>${r[2]}</b><br><small>${r[1]}</small></div>`).join('')}</div></section>
      <section class="block"><div class="grid">
        <div class="card"><span class="kicker">নজদি উচ্চারণ</span><h3>ق = গ</h3><p>রিয়াদে ق সাধারণত "গ" উচ্চারিত হয়: <span class="ar">قهوة</span> = গাহওয়া, <span class="ar">قال</span> = গাল। কথ্য অংশে আমরা যেভাবে বলা হয় সেভাবেই লিখি; ফুসহা অংশে ক়।</p></div>
        <div class="card"><span class="kicker">আলিফ-লাম</span><h3>সূর্য ও চন্দ্র অক্ষর</h3><p>সূর্য অক্ষরের আগে ال-এর ল পড়া হয় না: <span class="ar">الشمس</span> = আশ-শামস; চন্দ্র অক্ষরে পড়া হয়: <span class="ar">القمر</span> = আল-ক়ামার।</p></div>
        <div class="card"><span class="kicker">শেষে ة</span><h3>থামলে "আহ / আ"</h3><p>বাক্যের শেষে থামলে ة উচ্চারণ হয় "আহ" বা "আ": <span class="ar">مدرسة</span> = মাদরাসাহ।</p></div>
      </div></section>`;
  }

  function enroll() {
    app.innerHTML = `<div class="crumbs"><a href="#/">হোম</a> › ভর্তি</div>
      <h1 style="font-size:34px">ভর্তি ও ফি</h1>
      <p class="muted">দাম প্রাথমিক; প্রথম ব্যাচের পর চূড়ান্ত হবে।</p>
      <table class="price-table"><thead><tr><th>প্যাকেজ</th><th>ফি</th><th>কাদের জন্য</th></tr></thead><tbody>
        <tr><td>লেভেল ০ + ১ (১২ সপ্তাহ)</td><td><b>১৯৯ রিয়াল</b> · আর্লি বার্ড ১৪৯</td><td>সৌদিতে থাকা প্রবাসী</td></tr>
        <tr><td>স্পিকিং ক্লাব</td><td><b>মাসে ৩৯ রিয়াল</b></td><td>লেভেল ১ শেষ করা শিক্ষার্থী</td></tr>
        <tr><td>পেশাভিত্তিক ট্র্যাক</td><td><b>প্রতিটি ২৯৯ রিয়াল</b></td><td>লেভেল ২</td></tr>
        <tr><td>প্রি-ডিপার্চার (বাংলাদেশ)</td><td><b>৩০০০ টাকা</b></td><td>সৌদি যাওয়ার আগে</td></tr>
        <tr><td>কোম্পানি / এজেন্সি</td><td><b>গ্রুপ ছাড়</b></td><td>২০+ জনের ব্যাচ</td></tr>
      </tbody></table>
      <section class="block"><div class="grid">
        <div class="card"><span class="kicker">পেমেন্ট</span><h3>সৌদি থেকে</h3><p>STC Pay বা ব্যাংক ট্রান্সফার।</p></div>
        <div class="card"><span class="kicker">পেমেন্ট</span><h3>বাংলাদেশ থেকে</h3><p>বিকাশ / নগদ / ব্যাংক।</p></div>
        <div class="card"><span class="kicker">ব্যাচ</span><h3>নারীদের আলাদা ব্যাচ</h3><p>নারী শিক্ষিকার তত্ত্বাবধানে আলাদা লাইভ ক্লাস।</p></div>
      </div></section>
      <p>ভর্তির জন্য যোগাযোগ করুন — পেমেন্ট যাচাইয়ের পর কোর্স অ্যাক্সেস দেওয়া হবে।</p>`;
  }

  // ---------- router ----------
  async function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [p, a, b] = h.split('/');
    document.querySelectorAll('.nav a').forEach(x => x.classList.toggle('active', x.getAttribute('href') === '#/' + (p || '')));
    try {
      if (!p) await home();
      else if (p === 'course') await course();
      else if (p === 'level') await level(a);
      else if (p === 'lesson') await lesson(a, decodeURIComponent(b || ''));
      else if (p === 'guide') guide();
      else if (p === 'enroll') enroll();
      else await home();
    } catch (e) { console.error(e); app.innerHTML = '<div class="loading">কিছু একটা সমস্যা হয়েছে। পাতাটি আবার লোড করুন।</div>'; }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // delegated clicks
  document.addEventListener('click', e => {
    const s = e.target.closest('[data-say]'); if (s) { speak(s.dataset.say); return; }
    const j = e.target.closest('[data-jump]'); if (j) { const el = document.getElementById(j.dataset.jump); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  document.addEventListener('change', e => {
    const t = e.target.closest('[data-pref]'); if (!t) return;
    prefs[t.dataset.pref] = t.checked; store.set('pae-prefs', prefs); applyPrefs();
  });

  route();
})();

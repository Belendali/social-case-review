/* ===== comments — press C · no backend, comments travel as a code ===== */
(function () {
  const KEY = "deckCommentsV1";
  const PAGE = location.pathname.split("/").pop() || "index.html";
  const TITLES = { "index.html": "Agenda", "answer.html": "Answer.AI", "wanaka.html": "Wanaka", "social.html": "LiveStatus" };

  let store = load();
  let idx = 0;
  let open = false;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { author: "", data: {} }; }
    catch (e) { return { author: "", data: {} }; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }
  function listFor(page, i) {
    return ((store.data[page] || {})[i] || []).slice();
  }
  function add(text) {
    const page = store.data[PAGE] || (store.data[PAGE] = {});
    const arr = page[idx] || (page[idx] = []);
    arr.push({ who: store.author || "Guest", text: text, at: Date.now() });
    save();
  }
  function total() {
    let n = 0;
    Object.values(store.data).forEach((p) => Object.values(p).forEach((a) => (n += a.length)));
    return n;
  }

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .cmt-dot { position: fixed; right: 22px; bottom: 22px; z-index: 60; display: none; align-items: center; gap: 7px;
    font-family: var(--serif, system-ui); font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
    color: #cfc4ff; background: rgba(12,12,18,.8); border: 1px solid rgba(139,124,255,.4); border-radius: 999px;
    padding: 7px 13px; backdrop-filter: blur(8px); cursor: pointer; }
  .cmt-dot.on { display: flex; }
  .cmt-dot i { width: 6px; height: 6px; border-radius: 50%; background: #8b7cff; font-style: normal; }
  .cmt-panel { position: fixed; right: 0; top: 0; bottom: 0; width: min(400px, 92vw); z-index: 70;
    background: rgba(10,10,14,.97); border-left: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(14px);
    transform: translateX(102%); transition: transform .35s cubic-bezier(.22,1,.36,1);
    display: flex; flex-direction: column; font-family: system-ui, -apple-system, "PingFang SC", sans-serif; color: #f2f2f0; }
  .cmt-panel.open { transform: none; }
  .cmt-head { padding: 22px 22px 14px; border-bottom: 1px solid rgba(255,255,255,.1); }
  .cmt-head .k { font-family: var(--serif, system-ui); font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: #8b8b9c; }
  .cmt-head h4 { margin: 6px 0 0; font-size: 17px; font-weight: 600; }
  .cmt-head .sub { font-size: 12px; color: #8b8b9c; margin-top: 4px; }
  .cmt-list { flex: 1; overflow-y: auto; padding: 16px 22px; display: flex; flex-direction: column; gap: 12px; }
  .cmt-item { border-left: 2px solid rgba(139,124,255,.6); padding: 2px 0 2px 12px; }
  .cmt-item .who { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #8b8b9c; }
  .cmt-item .txt { font-size: 14px; line-height: 1.55; margin-top: 4px; white-space: pre-wrap; }
  .cmt-empty { font-size: 13px; color: #6f6f80; line-height: 1.6; }
  .cmt-form { padding: 14px 22px 18px; border-top: 1px solid rgba(255,255,255,.1); display: flex; flex-direction: column; gap: 9px; }
  .cmt-form input, .cmt-form textarea { width: 100%; font: inherit; font-size: 14px; color: #f2f2f0;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; padding: 10px 12px; outline: none; }
  .cmt-form input { font-size: 13px; }
  .cmt-form textarea { min-height: 84px; resize: vertical; line-height: 1.5; }
  .cmt-form :is(input, textarea):focus { border-color: rgba(139,124,255,.7); }
  .cmt-row { display: flex; gap: 8px; }
  .cmt-btn { flex: 1; font: inherit; font-size: 13.5px; font-weight: 600; border: 0; border-radius: 10px; padding: 11px 14px;
    background: #8b7cff; color: #0b0b10; cursor: pointer; }
  .cmt-btn.ghost { background: rgba(255,255,255,.06); color: #cfc4ff; border: 1px solid rgba(255,255,255,.14); font-weight: 500; }
  .cmt-tools { padding: 0 22px 18px; display: flex; flex-direction: column; gap: 8px; }
  .cmt-tools .hint { font-size: 11.5px; color: #6f6f80; line-height: 1.5; }
  .cmt-code { width: 100%; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: #cfc4ff;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; padding: 10px 12px; min-height: 70px; resize: vertical; display: none; }
  .cmt-code.on { display: block; }
  .cmt-close { position: absolute; right: 16px; top: 16px; background: none; border: 0; color: #8b8b9c; font-size: 20px; cursor: pointer; line-height: 1; }
  `;
  document.head.appendChild(css);

  /* ---------- markup ---------- */
  const dot = document.createElement("div");
  dot.className = "cmt-dot";
  dot.innerHTML = '<i></i><span></span>';
  document.body.appendChild(dot);

  const panel = document.createElement("aside");
  panel.className = "cmt-panel";
  panel.innerHTML = `
    <button class="cmt-close" type="button" aria-label="Close">×</button>
    <div class="cmt-head">
      <div class="k">Comments</div>
      <h4 class="cmt-where"></h4>
      <div class="sub">Press <b>C</b> to open or close this panel.</div>
    </div>
    <div class="cmt-list"></div>
    <div class="cmt-form">
      <input class="cmt-name" type="text" placeholder="Your name" />
      <textarea class="cmt-text" placeholder="Comment on this slide…"></textarea>
      <button class="cmt-btn cmt-submit" type="button">Submit</button>
    </div>
    <div class="cmt-tools">
      <div class="cmt-row">
        <button class="cmt-btn ghost cmt-export" type="button">Copy all as code</button>
        <button class="cmt-btn ghost cmt-import" type="button">Paste code</button>
      </div>
      <textarea class="cmt-code" placeholder="Paste the code here, then press Paste code again"></textarea>
      <div class="hint cmt-hint">Comments live in this browser. Send the code to share them.</div>
    </div>`;
  document.body.appendChild(panel);

  const $ = (s) => panel.querySelector(s);
  const listEl = $(".cmt-list"), whereEl = $(".cmt-where"), nameEl = $(".cmt-name"),
        textEl = $(".cmt-text"), codeEl = $(".cmt-code"), hintEl = $(".cmt-hint");
  nameEl.value = store.author || "";

  function render() {
    const items = listFor(PAGE, idx);
    whereEl.textContent = (TITLES[PAGE] || PAGE) + " · slide " + (idx + 1);
    listEl.innerHTML = "";
    if (!items.length) {
      const p = document.createElement("div");
      p.className = "cmt-empty";
      p.textContent = "No comments on this slide yet.";
      listEl.appendChild(p);
    } else {
      items.forEach((c) => {
        const el = document.createElement("div");
        el.className = "cmt-item";
        const who = document.createElement("div");
        who.className = "who";
        who.textContent = c.who + " · " + new Date(c.at).toLocaleDateString();
        const tx = document.createElement("div");
        tx.className = "txt";
        tx.textContent = c.text;
        el.appendChild(who); el.appendChild(tx);
        listEl.appendChild(el);
      });
    }
    const n = items.length;
    dot.classList.toggle("on", n > 0 && !open);
    dot.querySelector("span").textContent = n + (n === 1 ? " comment" : " comments");
  }

  function toggle(force) {
    open = force === undefined ? !open : force;
    panel.classList.toggle("open", open);
    render();
    if (open) setTimeout(() => textEl.focus(), 260);
  }

  /* ---------- events ---------- */
  document.addEventListener("deck:change", (e) => { idx = e.detail.index; render(); });

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing) {
      if (e.key === "Escape") { t.blur(); toggle(false); }
      return;
    }
    if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); toggle(); }
    else if (e.key === "Escape" && open) toggle(false);
  });

  dot.addEventListener("click", () => toggle(true));
  $(".cmt-close").addEventListener("click", () => toggle(false));

  $(".cmt-submit").addEventListener("click", () => {
    const text = textEl.value.trim();
    if (!text) { textEl.focus(); return; }
    store.author = nameEl.value.trim() || store.author || "Guest";
    add(text);
    textEl.value = "";
    render();
    hintEl.textContent = "Saved. " + total() + " comments in this browser — copy the code to send them.";
  });

  $(".cmt-export").addEventListener("click", async () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(store))));
    codeEl.classList.add("on");
    codeEl.value = payload;
    codeEl.select();
    try {
      await navigator.clipboard.writeText(payload);
      hintEl.textContent = "Copied. Paste it to Bella — " + total() + " comments.";
    } catch (err) {
      hintEl.textContent = "Select the code above and copy it manually.";
    }
  });

  $(".cmt-import").addEventListener("click", () => {
    if (!codeEl.classList.contains("on")) {
      codeEl.classList.add("on");
      codeEl.value = "";
      codeEl.focus();
      hintEl.textContent = "Paste the code, then press Paste code again.";
      return;
    }
    const raw = codeEl.value.trim();
    if (!raw) { codeEl.focus(); return; }
    let incoming;
    try { incoming = JSON.parse(decodeURIComponent(escape(atob(raw)))); }
    catch (err) { hintEl.textContent = "That code didn't parse. Check it was copied in full."; return; }
    let added = 0;
    Object.entries(incoming.data || {}).forEach(([page, slides]) => {
      const mine = store.data[page] || (store.data[page] = {});
      Object.entries(slides).forEach(([i, arr]) => {
        const target = mine[i] || (mine[i] = []);
        arr.forEach((c) => {
          if (!target.some((x) => x.at === c.at && x.text === c.text)) { target.push(c); added++; }
        });
        target.sort((a, b) => a.at - b.at);
      });
    });
    save();
    codeEl.classList.remove("on");
    codeEl.value = "";
    render();
    hintEl.textContent = added + " comments added. Slides with comments show a marker.";
  });

  render();
})();

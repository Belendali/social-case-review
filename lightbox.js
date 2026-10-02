/* ===== click an image to see it large · Esc or click to close ===== */
(function () {
  const box = document.createElement("div");
  box.className = "lbx";
  box.innerHTML = '<img alt="" /><video playsinline muted loop autoplay></video><div class="lbx-cap"></div>';
  document.body.appendChild(box);
  const img = box.querySelector("img"), vid = box.querySelector("video"), cap = box.querySelector(".lbx-cap");

  const css = document.createElement("style");
  css.textContent = `
  .zoomable { cursor: zoom-in; transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease-out; }
  .zoomable:is(:hover, .hov) { transform: translateY(-4px) scale(1.012); }
  .lbx { position: fixed; inset: 0; z-index: 90; display: none; place-items: center; flex-direction: column; gap: 14px;
    background: rgba(6,6,10,.94); backdrop-filter: blur(10px); cursor: zoom-out; padding: 40px; }
  body.script-on .lbx { bottom: var(--script-h, 36vh); }   /* keep the script readable while zoomed */
  .lbx.on { display: grid; }
  .lbx img, .lbx video { max-width: min(1100px, 92vw); max-height: 86vh; width: auto; height: auto; object-fit: contain;
    border-radius: 18px; border: 1px solid rgba(255,255,255,.16); box-shadow: 0 40px 90px rgba(0,0,0,.6);
    animation: lbxIn .28s cubic-bezier(.22,1,.36,1) both; }
  .lbx-cap { font-family: var(--serif, system-ui); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.5); }
  @keyframes lbxIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
  `;
  document.head.appendChild(css);

  // the presenter's deck runs in an iframe; top-level windows mirror it
  const mbc = ("BroadcastChannel" in window) ? new BroadcastChannel("deck-lightbox") : null;
  const isSource = window !== window.top;
  function open(src, label, isVideo, mirrored) {
    img.hidden = !!isVideo; vid.hidden = !isVideo;
    if (isVideo) { vid.src = src; vid.play().catch(function () {}); } else { img.src = src; }
    cap.textContent = label || "";
    box.classList.add("on");
    if (mbc && isSource && !mirrored) mbc.postMessage({ type: "open", src: src, label: label || "", isVideo: !!isVideo });
  }
  function close(mirrored) {
    box.classList.remove("on"); img.src = ""; vid.pause(); vid.removeAttribute("src");
    if (mbc && isSource && mirrored !== true) mbc.postMessage({ type: "close" });
  }
  if (mbc && !isSource) mbc.onmessage = function (e) {
    const m = e.data || {};
    if (m.type === "open") open(m.src, m.label, m.isVideo, true);
    else if (m.type === "close") close(true);
  };

  document.addEventListener("click", (e) => {
    const t = e.target.closest(".zoomable");
    if (!t) return;
    e.preventDefault();
    let label = t.alt || "";
    const fig = t.closest("figure");
    const capEl = fig && fig.querySelector("figcaption");
    if (capEl) {
      label = [...capEl.childNodes].map((n) => (n.textContent || "").trim()).filter(Boolean).join(" · ");
    } else {
      const ph = t.closest(".ph, .fr, .f3, .ssone, .ssp");
      const lab = ph && ph.querySelector(".phlab");
      if (lab) label = lab.textContent.trim();
    }
    open(t.currentSrc || t.src, label, t.tagName === "VIDEO");
  });
  box.addEventListener("click", function () { close(); });
  window.addEventListener("keydown", (e) => {
    if (!box.classList.contains("on")) return;
    e.stopImmediatePropagation();
    if (e.key === "Escape" || e.key === " " || e.key === "Enter") { e.preventDefault(); close(); }
  }, true);
  document.addEventListener("deck:change", function () { close(); });
})();

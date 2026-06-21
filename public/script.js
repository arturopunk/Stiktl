/* =================================================================
   STIKTL — script.js
   Blobs aurora, reveal, nav scroll, descargador de video.
   ================================================================= */

/* ── Blobs flotantes ── */
function spawnBlobs() {
  const host = document.getElementById("blobs");
  if (!host) return;
  const colors = [
    "rgba(34, 211, 238, 0.50)",
    "rgba(255, 122, 24, 0.42)",
    "rgba(139, 92, 246, 0.38)"
  ];
  for (let i = 0; i < 3; i++) {
    const b = document.createElement("span");
    b.className = "blob";
    const size = 240 + Math.random() * 280;
    b.style.width = b.style.height = `${size}px`;
    b.style.left  = `${Math.random() * 100}%`;
    b.style.top   = `${Math.random() * 100}%`;
    b.style.background = colors[i % colors.length];
    b.style.setProperty("--dx",  `${(Math.random() - 0.5) * 150}px`);
    b.style.setProperty("--dy",  `${(Math.random() - 0.5) * 150}px`);
    b.style.setProperty("--sc",  `${1.05 + Math.random() * 0.35}`);
    b.style.setProperty("--dur", `${20 + Math.random() * 12}s`);
    b.style.animationDelay = `${-Math.random() * 10}s`;
    host.appendChild(b);
  }
}

/* ── Reveal escalonado ── */
function setupReveal() {
  document.querySelectorAll(".reveal").forEach(el => {
    const d = parseInt(el.dataset.delay || "0", 10);
    if (d) el.style.setProperty("--reveal-delay", `${d}ms`);
  });
}

/* ── Sombra del nav al hacer scroll ── */
function setupHeaderScroll() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const fn = () => {
    nav.style.boxShadow = window.scrollY > 16
      ? "0 16px 40px -20px rgba(0,0,0,.75), inset 0 1px 0 rgba(204,208,224,.22)"
      : "";
  };
  window.addEventListener("scroll", fn, { passive: true });
  fn();
}

/* ── Descargador de video ── */
let _dlUrl = null, _dlFile = "video.mp4";

async function stiktlDownload() {
  const url  = (document.getElementById("dlUrl").value || "").trim();
  const btn  = document.getElementById("dlBtn");
  const res2 = document.getElementById("dlResult");

  if (!url.startsWith("http")) { dlStatus("⚠️ Pega un link válido primero.", "warn"); return; }

  btn.disabled = true;
  res2.style.display = "none";
  dlStatus("⏳ Obteniendo video…", "info");
  _dlUrl = null;

  try {
    const r = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ url, videoQuality: "720", filenameStyle: "pretty" }),
    });
    if (!r.ok) throw new Error("El servidor no respondió bien (" + r.status + ")");
    const d = await r.json();

    if (d.status === "error") throw new Error(d.error?.code || "No se pudo obtener el video");

    if (d.status === "redirect" || d.status === "tunnel") {
      _dlUrl  = d.url;
      _dlFile = d.filename || "stiktl-video.mp4";
    } else if (d.status === "picker" && d.picker?.length) {
      const v = d.picker.find(p => p.type === "video") || d.picker[0];
      _dlUrl  = v.url;
      _dlFile = d.filename || "stiktl-video.mp4";
    } else {
      throw new Error("Respuesta inesperada del servidor");
    }

    document.getElementById("dlTitle").textContent =
      _dlFile.replace(/\.[^.]+$/, "").replace(/_/g, " ").slice(0, 55);
    document.getElementById("dlProg").style.display = "none";
    res2.style.display = "flex";
    dlStatus("✅ Video encontrado. Toca 'Guardar'.", "ok");

  } catch (e) {
    dlStatus("❌ " + e.message, "error");
  } finally {
    btn.disabled = false;
  }
}

async function stiktlSave() {
  if (!_dlUrl) return;
  const saveBtn = document.getElementById("dlSaveBtn");
  const prog    = document.getElementById("dlProg");
  const bar     = document.getElementById("dlBar");
  const pct     = document.getElementById("dlPct");
  saveBtn.disabled = true;
  prog.style.display = "flex";
  dlStatus("⬇️ Descargando…", "info");

  try {
    const r = await fetch(_dlUrl);
    if (!r.ok) throw new Error("" + r.status);

    const total  = parseInt(r.headers.get("Content-Length") || "0");
    const reader = r.body.getReader();
    const chunks = [];
    let got = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
      if (total > 0) {
        const p = Math.round(got / total * 100);
        bar.style.width = p + "%";
        pct.textContent = p + "%";
      }
    }

    const blobUrl = URL.createObjectURL(new Blob(chunks));
    const a = Object.assign(document.createElement("a"), { href: blobUrl, download: _dlFile });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
    dlStatus("✅ ¡Guardado!", "ok");
    prog.style.display = "none";

  } catch {
    // CORS fallback: open in new tab so user can long-press to save
    window.open(_dlUrl, "_blank");
    dlStatus("⚠️ Ábrelo y mantenlo presionado para guardar.", "warn");
    prog.style.display = "none";
  } finally {
    saveBtn.disabled = false;
  }
}

function dlStatus(msg, type) {
  const el = document.getElementById("dlStatus");
  if (!el) return;
  el.textContent = msg;
  el.className   = "dl-status dl-status--" + type;
  el.style.display = msg ? "block" : "none";
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  spawnBlobs();
  setupReveal();
  setupHeaderScroll();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  const inp = document.getElementById("dlUrl");
  if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") stiktlDownload(); });
});

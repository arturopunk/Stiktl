/* =================================================================
   STIKTL — script.js (ligero)
   Blobs aurora cyan + naranja, reveal escalonado, sombra de nav y año.
   ================================================================= */

/* Blobs flotantes del fondo (cyan + naranja, la mezcla de marca) */
function spawnBlobs() {
  const host = document.getElementById("blobs");
  if (!host) return;

  const colors = [
    "rgba(34, 211, 238, 0.50)",   // cyan
    "rgba(255, 122, 24, 0.42)",   // naranja
    "rgba(139, 92, 246, 0.38)"    // lila (acento)
  ];
  const COUNT = 3;                 // pocos = fondo fluido

  for (let i = 0; i < COUNT; i++) {
    const blob = document.createElement("span");
    blob.className = "blob";
    const size = 240 + Math.random() * 280;
    blob.style.width = blob.style.height = `${size}px`;
    blob.style.left = `${Math.random() * 100}%`;
    blob.style.top = `${Math.random() * 100}%`;
    blob.style.background = colors[i % colors.length];
    blob.style.setProperty("--dx", `${(Math.random() - 0.5) * 150}px`);
    blob.style.setProperty("--dy", `${(Math.random() - 0.5) * 150}px`);
    blob.style.setProperty("--sc", `${1.05 + Math.random() * 0.35}`);
    blob.style.setProperty("--dur", `${20 + Math.random() * 12}s`);
    blob.style.animationDelay = `${-Math.random() * 10}s`;
    host.appendChild(blob);
  }
}

/* Reveal escalonado: solo aplica el retraso de cada elemento */
function setupReveal() {
  document.querySelectorAll(".reveal").forEach((el) => {
    const delay = parseInt(el.dataset.delay || "0", 10);
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
  });
}

/* Sombra/elevación del nav al hacer scroll (passive = no bloquea) */
function setupHeaderScroll() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const onScroll = () => {
    nav.style.boxShadow = window.scrollY > 16
      ? "0 16px 40px -20px rgba(0,0,0,.75), inset 0 1px 0 rgba(204,208,224,.22)"
      : "";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ===================== DESCARGADOR ===================== */
const API = "https://stiktl-api.railway.app"; // cambia a tu URL de Railway

async function stiktlDownload() {
  const input = document.getElementById("dlUrl");
  const btn   = document.getElementById("dlBtn");
  const status= document.getElementById("dlStatus");
  const result= document.getElementById("dlResult");
  const url   = input.value.trim();

  if (!url || !url.startsWith("http")) {
    setStatus("⚠️ Pega un link válido primero.", "warn"); return;
  }

  btn.disabled = true;
  setStatus("⏳ Obteniendo video…", "info");
  result.style.display = "none";

  try {
    const res = await fetch(`${API}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }

    const data = await res.json();
    document.getElementById("dlTitle").textContent = data.title || "Video";
    const link = document.getElementById("dlLink");
    link.href = data.url;
    link.download = `${data.title || "stiktl-video"}.${data.ext || "mp4"}`;
    const thumb = document.getElementById("dlThumb");
    if (data.thumbnail) { thumb.src = data.thumbnail; thumb.style.display = "block"; }
    else thumb.style.display = "none";
    result.style.display = "flex";
    setStatus("✅ Listo. Toca 'Guardar video'.", "ok");
  } catch (e) {
    setStatus(`❌ ${e.message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

function setStatus(msg, type) {
  const el = document.getElementById("dlStatus");
  el.textContent = msg;
  el.className = `dl-status dl-status--${type}`;
}

// Enter key triggers download
document.addEventListener("DOMContentLoaded", () => {
  const inp = document.getElementById("dlUrl");
  if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") stiktlDownload(); });
});

document.addEventListener("DOMContentLoaded", () => {
  spawnBlobs();
  setupReveal();
  setupHeaderScroll();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

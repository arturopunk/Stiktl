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
async function stiktlDownload() {
  const input  = document.getElementById("dlUrl");
  const btn    = document.getElementById("dlBtn");
  const result = document.getElementById("dlResult");
  const url    = input.value.trim();

  if (!url || !url.startsWith("http")) {
    setStatus("⚠️ Pega un link válido primero.", "warn"); return;
  }

  btn.disabled = true;
  setStatus("⏳ Obteniendo video…", "info");
  result.style.display = "none";

  try {
    // cobalt.tools — API pública, gratis, sin backend propio.
    // Soporta TikTok, Instagram, YouTube, Twitter/X, Reddit y más.
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: "720",
        filenameStyle: "pretty",
      }),
    });

    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
    const data = await res.json();

    // cobalt devuelve status "redirect" o "tunnel" con la URL directa,
    // o "picker" con múltiples opciones (carruseles de Instagram, etc.)
    let videoUrl = null, title = "video";

    if (data.status === "redirect" || data.status === "tunnel") {
      videoUrl = data.url;
      title = data.filename || "stiktl-video";
    } else if (data.status === "picker" && data.picker?.length) {
      // Toma el primer elemento de video del carrusel
      const vid = data.picker.find(p => p.type === "video") || data.picker[0];
      videoUrl = vid.url;
      title = data.filename || "stiktl-video";
    } else if (data.status === "error") {
      throw new Error(data.error?.code || "No se pudo obtener el video");
    } else {
      throw new Error("Respuesta inesperada del servidor");
    }

    // Muestra resultado
    document.getElementById("dlTitle").textContent = title.replace(/\.[^.]+$/, "");
    const link = document.getElementById("dlLink");
    link.href = videoUrl;
    link.setAttribute("download", title);
    // cobalt no devuelve miniatura; ocultamos el thumb
    document.getElementById("dlThumb").style.display = "none";
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

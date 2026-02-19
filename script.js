const config = window.INVITATION_CONFIG;

if (!config) {
  throw new Error("Missing INVITATION_CONFIG. Ensure config.js is loaded before script.js.");
}

const openingOverlay = document.getElementById("openingOverlay");
const openInviteBtn = document.getElementById("openInviteBtn");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const nextSectionBtn = document.getElementById("nextSectionBtn");
const bgMusic = document.getElementById("bgMusic");

let isMusicPlaying = false;
let autoPlayFallbackBound = false;

function normalizeImageUrl(url) {
  if (!url) return "";
  let match = url.match(/drive\.google\.com\/file\/d\/([^/]+)\//);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  match = url.match(/[?&]id=([^&]+)/);
  if (url.includes("drive.google.com") && match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

function renderHeroCalendar() {
  const calendar = config.hero.calendar || {};
  setText("calendarMonth", calendar.month || "");
  setText("calendarDay", calendar.day || "");
  setText("calendarYear", calendar.year || "");
  setText("calendarTime", calendar.time || config.hero.dateLine || "");

  const calendarLink = document.getElementById("calendarLink");
  if (calendarLink) {
    calendarLink.textContent = calendar.addToCalendarLabel || "Add To Calendar";
    calendarLink.href = calendar.addToCalendarUrl || "#";
  }
}

function resolveMapUrls(mapConfig) {
  const explicitOpenUrl = (mapConfig.openUrl || "").trim();
  const explicitEmbedUrl = (mapConfig.embedUrl || "").trim();
  const query = (mapConfig.query || "").trim();

  const isEmbeddable =
    explicitEmbedUrl.includes("output=embed") || explicitEmbedUrl.includes("/maps/embed");

  if (isEmbeddable) {
    return {
      embedUrl: explicitEmbedUrl,
      openUrl: explicitOpenUrl || explicitEmbedUrl
    };
  }

  if (query) {
    const encoded = encodeURIComponent(query);
    return {
      embedUrl: `https://www.google.com/maps?q=${encoded}&z=15&output=embed`,
      openUrl: explicitOpenUrl || `https://www.google.com/maps/search/?api=1&query=${encoded}`
    };
  }

  return {
    embedUrl: explicitEmbedUrl,
    openUrl: explicitOpenUrl
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderCoupleNames(id, partner1, partner2, separatorText) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = "";
  const p1 = document.createElement("span");
  p1.textContent = partner1;
  const sep = document.createElement("span");
  sep.className = "couple-separator";
  sep.textContent = separatorText;
  const p2 = document.createElement("span");
  p2.textContent = partner2;

  el.appendChild(p1);
  el.appendChild(sep);
  el.appendChild(p2);
}

function renderDetails() {
  const container = document.getElementById("detailsGrid");
  if (!container) return;

  container.textContent = "";
  for (const item of config.details) {
    const article = document.createElement("article");
    article.className = "card reveal";

    const header = document.createElement("div");
    header.className = "detail-header";

    const iconWrap = document.createElement("div");
    iconWrap.className = "detail-icon-wrap";
    const icon = document.createElement("img");
    icon.className = "detail-icon";
    icon.src = item.iconSrc || "assets/ring.svg";
    icon.alt = item.iconAlt || "Ring ceremony icon";
    iconWrap.appendChild(icon);
    header.appendChild(iconWrap);

    const textWrap = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = item.title;
    textWrap.appendChild(title);
    if (item.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "detail-subtitle";
      subtitle.textContent = item.subtitle;
      textWrap.appendChild(subtitle);
    }
    header.appendChild(textWrap);
    article.appendChild(header);

    for (const line of item.lines) {
      const p = document.createElement("p");
      p.className = "detail-line";
      p.textContent = line;
      article.appendChild(p);
    }

    container.appendChild(article);
  }
}

function renderGallery() {
  const container = document.getElementById("gallery");
  if (!container) return;

  container.textContent = "";
  for (const photo of config.gallery.photos) {
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";
    container.appendChild(img);
  }
}

function initRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -7% 0px" }
  );

  for (const item of revealItems) observer.observe(item);
}

function applyConfig() {
  document.title = config.meta.pageTitle;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", config.meta.description);

  const separatorText = config.couple.separator || " & ";
  renderCoupleNames("openingNames", config.couple.partner1, config.couple.partner2, separatorText);
  renderCoupleNames("heroNames", config.couple.partner1, config.couple.partner2, separatorText);

  setText("openingEyebrow", config.opening.eyebrow);
  setText("openingSubtitle", config.opening.subtitle);
  setText("openInviteBtn", config.opening.openButtonLabel);

  setText("heroEyebrow", config.hero.eyebrow);
  setText("nextSectionBtn", config.hero.nextSectionLabel || "View Details");
  renderHeroCalendar();

  const openingCoupleImage = document.getElementById("openingCoupleImage");
  if (openingCoupleImage) {
    const configuredImage = normalizeImageUrl(config.resources.heroCoupleImageUrl || "");
    const fallbackImage =
      (config.gallery && config.gallery.photos && config.gallery.photos[0] && config.gallery.photos[0].src) ||
      config.resources.openingBackgroundUrl ||
      "";
    openingCoupleImage.onerror = () => {
      openingCoupleImage.src = fallbackImage;
    };
    openingCoupleImage.src = configuredImage || fallbackImage;
    openingCoupleImage.alt = config.resources.heroCoupleImageAlt || "Couple image";
  }

  setText("inviteHeading", config.invitation.heading);
  setText("inviteBody", config.invitation.body);

  setText("galleryHeading", config.gallery.heading);
  renderDetails();
  renderGallery();

  setText("mapHeading", config.map.heading);
  setText("mapDescription", config.map.description);

  const { embedUrl, openUrl } = resolveMapUrls(config.map || {});

  const mapIframe = document.getElementById("mapIframe");
  if (mapIframe) {
    mapIframe.title = config.map.iframeTitle;
    mapIframe.src = embedUrl;
  }

  const mapLink = document.getElementById("mapLink");
  if (mapLink) {
    mapLink.href = openUrl;
    mapLink.textContent = config.map.openLabel;
  }

  setText("footerPrimary", config.footer.primary);
  setText("footerSecondary", config.footer.secondary);
  setText("audioUnsupportedText", config.system.audioUnsupportedText);

  const audioSource = bgMusic.querySelector("source");
  if (audioSource) {
    audioSource.src = config.resources.musicSrc;
  }
  bgMusic.src = config.resources.musicSrc;
  bgMusic.load();

  document.documentElement.style.setProperty(
    "--opening-bg-image",
    `url("${config.resources.openingBackgroundUrl}")`
  );
  document.documentElement.style.setProperty(
    "--hero-bg-image",
    `url("${config.resources.heroBackgroundUrl}")`
  );
  document.documentElement.style.setProperty(
    "--second-bg-image",
    `url("${config.resources.secondPageBackgroundUrl || config.resources.openingBackgroundUrl}")`
  );

  initRevealAnimations();
}

function updateMusicButton() {
  musicToggleBtn.textContent = isMusicPlaying
    ? config.hero.musicPauseLabel
    : config.hero.musicPlayLabel;
  musicToggleBtn.setAttribute("aria-pressed", String(isMusicPlaying));
}

async function playMusic() {
  try {
    await bgMusic.play();
    isMusicPlaying = true;
    return true;
  } catch (err) {
    isMusicPlaying = false;
    return false;
  } finally {
    updateMusicButton();
  }
}

function pauseMusic() {
  bgMusic.pause();
  isMusicPlaying = false;
  updateMusicButton();
}

openInviteBtn.addEventListener("click", async () => {
  openingOverlay.classList.add("hidden");
  await playMusic();
});

musicToggleBtn.addEventListener("click", async () => {
  if (isMusicPlaying) {
    pauseMusic();
  } else {
    await playMusic();
  }
});

if (nextSectionBtn) {
  nextSectionBtn.addEventListener("click", () => {
    const main = document.querySelector("main");
    if (!main) return;
    main.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

bgMusic.addEventListener("ended", () => {
  isMusicPlaying = false;
  updateMusicButton();
});

async function attemptAutoPlay() {
  const ok = await playMusic();
  if (ok || autoPlayFallbackBound) return;

  autoPlayFallbackBound = true;
  const startOnFirstInteraction = async () => {
    await playMusic();
    window.removeEventListener("click", startOnFirstInteraction);
    window.removeEventListener("touchstart", startOnFirstInteraction);
    window.removeEventListener("keydown", startOnFirstInteraction);
  };

  window.addEventListener("click", startOnFirstInteraction, { once: true });
  window.addEventListener("touchstart", startOnFirstInteraction, { once: true });
  window.addEventListener("keydown", startOnFirstInteraction, { once: true });
}

applyConfig();
updateMusicButton();
attemptAutoPlay();
window.addEventListener("DOMContentLoaded", attemptAutoPlay);
window.addEventListener("load", attemptAutoPlay);

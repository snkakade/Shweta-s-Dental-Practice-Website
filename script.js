(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const loader = document.getElementById("loader");
  const loaderCount = document.getElementById("loaderCount");
  const loaderLine = loader.querySelector(".loader__line i");

  body.classList.add("loading");
  let loaded = 0;
  const loadDuration = reduceMotion ? 100 : 1400;
  const loadStart = performance.now();

  const tickLoader = (time) => {
    const progress = Math.min(1, (time - loadStart) / loadDuration);
    loaded = Math.round(progress * 100);
    loaderCount.textContent = String(loaded).padStart(3, "0");
    loaderLine.style.width = `${loaded}%`;
    if (progress < 1) {
      requestAnimationFrame(tickLoader);
    } else {
      window.setTimeout(() => {
        loader.classList.add("is-done");
        body.classList.remove("loading");
        window.setTimeout(() => loader.remove(), 1200);
      }, reduceMotion ? 0 : 250);
    }
  };
  requestAnimationFrame(tickLoader);

  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({
      autoRaf: true,
      anchors: { offset: -66 },
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: .85
    });
  }

  const header = document.getElementById("header");
  const progressBar = document.getElementById("scrollProgress");
  const updateScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 30);
    progressBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
  };
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  const menuButton = document.getElementById("menuButton");
  const menu = document.getElementById("menu");
  const toggleMenu = (force) => {
    const open = typeof force === "boolean" ? force : !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    menuButton.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("menu-open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuButton.addEventListener("click", () => toggleMenu());
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
  ["doctor", "invisalign"].forEach((sectionId) => {
    document.querySelectorAll(`a[href="#${sectionId}"]`).forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const section = document.getElementById(sectionId);
        history.pushState(null, "", `#${sectionId}`);
        if (lenis) {
          lenis.scrollTo(section, { offset: 0 });
        } else {
          section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }
      });
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleMenu(false);
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: "0px 0px -7% 0px" });
    reveals.forEach((element, index) => {
      element.style.transitionDelay = `${(index % 3) * 70}ms`;
      revealObserver.observe(element);
    });
  } else {
    reveals.forEach((element) => element.classList.add("in-view"));
  }

  const cursor = document.getElementById("cursor");
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let currentX = cursorX;
    let currentY = cursorY;
    window.addEventListener("mousemove", (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
    }, { passive: true });
    const renderCursor = () => {
      currentX += (cursorX - currentX) * .16;
      currentY += (cursorY - currentY) * .16;
      cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();

    document.querySelectorAll("a, button, input, select, [data-cursor]").forEach((element) => {
      element.addEventListener("mouseenter", () => {
        cursor.classList.add("is-active");
        cursor.querySelector("span").textContent = element.dataset.cursor || (element.matches("input, select") ? "Type" : "Open");
      });
      element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    });
  }

  document.querySelectorAll(".magnetic").forEach((element) => {
    if (reduceMotion) return;
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
    });
    element.addEventListener("mouseleave", () => { element.style.transform = ""; });
  });

  const careItems = [...document.querySelectorAll(".care-item")];
  const careVisual = document.querySelector(".care__visual");
  const careNumber = document.getElementById("careNumber");
  const careLabel = document.getElementById("careVisualLabel");
  careItems.forEach((item) => {
    item.querySelector("button").addEventListener("click", () => {
      if (item.classList.contains("is-active")) return;
      careItems.forEach((other) => {
        other.classList.remove("is-active");
        other.querySelector("button").setAttribute("aria-expanded", "false");
      });
      item.classList.add("is-active");
      item.querySelector("button").setAttribute("aria-expanded", "true");
      careVisual.classList.add("is-changing");
      window.setTimeout(() => {
        careNumber.textContent = item.dataset.number;
        careLabel.textContent = item.dataset.care;
        careVisual.classList.remove("is-changing");
      }, 260);
    });
  });

  const processSteps = [...document.querySelectorAll(".process-step")];
  const processMeter = document.getElementById("processMeter");
  if ("IntersectionObserver" in window) {
    const processObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = processSteps.indexOf(entry.target);
          processMeter.style.width = `${(index + 1) * 25}%`;
        }
      });
    }, { threshold: .5 });
    processSteps.forEach((step) => processObserver.observe(step));
  }

  const invisalignSection = document.getElementById("invisalign");
  const invisalignProduct = document.getElementById("invisalignProduct");
  const invisalignSmile = document.getElementById("invisalignSmile");
  const invisalignDetail = document.getElementById("invisalignDetail");
  const invisalignVideo = document.getElementById("invisalignVideo");
  const invisalignOrbit = invisalignSection.querySelector(".invisalign__orbit");
  const invisalignProgress = document.getElementById("invisalignProgress");
  const invisalignProgressLabel = document.getElementById("invisalignProgressLabel");
  const invisalignBeats = [...invisalignSection.querySelectorAll(".invisalign__beat")];
  const desktopInvisalign = window.matchMedia("(min-width: 981px)");
  let activeInvisalignBeat = 0;
  let invisalignFrame = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const resetInvisalignMotion = () => {
    [invisalignProduct, invisalignSmile, invisalignDetail, invisalignVideo, invisalignOrbit].forEach((element) => {
      element.style.removeProperty("transform");
      element.style.removeProperty("opacity");
    });
    invisalignProgress.style.removeProperty("width");
  };
  const renderInvisalign = () => {
    invisalignFrame = 0;
    if (!desktopInvisalign.matches || reduceMotion) {
      resetInvisalignMotion();
      return;
    }

    const rect = invisalignSection.getBoundingClientRect();
    const distance = Math.max(1, invisalignSection.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance);
    const driftX = (progress - .45) * 145;
    const driftY = Math.sin(progress * Math.PI) * -42 + progress * 58;
    const rotation = -10 + progress * 25;
    const scale = 1 + Math.sin(progress * Math.PI) * .12;
    const smileReveal = clamp((progress - .2) / .27);
    const detailReveal = clamp((progress - .58) / .24);

    invisalignSection.style.setProperty("--invis-progress", progress.toFixed(3));
    invisalignProduct.style.transform = `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) rotate(${rotation}deg) scale(${scale})`;
    invisalignSmile.style.opacity = smileReveal.toFixed(3);
    invisalignSmile.style.transform = `translateY(${(1 - smileReveal) * 70}px) scale(${.75 + smileReveal * .25})`;
    invisalignDetail.style.opacity = detailReveal.toFixed(3);
    invisalignDetail.style.transform = `translate(${(1 - detailReveal) * 50}px, ${(1 - detailReveal) * 50}px) rotate(${8 - detailReveal * 13}deg) scale(${.8 + detailReveal * .2})`;
    invisalignVideo.style.opacity = String(.34 - progress * .15);
    invisalignVideo.style.transform = `scale(${1.05 + progress * .05}) translateY(${progress * -14}px)`;
    invisalignOrbit.style.transform = `translate(-50%, -50%) rotate(${progress * 125}deg)`;
    invisalignProgress.style.width = `${progress * 100}%`;

    const nextBeat = Math.min(2, Math.floor(progress * 3));
    if (nextBeat !== activeInvisalignBeat) {
      activeInvisalignBeat = nextBeat;
      invisalignBeats.forEach((beat, index) => beat.classList.toggle("is-active", index === activeInvisalignBeat));
      invisalignProgressLabel.textContent = String(activeInvisalignBeat + 1).padStart(2, "0");
    }
  };
  const queueInvisalignRender = () => {
    if (!invisalignFrame) invisalignFrame = requestAnimationFrame(renderInvisalign);
  };

  window.addEventListener("scroll", queueInvisalignRender, { passive: true });
  window.addEventListener("resize", queueInvisalignRender);
  desktopInvisalign.addEventListener("change", queueInvisalignRender);
  renderInvisalign();

  if ("IntersectionObserver" in window && !reduceMotion) {
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        invisalignVideo.play().catch(() => {});
      } else {
        invisalignVideo.pause();
      }
    }, { threshold: .08 });
    videoObserver.observe(invisalignSection);
  } else if (reduceMotion) {
    invisalignVideo.pause();
  }

  const scannerMedia = document.getElementById("scannerMedia");
  const scannerVideo = document.getElementById("scannerVideo");
  const activateScannerVideo = () => {
    scannerMedia.classList.add("is-playable");
    if (!reduceMotion) scannerVideo.play().catch(() => {});
  };
  scannerVideo.addEventListener("canplay", activateScannerVideo, { once: true });
  if (scannerVideo.readyState >= 3) activateScannerVideo();

  if ("IntersectionObserver" in window && !reduceMotion) {
    const scannerObserver = new IntersectionObserver(([entry]) => {
      if (!scannerMedia.classList.contains("is-playable")) return;
      if (entry.isIntersecting) {
        scannerVideo.play().catch(() => {});
      } else {
        scannerVideo.pause();
      }
    }, { threshold: .15 });
    scannerObserver.observe(scannerMedia);
  }

  const compareSlider = document.getElementById("compareSlider");
  const beforeLayer = document.getElementById("beforeLayer");
  const compareLine = document.getElementById("compareLine");
  const updateComparison = () => {
    const value = `${compareSlider.value}%`;
    beforeLayer.style.width = value;
    compareLine.style.left = value;
  };
  compareSlider.addEventListener("input", updateComparison);
  updateComparison();

  const quotes = [...document.querySelectorAll(".quote")];
  const quoteCurrent = document.getElementById("quoteCurrent");
  let quoteIndex = 0;
  const showQuote = (next) => {
    quoteIndex = (next + quotes.length) % quotes.length;
    quotes.forEach((quote, index) => quote.classList.toggle("is-active", index === quoteIndex));
    quoteCurrent.textContent = String(quoteIndex + 1).padStart(2, "0");
  };
  document.getElementById("quotePrev").addEventListener("click", () => showQuote(quoteIndex - 1));
  document.getElementById("quoteNext").addEventListener("click", () => showQuote(quoteIndex + 1));

  const bookingForm = document.getElementById("bookingForm");
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(bookingForm);
    const message = [
      "Hello Dr. Shweta, I'd like to request an appointment.",
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Interested in: ${data.get("interest")}`,
      data.get("message") ? `Message: ${data.get("message")}` : ""
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/918605864503?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const loader = document.getElementById("loader");
  const loaderCount = document.getElementById("loaderCount");
  const loaderLine = loader.querySelector(".loader__line i");

  body.classList.add("loading");
  const loadDuration = reduceMotion ? 100 : 1100;
  const loadStart = performance.now();
  const tickLoader = (time) => {
    const progress = Math.min(1, (time - loadStart) / loadDuration);
    const loaded = Math.round(progress * 100);
    loaderCount.textContent = String(loaded).padStart(3, "0");
    loaderLine.style.width = `${loaded}%`;
    if (progress < 1) {
      requestAnimationFrame(tickLoader);
    } else {
      window.setTimeout(() => {
        loader.classList.add("is-done");
        body.classList.remove("loading");
        window.setTimeout(() => loader.remove(), 1200);
      }, reduceMotion ? 0 : 180);
    }
  };
  requestAnimationFrame(tickLoader);

  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ autoRaf: true, anchors: { offset: -66 }, duration: 1.15, smoothWheel: true, wheelMultiplier: .85 });
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleMenu(false);
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: "0px 0px -7% 0px" });
    reveals.forEach((element, index) => {
      element.style.transitionDelay = `${(index % 2) * 80}ms`;
      observer.observe(element);
    });
  } else {
    reveals.forEach((element) => element.classList.add("in-view"));
  }

  const cursor = document.getElementById("cursor");
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    window.addEventListener("mousemove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });
    const renderCursor = () => {
      currentX += (targetX - currentX) * .16;
      currentY += (targetY - currentY) * .16;
      cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    };
    renderCursor();
    document.querySelectorAll("a, button, .compare").forEach((element) => {
      element.addEventListener("mouseenter", () => {
        cursor.classList.add("is-active");
        cursor.querySelector("span").textContent = element.classList.contains("compare") ? "Drag" : "Open";
      });
      element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    });
  }

  document.querySelectorAll(".magnetic").forEach((element) => {
    if (reduceMotion) return;
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px, ${(event.clientY - rect.top - rect.height / 2) * .12}px)`;
    });
    element.addEventListener("mouseleave", () => { element.style.transform = ""; });
  });

  const comparisons = [...document.querySelectorAll(".compare")];
  const cycleDuration = 3600;
  const animationStart = performance.now();
  const easeInOutSine = (value) => -(Math.cos(Math.PI * value) - 1) / 2;
  const syncedPercent = (now = performance.now()) => {
    const phase = ((now - animationStart) % (cycleDuration * 2)) / cycleDuration;
    return phase <= 1 ? easeInOutSine(phase) * 100 : (1 - easeInOutSine(phase - 1)) * 100;
  };

  comparisons.forEach((compare) => {
    const after = compare.querySelector(".compare-after");
    const line = compare.querySelector(".compare-line");
    const handle = compare.querySelector(".compare-handle");
    const afterTag = compare.querySelector(".tag-after");
    const beforeTag = compare.querySelector(".tag-before");
    let hovered = false;
    let dragging = false;
    let focused = false;
    let currentPercent = 50;

    const render = (percent, animate = false) => {
      const safe = Math.max(0, Math.min(100, percent));
      const transition = animate ? "220ms ease" : "none";
      currentPercent = safe;
      after.style.transition = `clip-path ${transition}`;
      line.style.transition = `left ${transition}`;
      handle.style.transition = `left ${transition}`;
      after.style.clipPath = `inset(0 ${100 - safe}% 0 0)`;
      line.style.left = `${safe}%`;
      handle.style.left = `${safe}%`;
      afterTag.style.opacity = safe > 80 ? "1" : ".5";
      beforeTag.style.opacity = safe < 20 ? "1" : ".5";
      compare.setAttribute("aria-valuenow", String(Math.round(safe)));
      compare.setAttribute("aria-valuetext", safe < 20 ? "Mostly before view" : safe > 80 ? "Mostly after view" : "Mixed before and after view");
    };
    const positionFromEvent = (event) => {
      const rect = compare.getBoundingClientRect();
      render(((event.clientX - rect.left) / rect.width) * 100);
    };

    compare.addEventListener("mouseenter", () => {
      hovered = true;
      if (!dragging) render(50, true);
    });
    compare.addEventListener("mouseleave", () => {
      hovered = false;
      if (!dragging) render(syncedPercent(), true);
    });
    compare.addEventListener("pointerdown", (event) => {
      dragging = true;
      compare.setPointerCapture(event.pointerId);
      positionFromEvent(event);
    });
    compare.addEventListener("pointermove", (event) => {
      if (dragging) positionFromEvent(event);
    });
    compare.addEventListener("pointerup", (event) => {
      dragging = false;
      if (compare.hasPointerCapture(event.pointerId)) compare.releasePointerCapture(event.pointerId);
      if (!hovered) render(syncedPercent(), true);
    });
    compare.addEventListener("pointercancel", () => {
      dragging = false;
      if (!hovered) render(syncedPercent(), true);
    });
    compare.addEventListener("focus", () => {
      focused = true;
      render(50, true);
    });
    compare.addEventListener("blur", () => {
      focused = false;
      if (!hovered && !dragging) render(syncedPercent(), true);
    });
    compare.addEventListener("keydown", (event) => {
      let next = currentPercent;
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") next -= 5;
      else if (event.key === "ArrowRight" || event.key === "ArrowUp") next += 5;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 100;
      else return;
      event.preventDefault();
      render(next, true);
    });

    compare.renderAuto = (percent) => {
      if (!hovered && !dragging && !focused) render(percent);
    };
    render(50);
  });

  const animateComparisons = (now) => {
    const percent = reduceMotion ? 50 : syncedPercent(now);
    comparisons.forEach((compare) => compare.renderAuto(percent));
    if (!reduceMotion) requestAnimationFrame(animateComparisons);
  };
  animateComparisons(performance.now());

  document.getElementById("year").textContent = new Date().getFullYear();
})();

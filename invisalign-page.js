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
  document.querySelectorAll('a[href="#starting-point"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const title = document.getElementById("starting-title");
      const target = title.getBoundingClientRect().top + window.scrollY - 84;
      history.pushState(null, "", "#starting-point");
      if (lenis) {
        lenis.scrollTo(target);
      } else {
        window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });
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
      element.style.transitionDelay = `${(index % 3) * 65}ms`;
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
    document.querySelectorAll("a, button").forEach((element) => {
      element.addEventListener("mouseenter", () => {
        cursor.classList.add("is-active");
        cursor.querySelector("span").textContent = element.classList.contains("concern-card") ? "Choose" : "Open";
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

  const concernData = {
    overlap: {
      number: "01",
      label: "Deep overlap",
      title: "When the upper teeth cover more of the lower teeth.",
      summary: "We look at how the front teeth meet, how the back teeth support the bite and whether there are signs of wear or discomfort.",
      assess: "Bite depth, tooth position, jaw relationship and gum health.",
      plan: "Carefully sequenced tooth movement, attachments and regular progress reviews."
    },
    under: {
      number: "02",
      label: "Lower teeth ahead",
      title: "When the lower teeth sit in front of the upper teeth.",
      summary: "The relationship between the teeth and jaws needs careful assessment. Some presentations may suit aligners, while others need a different or combined approach.",
      assess: "Jaw relationship, facial growth, tooth position and functional movement.",
      plan: "A personalised aligner sequence or referral for additional specialist input."
    },
    cross: {
      number: "03",
      label: "Uneven bite",
      title: "When some upper teeth bite inside the lower teeth.",
      summary: "An uneven bite can involve one tooth or a wider part of the arch. The position and cause guide what movement is realistic.",
      assess: "Which teeth are involved, arch width, jaw position and available space.",
      plan: "Targeted expansion or tooth movement with close monitoring of the bite."
    },
    spacing: {
      number: "04",
      label: "Spaces",
      title: "When visible gaps interrupt the line of the smile.",
      summary: "Spacing can relate to tooth size, missing teeth, gum health or the way the tongue and lips function. Closing a gap is only one part of planning it well.",
      assess: "Gap distribution, tooth proportions, gum condition and long-term stability.",
      plan: "Space closure, redistribution or a combined restorative and aligner plan."
    },
    open: {
      number: "05",
      label: "Open bite",
      title: "When the front teeth stay apart as the back teeth meet.",
      summary: "We consider the bite pattern alongside habits, tongue posture and jaw relationships before deciding whether aligners are appropriate.",
      assess: "Where the bite is open, oral habits, growth pattern and tooth contact.",
      plan: "Controlled vertical tooth movement, habit management or multidisciplinary care."
    },
    crowding: {
      number: "06",
      label: "Crowding",
      title: "When teeth overlap because space is limited.",
      summary: "Creating a balanced result means understanding how much space is needed and how to gain it without compromising gum support or facial balance.",
      assess: "Degree of overlap, arch shape, gum support and tooth proportions.",
      plan: "Staged alignment with carefully planned space creation and retention."
    },
    growing: {
      number: "07",
      label: "Growing smile",
      title: "When baby and adult teeth share a changing smile.",
      summary: "Timing matters in a growing mouth. We assess dental development and whether treatment now, later or in phases would be most helpful.",
      assess: "Eruption stage, available space, jaw growth and developing bite.",
      plan: "Monitoring, early guidance or a phased aligner approach where appropriate."
    },
    refine: {
      number: "08",
      label: "Small refinements",
      title: "When the smile is mostly aligned but a few details remain.",
      summary: "Even modest changes need a stable bite and healthy foundations. We focus on proportion, symmetry and how the final position can be maintained.",
      assess: "Minor rotations, small spaces, bite contacts and previous treatment history.",
      plan: "A focused aligner sequence followed by a personalised retention plan."
    }
  };

  const concernCards = [...document.querySelectorAll(".concern-card")];
  const detail = document.getElementById("concern-detail");
  const detailFields = {
    number: document.getElementById("concernNumber"),
    label: document.getElementById("concernLabel"),
    title: document.getElementById("concernTitle"),
    summary: document.getElementById("concernSummary"),
    assess: document.getElementById("concernAssess"),
    plan: document.getElementById("concernPlan")
  };
  const concernLegal = document.querySelector(".starting-point__legal");

  const revealConcernDetail = () => {
    if (!concernLegal.classList.contains("in-view")) {
      window.setTimeout(() => concernLegal.classList.add("in-view"), reduceMotion ? 0 : 280);
    }
    window.setTimeout(() => {
      const target = Math.max(0, concernLegal.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 28);
      if (lenis) {
        lenis.scrollTo(target);
      } else {
        window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }, reduceMotion ? 0 : 220);
  };

  const selectConcern = (card, moveFocus = false) => {
    const selected = concernData[card.dataset.concern];
    concernCards.forEach((item) => {
      const active = item === card;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    detail.classList.add("is-changing");
    window.setTimeout(() => {
      Object.entries(detailFields).forEach(([key, field]) => {
        field.textContent = selected[key];
      });
      detail.classList.remove("is-changing");
    }, reduceMotion ? 0 : 180);
    if (moveFocus) card.focus();
  };

  concernCards.forEach((card, index) => {
    card.tabIndex = index === 0 ? 0 : -1;
    card.addEventListener("click", () => {
      selectConcern(card);
      revealConcernDetail();
    });
    card.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % concernCards.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + concernCards.length) % concernCards.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = concernCards.length - 1;
      else return;
      event.preventDefault();
      selectConcern(concernCards[nextIndex], true);
    });
  });

  const videos = [...document.querySelectorAll("video")];
  if ("IntersectionObserver" in window && !reduceMotion) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    }, { threshold: .08 });
    videos.forEach((video) => videoObserver.observe(video));
  } else if (reduceMotion) {
    videos.forEach((video) => video.pause());
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();

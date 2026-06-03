/* EMI 2026 deck — reveal.js initialization and conference chrome.
 *
 * Loads after components.js. Initializes reveal.js with a calm fade
 * transition, a brand-coloured progress bar, a native "current / total"
 * page number (bottom-right), subtle edge controls, a persistent talk-
 * title footer, and a discoverable overview-mode button (bottom-left).
 * Data is read from window.EMI_DATA, which build.py inlines into
 * index.html so the deck works offline under file:// (no fetch/CORS).
 *
 * After Reveal is ready, EMI.autoInit() wires up any [data-emi]
 * elements the section authors placed in their slides.
 */

(function (global) {
  "use strict";

  var TALK_TITLE =
    "Generating Surrogates — Transformer-HyperNetwork for Wind Response";

  // Custom grid (slide-sorter) overview, built by EMI.slideGrid and
  // created on Reveal ready. Replaces reveal's native single-row
  // overview (which is disabled). The bottom-left button + the O and
  // Esc keys all route here.
  var slideGrid = null;
  var overviewButton = null;

  function syncOverviewButton() {
    if (overviewButton) {
      overviewButton.classList.toggle(
        "is-active", Boolean(slideGrid && slideGrid.isOpen())
      );
    }
  }

  function toggleGrid() {
    if (slideGrid) {
      slideGrid.toggle();
      syncOverviewButton();
    }
  }

  function closeGrid() {
    if (slideGrid) {
      slideGrid.close();
      syncOverviewButton();
    }
  }

  // Persistent footer carrying only the talk title (bottom-left). The
  // live page number is rendered by reveal's native slide-number
  // ("c/t", bottom-right) so it appears on every slide, including the
  // title. The footer hides on any slide opting out via .no-footer or
  // data-state="no-footer".
  function installFooter() {
    var footer = document.createElement("div");
    footer.className = "deck-footer";

    var titleSpan = document.createElement("span");
    titleSpan.className = "footer-title";
    titleSpan.textContent = TALK_TITLE;

    footer.appendChild(titleSpan);
    document.querySelector(".reveal").appendChild(footer);

    function update() {
      var slide = global.Reveal.getCurrentSlide();
      var hide = slide && (
        slide.classList.contains("no-footer") ||
        slide.getAttribute("data-state") === "no-footer"
      );
      footer.classList.toggle("hidden", Boolean(hide));
    }

    global.Reveal.on("ready", update);
    global.Reveal.on("slidechanged", update);
  }

  // Fixed, on-screen overview toggle (bottom-left) so the grid view is
  // discoverable without knowing the O / Esc shortcuts. Opens the custom
  // EMI.slideGrid overlay; pressed state tracks whether the grid is open.
  function installOverviewButton() {
    overviewButton = document.createElement("button");
    overviewButton.className = "overview-toggle";
    overviewButton.setAttribute("type", "button");
    overviewButton.setAttribute("aria-label", "Toggle slide overview");
    overviewButton.setAttribute("title", "Slide overview (O / Esc)");
    // 3x3 grid glyph.
    overviewButton.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" ' +
      'aria-hidden="true" focusable="false">' +
      '<rect x="3" y="3" width="6" height="6" rx="1.5"></rect>' +
      '<rect x="15" y="3" width="6" height="6" rx="1.5"></rect>' +
      '<rect x="3" y="15" width="6" height="6" rx="1.5"></rect>' +
      '<rect x="15" y="15" width="6" height="6" rx="1.5"></rect>' +
      "</svg>";

    overviewButton.addEventListener("click", toggleGrid);
    document.querySelector(".reveal").appendChild(overviewButton);
  }

  function init() {
    if (!global.Reveal) {
      global.console.error("reveal.js failed to load (lib/reveal).");
      return;
    }

    var plugins = [];
    if (global.RevealNotes) {
      plugins.push(global.RevealNotes);
    }
    if (global.RevealHighlight) {
      plugins.push(global.RevealHighlight);
    }
    if (global.RevealZoom) {
      plugins.push(global.RevealZoom);
    }

    global.Reveal.initialize({
      width: 1280,
      height: 720,
      margin: 0.06,
      minScale: 0.2,
      maxScale: 2.0,
      hash: true,
      controls: true,
      controlsTutorial: false,
      // Cluster nav arrows in the bottom-right corner instead of the
      // vertical edges, so they no longer intrude into tables/charts
      // (round-2 review). Page number sits bottom-center to clear them.
      controlsLayout: "bottom-right",
      progress: true,
      slideNumber: "c/t",
      showSlideNumber: "all",
      // Disable reveal's native single-row overview; we use the custom
      // EMI.slideGrid (slide-sorter) instead. O toggles it, Esc closes.
      overview: false,
      keyboard: {
        79: toggleGrid, // "O"
        27: closeGrid // Esc
      },
      transition: "fade",
      transitionSpeed: "default",
      backgroundTransition: "fade",
      fragmentInURL: true,
      center: true,
      plugins: plugins
    });

    global.Reveal.on("ready", function () {
      installFooter();
      if (global.EMI && typeof global.EMI.slideGrid === "function") {
        slideGrid = global.EMI.slideGrid({ onChange: syncOverviewButton });
      }
      installOverviewButton();
      if (global.EMI && typeof global.EMI.autoInit === "function") {
        global.EMI.autoInit();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);

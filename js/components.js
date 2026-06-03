/* EMI 2026 deck — shared interactive components (vanilla JS, no deps).
 * ===================================================================
 *
 * All rendering is dependency-free (Canvas + SVG + DOM). Every
 * component reads from `window.EMI_DATA` and tolerates missing data by
 * drawing a labelled placeholder, so section authors can develop their
 * slides before data-prep finishes.
 *
 * Colour convention (matches css/theme.css): FEM = --primary (blue,
 * solid), NN = --accent (orange, solid), reference = dashed grey.
 *
 * -------------------------------------------------------------------
 * PUBLIC API  (window.EMI)
 * -------------------------------------------------------------------
 *
 *   EMI.overlay(element, options)
 *     Line chart of FEM (blue) vs NN (orange) top-floor displacement
 *     over time, with interactive controls. Always shows the FINAL
 *     model (orange) vs FEM (blue) — there is no version toggle.
 *     options = {
 *       load:    "wind" | "constant" | "sine" | "impulse"  (default "wind")
 *       floor:   integer top-floor index (informational; data is the
 *                top-floor series baked by data-prep)         (optional)
 *       controls: boolean — show load-class + Play controls (default true)
 *       play:    boolean — show the Play (time-sweep) button (default true)
 *       autoplay: boolean — auto-run the sweep when the slide becomes
 *                current, re-running on each entry (default true; never
 *                fires in print/PDF). Load-class buttons are prominent.
 *     }
 *     (Any legacy `version` option is ignored; the final model is used.)
 *     Returns a handle: { redraw(), setLoad(name), startPlay(), destroy() }.
 *
 *   EMI.mimo(element, options)
 *     Two stacked SVG panels for one load class (window.EMI_DATA.mimo):
 *     TOP applied forces per shown floor (multi-force input); BOTTOM
 *     per-floor displacement, FEM (solid) vs final model (dashed accent).
 *     options = { load: "wind"|"constant"|"sine"|"impulse" (default wind) }
 *     Load-class buttons + autoplay sweep on entry (static in print).
 *     Returns { redraw(), setLoad(name), startSweep(), destroy() }.
 *
 *   EMI.bars(element, options)
 *     Animated bar chart of the FINAL model's population NRMSE — ONE bar
 *     per load class (wind, constant, sine, impulse), log y-axis, values
 *     shown as %. No v1/v2/v3 versions. Impulse (54.2%) is tinted --bad
 *     and labelled "current limit". Staged by reveal fragments: each
 *     fragmentshown reveals one more class, in order; with no fragments
 *     all four bars show on slide entry.
 *     options = {
 *       metric: key under results (default "population_nrmse")
 *     }
 *     Returns { redraw(), showGroups(n), destroy() }.
 *
 *   EMI.architecture(element)
 *     SVG data-flow diagram with TWO inputs: (1) building features ->
 *     per-feature tokens -> transformer self-attention -> generated
 *     weights (the hyper-network), and (2) a wind-load time-history that
 *     feeds the conditional LSTM (response network) -> response curve.
 *     Advances one stage per reveal fragment in the containing section
 *     (fragmentshown events); the wind-load input appears with the LSTM
 *     stage. With no fragments present, all stages show immediately.
 *     Returns { showStage(i), redraw(), destroy() }.
 *
 *   EMI.speedup(element, options)
 *     Animated proportional visual of the ~7,000x speedup (OpenSees
 *     ~80 s/building vs batched GPU inference). Two comparison tracks
 *     plus a count-up of the ratio. Not a literal 7000 bars.
 *     options = { ratio, seconds_per_building } (default from results)
 *     Returns { animate(), redraw(), destroy() }.
 *
 *   EMI.counter(element, target, options)
 *     Count-up number animation that fires when the element's slide
 *     becomes current.
 *     options = {
 *       decimals: integer (default 0)
 *       prefix:   string (default "")
 *       suffix:   string (default "")
 *       duration: ms (default 900)
 *       separator: boolean — thousands separator (default true)
 *       colorClass: one of "", "accent", "good", "bad", "ink"
 *     }
 *     Returns { play(), reset() }.
 *
 *   EMI.diagramOneVsMany(element)
 *     Native SVG schematic (slide 3): "one model per building" (✗) vs
 *     "one shared HyperNetwork" (✓), with a center VS divider. Real,
 *     slide-scaled text. Static (print-safe). Redraws on resize.
 *     Returns { redraw(), destroy() }.
 *
 *   EMI.diagramBilinear(element)
 *     Native SVG force–displacement bilinear backbone (slide 7): slope
 *     k0 to a yield point, then gamma*k0; dashed helpers to the axes
 *     labelled delta_y / F_y (real subscript glyphs). Static. Redraws
 *     on resize. Returns { redraw(), destroy() }.
 *
 *   EMI.autoInit()
 *     Scans the document for [data-emi] elements and instantiates the
 *     matching component using data-* attributes. Called by deck.js
 *     after Reveal.initialize. Data-hook attributes:
 *       data-emi="overlay"  data-load data-version data-floor
 *                           data-controls data-play data-autoplay
 *       data-emi="bars"     data-metric
 *       data-emi="mimo"     data-load
 *       data-emi="architecture"
 *       data-emi="diagram-one-vs-many"
 *       data-emi="diagram-bilinear"
 *       data-emi="speedup"  data-ratio data-seconds
 *       data-emi="counter"  data-target data-decimals data-prefix
 *                           data-suffix data-color
 *
 * -------------------------------------------------------------------
 * EXPECTED window.EMI_DATA SCHEMA  (produced by data-prep, inlined by
 * build.py). Components degrade gracefully if a key is null/missing.
 * -------------------------------------------------------------------
 *
 *   window.EMI_DATA = {
 *     overlays: {
 *       meta: { dt_stored, n_steps, n_downsampled, floor_top_index,
 *               demo_building, ... },
 *       wind:     { v1:{t:[...],fem:[...],nn:[...]}, v2:{...}, v3:{...} },
 *       constant: { ... }, sine: { ... }, impulse: { ... }
 *     },
 *     results: {
 *       population_nrmse: {
 *         wind:{v1,v2,v3}, constant:{...}, sine:{...}, impulse:{...} },
 *       headline: { nrmse_160_before, nrmse_160_after, nrmse_9k_mean_pct,
 *                   nrmse_9k_median_pct, speedup, opensees_s_per_building,
 *                   n_buildings_9k, n_test },
 *       scalability:   [ { metric, b160, k9_zeropad, k9_interp }, ... ],
 *       stratified_sine:[ { bin, v3_n, v3_mean, v2_n, v2_mean }, ... ]
 *     }
 *   }
 */

(function (global) {
  "use strict";

  var EMI = {};

  // ---- Palette: resolved once from the CSS custom properties so the
  //      canvas drawing stays in sync with theme.css. ----------------
  var PALETTE = null;

  function palette() {
    if (PALETTE) {
      return PALETTE;
    }
    var style = global.getComputedStyle(document.documentElement);
    function readVar(name, fallback) {
      var value = style.getPropertyValue(name);
      return value && value.trim() ? value.trim() : fallback;
    }
    PALETTE = {
      ink: readVar("--ink", "#1d1d1f"),
      inkSoft: readVar("--ink-soft", "#4b4b4f"),
      inkMute: readVar("--ink-mute", "#86868b"),
      bg: readVar("--bg", "#ffffff"),
      bgAlt: readVar("--bg-alt", "#f5f5f7"),
      line: readVar("--line", "#d2d2d7"),
      primary: readVar("--primary", "#0071e3"),
      primaryDk: readVar("--primary-dk", "#0a4fa0"),
      accent: readVar("--accent", "#ff9f0a"),
      good: readVar("--good", "#34c759"),
      bad: readVar("--bad", "#ff3b30"),
      fontSans: readVar("--font-sans", "sans-serif"),
      fontMono: readVar("--font-mono", "monospace")
    };
    return PALETTE;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  // ---- Small shared helpers ---------------------------------------

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function svgElement(tag, attributes) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attributes) {
      Object.keys(attributes).forEach(function (key) {
        node.setAttribute(key, attributes[key]);
      });
    }
    return node;
  }

  // Build an SVG <text> with mixed normal / subscript runs so math
  // glyphs (k0, gamma*k0, delta_y, F_y) render as real, crisp,
  // slide-scaled text with genuinely LOWERED subscripts.
  //
  // NOTE: Chromium ignores the SVG `baseline-shift:"sub"` keyword on
  // <tspan> (it renders the run inline at the normal baseline). We
  // therefore lower subscripts with an explicit `dy` offset + smaller
  // font-size. `dy` is CUMULATIVE across tspans, so the first run that
  // enters subscript state carries dy=+0.16em (down) and the first
  // normal run after it carries dy=-0.16em to return to the baseline.
  // segments: array of { t, sub }.
  function svgMathText(attributes, segments) {
    var text = svgElement("text", attributes);
    var lowered = false;
    segments.forEach(function (segment) {
      var attrs = {};
      if (segment.sub) {
        attrs["font-size"] = "0.68em";
        if (!lowered) {
          attrs.dy = "0.16em"; // move the baseline DOWN once
          lowered = true;
        }
      } else if (lowered) {
        attrs.dy = "-0.16em"; // return to the normal baseline
        lowered = false;
      }
      var tspan = svgElement("tspan", attrs);
      tspan.textContent = segment.t;
      text.appendChild(tspan);
    });
    return text;
  }

  // Draw a friendly placeholder when data is unavailable.
  function drawPlaceholder(element, message) {
    clearElement(element);
    var box = makeElement("div", "placeholder", message);
    element.appendChild(box);
  }

  // Set up a crisp, correctly-scaled canvas filling its container.
  // Returns { canvas, context, width, height } in CSS pixels.
  function mountCanvas(element) {
    clearElement(element);
    var canvas = makeElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    element.appendChild(canvas);
    return resizeCanvas(canvas);
  }

  function resizeCanvas(canvas) {
    var ratio = global.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(10, Math.round(rect.width));
    var height = Math.max(10, Math.round(rect.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    var context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return {
      canvas: canvas,
      context: context,
      width: width,
      height: height
    };
  }

  function extent(values) {
    var lo = Infinity;
    var hi = -Infinity;
    for (var index = 0; index < values.length; index += 1) {
      var value = values[index];
      if (value < lo) {
        lo = value;
      }
      if (value > hi) {
        hi = value;
      }
    }
    if (!isFinite(lo) || !isFinite(hi)) {
      return [0, 1];
    }
    if (lo === hi) {
      return [lo - 1, hi + 1];
    }
    return [lo, hi];
  }

  function easeOutCubic(t) {
    var inv = 1 - t;
    return 1 - inv * inv * inv;
  }

  // Find the reveal <section> that contains an element, if any.
  function containingSection(element) {
    var node = element;
    while (node && node !== document.body) {
      if (node.tagName === "SECTION") {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  // Register a callback that runs when the element's slide becomes the
  // current reveal slide (and immediately, if it already is).
  function onSlideEnter(element, callback) {
    var section = containingSection(element);
    function maybeFire(currentSlide) {
      if (!section) {
        callback();
        return;
      }
      if (currentSlide === section || section.contains(currentSlide)) {
        callback();
      }
    }
    if (global.Reveal && global.Reveal.isReady && global.Reveal.isReady()) {
      maybeFire(global.Reveal.getCurrentSlide());
    }
    if (global.Reveal && global.Reveal.on) {
      global.Reveal.on("slidechanged", function (event) {
        maybeFire(event.currentSlide);
      });
      global.Reveal.on("ready", function (event) {
        maybeFire(event.currentSlide);
      });
    } else {
      // Reveal not yet present — fire on next tick as a fallback.
      global.setTimeout(callback, 0);
    }
  }

  // Count the visible fragments inside an element's section. Used by
  // stage-driven components (architecture, bars).
  function visibleFragmentCount(element) {
    var section = containingSection(element);
    if (!section) {
      return 0;
    }
    return section.querySelectorAll(".fragment.visible").length;
  }

  // Register fragment-stage callbacks scoped to the element's section.
  function onFragmentChange(element, callback) {
    var section = containingSection(element);
    function fire() {
      callback(visibleFragmentCount(element));
    }
    if (global.Reveal && global.Reveal.on) {
      global.Reveal.on("fragmentshown", function (event) {
        if (!section || section.contains(event.fragment)) {
          fire();
        }
      });
      global.Reveal.on("fragmenthidden", function (event) {
        if (!section || section.contains(event.fragment)) {
          fire();
        }
      });
      global.Reveal.on("slidechanged", function (event) {
        if (!section || section.contains(event.currentSlide)) {
          fire();
        }
      });
    }
  }

  // Redraw on resize / slide change, debounced.
  function onResize(callback) {
    var pending = null;
    function schedule() {
      if (pending) {
        global.clearTimeout(pending);
      }
      pending = global.setTimeout(callback, 120);
    }
    global.addEventListener("resize", schedule);
    if (global.Reveal && global.Reveal.on) {
      global.Reveal.on("slidechanged", schedule);
      global.Reveal.on("resize", schedule);
    }
  }

  function emiData() {
    return global.EMI_DATA || {};
  }

  // True during reveal's print/PDF export (?print-pdf or the .print-pdf
  // body class) — components skip autoplay there so the PDF captures the
  // full static curves, not a mid-sweep frame. Shared by overlay + mimo.
  function isPrintMode() {
    try {
      if (/print-pdf/.test(global.location.search)) {
        return true;
      }
    } catch (error) {
      // location may be unavailable in some embeds; ignore.
    }
    var reveal = document.querySelector(".reveal");
    return Boolean(reveal && reveal.classList.contains("print-pdf"));
  }

  // =================================================================
  // EMI.overlay — FEM vs NN time-series with interactive controls.
  // =================================================================
  EMI.overlay = function (element, options) {
    options = options || {};
    var data = emiData().overlays;
    var loadClasses = ["wind", "constant", "sine", "impulse"];
    var loadLabels = {
      wind: "Wind",
      constant: "Constant",
      sine: "Sine",
      impulse: "Impulse"
    };

    if (!data) {
      drawPlaceholder(
        element,
        "EMI.overlay — overlays.json not loaded yet (FEM vs NN curves)"
      );
      return { redraw: function () {}, destroy: function () {} };
    }

    // Always present the FINAL model (no v1/v2/v3 toggle): for each
    // load class we plot the final model's curve (the canonical "v3"
    // series, or the latest available) in orange vs FEM in blue.
    var state = {
      load: options.load || "wind",
      showControls: options.controls !== false,
      showPlay: options.play !== false,
      // Autoplay the time-sweep when the slide becomes current (lively
      // on entry, no manual click). Opt out with autoplay:false.
      autoplay: options.autoplay !== false,
      cursor: null,
      playing: false,
      animationId: null,
      playButton: null
    };

    var pal = palette();
    var wrapper = null;
    var buttonsLoad = {};
    var canvasState = null;

    function availableVersions(loadName) {
      var group = data[loadName] || {};
      return ["v1", "v2", "v3"].filter(function (version) {
        return group[version] && group[version].t;
      });
    }

    // The final model's series for a load class: prefer "v3", else the
    // latest available version. (Versions are an internal data detail;
    // the deck shows a single final model.)
    function finalVersion(loadName) {
      var group = data[loadName] || {};
      if (group.v3 && group.v3.t) {
        return "v3";
      }
      var versions = availableVersions(loadName);
      return versions.length ? versions[versions.length - 1] : null;
    }

    function currentSeries() {
      var group = data[state.load] || {};
      var version = finalVersion(state.load);
      return version ? group[version] : null;
    }

    function build() {
      clearElement(element);
      wrapper = makeElement("div", "emi-overlay");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.height = "100%";
      wrapper.style.gap = "0.6rem";

      if (state.showControls) {
        wrapper.appendChild(buildControls());
      }

      var canvasHolder = makeElement("div");
      canvasHolder.style.flex = "1 1 auto";
      canvasHolder.style.minHeight = "0";
      wrapper.appendChild(canvasHolder);
      element.appendChild(wrapper);

      canvasState = mountCanvas(canvasHolder);
      draw();
    }

    // active = selected; prominent = the primary interactive control
    // (the load-class switch — the main hook on the diagnostic slide):
    // larger, outlined when idle, filled when active, so it clearly
    // reads as clickable. Non-prominent (Play) stays quiet/secondary.
    function styleControlButton(button, active, prominent) {
      button.style.font = "600 " + (prominent ? "16px " : "14px ") +
        pal.fontMono;
      button.style.padding = prominent
        ? "0.45rem 1rem" : "0.3rem 0.75rem";
      button.style.borderRadius = "999px";
      button.style.cursor = "pointer";
      button.style.transition = "all 0.16s ease";
      if (active) {
        button.style.background = pal.primary;
        button.style.color = pal.bg;
        button.style.border = "1.5px solid " + pal.primary;
        button.style.boxShadow = prominent
          ? "0 2px 10px rgba(0, 113, 227, 0.30)" : "none";
      } else {
        button.style.background = pal.bg;
        button.style.color = prominent ? pal.primary : pal.inkSoft;
        button.style.border = prominent
          ? "1.5px solid " + pal.primary
          : "1px solid " + pal.line;
        button.style.boxShadow = "none";
      }
    }

    // Controls: a PROMINENT load-class switch + a quiet Play button
    // (no version toggle).
    function buildControls() {
      var bar = makeElement("div", "emi-overlay-controls");
      bar.style.display = "flex";
      bar.style.flexWrap = "wrap";
      bar.style.alignItems = "center";
      bar.style.gap = "0.7rem";

      var loadLabel = makeElement("span", null, "Load case");
      loadLabel.style.font = "600 13px " + pal.fontMono;
      loadLabel.style.textTransform = "uppercase";
      loadLabel.style.letterSpacing = "0.06em";
      loadLabel.style.color = pal.inkMute;
      bar.appendChild(loadLabel);

      var loadGroup = makeElement("div");
      loadGroup.style.display = "flex";
      loadGroup.style.gap = "0.5rem";
      loadClasses.forEach(function (name) {
        if (!data[name]) {
          return;
        }
        var button = makeElement("button", null, loadLabels[name]);
        styleControlButton(button, name === state.load, true);
        button.addEventListener("click", function () {
          setLoad(name);
        });
        // Subtle hover on idle buttons to reinforce interactivity.
        button.addEventListener("mouseenter", function () {
          if (name !== state.load) {
            button.style.background = pal.bgAlt;
          }
        });
        button.addEventListener("mouseleave", function () {
          if (name !== state.load) {
            button.style.background = pal.bg;
          }
        });
        buttonsLoad[name] = button;
        loadGroup.appendChild(button);
      });
      bar.appendChild(loadGroup);

      if (state.showPlay) {
        var playButton = makeElement("button", null, "Play");
        styleControlButton(playButton, false, false);
        playButton.style.marginLeft = "auto";
        playButton.addEventListener("click", togglePlay);
        state.playButton = playButton;
        bar.appendChild(playButton);
      }

      return bar;
    }

    function refreshButtonStyles() {
      Object.keys(buttonsLoad).forEach(function (name) {
        styleControlButton(buttonsLoad[name], name === state.load, true);
      });
    }

    function setLoad(name) {
      if (!data[name]) {
        return;
      }
      state.load = name;
      stopPlay();
      build();
    }

    function setPlayLabel(text) {
      if (state.playButton) {
        state.playButton.textContent = text;
      }
    }

    // Start (or restart) the time-sweep: animate a cursor 0 -> end,
    // drawing the curves left-to-right. Shared by the Play button and
    // autoplay-on-entry.
    function startPlay() {
      var series = currentSeries();
      if (!series) {
        return;
      }
      if (state.animationId) {
        global.cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      state.playing = true;
      setPlayLabel("Pause");
      var start = null;
      var totalSteps = series.t.length;
      function step(timestamp) {
        if (!state.playing) {
          return;
        }
        if (start === null) {
          start = timestamp;
        }
        var elapsed = timestamp - start;
        var fraction = Math.min(1, elapsed / 4200);
        state.cursor = Math.round(fraction * (totalSteps - 1));
        draw();
        if (fraction < 1) {
          state.animationId = global.requestAnimationFrame(step);
        } else {
          stopPlay();
        }
      }
      state.animationId = global.requestAnimationFrame(step);
    }

    function togglePlay() {
      if (state.playing) {
        stopPlay();
      } else {
        startPlay();
      }
    }

    function stopPlay() {
      state.playing = false;
      state.cursor = null;
      if (state.animationId) {
        global.cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      setPlayLabel("Play");
      draw();
    }

    function draw() {
      if (!canvasState) {
        return;
      }
      var series = currentSeries();
      var context = canvasState.context;
      var width = canvasState.width;
      var height = canvasState.height;
      context.clearRect(0, 0, width, height);

      if (!series) {
        context.fillStyle = pal.inkSoft;
        context.font = "15px " + pal.fontMono;
        context.textAlign = "center";
        context.fillText(
          "no curve available for " + state.load,
          width / 2,
          height / 2
        );
        return;
      }

      var padLeft = 66;
      var padRight = 18;
      var padTop = 16;
      var padBottom = 42;
      var plotW = width - padLeft - padRight;
      var plotH = height - padTop - padBottom;

      var time = series.t;
      var fem = series.fem;
      var nn = series.nn;
      var tExtent = extent(time);
      var yExtent = extent(fem.concat(nn));
      // Pad the y-range slightly for headroom.
      var yPad = (yExtent[1] - yExtent[0]) * 0.08;
      yExtent = [yExtent[0] - yPad, yExtent[1] + yPad];

      function sx(t) {
        return padLeft + ((t - tExtent[0]) / (tExtent[1] - tExtent[0])) * plotW;
      }
      function sy(y) {
        return padTop + (1 - (y - yExtent[0]) / (yExtent[1] - yExtent[0])) * plotH;
      }

      // ---- Grid + axes (thin, no chartjunk) ----
      context.strokeStyle = pal.line;
      context.fillStyle = pal.inkSoft;
      context.lineWidth = 1;
      context.font = "600 15px " + pal.fontMono;
      context.textAlign = "right";
      context.textBaseline = "middle";
      var yTicks = 4;
      for (var i = 0; i <= yTicks; i += 1) {
        var yValue = yExtent[0] + (i / yTicks) * (yExtent[1] - yExtent[0]);
        var yPixel = sy(yValue);
        context.globalAlpha = 0.5;
        context.beginPath();
        context.moveTo(padLeft, yPixel);
        context.lineTo(width - padRight, yPixel);
        context.stroke();
        context.globalAlpha = 1;
        context.fillText(yValue.toExponential(1), padLeft - 8, yPixel);
      }
      // Zero line emphasised.
      if (yExtent[0] < 0 && yExtent[1] > 0) {
        context.globalAlpha = 0.9;
        context.strokeStyle = pal.line;
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(padLeft, sy(0));
        context.lineTo(width - padRight, sy(0));
        context.stroke();
        context.globalAlpha = 1;
      }

      // X ticks.
      context.fillStyle = pal.inkSoft;
      context.font = "600 15px " + pal.fontMono;
      context.textAlign = "center";
      context.textBaseline = "top";
      var xTicks = 6;
      for (var j = 0; j <= xTicks; j += 1) {
        var tValue = tExtent[0] + (j / xTicks) * (tExtent[1] - tExtent[0]);
        context.fillText(tValue.toFixed(0), sx(tValue), height - padBottom + 10);
      }
      context.fillStyle = pal.inkSoft;
      context.fillText("time (s)", padLeft + plotW / 2, height - 16);

      // ---- Cursor (during Play) ----
      var limit = state.cursor !== null ? state.cursor + 1 : time.length;

      // ---- Curves ----
      function drawCurve(values, color, lineWidth) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.lineJoin = "round";
        context.beginPath();
        for (var k = 0; k < limit && k < values.length; k += 1) {
          var px = sx(time[k]);
          var py = sy(values[k]);
          if (k === 0) {
            context.moveTo(px, py);
          } else {
            context.lineTo(px, py);
          }
        }
        context.stroke();
      }
      drawCurve(fem, pal.primary, 2.4);
      drawCurve(nn, pal.accent, 2.0);

      // Cursor marker.
      if (state.cursor !== null && state.cursor < time.length) {
        var cx = sx(time[state.cursor]);
        context.strokeStyle = pal.inkMute;
        context.globalAlpha = 0.5;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(cx, padTop);
        context.lineTo(cx, height - padBottom);
        context.stroke();
        context.globalAlpha = 1;
      }

      // ---- Inline legend ----
      context.font = "700 15px " + pal.fontMono;
      context.textAlign = "left";
      context.textBaseline = "middle";
      var legendY = padTop + 8;
      context.fillStyle = pal.primary;
      context.fillRect(padLeft + 6, legendY - 2, 22, 4);
      context.fillText("FEM (OpenSees)", padLeft + 34, legendY);
      context.fillStyle = pal.accent;
      context.fillRect(padLeft + 192, legendY - 2, 22, 4);
      context.fillText("Neural network", padLeft + 220, legendY);
    }

    onResize(function () {
      if (canvasState) {
        canvasState = resizeCanvas(canvasState.canvas);
        draw();
      }
    });

    build();

    // Autoplay the sweep once whenever this slide becomes the current
    // reveal slide (re-runs on each entry). Skipped in print/PDF.
    if (state.autoplay) {
      onSlideEnter(element, function () {
        if (!isPrintMode()) {
          startPlay();
        }
      });
    }

    return {
      redraw: draw,
      setLoad: setLoad,
      startPlay: startPlay,
      destroy: function () {
        stopPlay();
        clearElement(element);
      }
    };
  };

  // =================================================================
  // EMI.mimo — multi-force input -> multi-response output (slide 12).
  //
  // Two stacked SVG panels for one load class:
  //   TOP    "Input — applied forces": one force-vs-time line per shown
  //          floor (multi-force input).
  //   BOTTOM "Output — floor displacements": per shown floor, FEM (solid)
  //          vs final model (dashed, accent) displacement-vs-time.
  // Load-class buttons (default wind); autoplays a left-to-right time
  // sweep on slide entry (clip-path reveal), static in print/PDF;
  // degrades to a placeholder if window.EMI_DATA.mimo is missing.
  //   Hook: <div class="chart tall" data-emi="mimo" data-load="wind"></div>
  // =================================================================
  EMI.mimo = function (element, options) {
    options = options || {};
    var loadClasses = ["wind", "constant", "sine", "impulse"];
    var loadLabels = {
      wind: "Wind", constant: "Constant", sine: "Sine", impulse: "Impulse"
    };
    var data = emiData().mimo;

    if (!data || !data.t) {
      drawPlaceholder(
        element, "EMI.mimo — mimo.json not loaded yet (input/output panels)"
      );
      return { redraw: function () {}, setLoad: function () {},
        destroy: function () {} };
    }

    var pal = palette();
    var time = data.t;
    var floors = data.floors_shown || [];
    var nFloors = (data.meta && data.meta.n_floors) || 15;

    function firstAvailable() {
      for (var i = 0; i < loadClasses.length; i += 1) {
        if (data[loadClasses[i]]) {
          return loadClasses[i];
        }
      }
      return "wind";
    }

    var state = {
      load: (options.load && data[options.load]) ? options.load
        : firstAvailable(),
      playing: false,
      animationId: null
    };

    var buttonsLoad = {};
    var playButton = null;
    // Refs needed by the sweep animation (set in build()).
    var refs = { cursor: null, plotLeft: 0, plotW: 0 };

    function styleButton(button, active) {
      button.style.font = "600 15px " + pal.fontMono;
      button.style.padding = "0.36rem 0.85rem";
      button.style.borderRadius = "999px";
      button.style.cursor = "pointer";
      button.style.transition = "all 0.16s ease";
      button.style.border = "1.5px solid " + pal.primary;
      if (active) {
        button.style.background = pal.primary;
        button.style.color = pal.bg;
        button.style.borderColor = "transparent";
      } else {
        button.style.background = pal.bg;
        button.style.color = pal.primary;
      }
    }

    function extentOf(arrays) {
      var lo = Infinity;
      var hi = -Infinity;
      arrays.forEach(function (row) {
        for (var i = 0; i < row.length; i += 1) {
          if (row[i] < lo) { lo = row[i]; }
          if (row[i] > hi) { hi = row[i]; }
        }
      });
      if (!isFinite(lo) || !isFinite(hi) || lo === hi) {
        return [lo === hi && isFinite(lo) ? lo - 1 : -1,
          lo === hi && isFinite(hi) ? hi + 1 : 1];
      }
      var pad = (hi - lo) * 0.08;
      return [lo - pad, hi + pad];
    }

    function floorAlpha(index) {
      if (floors.length <= 1) {
        return 1;
      }
      return 0.42 + 0.58 * (index / (floors.length - 1));
    }

    // True when every input row is (near-)identical, i.e. the load is
    // spatially uniform across floors (constant/sine/impulse). Then the
    // four input lines coincide, so we draw a single line + a note.
    function rowsIdentical(rows) {
      if (!rows || rows.length < 2) {
        return true;
      }
      var reference = rows[0];
      // Tolerance relative to the signal's own magnitude.
      var magnitude = 0;
      for (var m = 0; m < reference.length; m += 1) {
        var a = Math.abs(reference[m]);
        if (a > magnitude) {
          magnitude = a;
        }
      }
      var tolerance = Math.max(1e-9, magnitude * 1e-3);
      for (var r = 1; r < rows.length; r += 1) {
        for (var i = 0; i < reference.length; i += 1) {
          if (Math.abs(rows[r][i] - reference[i]) > tolerance) {
            return false;
          }
        }
      }
      return true;
    }

    function polyline(points, color, width, alpha, dashed) {
      var line = svgElement("polyline", {
        points: points, fill: "none", stroke: color,
        "stroke-width": width, "stroke-opacity": alpha,
        "stroke-linejoin": "round", "stroke-linecap": "round"
      });
      if (dashed) {
        line.setAttribute("stroke-dasharray", "7 5");
      }
      return line;
    }

    function build() {
      clearElement(element);
      var wrapper = makeElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.height = "100%";
      wrapper.style.gap = "0.5rem";

      // ---- Controls: load-class switch ----
      var bar = makeElement("div");
      bar.style.display = "flex";
      bar.style.flexWrap = "wrap";
      bar.style.alignItems = "center";
      bar.style.gap = "0.7rem";
      var label = makeElement("span", null, "Load case");
      label.style.font = "600 13px " + pal.fontMono;
      label.style.textTransform = "uppercase";
      label.style.letterSpacing = "0.06em";
      label.style.color = pal.inkMute;
      bar.appendChild(label);
      buttonsLoad = {};
      loadClasses.forEach(function (name) {
        if (!data[name]) {
          return;
        }
        var button = makeElement("button", null, loadLabels[name]);
        styleButton(button, name === state.load);
        button.addEventListener("click", function () {
          setLoad(name);
        });
        buttonsLoad[name] = button;
        bar.appendChild(button);
      });
      var play = makeElement("button", null, "Play");
      styleButton(play, false);
      play.style.border = "1px solid " + pal.line;
      play.style.color = pal.inkSoft;
      play.style.marginLeft = "auto";
      play.addEventListener("click", function () {
        if (state.playing) {
          stopSweep();
        } else {
          startSweep();
        }
      });
      playButton = play;
      bar.appendChild(play);
      wrapper.appendChild(bar);

      // ---- SVG: two stacked panels ----
      var holder = makeElement("div");
      holder.style.flex = "1 1 auto";
      holder.style.minHeight = "0";
      wrapper.appendChild(holder);
      element.appendChild(wrapper);

      // Fill the container: use its MEASURED pixel box as the viewBox so
      // the SVG spans the full content width (no letterbox) with crisp,
      // undistorted text. When the slide is offscreen (0 size at init)
      // fall back to a ~3:1 box; onResize / onSlideEnter rebuild once it
      // is visible to capture the true size.
      var box = holder.getBoundingClientRect();
      var W = box.width > 40 ? Math.round(box.width) : 1208;
      var H = box.height > 40 ? Math.round(box.height) : 400;
      var svg = svgElement("svg", {
        viewBox: "0 0 " + W + " " + H, width: "100%", height: "100%",
        preserveAspectRatio: "xMidYMid meet"
      });

      var series = data[state.load];
      var inputUniform = rowsIdentical(series.input);

      var padLeft = 72;
      var padRight = 20;
      var plotLeft = padLeft;
      var plotW = W - padLeft - padRight;
      var t0 = time[0];
      var t1 = time[time.length - 1];
      function sx(t) {
        return plotLeft + ((t - t0) / (t1 - t0)) * plotW;
      }

      // Vertical layout parametric in H: title + plot, twice, + x-label.
      var titleSpace = 30;
      var xLabelSpace = 26;
      var midGap = 34;
      var plotH = (H - titleSpace * 2 - xLabelSpace - midGap) / 2;
      var topPlot = titleSpace;
      var bottomPlot = titleSpace + plotH + midGap + titleSpace;

      function drawPanel(title, top, height, rowsByFloor, isOutput) {
        var bottom = top + height;
        var titleNode = svgElement("text", {
          x: plotLeft, y: top - 10, fill: pal.ink, "font-size": 19,
          "font-weight": 700, "font-family": pal.fontSans
        });
        titleNode.textContent = title;
        svg.appendChild(titleNode);

        var allRows = isOutput
          ? rowsByFloor.fem.concat(rowsByFloor.nn)
          : rowsByFloor.input;
        var ext = extentOf(allRows);
        function sy(v) {
          return top + (1 - (v - ext[0]) / (ext[1] - ext[0])) * height;
        }

        // Axis frame (thin) + zero line.
        svg.appendChild(svgElement("line", {
          x1: plotLeft, y1: top, x2: plotLeft, y2: bottom,
          stroke: pal.line, "stroke-width": 1
        }));
        svg.appendChild(svgElement("line", {
          x1: plotLeft, y1: bottom, x2: plotLeft + plotW, y2: bottom,
          stroke: pal.line, "stroke-width": 1
        }));
        if (ext[0] < 0 && ext[1] > 0) {
          svg.appendChild(svgElement("line", {
            x1: plotLeft, y1: sy(0), x2: plotLeft + plotW, y2: sy(0),
            stroke: pal.line, "stroke-width": 1, "stroke-opacity": 0.7
          }));
        }

        function pointsFor(row) {
          var parts = [];
          for (var i = 0; i < row.length; i += 1) {
            parts.push(sx(time[i]).toFixed(1) + "," + sy(row[i]).toFixed(1));
          }
          return parts.join(" ");
        }

        // Full curves are drawn directly (no clip): in any static or
        // settled state they always span the full panel width. The
        // autoplay sweep is a non-destructive moving cursor only.
        if (isOutput) {
          rowsByFloor.fem.forEach(function (row, i) {
            svg.appendChild(
              polyline(pointsFor(row), pal.primary, 2.4, floorAlpha(i), false)
            );
          });
          rowsByFloor.nn.forEach(function (row, i) {
            svg.appendChild(
              polyline(pointsFor(row), pal.accent, 2.2, floorAlpha(i), true)
            );
          });
        } else if (inputUniform) {
          svg.appendChild(
            polyline(pointsFor(rowsByFloor.input[0]), pal.primary, 2.6, 1,
              false)
          );
        } else {
          rowsByFloor.input.forEach(function (row, i) {
            svg.appendChild(
              polyline(pointsFor(row), pal.primary, 2.2, floorAlpha(i), false)
            );
          });
        }

        // Top-right annotation describing the panel's spatial character.
        var note = svgElement("text", {
          x: plotLeft + plotW, y: top - 10, fill: pal.inkMute,
          "font-size": 13, "text-anchor": "end", "font-family": pal.fontMono
        });
        note.textContent = isOutput
          ? "floors " + floors.map(function (f) { return f + 1; })
            .join(" · ") + " of " + nFloors
          : (inputUniform
            ? "uniform across floors"
            : "per-floor — non-uniform");
        svg.appendChild(note);
      }

      drawPanel(
        "Input — applied forces", topPlot, plotH,
        { input: series.input }, false
      );
      drawPanel(
        "Output — floor displacements", bottomPlot, plotH,
        { fem: series.fem, nn: series.nn }, true
      );

      // Shared x-axis label.
      var xLabel = svgElement("text", {
        x: plotLeft + plotW / 2, y: H - 6, fill: pal.inkSoft,
        "font-size": 15, "font-weight": 600, "text-anchor": "middle",
        "font-family": pal.fontMono
      });
      xLabel.textContent = "time (s)";
      svg.appendChild(xLabel);

      // Output-panel legend: FEM solid vs model dashed.
      var legendY = bottomPlot - 10;
      var lgX = plotLeft + 340;
      var lg = svgElement("g");
      lg.appendChild(svgElement("line", {
        x1: lgX, y1: legendY - 5, x2: lgX + 24, y2: legendY - 5,
        stroke: pal.primary, "stroke-width": 3
      }));
      var lgFem = svgElement("text", {
        x: lgX + 30, y: legendY, fill: pal.inkSoft,
        "font-size": 14, "font-family": pal.fontMono
      });
      lgFem.textContent = "FEM";
      lg.appendChild(lgFem);
      lg.appendChild(svgElement("line", {
        x1: lgX + 92, y1: legendY - 5, x2: lgX + 116, y2: legendY - 5,
        stroke: pal.accent, "stroke-width": 3, "stroke-dasharray": "7 5"
      }));
      var lgNn = svgElement("text", {
        x: lgX + 122, y: legendY, fill: pal.inkSoft,
        "font-size": 14, "font-family": pal.fontMono
      });
      lgNn.textContent = "model";
      lg.appendChild(lgNn);
      svg.appendChild(lg);

      // Sweep cursor across both panels (hidden at rest; never hides data).
      var cursor = svgElement("line", {
        x1: plotLeft, y1: topPlot, x2: plotLeft, y2: bottomPlot + plotH,
        stroke: pal.inkMute, "stroke-width": 1.4, "stroke-opacity": 0
      });
      svg.appendChild(cursor);

      refs.cursor = cursor;
      refs.plotLeft = plotLeft;
      refs.plotW = plotW;

      holder.appendChild(svg);
    }

    function setLoad(name) {
      if (!data[name]) {
        return;
      }
      state.load = name;
      stopSweep();
      build();
    }

    function setSweep(progress) {
      if (!refs.cursor) {
        return;
      }
      var x = refs.plotLeft + refs.plotW * progress;
      refs.cursor.setAttribute("x1", x.toFixed(1));
      refs.cursor.setAttribute("x2", x.toFixed(1));
      refs.cursor.setAttribute(
        "stroke-opacity", progress > 0 && progress < 1 ? "0.5" : "0"
      );
    }

    function startSweep() {
      if (state.animationId) {
        global.cancelAnimationFrame(state.animationId);
      }
      state.playing = true;
      if (playButton) {
        playButton.textContent = "Pause";
      }
      var start = null;
      function step(timestamp) {
        if (!state.playing) {
          return;
        }
        if (start === null) {
          start = timestamp;
        }
        var progress = Math.min(1, (timestamp - start) / 4200);
        setSweep(progress);
        if (progress < 1) {
          state.animationId = global.requestAnimationFrame(step);
        } else {
          stopSweep();
        }
      }
      setSweep(0);
      state.animationId = global.requestAnimationFrame(step);
    }

    function stopSweep() {
      state.playing = false;
      if (state.animationId) {
        global.cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      setSweep(1); // hide the cursor; full curves remain drawn
      if (playButton) {
        playButton.textContent = "Play";
      }
    }

    onResize(build);
    build();

    // On slide entry: rebuild so the SVG is measured against the now-
    // visible container (fills full width), then autoplay the cursor
    // sweep (skipped in print/PDF; full curves are always drawn anyway).
    onSlideEnter(element, function () {
      build();
      if (!isPrintMode()) {
        startSweep();
      }
    });

    return {
      redraw: build,
      setLoad: setLoad,
      startSweep: startSweep,
      destroy: function () {
        stopSweep();
        clearElement(element);
      }
    };
  };

  // =================================================================
  // EMI.bars — grouped NRMSE bars (log y), staged by fragments.
  // =================================================================
  EMI.bars = function (element, options) {
    options = options || {};
    var metricKey = options.metric || "population_nrmse";
    var results = emiData().results;
    var metric = results ? results[metricKey] : null;
    var loadClasses = ["wind", "constant", "sine", "impulse"];
    var loadLabels = {
      wind: "Wind",
      constant: "Constant",
      sine: "Sine",
      impulse: "Impulse"
    };

    if (!metric) {
      drawPlaceholder(
        element,
        "EMI.bars — results.json (" + metricKey + ") not loaded yet"
      );
      return {
        redraw: function () {},
        showGroups: function () {},
        destroy: function () {}
      };
    }

    var pal = palette();
    var canvasState = mountCanvas(element);

    // One bar per load class showing the FINAL model's population NRMSE
    // (no v1/v2/v3 versions). Impulse is tinted as the current limit.
    function classColor(loadName) {
      return loadName === "impulse" ? pal.bad : pal.primary;
    }

    // Final model's percentage NRMSE for a class: prefer "v3", else the
    // latest available version; * 100, floored for the log axis.
    function finalPercent(loadName) {
      var group = metric[loadName] || {};
      var raw = null;
      var keys = ["v3", "v2", "v1"];
      for (var k = 0; k < keys.length; k += 1) {
        if (group[keys[k]] !== undefined && group[keys[k]] !== null) {
          raw = group[keys[k]];
          break;
        }
      }
      // Also accept a plain scalar (already-final) value.
      if (raw === null && typeof group === "number") {
        raw = group;
      }
      if (raw === null) {
        return null;
      }
      return Math.max(0.001, raw * 100);
    }

    var animationStart = null;
    var animationId = null;
    var visibleGroups = 0; // how many load-class bars are revealed
    var progress = 1; // grow animation 0..1

    function logScale(value, minLog, maxLog, plotTop, plotH) {
      var l = Math.log10(value);
      var fraction = (l - minLog) / (maxLog - minLog);
      fraction = Math.max(0, Math.min(1, fraction));
      return plotTop + (1 - fraction) * plotH;
    }

    function draw() {
      if (!canvasState) {
        return;
      }
      var context = canvasState.context;
      var width = canvasState.width;
      var height = canvasState.height;
      context.clearRect(0, 0, width, height);

      var padLeft = 64;
      var padRight = 18;
      var padTop = 22;
      var padBottom = 50;
      var plotW = width - padLeft - padRight;
      var plotH = height - padTop - padBottom;

      // Log range: 0.1% .. 100% spans the final per-class results.
      var minLog = -1; // 0.1 %
      var maxLog = 2; // 100 %
      var baseY = logScale(
        Math.pow(10, minLog), minLog, maxLog, padTop, plotH
      );

      // Gridlines at decades.
      context.font = "600 14px " + pal.fontMono;
      context.fillStyle = pal.inkSoft;
      context.strokeStyle = pal.line;
      context.lineWidth = 1;
      context.textAlign = "right";
      context.textBaseline = "middle";
      for (var decade = minLog; decade <= maxLog; decade += 1) {
        var yPixel = logScale(
          Math.pow(10, decade), minLog, maxLog, padTop, plotH
        );
        context.globalAlpha = 0.5;
        context.beginPath();
        context.moveTo(padLeft, yPixel);
        context.lineTo(width - padRight, yPixel);
        context.stroke();
        context.globalAlpha = 1;
        var labelValue = Math.pow(10, decade);
        var label = labelValue >= 1
          ? labelValue.toFixed(0) + "%"
          : labelValue.toFixed(1) + "%";
        context.fillText(label, padLeft - 8, yPixel);
      }

      var columnWidth = plotW / loadClasses.length;
      var barWidth = Math.min(96, columnWidth * 0.5);

      loadClasses.forEach(function (loadName, classIndex) {
        var revealed = classIndex < visibleGroups;
        var columnCenter = padLeft + classIndex * columnWidth +
          columnWidth / 2;
        var barX = columnCenter - barWidth / 2;

        // Class label (x-axis).
        context.fillStyle = revealed ? pal.ink : pal.line;
        context.font = "600 17px " + pal.fontMono;
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(
          loadLabels[loadName], columnCenter, height - padBottom + 14
        );

        var value = finalPercent(loadName);
        if (value === null) {
          return;
        }
        var topY = logScale(value, minLog, maxLog, padTop, plotH);
        var grow = revealed ? progress : 0;
        var drawnTop = baseY - (baseY - topY) * grow;

        var isLimit = loadName === "impulse";
        context.fillStyle = classColor(loadName);
        context.globalAlpha = revealed ? 1 : 0.12;
        context.fillRect(barX, drawnTop, barWidth, baseY - drawnTop);
        context.globalAlpha = 1;

        // Value label + current-limit call-out.
        if (revealed && progress > 0.55) {
          context.fillStyle = isLimit ? pal.bad : pal.ink;
          context.font = "700 18px " + pal.fontMono;
          context.textAlign = "center";
          context.textBaseline = "bottom";
          var valueLabel = (value >= 10 ? value.toFixed(1)
            : value.toFixed(2)) + "%";
          context.fillText(valueLabel, columnCenter, drawnTop - 6);
          if (isLimit) {
            context.fillStyle = pal.bad;
            context.font = "600 13px " + pal.fontMono;
            context.fillText("current limit", columnCenter, drawnTop - 28);
          }
        }
      });

      // Y-axis title.
      context.save();
      context.translate(16, padTop + plotH / 2);
      context.rotate(-Math.PI / 2);
      context.fillStyle = pal.inkSoft;
      context.font = "600 14px " + pal.fontMono;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("population NRMSE (%, log)", 0, 0);
      context.restore();
    }

    function animateGrow() {
      animationStart = null;
      if (animationId) {
        global.cancelAnimationFrame(animationId);
      }
      function step(timestamp) {
        if (animationStart === null) {
          animationStart = timestamp;
        }
        var elapsed = timestamp - animationStart;
        progress = easeOutCubic(Math.min(1, elapsed / 700));
        draw();
        if (progress < 1) {
          animationId = global.requestAnimationFrame(step);
        }
      }
      animationId = global.requestAnimationFrame(step);
    }

    function showGroups(count) {
      var clamped = Math.max(0, Math.min(loadClasses.length, count));
      if (clamped !== visibleGroups) {
        visibleGroups = clamped;
        animateGrow();
      } else {
        draw();
      }
    }

    onResize(function () {
      canvasState = resizeCanvas(canvasState.canvas);
      draw();
    });

    // Fragment-driven staging: each visible fragment reveals one more
    // load-class bar, in order (wind, constant, sine, impulse). So a
    // slide with 4 empty `.fragment` placeholders reveals one bar per
    // click. With no fragments, all four bars show on slide entry.
    onFragmentChange(element, function (fragmentCount) {
      var section = containingSection(element);
      var hasFragments = section &&
        section.querySelectorAll(".fragment").length > 0;
      if (hasFragments) {
        showGroups(fragmentCount);
      } else {
        showGroups(loadClasses.length);
      }
    });

    onSlideEnter(element, function () {
      var section = containingSection(element);
      var hasFragments = section &&
        section.querySelectorAll(".fragment").length > 0;
      if (!hasFragments) {
        showGroups(loadClasses.length);
      } else {
        showGroups(visibleFragmentCount(element));
      }
    });

    draw();

    return {
      redraw: draw,
      showGroups: showGroups,
      destroy: function () {
        if (animationId) {
          global.cancelAnimationFrame(animationId);
        }
        clearElement(element);
      }
    };
  };

  // =================================================================
  // EMI.architecture — SVG data-flow, one stage per fragment.
  // =================================================================
  EMI.architecture = function (element) {
    var pal = palette();

    // Orthogonal routing, rounded corners, centre-aligned major blocks,
    // uniform smaller blocks (per project diagram style).
    var stages = [
      { key: "features", title: "Building features",
        sub: "height, width, mass, damping, stiffness", accent: false },
      { key: "tokens", title: "Per-feature tokens",
        sub: "embed each feature -> token sequence", accent: false },
      { key: "transformer", title: "Transformer encoder",
        sub: "self-attention across feature tokens", accent: false },
      { key: "weights", title: "Generated weights",
        sub: "hyper-network emits LSTM parameters", accent: true },
      { key: "lstm", title: "Conditional LSTM",
        sub: "unrolled over wind-load time series", accent: false },
      { key: "response", title: "Response curve",
        sub: "per-floor displacement vs time", accent: false }
    ];

    var svg = null;
    var stageNodes = [];
    var windNode = null; // second input: wind-load sequence -> LSTM
    var shown = 0;

    function build() {
      clearElement(element);
      var width = 1000;
      var height = 320;
      svg = svgElement("svg", {
        viewBox: "0 0 " + width + " " + height,
        width: "100%",
        height: "100%",
        preserveAspectRatio: "xMidYMid meet"
      });
      svg.style.fontFamily = pal.fontMono;

      // Arrow marker.
      var defs = svgElement("defs");
      var marker = svgElement("marker", {
        id: "emi-arrow",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      });
      var arrowPath = svgElement("path", {
        d: "M 0 0 L 10 5 L 0 10 z",
        fill: pal.inkMute
      });
      marker.appendChild(arrowPath);
      defs.appendChild(marker);
      svg.appendChild(defs);

      var count = stages.length;
      var margin = 24;
      var gap = 18;
      var boxWidth = (width - margin * 2 - gap * (count - 1)) / count;
      var boxHeight = 96;
      var boxTop = (height - boxHeight) / 2 - 10;
      stageNodes = [];

      stages.forEach(function (stage, index) {
        var x = margin + index * (boxWidth + gap);

        // Connector from previous box (orthogonal, straight here).
        if (index > 0) {
          var prevX = x - gap;
          var midY = boxTop + boxHeight / 2;
          var connector = svgElement("line", {
            x1: prevX,
            y1: midY,
            x2: x,
            y2: midY,
            stroke: pal.inkMute,
            "stroke-width": "2",
            "marker-end": "url(#emi-arrow)"
          });
          connector.style.opacity = "0";
          connector.dataset.stage = index;
          connector.dataset.kind = "connector";
          svg.appendChild(connector);
        }

        var group = svgElement("g");
        group.style.opacity = "0.12";
        group.style.transition = "opacity 0.35s ease, transform 0.35s ease";

        var rect = svgElement("rect", {
          x: x,
          y: boxTop,
          width: boxWidth,
          height: boxHeight,
          rx: "14",
          ry: "14",
          fill: stage.accent ? "rgba(255,159,10,0.10)" : pal.bgAlt,
          stroke: stage.accent ? pal.accent : pal.line,
          "stroke-width": stage.accent ? "2" : "1.2"
        });
        group.appendChild(rect);

        var index1 = svgElement("text", {
          x: x + 14,
          y: boxTop + 24,
          fill: stage.accent ? pal.accent : pal.inkMute,
          "font-size": "13",
          "font-weight": "700"
        });
        index1.textContent = String(index + 1);
        group.appendChild(index1);

        appendWrappedText(
          group, stage.title, x + boxWidth / 2, boxTop + 46,
          pal.ink, 14, 700, boxWidth - 20
        );
        appendWrappedText(
          group, stage.sub, x + boxWidth / 2, boxTop + 70,
          pal.inkMute, 10, 400, boxWidth - 16
        );

        svg.appendChild(group);
        stageNodes.push(group);
      });

      // ---- Second input: wind-load time-history feeding the response
      //      (conditional LSTM) stage. The diagram thus shows TWO inputs:
      //        (1) building features -> hyper-network -> generated weights
      //            (the upper-left chain ending at the accent box), and
      //        (2) wind-load sequence -> response network -> response
      //            (this glyph rising into the LSTM, then to the curve).
      //      Revealed together with the conditional-LSTM stage. ----------
      var lstmIndex = 4;
      var lstmX = margin + lstmIndex * (boxWidth + gap);
      var lstmCx = lstmX + boxWidth / 2;
      var boxBottom = boxTop + boxHeight;

      var windBoxW = 178;
      var windBoxH = 46;
      var windBoxX = lstmCx - windBoxW / 2;
      var windBoxTop = boxBottom + 24;

      windNode = svgElement("g");
      windNode.style.opacity = "0.12";
      windNode.style.transition = "opacity 0.35s ease";

      // Arrow rising from the wind-load glyph into the LSTM box bottom.
      var windArrow = svgElement("line", {
        x1: lstmCx,
        y1: windBoxTop,
        x2: lstmCx,
        y2: boxBottom + 2,
        stroke: pal.inkMute,
        "stroke-width": "2",
        "marker-end": "url(#emi-arrow)"
      });
      windNode.appendChild(windArrow);

      var windRect = svgElement("rect", {
        x: windBoxX,
        y: windBoxTop,
        width: windBoxW,
        height: windBoxH,
        rx: "12",
        ry: "12",
        fill: pal.bg,
        stroke: pal.primary,
        "stroke-width": "1.4"
      });
      windNode.appendChild(windRect);

      // Deterministic gust-like waveform drawn inside the glyph.
      var waveformPadX = 14;
      var waveformXStart = windBoxX + waveformPadX;
      var waveformXEnd = windBoxX + windBoxW - waveformPadX;
      var waveformYCenter = windBoxTop + windBoxH / 2 + 3;
      var waveformAmplitude = windBoxH / 2 - 12;
      var waveformSamples = 56;
      var waveformPath = "";
      for (var sample = 0; sample < waveformSamples; sample += 1) {
        var fraction = sample / (waveformSamples - 1);
        var pointX = waveformXStart +
          fraction * (waveformXEnd - waveformXStart);
        var phase = fraction * Math.PI * 2 * 3.2;
        var pointY = waveformYCenter - waveformAmplitude * (
          0.6 * Math.sin(phase) +
          0.3 * Math.sin(phase * 2.3 + 0.8) +
          0.1 * Math.sin(phase * 0.5 + 1.7)
        );
        waveformPath += (sample === 0 ? "M " : " L ") +
          pointX.toFixed(1) + " " + pointY.toFixed(1);
      }
      var windWave = svgElement("path", {
        d: waveformPath,
        fill: "none",
        stroke: pal.primary,
        "stroke-width": "1.8",
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
      });
      windNode.appendChild(windWave);

      var windLabel = svgElement("text", {
        x: lstmCx,
        y: windBoxTop + windBoxH + 15,
        fill: pal.inkMute,
        "font-size": "11",
        "font-weight": "600",
        "text-anchor": "middle"
      });
      windLabel.textContent = "Wind-load sequence (per-floor force)";
      windNode.appendChild(windLabel);

      svg.appendChild(windNode);

      // Caption beneath.
      var caption = svgElement("text", {
        x: width / 2,
        y: height - 12,
        fill: pal.inkMute,
        "font-size": "12",
        "text-anchor": "middle"
      });
      caption.textContent =
        "Two inputs: building features generate the network; the " +
        "wind-load sequence drives it to produce the response.";
      svg.appendChild(caption);

      element.appendChild(svg);
    }

    function appendWrappedText(group, text, cx, cy, color, size, weight, maxW) {
      // Centre-anchored text with naive word wrap to two lines.
      var words = text.split(" ");
      var lines = [];
      var current = "";
      var approxCharWidth = size * 0.6;
      words.forEach(function (word) {
        var candidate = current ? current + " " + word : word;
        if (candidate.length * approxCharWidth > maxW && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      });
      if (current) {
        lines.push(current);
      }
      lines.forEach(function (line, lineIndex) {
        var textNode = svgElement("text", {
          x: cx,
          y: cy + lineIndex * (size + 2),
          fill: color,
          "font-size": size,
          "font-weight": weight,
          "text-anchor": "middle"
        });
        textNode.textContent = line;
        group.appendChild(textNode);
      });
    }

    function showStage(count) {
      shown = Math.max(0, Math.min(stages.length, count));
      stageNodes.forEach(function (group, index) {
        group.style.opacity = index < shown ? "1" : "0.12";
      });
      if (svg) {
        var connectors = svg.querySelectorAll('[data-kind="connector"]');
        connectors.forEach(function (line) {
          var stageIndex = parseInt(line.dataset.stage, 10);
          line.style.opacity = stageIndex < shown ? "0.9" : "0";
        });
      }
      // Wind-load input appears with the conditional-LSTM stage (the
      // response network it feeds), i.e. once stage index 4 is revealed.
      if (windNode) {
        windNode.style.opacity = shown > 4 ? "1" : "0.12";
      }
    }

    build();

    // No fragments -> show all. Otherwise reveal (fragments + 1) stages,
    // so the first stage is visible before any fragment is triggered.
    onFragmentChange(element, function (fragmentCount) {
      var section = containingSection(element);
      var hasFragments = section &&
        section.querySelectorAll(".fragment").length > 0;
      showStage(hasFragments ? fragmentCount + 1 : stages.length);
    });

    onSlideEnter(element, function () {
      var section = containingSection(element);
      var hasFragments = section &&
        section.querySelectorAll(".fragment").length > 0;
      showStage(hasFragments ? visibleFragmentCount(element) + 1 : stages.length);
    });

    return {
      showStage: showStage,
      redraw: build,
      destroy: function () {
        clearElement(element);
      }
    };
  };

  // =================================================================
  // EMI.speedup — proportional ~7,000x visual with count-up.
  // =================================================================
  EMI.speedup = function (element, options) {
    options = options || {};
    var results = emiData().results;
    var headline = results ? results.headline : null;
    var ratio = options.ratio ||
      (headline ? headline.speedup : 7000);
    var secondsPerBuilding = options.seconds ||
      (headline ? headline.opensees_s_per_building : 80);

    var pal = palette();
    var canvasState = mountCanvas(element);
    var animationId = null;
    var animationStart = null;

    function draw(progress) {
      var context = canvasState.context;
      var width = canvasState.width;
      var height = canvasState.height;
      context.clearRect(0, 0, width, height);

      // Reserve a left zone for row labels and a right zone for the
      // time labels so neither is clipped at the canvas edge.
      var padX = 32;
      var leftLabelWidth = 168;
      var rightLabelWidth = 184;
      var trackLeft = padX + leftLabelWidth;
      var trackRight = width - padX - rightLabelWidth;
      var trackWidth = Math.max(40, trackRight - trackLeft);
      var rowH = 28;
      var femY = height * 0.30;
      var nnY = height * 0.56;

      context.textBaseline = "middle";

      // Row labels (left zone), darker + larger for projection.
      context.fillStyle = pal.ink;
      context.font = "600 16px " + pal.fontMono;
      context.textAlign = "right";
      context.fillText("OpenSees FEM", trackLeft - 16, femY + rowH / 2);
      context.fillText("Neural network", trackLeft - 16, nnY + rowH / 2);

      // FEM track fills the full width (the slow baseline).
      var femFill = trackWidth * progress;
      context.fillStyle = pal.bgAlt;
      roundRect(context, trackLeft, femY, trackWidth, rowH, 8);
      context.fill();
      context.fillStyle = pal.primary;
      roundRect(context, trackLeft, femY, femFill, rowH, 8);
      context.fill();

      // NN track: a tiny sliver proportional to 1/ratio (visually
      // floored so it is perceptible).
      var nnFraction = Math.max(1 / ratio, 0.006);
      var nnFill = trackWidth * nnFraction * progress;
      context.fillStyle = pal.bgAlt;
      roundRect(context, trackLeft, nnY, trackWidth, rowH, 8);
      context.fill();
      context.fillStyle = pal.accent;
      roundRect(context, trackLeft, nnY, Math.max(6, nnFill), rowH, 8);
      context.fill();

      // Time annotations (in the reserved right zone; clamped so they
      // never run past the canvas right edge).
      context.fillStyle = pal.inkSoft;
      context.font = "600 15px " + pal.fontMono;
      context.textAlign = "left";
      var femLabelX = Math.min(trackLeft + femFill + 12, trackRight + 10);
      context.fillText(
        "~" + secondsPerBuilding.toFixed(0) + " s / building",
        femLabelX,
        femY + rowH / 2
      );
      var nnMillis = (secondsPerBuilding / ratio) * 1000;
      context.fillText(
        "~" + nnMillis.toFixed(1) + " ms / building (batched)",
        trackLeft + Math.max(6, nnFill) + 12,
        nnY + rowH / 2
      );

      // Big ratio headline.
      var shownRatio = Math.round(ratio * progress);
      context.fillStyle = pal.accent;
      context.font = "700 60px " + pal.fontSans;
      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      context.fillText(
        "~" + formatThousands(shownRatio) + "x",
        width / 2,
        height * 0.90
      );
      context.fillStyle = pal.inkSoft;
      context.font = "600 15px " + pal.fontMono;
      context.fillText("faster per building", width / 2, height * 0.985);
    }

    function animate() {
      animationStart = null;
      if (animationId) {
        global.cancelAnimationFrame(animationId);
      }
      function step(timestamp) {
        if (animationStart === null) {
          animationStart = timestamp;
        }
        var elapsed = timestamp - animationStart;
        var progress = easeOutCubic(Math.min(1, elapsed / 1400));
        draw(progress);
        if (progress < 1) {
          animationId = global.requestAnimationFrame(step);
        }
      }
      animationId = global.requestAnimationFrame(step);
    }

    onResize(function () {
      canvasState = resizeCanvas(canvasState.canvas);
      draw(1);
    });

    onSlideEnter(element, animate);
    draw(0);

    return {
      animate: animate,
      redraw: function () {
        draw(1);
      },
      destroy: function () {
        if (animationId) {
          global.cancelAnimationFrame(animationId);
        }
        clearElement(element);
      }
    };
  };

  function roundRect(context, x, y, width, height, radius) {
    var r = Math.min(radius, height / 2, Math.abs(width) / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function formatThousands(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // =================================================================
  // EMI.counter — count-up on slide entry.
  // =================================================================
  EMI.counter = function (element, target, options) {
    options = options || {};
    var decimals = options.decimals !== undefined ? options.decimals : 0;
    var prefix = options.prefix || "";
    var suffix = options.suffix || "";
    var duration = options.duration || 900;
    var useSeparator = options.separator !== false;
    var colorClass = options.colorClass || "";

    var pal = palette();
    if (colorClass === "accent") {
      element.style.color = pal.accent;
    } else if (colorClass === "good") {
      element.style.color = pal.good;
    } else if (colorClass === "bad") {
      element.style.color = pal.bad;
    } else if (colorClass === "ink") {
      element.style.color = pal.ink;
    }

    var animationId = null;
    var animationStart = null;

    function format(value) {
      var fixed = value.toFixed(decimals);
      if (useSeparator && decimals === 0) {
        fixed = formatThousands(fixed);
      } else if (useSeparator) {
        var parts = fixed.split(".");
        parts[0] = formatThousands(parts[0]);
        fixed = parts.join(".");
      }
      return prefix + fixed + suffix;
    }

    function reset() {
      element.textContent = format(0);
    }

    function play() {
      animationStart = null;
      if (animationId) {
        global.cancelAnimationFrame(animationId);
      }
      function step(timestamp) {
        if (animationStart === null) {
          animationStart = timestamp;
        }
        var elapsed = timestamp - animationStart;
        var progress = easeOutCubic(Math.min(1, elapsed / duration));
        element.textContent = format(target * progress);
        if (progress < 1) {
          animationId = global.requestAnimationFrame(step);
        } else {
          element.textContent = format(target);
        }
      }
      animationId = global.requestAnimationFrame(step);
    }

    reset();
    onSlideEnter(element, play);

    return { play: play, reset: reset };
  };

  // =================================================================
  // EMI.diagramOneVsMany — native SVG schematic (slide 3).
  //   LEFT  "One model per building": buildings each wired to their OWN
  //         network box (✗) — "N buildings -> N trained models".
  //   RIGHT "One shared HyperNetwork": buildings all feeding ONE shared
  //         box (✓) — "N buildings -> 1 model, no retraining".
  //   Center "VS" divider. All text is real SVG, scales with the slide.
  //   Hook: <div class="chart" data-emi="diagram-one-vs-many"></div>
  // =================================================================
  EMI.diagramOneVsMany = function (element) {
    if (!element) {
      return { redraw: function () {}, destroy: function () {} };
    }
    var pal = palette();

    function drawBuilding(parent, x, y, w, h, color) {
      parent.appendChild(svgElement("rect", {
        x: x, y: y, width: w, height: h, rx: 4, ry: 4,
        fill: pal.bg, stroke: color, "stroke-width": 2
      }));
      var pad = 7;
      var gap = 5;
      var cols = 2;
      var rows = 3;
      var ww = (w - pad * 2 - gap * (cols - 1)) / cols;
      var wh = (h - pad * 2 - gap * (rows - 1)) / rows;
      for (var r = 0; r < rows; r += 1) {
        for (var c = 0; c < cols; c += 1) {
          parent.appendChild(svgElement("rect", {
            x: x + pad + c * (ww + gap),
            y: y + pad + r * (wh + gap),
            width: ww, height: wh, rx: 1.5, ry: 1.5,
            fill: color, "fill-opacity": 0.22
          }));
        }
      }
    }

    function drawBox(parent, x, y, w, h, color, lines, accent, fontSize) {
      parent.appendChild(svgElement("rect", {
        x: x, y: y, width: w, height: h, rx: 10, ry: 10,
        fill: accent ? "rgba(255,159,10,0.10)" : pal.bgAlt,
        stroke: color, "stroke-width": accent ? 2.6 : 2
      }));
      lines.forEach(function (line, index) {
        var label = svgElement("text", {
          x: x + w / 2,
          y: y + h / 2 + (index - (lines.length - 1) / 2) * (fontSize + 3)
            + fontSize * 0.34,
          fill: accent ? pal.accent : pal.ink,
          "font-size": fontSize, "font-weight": 700,
          "text-anchor": "middle", "font-family": pal.fontMono
        });
        label.textContent = line;
        parent.appendChild(label);
      });
    }

    function badge(parent, cx, cy, symbol, color, radius) {
      parent.appendChild(svgElement("circle", {
        cx: cx, cy: cy, r: radius, fill: pal.bg,
        stroke: color, "stroke-width": 2.6
      }));
      var text = svgElement("text", {
        x: cx, y: cy + 1, fill: color, "font-size": radius * 1.3,
        "font-weight": 700, "text-anchor": "middle",
        "dominant-baseline": "central", "font-family": pal.fontSans
      });
      text.textContent = symbol;
      parent.appendChild(text);
    }

    function centeredText(parent, cx, y, text, color, size, family) {
      var node = svgElement("text", {
        x: cx, y: y, fill: color, "font-size": size, "font-weight": 700,
        "text-anchor": "middle", "font-family": family || pal.fontSans,
        "letter-spacing": "-0.01em"
      });
      node.textContent = text;
      parent.appendChild(node);
      return node;
    }

    function build() {
      clearElement(element);
      // Fill the container: measure its pixel box and use it as the
      // viewBox (parametric layout below) so the diagram spans the full
      // slide content width with crisp, undistorted, large text. Falls
      // back to a ~3:1 box offscreen; rebuilds on resize.
      var box = element.getBoundingClientRect();
      var W = box.width > 80 ? Math.round(box.width) : 1216;
      var H = box.height > 80 ? Math.round(box.height) : 400;
      var svg = svgElement("svg", {
        viewBox: "0 0 " + W + " " + H, width: "100%", height: "100%",
        preserveAspectRatio: "xMidYMid meet"
      });

      var defs = svgElement("defs");
      var marker = svgElement("marker", {
        id: "emi-ovm-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5",
        markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
      });
      marker.appendChild(svgElement("path", {
        d: "M 0 0 L 10 5 L 0 10 z", fill: pal.inkMute
      }));
      defs.appendChild(marker);
      svg.appendChild(defs);

      function arrow(x1, y1, x2, y2) {
        svg.appendChild(svgElement("line", {
          x1: x1, y1: y1, x2: x2, y2: y2, stroke: pal.inkMute,
          "stroke-width": 2.2, "marker-end": "url(#emi-ovm-arrow)"
        }));
      }

      // ---- Layout (parametric in W, H) ----
      var pad = 28;
      var vsX = W / 2;
      var leftCx = (pad + (vsX - 36)) / 2;
      var rightCx = ((vsX + 36) + (W - pad)) / 2;
      var titleY = 38;
      var captionY = H - 14;
      var contentTop = titleY + 28;
      var contentBottom = captionY - 36;
      var midY = (contentTop + contentBottom) / 2;

      // Fonts scale gently with width so they stay readable at any size.
      var titleSize = 28;
      var boxSize = 24;
      var captionSize = 23;

      // Three building rows centered in the content band.
      var rowStep = (contentBottom - contentTop) / 3;
      var bH = Math.min(64, rowStep - 14);
      var bW = bH;
      var rowYs = [0, 1, 2].map(function (i) {
        return contentTop + rowStep * (i + 0.5) - bH / 2;
      });

      // VS divider.
      svg.appendChild(svgElement("line", {
        x1: vsX, y1: contentTop - 8, x2: vsX, y2: contentBottom + 8,
        stroke: pal.line, "stroke-width": 2, "stroke-dasharray": "5 6"
      }));
      svg.appendChild(svgElement("circle", {
        cx: vsX, cy: midY, r: 28, fill: pal.bg, stroke: pal.inkMute,
        "stroke-width": 2
      }));
      var vs = svgElement("text", {
        x: vsX, y: midY + 1, fill: pal.inkSoft, "font-size": 24,
        "font-weight": 700, "text-anchor": "middle",
        "dominant-baseline": "central", "font-family": pal.fontSans
      });
      vs.textContent = "VS";
      svg.appendChild(vs);

      // ---- LEFT panel: one model per building ----
      centeredText(svg, leftCx, titleY, "One model per building", pal.ink,
        titleSize);
      var boxW = 132;
      var arrowLen = 46;
      var leftGroupW = bW + arrowLen + boxW;
      var leftStartX = leftCx - leftGroupW / 2;
      rowYs.forEach(function (y) {
        drawBuilding(svg, leftStartX, y, bW, bH, pal.primary);
        arrow(leftStartX + bW, y + bH / 2, leftStartX + bW + arrowLen - 4,
          y + bH / 2);
        drawBox(svg, leftStartX + bW + arrowLen, y + bH / 2 - 22, boxW, 44,
          pal.line, ["Model"], false, boxSize);
      });
      badge(svg, leftStartX + leftGroupW + 32, midY, "✗", pal.bad, 24);
      centeredText(svg, leftCx, captionY, "N buildings → N trained models",
        pal.inkSoft, captionSize, pal.fontMono);

      // ---- RIGHT panel: one shared HyperNetwork ----
      centeredText(svg, rightCx, titleY, "One shared HyperNetwork",
        pal.primaryDk, titleSize);
      var sharedW = 150;
      var sharedH = 104;
      var sharedX = rightCx + 64;
      var sharedY = midY - sharedH / 2;
      var sharedCy = midY;
      var rightBX = rightCx - 156;
      rowYs.forEach(function (y) {
        drawBuilding(svg, rightBX, y, bW, bH, pal.primary);
        arrow(rightBX + bW, y + bH / 2, sharedX - 4, sharedCy);
      });
      drawBox(svg, sharedX, sharedY, sharedW, sharedH, pal.accent,
        ["Hyper-", "Network"], true, boxSize);
      badge(svg, sharedX + sharedW / 2, sharedY + sharedH + 30, "✓",
        pal.good, 22);
      centeredText(svg, rightCx, captionY,
        "N buildings → 1 model, no retraining", pal.inkSoft,
        captionSize, pal.fontMono);

      element.appendChild(svg);
    }

    build();
    onResize(build);
    // Rebuild once the slide is actually visible so the measurement (and
    // thus full-width fill) is correct.
    onSlideEnter(element, build);

    return {
      redraw: build,
      destroy: function () { clearElement(element); }
    };
  };

  // =================================================================
  // EMI.diagramBilinear — native SVG force-displacement backbone
  // (slide 7). Steep initial segment (slope k0) to a yield point, then
  // a shallower post-yield segment (slope gamma*k0). Yield point marked
  // (accent); dashed helpers drop to the axes labelled delta_y / F_y.
  // All glyphs are real SVG text (proper subscripts), slide-scaled.
  //   Hook: <div class="chart" data-emi="diagram-bilinear"></div>
  // =================================================================
  EMI.diagramBilinear = function (element) {
    if (!element) {
      return { redraw: function () {}, destroy: function () {} };
    }
    var pal = palette();

    function build() {
      clearElement(element);
      var W = 760;
      var H = 470;
      var svg = svgElement("svg", {
        viewBox: "0 0 " + W + " " + H, width: "100%", height: "100%",
        preserveAspectRatio: "xMidYMid meet"
      });

      var defs = svgElement("defs");
      var marker = svgElement("marker", {
        id: "emi-bl-arrow", viewBox: "0 0 10 10", refX: "8", refY: "5",
        markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
      });
      marker.appendChild(svgElement("path", {
        d: "M 0 0 L 10 5 L 0 10 z", fill: pal.inkSoft
      }));
      defs.appendChild(marker);
      svg.appendChild(defs);

      var originX = 92;
      var originY = 392;
      var axisTop = 48;
      var axisRight = 712;

      // Axes with arrowheads.
      svg.appendChild(svgElement("line", {
        x1: originX, y1: originY, x2: originX, y2: axisTop,
        stroke: pal.inkSoft, "stroke-width": 2,
        "marker-end": "url(#emi-bl-arrow)"
      }));
      svg.appendChild(svgElement("line", {
        x1: originX, y1: originY, x2: axisRight, y2: originY,
        stroke: pal.inkSoft, "stroke-width": 2,
        "marker-end": "url(#emi-bl-arrow)"
      }));

      // Yield + end points.
      var yieldX = 348;
      var yieldY = 178;
      var endX = 672;
      var endY = 132;

      // Dashed helper lines to the axes.
      var helperStyle = {
        stroke: pal.ink, "stroke-width": 1.4, "stroke-dasharray": "5 5",
        "stroke-opacity": 0.55
      };
      var vHelper = svgElement("line", helperStyle);
      vHelper.setAttribute("x1", yieldX);
      vHelper.setAttribute("y1", yieldY);
      vHelper.setAttribute("x2", yieldX);
      vHelper.setAttribute("y2", originY);
      svg.appendChild(vHelper);
      var hHelper = svgElement("line", helperStyle);
      hHelper.setAttribute("x1", originX);
      hHelper.setAttribute("y1", yieldY);
      hHelper.setAttribute("x2", yieldX);
      hHelper.setAttribute("y2", yieldY);
      svg.appendChild(hHelper);

      // Bilinear backbone.
      svg.appendChild(svgElement("polyline", {
        points: originX + "," + originY + " " + yieldX + "," + yieldY +
          " " + endX + "," + endY,
        fill: "none", stroke: pal.primary, "stroke-width": 3.5,
        "stroke-linejoin": "round", "stroke-linecap": "round"
      }));

      // Yield point marker (accent).
      svg.appendChild(svgElement("circle", {
        cx: yieldX, cy: yieldY, r: 7, fill: pal.accent,
        stroke: pal.bg, "stroke-width": 2
      }));

      // Slope labels. NOTE: sans-serif (not mono) — monospace fonts
      // slash their zeros, so k0/gamma*k0 would read as theta. Sans
      // renders a clean unslashed "0".
      svg.appendChild(svgMathText({
        x: 168, y: 250, fill: pal.ink, "font-size": 24, "font-weight": 700,
        "text-anchor": "middle", "font-family": pal.fontSans
      }, [{ t: "k" }, { t: "0", sub: true }]));
      svg.appendChild(svgMathText({
        x: 520, y: 120, fill: pal.ink, "font-size": 24, "font-weight": 700,
        "text-anchor": "middle", "font-family": pal.fontSans
      }, [{ t: "γk" }, { t: "0", sub: true }]));

      // Axis-intercept labels for the yield point.
      svg.appendChild(svgMathText({
        x: yieldX, y: originY + 32, fill: pal.accent, "font-size": 23,
        "font-weight": 700, "text-anchor": "middle",
        "font-family": pal.fontSans
      }, [{ t: "δ" }, { t: "y", sub: true }]));
      svg.appendChild(svgMathText({
        x: originX - 18, y: yieldY + 7, fill: pal.accent, "font-size": 23,
        "font-weight": 700, "text-anchor": "end",
        "font-family": pal.fontSans
      }, [{ t: "F" }, { t: "y", sub: true }]));

      // Axis titles.
      var xTitle = svgElement("text", {
        x: (originX + axisRight) / 2, y: originY + 64, fill: pal.inkSoft,
        "font-size": 21, "font-weight": 600, "text-anchor": "middle",
        "font-family": pal.fontSans
      });
      xTitle.textContent = "Displacement x";
      svg.appendChild(xTitle);

      var yTitle = svgElement("text", {
        x: 30, y: (axisTop + originY) / 2, fill: pal.inkSoft,
        "font-size": 21, "font-weight": 600, "text-anchor": "middle",
        "font-family": pal.fontSans,
        transform: "rotate(-90 30 " + ((axisTop + originY) / 2) + ")"
      });
      yTitle.textContent = "Restoring force F";
      svg.appendChild(yTitle);

      element.appendChild(svg);
    }

    build();
    onResize(build);

    return {
      redraw: build,
      destroy: function () { clearElement(element); }
    };
  };

  // =================================================================
  // EMI.slideGrid — custom grid (slide-sorter / light-table) overview.
  //
  // Builds a full-viewport overlay of thumbnail cards (one per top-level
  // slide), replacing reveal's default single-row overview. Thumbnails
  // are the integrator's rendered PNGs under assets/thumbs/. Click a
  // card to jump to that slide; the current slide is highlighted.
  //
  //   var grid = EMI.slideGrid({ thumbDir, prefix, ext });
  //   grid.open(); grid.close(); grid.toggle(); grid.isOpen();
  //
  // deck.js wires the overview button + Esc/O to this (native reveal
  // overview is disabled).
  // =================================================================
  EMI.slideGrid = function (options) {
    options = options || {};
    var thumbDir = options.thumbDir || "assets/thumbs/";
    var prefix = options.prefix || "slide_";
    var ext = options.ext || ".png";
    // Optional callback(isOpen) fired on every open/close so callers can
    // keep an external toggle (e.g. the overview button) in sync — this
    // covers closes triggered inside the overlay (card/backdrop/×).
    var onChange = typeof options.onChange === "function"
      ? options.onChange : null;

    var pal = palette();
    var overlay = null;
    var cards = [];
    var built = false;

    function pad2(number) {
      return (number < 10 ? "0" : "") + number;
    }

    function slideSections() {
      return Array.prototype.slice.call(
        document.querySelectorAll(".reveal .slides > section")
      );
    }

    function slideTitle(section, index) {
      var node = section.querySelector(".headline, h1, h2, h3");
      var text = node ? (node.textContent || "").trim() : "";
      if (!text) {
        text = "Slide " + (index + 1);
      }
      // Collapse whitespace and keep it short for the card label.
      text = text.replace(/\s+/g, " ");
      if (text.length > 64) {
        text = text.slice(0, 61) + "...";
      }
      return text;
    }

    function build() {
      overlay = makeElement("div", "emi-grid-overlay");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-label", "Slide overview");
      overlay.setAttribute("aria-modal", "true");

      var bar = makeElement("div", "emi-grid-bar");
      bar.appendChild(makeElement("span", "emi-grid-title", "Slides"));
      var closeButton = makeElement("button", "emi-grid-close");
      closeButton.setAttribute("type", "button");
      closeButton.setAttribute("aria-label", "Close overview");
      closeButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="22" height="22" ' +
        'aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" ' +
        'stroke="currentColor" stroke-width="2.2" ' +
        'stroke-linecap="round" fill="none"/></svg>';
      closeButton.addEventListener("click", close);
      bar.appendChild(closeButton);
      overlay.appendChild(bar);

      var grid = makeElement("div", "emi-grid");
      cards = [];
      slideSections().forEach(function (section, index) {
        var card = makeElement("button", "emi-grid-card");
        card.setAttribute("type", "button");
        card.dataset.index = String(index);

        var thumbWrap = makeElement("span", "emi-grid-thumbwrap");
        var image = makeElement("img");
        image.src = thumbDir + prefix + pad2(index + 1) + ext;
        image.alt = "Slide " + (index + 1);
        image.loading = "lazy";
        thumbWrap.appendChild(image);
        card.appendChild(thumbWrap);

        var meta = makeElement("span", "emi-grid-meta");
        meta.appendChild(
          makeElement("span", "emi-grid-num", pad2(index + 1))
        );
        meta.appendChild(
          makeElement("span", "emi-grid-name", slideTitle(section, index))
        );
        card.appendChild(meta);

        card.addEventListener("click", function () {
          if (global.Reveal && global.Reveal.slide) {
            global.Reveal.slide(index, 0);
          }
          close();
        });
        cards.push(card);
        grid.appendChild(card);
      });
      overlay.appendChild(grid);

      // Click on the backdrop (not a card) closes.
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          close();
        }
      });

      document.body.appendChild(overlay);
      built = true;
    }

    function highlightCurrent() {
      var current = (global.Reveal && global.Reveal.getIndices)
        ? global.Reveal.getIndices().h : 0;
      cards.forEach(function (card, index) {
        if (index === current) {
          card.classList.add("is-current");
          // Bring the current card into view.
          if (card.scrollIntoView) {
            card.scrollIntoView({ block: "nearest" });
          }
        } else {
          card.classList.remove("is-current");
        }
      });
    }

    function open() {
      if (!built) {
        build();
      }
      highlightCurrent();
      overlay.classList.add("is-open");
      if (onChange) {
        onChange(true);
      }
    }

    function close() {
      if (overlay) {
        overlay.classList.remove("is-open");
      }
      if (onChange) {
        onChange(false);
      }
    }

    function isOpen() {
      return Boolean(overlay && overlay.classList.contains("is-open"));
    }

    function toggle() {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    return {
      open: open,
      close: close,
      toggle: toggle,
      isOpen: isOpen
    };
  };

  // =================================================================
  // EMI.autoInit — wire up [data-emi] elements after Reveal is ready.
  // =================================================================
  EMI.autoInit = function () {
    var nodes = document.querySelectorAll("[data-emi]");
    nodes.forEach(function (node) {
      if (node.dataset.emiMounted === "1") {
        return;
      }
      node.dataset.emiMounted = "1";
      var kind = node.dataset.emi;
      if (kind === "overlay") {
        EMI.overlay(node, {
          load: node.dataset.load,
          version: node.dataset.version,
          floor: node.dataset.floor ?
            parseInt(node.dataset.floor, 10) : undefined,
          controls: node.dataset.controls !== "false",
          play: node.dataset.play !== "false",
          autoplay: node.dataset.autoplay !== "false"
        });
      } else if (kind === "bars") {
        EMI.bars(node, { metric: node.dataset.metric });
      } else if (kind === "architecture") {
        EMI.architecture(node);
      } else if (kind === "mimo") {
        EMI.mimo(node, { load: node.dataset.load });
      } else if (kind === "diagram-one-vs-many") {
        EMI.diagramOneVsMany(node);
      } else if (kind === "diagram-bilinear") {
        EMI.diagramBilinear(node);
      } else if (kind === "speedup") {
        EMI.speedup(node, {
          ratio: node.dataset.ratio ?
            parseFloat(node.dataset.ratio) : undefined,
          seconds: node.dataset.seconds ?
            parseFloat(node.dataset.seconds) : undefined
        });
      } else if (kind === "counter") {
        EMI.counter(node, parseFloat(node.dataset.target || "0"), {
          decimals: node.dataset.decimals ?
            parseInt(node.dataset.decimals, 10) : 0,
          prefix: node.dataset.prefix || "",
          suffix: node.dataset.suffix || "",
          colorClass: node.dataset.color || ""
        });
      }
    });
  };

  global.EMI = EMI;
})(window);

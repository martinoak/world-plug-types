(function () {
  "use strict";

  const ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";
  const W = 960;
  const H = 500;
  const TYPES = Object.keys(PLUG_TYPES);

  const normalize = (s) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- Country records ----------
  const countries = Object.entries(COUNTRY_DATA)
    .map(([id, [names, types, volts, hz]]) => {
      const [name, ...aliases] = names.split("|");
      return {
        id, name, aliases,
        types: types.split(""),
        volts, hz,
        search: normalize([name, ...aliases].join(" | ")),
        features: [],
        paths: [],
        li: null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(countries.map((c) => [c.id, c]));

  const state = { query: "", types: new Set(), selected: null };

  // ---------- DOM ----------
  const svg = d3.select("#map");
  const wrap = document.getElementById("map-wrap");
  const tooltip = document.getElementById("tooltip");
  const details = document.getElementById("details");
  const searchInput = document.getElementById("search");
  const listEl = document.getElementById("country-list");
  const countEl = document.getElementById("count");
  const clearBtn = document.getElementById("clear-filters");
  const filterEl = document.getElementById("type-filter");

  const projection = d3.geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], { type: "Sphere" });
  const path = d3.geoPath(projection);

  const g = svg.append("g");
  g.append("path").attr("class", "sphere").attr("d", path({ type: "Sphere" }));
  g.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));
  const countryLayer = g.append("g");

  const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .translateExtent([[0, 0], [W, H]])
    .on("zoom", (e) => g.attr("transform", e.transform));
  svg.call(zoom);

  document.getElementById("zoom-in").onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1.6);
  document.getElementById("zoom-out").onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6);
  document.getElementById("zoom-reset").onclick = () => svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);

  // ---------- Type filter chips ----------
  filterEl.innerHTML = TYPES.map(
    (t) => `<button class="chip" data-type="${t}" aria-pressed="false" title="Type ${t}: ${PLUG_TYPES[t].desc}">${plugIcon(t, 20)}${t}</button>`
  ).join("");
  filterEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    const t = btn.dataset.type;
    state.types.has(t) ? state.types.delete(t) : state.types.add(t);
    btn.setAttribute("aria-pressed", state.types.has(t));
    update();
  });

  // ---------- Country list ----------
  for (const c of countries) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="name">${escapeHtml(c.name)}</span><span class="badges">${c.types
      .map((t) => `<span class="badge">${t}</span>`)
      .join("")}</span>`;
    li.addEventListener("click", () => select(c, true));
    li.addEventListener("mouseenter", () => setHover(c, true));
    li.addEventListener("mouseleave", () => setHover(c, false));
    c.li = li;
    listEl.appendChild(li);
  }
  const emptyEl = document.createElement("li");
  emptyEl.className = "empty";
  emptyEl.textContent = "No countries match.";
  listEl.appendChild(emptyEl);

  searchInput.addEventListener("input", () => {
    state.query = normalize(searchInput.value);
    update();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = countries.find(matches);
      if (first) select(first, true);
    }
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    state.types.clear();
    filterEl.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", "false"));
    update();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") select(null);
  });

  function matches(c) {
    if (state.query && !c.search.includes(state.query)) return false;
    if (state.types.size && !c.types.some((t) => state.types.has(t))) return false;
    return true;
  }

  function update() {
    const filtering = Boolean(state.query || state.types.size);
    let shown = 0;
    for (const c of countries) {
      const ok = matches(c);
      c.li.hidden = !ok;
      if (ok) shown++;
    }
    emptyEl.hidden = shown > 0;
    countEl.textContent = filtering ? `${shown} of ${countries.length} countries` : `${countries.length} countries`;
    clearBtn.hidden = !filtering;

    countryLayer.selectAll("path.country")
      .classed("dim", (f) => filtering && !(f.rec && matches(f.rec)))
      .classed("match", (f) => filtering && f.rec && matches(f.rec));
  }

  // ---------- Hover & tooltip ----------
  function setHover(c, on) {
    if (!c) return;
    // No DOM re-ordering here: moving a node between pointerdown and click swallows taps.
    for (const p of c.paths) p.classList.toggle("hover", on);
  }

  function formatMeta(c) {
    return `${c.volts} V · ${c.hz} Hz`;
  }

  function showTooltip(event, c, fallbackName) {
    if (event.pointerType === "touch") return;
    if (c) {
      tooltip.innerHTML = `
        <div class="tt-name">${escapeHtml(c.name)}</div>
        <div class="tt-plugs">${c.types
          .map((t) => `<div class="tt-plug">${plugIcon(t, 34)}<span>Type ${t}</span></div>`)
          .join("")}</div>
        <div class="tt-meta">${formatMeta(c)}</div>`;
    } else {
      tooltip.innerHTML = `<div class="tt-name">${escapeHtml(fallbackName || "Unknown")}</div><div class="tt-meta">No plug data</div>`;
    }
    tooltip.hidden = false;
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const r = wrap.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let x = event.clientX - r.left + 16;
    let y = event.clientY - r.top + 16;
    if (x + tw > r.width - 6) x = event.clientX - r.left - tw - 16;
    if (y + th > r.height - 6) y = event.clientY - r.top - th - 16;
    tooltip.style.transform = `translate(${Math.max(6, x)}px, ${Math.max(6, y)}px)`;
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  // ---------- Selection & details ----------
  function select(c, zoomTo) {
    if (state.selected) {
      state.selected.li.classList.remove("selected");
      for (const p of state.selected.paths) p.classList.remove("selected");
    }
    state.selected = c;
    if (!c) {
      details.hidden = true;
      return;
    }
    c.li.classList.add("selected");
    scrollListTo(c.li);
    for (const p of c.paths) p.classList.add("selected");
    d3.selectAll(c.paths).raise();

    details.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <h2>${escapeHtml(c.name)}</h2>
      <div class="meta">${formatMeta(c)}</div>
      ${c.types
        .map(
          (t) => `<div class="plug-row">${plugIcon(t, 52)}<div><strong>Type ${t}</strong>${PLUG_TYPES[t].desc}<br><small>Also used in: ${PLUG_TYPES[t].where}</small></div></div>`
        )
        .join("")}
      ${c.paths.length ? "" : `<div class="not-on-map">Too small to show at this map scale.</div>`}`;
    details.querySelector(".close").onclick = () => select(null);
    details.hidden = false;

    if (zoomTo && c.features.length) zoomToCountry(c);
  }

  // Scroll only the list (scrollIntoView would also scroll the page on mobile).
  function scrollListTo(li) {
    if (li.hidden) return;
    const top = li.offsetTop;
    const bottom = top + li.offsetHeight;
    if (top < listEl.scrollTop) listEl.scrollTop = top;
    else if (bottom > listEl.scrollTop + listEl.clientHeight) listEl.scrollTop = bottom - listEl.clientHeight;
  }

  function zoomToCountry(c) {
    let [[x0, y0], [x1, y1]] = path.bounds(c.features[0]);
    for (const f of c.features.slice(1)) {
      const [[a0, b0], [a1, b1]] = path.bounds(f);
      x0 = Math.min(x0, a0); y0 = Math.min(y0, b0);
      x1 = Math.max(x1, a1); y1 = Math.max(y1, b1);
    }
    // On wide screens, fit the country into the area to the right of the details card.
    const viewScale = Math.min(wrap.clientWidth / W, wrap.clientHeight / H);
    const letterbox = (wrap.clientWidth - W * viewScale) / 2;
    const overlay = !details.hidden && getComputedStyle(details).position === "absolute";
    const cardRight = overlay ? details.offsetWidth + 24 : 0;
    const left = Math.max(0, (cardRight - letterbox) / viewScale);
    const w = W - left;
    const k = Math.max(1, Math.min(16, 0.8 / Math.max((x1 - x0) / w, (y1 - y0) / H)));
    const t = d3.zoomIdentity.translate(left + w / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    svg.transition().duration(750).call(zoom.transform, t);
  }

  // ---------- Load map ----------
  update();

  d3.json(ATLAS_URL)
    .then((topo) => {
      document.getElementById("loading").remove();
      const features = topojson.feature(topo, topo.objects.countries).features;
      for (const f of features) {
        f.rec = byId.get(f.id) || byId.get(FEATURE_NAME_KEYS[f.properties.name]) || null;
        if (f.rec) f.rec.features.push(f);
      }

      countryLayer.selectAll("path")
        .data(features)
        .join("path")
        .attr("class", (f) => "country" + (f.rec ? "" : " no-data"))
        .attr("d", path)
        .each(function (f) {
          if (f.rec) f.rec.paths.push(this);
        })
        .on("pointerenter", function (event, f) {
          setHover(f.rec, true);
          if (f.rec) f.rec.li.classList.add("active");
          showTooltip(event, f.rec, f.properties.name);
        })
        .on("pointermove", (event) => {
          if (!tooltip.hidden) moveTooltip(event);
        })
        .on("pointerleave", function (event, f) {
          setHover(f.rec, false);
          if (f.rec) f.rec.li.classList.remove("active");
          hideTooltip();
        })
        .on("click", (event, f) => {
          event.stopPropagation();
          if (f.rec) select(f.rec, false);
        });

      svg.select(".sphere").on("click", () => select(null));
      update();
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("loading").textContent = "Could not load the map. Check your connection and reload.";
    });
})();

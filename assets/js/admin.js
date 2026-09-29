/* =============================================================================
   ADMIN  —  edits the prices and writes pricing-config.js back out.
   =============================================================================
   Everything is described as a schema below, so a section is a list of fields
   rather than a slab of hand-written markup, and adding a field to the config
   means adding one line here.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PREVIEW_KEY = "cartapp-preview-config";

  /* The published prices, and the working copy being edited. */
  const published = JSON.parse(JSON.stringify(PRICING));
  let state = JSON.parse(JSON.stringify(PRICING));

  const money = new Intl.NumberFormat(PRICING.locale, {
    style: "currency",
    currency: PRICING.currency,
    minimumFractionDigits: PRICING.decimals,
    maximumFractionDigits: PRICING.decimals,
  });

  /* --- What can be edited, and how ------------------------------------- */

  const groupChoices = () => [
    { value: "icecream", label: "Ice cream" },
    { value: "drinks", label: "Drinks" },
  ];

  const appliesChoices = () => [
    { value: "all", label: "All cups" },
    { value: "icecream", label: "Ice cream cups only" },
    { value: "drinks", label: "Drinks cups only" },
  ];

  const unitChoices = () => [
    { value: "cup", label: "cups" },
    { value: "piece", label: "pieces" },
  ];

  /* Fields shared by everything that has a name and a note. */
  const NAMED = [
    { key: "name", label: "Name", type: "text" },
    { key: "name_ar", label: "Name in Arabic", type: "text", rtl: true },
    { key: "note", label: "Description", type: "text", wide: true },
    { key: "note_ar", label: "Description in Arabic", type: "text", rtl: true, wide: true },
  ];

  const LISTS = [
    {
      key: "menu",
      title: "Menu items",
      blurb:
        "What the carts serve. Each item shows its own smallest quantity on " +
        "the calculator, and a cart only offers the groups it serves.",
      addLabel: "Add a menu item",
      blank: () => ({
        id: uniqueId("item"), group: "icecream", name: "New item", name_ar: "",
        pricePerCup: 1, note: "", note_ar: "",
      }),
      fields: [
        ...NAMED,
        { key: "group", label: "Belongs to", type: "select", choices: groupChoices },
        { key: "pricePerCup", label: "Price per cup", type: "money" },
        {
          key: "minCups", label: "Smallest order", type: "number", step: 1,
          placeholder: () => String(state.minimumCups),
          help: "Leave empty to use the shop minimum.",
        },
      ],
    },
    {
      key: "quantityExtras",
      title: "Extras with a quantity",
      blurb: "The customer says how many they want, with a counter of their own.",
      addLabel: "Add one",
      blank: () => ({
        id: uniqueId("extra"), name: "New extra", name_ar: "", note: "", note_ar: "",
        pricePerUnit: 1, minQty: 1, unit: "cup",
      }),
      fields: [
        ...NAMED,
        { key: "pricePerUnit", label: "Price each", type: "money" },
        { key: "minQty", label: "Smallest order", type: "number", step: 1 },
        { key: "unit", label: "Counted in", type: "select", choices: unitChoices },
      ],
    },
    {
      key: "cupExtras",
      title: "Extras charged per cup",
      blurb: "Charged on the cups already ordered, not counted separately.",
      addLabel: "Add one",
      blank: () => ({
        id: uniqueId("extra"), name: "New extra", name_ar: "", note: "", note_ar: "",
        pricePerCup: 0.2, appliesTo: "all",
      }),
      fields: [
        ...NAMED,
        { key: "pricePerCup", label: "Price per cup", type: "money" },
        { key: "appliesTo", label: "Counted on", type: "select", choices: appliesChoices },
      ],
    },
    {
      key: "flatExtras",
      title: "Extras charged once",
      blurb: "A single charge, whatever the order size.",
      addLabel: "Add one",
      blank: () => ({
        id: uniqueId("extra"), name: "New extra", name_ar: "", note: "", note_ar: "",
        price: 10,
      }),
      fields: [...NAMED, { key: "price", label: "Price", type: "money" }],
    },
    {
      key: "locations",
      title: "Areas you cover",
      blurb: "The first one is the default, and usually the one with no charge.",
      addLabel: "Add an area",
      blank: () => ({ id: uniqueId("area"), name: "New area", name_ar: "", charge: 0 }),
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "name_ar", label: "Name in Arabic", type: "text", rtl: true },
        { key: "charge", label: "Travel charge", type: "money" },
      ],
    },
    {
      key: "carts",
      title: "Carts",
      blurb: "What a customer picks first. `Serves` decides which menu it shows.",
      addLabel: "Add a cart",
      blank: () => ({
        id: uniqueId("cart"), name: "New cart", name_ar: "", blurb: "", blurb_ar: "",
        emoji: "🛒", serves: ["icecream"],
      }),
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "name_ar", label: "Name in Arabic", type: "text", rtl: true },
        { key: "blurb", label: "Description", type: "text", wide: true },
        { key: "blurb_ar", label: "Description in Arabic", type: "text", rtl: true, wide: true },
        { key: "emoji", label: "Icon", type: "text" },
        { key: "serves", label: "Serves", type: "checks", choices: groupChoices },
      ],
    },
  ];

  /* Single values, grouped the way someone would think about them. */
  const NUMBERS = [
    {
      title: "What every booking starts at",
      fields: [
        { path: "serviceFee", label: "Service fee", type: "money" },
        { path: "duration.includedHours", label: "Hours included", type: "number", step: 1 },
        { path: "duration.extraHourRate", label: "Each extra hour", type: "money" },
        { path: "minimumCups", label: "Smallest order of any item", type: "number", step: 5 },
        {
          path: "groupMinimums.drinks", label: "Drinks must total", type: "number", step: 5,
          help: "Across all drinks together. Leave empty for no rule.",
        },
      ],
    },
    {
      title: "Tax and deposit",
      fields: [
        { path: "tax.percent", label: "VAT %", type: "number", step: 1, help: "0 hides the tax line." },
        { path: "deposit.percent", label: "Deposit %", type: "number", step: 5, help: "0 hides the deposit line." },
      ],
    },
    {
      title: "Where enquiries go",
      fields: [
        { path: "enquiry.email", label: "Your email", type: "text", wide: true },
        { path: "business.name", label: "Business name", type: "text" },
        { path: "business.tagline", label: "Tagline", type: "text", wide: true },
        { path: "business.tagline_ar", label: "Tagline in Arabic", type: "text", rtl: true, wide: true },
      ],
    },
  ];

  /* --- Small helpers ---------------------------------------------------- */

  function get(path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), state);
  }

  function set(path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), state);
    if (value === undefined) delete target[last];
    else target[last] = value;
  }

  /* Codes are how the calculator refers to an item; they must stay unique. */
  function uniqueId(prefix) {
    const taken = new Set();
    LISTS.forEach((list) =>
      (state[list.key] || []).forEach((row) => taken.add(row.id))
    );
    let n = 1;
    while (taken.has(`${prefix}_${n}`)) n += 1;
    return `${prefix}_${n}`;
  }

  function changed() {
    return JSON.stringify(state) !== JSON.stringify(published);
  }

  /* --- Rendering -------------------------------------------------------- */

  function field(spec, value, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "admin-field" + (spec.wide ? " is-wide" : "");

    const label = document.createElement("label");
    label.textContent = spec.label;
    wrap.appendChild(label);

    let input;
    if (spec.type === "select") {
      input = document.createElement("select");
      spec.choices().forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice.value;
        option.textContent = choice.label;
        input.appendChild(option);
      });
      input.value = value == null ? "" : value;
      input.addEventListener("change", () => onChange(input.value));
    } else if (spec.type === "checks") {
      input = document.createElement("div");
      input.className = "admin-checks";
      spec.choices().forEach((choice) => {
        const box = document.createElement("label");
        box.className = "checkbox";
        const tick = document.createElement("input");
        tick.type = "checkbox";
        tick.checked = (value || []).includes(choice.value);
        tick.addEventListener("change", () => {
          const next = new Set(value || []);
          if (tick.checked) next.add(choice.value);
          else next.delete(choice.value);
          onChange([...next]);
        });
        const text = document.createElement("span");
        text.textContent = choice.label;
        box.append(tick, text);
        input.appendChild(box);
      });
    } else {
      input = document.createElement("input");
      input.type = spec.type === "text" ? "text" : "number";
      if (spec.type === "money") {
        input.step = "0.05";
        input.min = "0";
      } else if (spec.type === "number") {
        input.step = String(spec.step || 1);
        input.min = "0";
      }
      if (spec.rtl) input.dir = "rtl";
      if (spec.placeholder) input.placeholder = spec.placeholder();
      input.value = value == null ? "" : value;
      input.addEventListener("input", () => {
        if (spec.type === "text") return onChange(input.value);
        /* An empty number means "not set", which is not the same as zero:
           an item with no minimum falls back to the shop's. */
        if (input.value.trim() === "") return onChange(undefined);
        onChange(Number(input.value));
      });
    }

    wrap.appendChild(input);

    if (spec.help) {
      const help = document.createElement("p");
      help.className = "admin-help";
      help.textContent = spec.help;
      wrap.appendChild(help);
    }
    return wrap;
  }

  function renderList(list) {
    const section = document.createElement("section");
    section.className = "panel admin-section";

    const heading = document.createElement("h2");
    heading.textContent = list.title;
    section.appendChild(heading);

    if (list.blurb) {
      const blurb = document.createElement("p");
      blurb.className = "admin-blurb";
      blurb.textContent = list.blurb;
      section.appendChild(blurb);
    }

    (state[list.key] || []).forEach((row, index) => {
      const card = document.createElement("div");
      card.className = "admin-row";

      const head = document.createElement("div");
      head.className = "admin-row-head";
      const title = document.createElement("strong");
      title.textContent = row.name || row.id;
      const code = document.createElement("span");
      code.className = "admin-code";
      code.textContent = row.id;
      head.append(title, code);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "admin-remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        const name = row.name || row.id;
        if (!window.confirm(`Remove "${name}"? Customers will no longer see it.`)) return;
        state[list.key].splice(index, 1);
        renderAll();
      });
      head.appendChild(remove);
      card.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "admin-grid";
      list.fields.forEach((spec) => {
        grid.appendChild(
          field(spec, row[spec.key], (value) => {
            if (value === undefined) delete row[spec.key];
            else row[spec.key] = value;
            touched();
            if (spec.key === "name") title.textContent = value || row.id;
          })
        );
      });
      card.appendChild(grid);
      section.appendChild(card);
    });

    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn-ghost";
    add.textContent = list.addLabel;
    add.addEventListener("click", () => {
      state[list.key] = state[list.key] || [];
      state[list.key].push(list.blank());
      renderAll();
    });
    section.appendChild(add);

    return section;
  }

  function renderNumbers(group) {
    const section = document.createElement("section");
    section.className = "panel admin-section";
    const heading = document.createElement("h2");
    heading.textContent = group.title;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "admin-grid";
    group.fields.forEach((spec) => {
      grid.appendChild(
        field(spec, get(spec.path), (value) => {
          set(spec.path, value);
          touched();
        })
      );
    });
    section.appendChild(grid);
    return section;
  }

  function renderAll() {
    const host = $("sections");
    host.innerHTML = "";
    /* The headline numbers first, then the lists, then the rest. */
    host.appendChild(renderNumbers(NUMBERS[0]));
    LISTS.forEach((list) => host.appendChild(renderList(list)));
    NUMBERS.slice(1).forEach((group) => host.appendChild(renderNumbers(group)));
    touched();
  }

  /* --- What the side panel says ----------------------------------------- */

  function touched() {
    const dirty = changed();
    $("status").textContent = dirty
      ? "You have unsaved changes."
      : "No changes yet.";
    $("status").classList.toggle("is-dirty", dirty);
  }

  /* --- Trying it out on the real calculator ----------------------------- */

  function previewing() {
    try { return !!localStorage.getItem(PREVIEW_KEY); } catch (e) { return false; }
  }

  function syncPreviewButtons() {
    $("stopPreviewBtn").hidden = !previewing();
  }

  function startPreview() {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
    } catch (e) {
      window.alert("This browser will not let the page remember the preview.");
      return;
    }
    syncPreviewButtons();
    window.open("index.html", "_blank");
  }

  function stopPreview() {
    try { localStorage.removeItem(PREVIEW_KEY); } catch (e) { /* ignore */ }
    syncPreviewButtons();
  }

  /* --- Saving ------------------------------------------------------------ */

  function fileText() {
    return serialiseConfig(state);
  }

  function download() {
    const blob = new Blob([fileText()], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pricing-config.js";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    const text = fileText();
    try {
      await navigator.clipboard.writeText(text);
      flash($("copyBtn"), "Copied");
    } catch (e) {
      /* Clipboard access is refused in some browsers; fall back to a download,
         which is the same file by another route. */
      download();
      flash($("copyBtn"), "Downloaded instead");
    }
  }

  function flash(button, message) {
    const original = button.textContent;
    button.textContent = message;
    setTimeout(() => { button.textContent = original; }, 1800);
  }

  /* --- Wiring ------------------------------------------------------------ */

  function init() {
    renderAll();
    syncPreviewButtons();

    $("previewBtn").addEventListener("click", startPreview);
    $("stopPreviewBtn").addEventListener("click", stopPreview);
    $("downloadBtn").addEventListener("click", download);
    $("copyBtn").addEventListener("click", copy);
    $("resetBtn").addEventListener("click", () => {
      if (changed() && !window.confirm("Undo every change you have made here?")) return;
      state = JSON.parse(JSON.stringify(published));
      stopPreview();
      renderAll();
    });

    window.addEventListener("beforeunload", (e) => {
      if (!changed()) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();

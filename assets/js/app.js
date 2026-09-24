/* =============================================================================
   APP  —  builds the form from pricing-config.js and keeps the estimate live.
   ========================================================================== */
(function () {
  "use strict";

  const cfg = PRICING;
  const $ = (id) => document.getElementById(id);

  /* Rials are written to 3 decimals (baisa); `decimals` in the config sets it. */
  const dp = Number.isInteger(cfg.decimals) ? cfg.decimals : 2;
  const money = new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
  const fmt = (n) => money.format(n);

  const GROUP_NAMES = { icecream: "Ice cream", drinks: "Drinks" };

  const el = {
    form: $("quoteForm"),
    cartOptions: $("cartOptions"),
    menu: $("menu"),
    cupsTotal: $("cupsTotal"),
    extras: $("extras"),
    location: $("location"),
    locationHint: $("locationHint"),
    hours: $("hours"),
    hoursValue: $("hoursValue"),
    hoursHint: $("hoursHint"),
    total: $("quoteTotal"),
    sub: $("quoteSub"),
    warnings: $("quoteWarnings"),
    body: $("breakdownBody"),
    foot: $("breakdownFoot"),
    mobileBar: $("mobileBar"),
    mobileBarTotal: $("mobileBarTotal"),
  };

  let selectedCartId = cfg.carts[0].id;
  /* Cup counts are kept here rather than read off the inputs, so switching
     cart does not lose what the customer already typed. */
  let quantities = {};

  /* --- Static text from the config ------------------------------------ */
  function applyBusinessText() {
    document.title = `${cfg.business.name} — Cart hire cost calculator`;
    document.querySelectorAll("[data-business-name]").forEach((n) => {
      n.textContent = cfg.business.name;
    });
    document.querySelectorAll("[data-business-tagline]").forEach((n) => {
      n.textContent = cfg.business.tagline;
    });
    document.querySelectorAll("[data-business-disclaimer]").forEach((n) => {
      n.textContent = cfg.business.disclaimer;
    });
  }

  /* --- Cart chooser ---------------------------------------------------- */
  function renderCarts() {
    el.cartOptions.innerHTML = "";
    cfg.carts.forEach((cart, i) => {
      const label = document.createElement("label");
      label.className = "cart-option" + (i === 0 ? " is-selected" : "");
      label.innerHTML = `
        <input type="radio" name="cart" value="${cart.id}" ${i === 0 ? "checked" : ""}>
        <span class="cart-option-emoji" aria-hidden="true">${cart.emoji || "🛒"}</span>
        <strong class="cart-option-name"></strong>
        <span class="cart-option-blurb"></span>
        <span class="cart-option-from">from ${fmt(cfg.serviceFee)}</span>`;
      label.querySelector(".cart-option-name").textContent = cart.name;
      label.querySelector(".cart-option-blurb").textContent = cart.blurb;
      el.cartOptions.appendChild(label);
    });

    el.cartOptions.addEventListener("change", (e) => {
      if (e.target.name !== "cart") return;
      selectedCartId = e.target.value;
      el.cartOptions.querySelectorAll(".cart-option").forEach((o) => {
        o.classList.toggle("is-selected", o.querySelector("input").checked);
      });
      renderMenu();
      renderExtras();
      update();
    });
  }

  function currentCart() {
    return cfg.carts.find((c) => c.id === selectedCartId) || cfg.carts[0];
  }

  /* --- The menu, grouped, showing only what this cart serves ----------- */
  function renderMenu() {
    const cart = currentCart();
    el.menu.innerHTML = "";

    cart.serves.forEach((group) => {
      const items = cfg.menu.filter((i) => i.group === group);
      if (!items.length) return;

      /* Only label the groups when a cart serves more than one. */
      if (cart.serves.length > 1) {
        const heading = document.createElement("p");
        heading.className = "menu-group";
        heading.textContent = GROUP_NAMES[group] || group;
        el.menu.appendChild(heading);
      }

      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "menu-item";
        row.innerHTML = `
          <div class="menu-item-text">
            <span class="menu-item-name"></span>
            <span class="menu-item-note"></span>
            <span class="menu-item-price">${fmt(item.pricePerCup)} per cup</span>
          </div>
          <div class="qty">
            <button type="button" class="qty-btn" data-step="-10"
                    aria-label="Fewer cups of ${item.name}">−</button>
            <input type="number" class="qty-input" inputmode="numeric"
                   min="0" max="5000" step="1" value="${quantities[item.id] || 0}"
                   data-item="${item.id}" aria-label="Cups of ${item.name}">
            <button type="button" class="qty-btn" data-step="10"
                    aria-label="More cups of ${item.name}">+</button>
          </div>`;
        row.querySelector(".menu-item-name").textContent = item.name;
        row.querySelector(".menu-item-note").textContent = item.note || "";
        el.menu.appendChild(row);
      });
    });

    /* The +/− buttons move in tens, which is how people order cups. */
    el.menu.querySelectorAll(".qty-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.parentElement.querySelector(".qty-input");
        const step = Number(button.dataset.step);
        const next = Math.max(0, (Number(input.value) || 0) + step);
        input.value = next;
        quantities[input.dataset.item] = next;
        update();
      });
    });
  }

  /* --- Extras, filtered to the ones this cart can offer ---------------- */
  function renderExtras() {
    const cart = currentCart();
    const previously = new Set(selectedExtras());
    el.extras.innerHTML = "";

    const cupExtras = cfg.cupExtras.filter(
      (e) => e.appliesTo === "all" || cart.serves.includes(e.appliesTo)
    );

    cupExtras
      .map((e) => ({ ...e, priceLabel: `${fmt(e.pricePerCup)} per cup`, kind: "cup" }))
      .concat(
        cfg.flatExtras.map((e) => ({ ...e, priceLabel: fmt(e.price), kind: "flat" }))
      )
      .forEach((extra) => {
        const checked = previously.has(extra.id);
        const label = document.createElement("label");
        label.className = "addon" + (checked ? " is-selected" : "");
        label.innerHTML = `
          <input type="checkbox" name="extra" value="${extra.id}"
                 data-kind="${extra.kind}" ${checked ? "checked" : ""}>
          <span>
            <span class="addon-name"></span>
            <span class="addon-note"></span>
            <span class="addon-price">${extra.priceLabel}</span>
          </span>`;
        label.querySelector(".addon-name").textContent = extra.name;
        label.querySelector(".addon-note").textContent = extra.note || "";
        el.extras.appendChild(label);
      });
  }

  function selectedExtras(kind) {
    const selector = kind
      ? `input[name="extra"][data-kind="${kind}"]:checked`
      : 'input[name="extra"]:checked';
    return Array.from(el.extras.querySelectorAll(selector)).map((i) => i.value);
  }

  /* --- Locations -------------------------------------------------------- */
  function renderLocations() {
    el.location.innerHTML = "";
    cfg.locations.forEach((loc) => {
      const option = document.createElement("option");
      option.value = loc.id;
      option.textContent =
        loc.charge > 0 ? `${loc.name} (+${fmt(loc.charge)})` : loc.name;
      el.location.appendChild(option);
    });
  }

  /* --- Reading the form ------------------------------------------------ */
  function readInput() {
    return {
      cartId: selectedCartId,
      quantities,
      locationId: el.location.value,
      hours: Number(el.hours.value),
      cupExtras: selectedExtras("cup"),
      flatExtras: selectedExtras("flat"),
    };
  }

  /* --- Rendering the estimate ------------------------------------------ */
  function row(label, detail, amount, rowClass) {
    const tr = document.createElement("tr");
    if (rowClass) tr.className = rowClass;
    const tdLabel = document.createElement("td");
    tdLabel.textContent = label;
    if (detail) {
      const small = document.createElement("span");
      small.className = "cell-detail";
      small.textContent = detail;
      tdLabel.appendChild(small);
    }
    const tdAmount = document.createElement("td");
    tdAmount.className = "cell-amount";
    tdAmount.textContent = amount;
    tr.append(tdLabel, tdAmount);
    return tr;
  }

  function renderQuote(q) {
    const showPrice = q.totalCups > 0;
    el.total.textContent = showPrice ? fmt(q.total) : "—";
    el.mobileBarTotal.textContent = showPrice ? fmt(q.total) : "—";
    el.sub.textContent = showPrice
      ? `${q.cart.name} · ${q.totalCups} cups · ${q.hours} h · ` +
        `about ${fmt(q.perCup)} per cup`
      : "Choose your cups to see a price.";

    el.body.innerHTML = "";
    el.foot.innerHTML = "";

    if (showPrice) {
      q.lines.forEach((l) => el.body.appendChild(row(l.label, l.detail, fmt(l.amount))));
      if (q.tax) {
        el.foot.appendChild(row("Subtotal", "", fmt(q.subtotal)));
        el.foot.appendChild(row(q.tax.label, "", fmt(q.tax.amount)));
      }
      el.foot.appendChild(row("Total estimate", "", fmt(q.total), "row-total"));
      if (q.deposit) {
        el.foot.appendChild(row(q.deposit.label, "", fmt(q.deposit.amount), "row-deposit"));
      }
    }

    el.warnings.innerHTML = "";
    q.warnings.forEach((text) => {
      const p = document.createElement("p");
      p.className = "warning";
      p.textContent = text;
      el.warnings.appendChild(p);
    });
  }

  /* --- Hints under the inputs ------------------------------------------ */
  function renderHints(q) {
    el.hoursValue.textContent = `${q.hours} h`;
    const included = cfg.duration.includedHours;
    const extra = q.hours - included;
    el.hoursHint.textContent =
      extra > 0
        ? `${extra} ${extra === 1 ? "hour" : "hours"} beyond the ${included} ` +
          `included, at ${fmt(cfg.duration.extraHourRate)} each.`
        : `${included} hours are included in the service fee.`;

    el.locationHint.textContent =
      q.location.charge > 0
        ? `${q.location.name} carries a ${fmt(q.location.charge)} travel charge.`
        : `No travel charge within ${q.location.name}.`;

    const short = cfg.minimumCups - q.totalCups;
    el.cupsTotal.textContent =
      q.totalCups === 0
        ? `Minimum order ${cfg.minimumCups} cups.`
        : q.meetsMinimum
        ? `${q.totalCups} cups in total.`
        : `${q.totalCups} cups — ${short} short of our ${cfg.minimumCups} cup minimum.`;
    el.cupsTotal.classList.toggle("is-alert", q.totalCups > 0 && !q.meetsMinimum);
  }

  /* Highlight the rows the customer has actually ordered. */
  function markChosenItems() {
    el.menu.querySelectorAll(".qty-input").forEach((input) => {
      const ordered = (quantities[input.dataset.item] || 0) > 0;
      input.closest(".menu-item").classList.toggle("is-chosen", ordered);
    });
  }

  /* --- The one function that runs on every change ---------------------- */
  function update() {
    const q = calculateQuote(readInput(), cfg);
    markChosenItems();
    renderHints(q);
    renderQuote(q);
  }

  /* --- Theme ----------------------------------------------------------- */
  const ICON = {
    /* A moon to switch to dark, a sun to switch back. */
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2' +
         'M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  };

  function initTheme() {
    const root = document.documentElement;
    const button = $("themeToggle");
    const icon = $("themeIcon");
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const isDark = () =>
      root.getAttribute("data-theme") === "dark" ||
      (!root.hasAttribute("data-theme") && media.matches);

    function paint() {
      const dark = isDark();
      icon.innerHTML = dark ? ICON.sun : ICON.moon;
      button.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme"
      );
    }

    let stored = null;
    try { stored = localStorage.getItem("cartapp-theme"); } catch (e) { /* private mode */ }
    if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);
    paint();

    /* Follow the system while the visitor has not chosen for themselves. */
    media.addEventListener("change", () => {
      if (!root.hasAttribute("data-theme")) paint();
    });

    button.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("cartapp-theme", next); } catch (e) { /* ignore */ }
      paint();
    });
  }

  /* --- Wire everything up ---------------------------------------------- */
  function init() {
    applyBusinessText();
    el.hours.min = cfg.duration.includedHours;
    el.hours.max = cfg.duration.maxHours;
    el.hours.value = cfg.duration.includedHours;

    renderCarts();
    renderLocations();
    renderMenu();
    renderExtras();
    initTheme();

    el.form.addEventListener("input", (e) => {
      if (e.target.classList.contains("qty-input")) {
        const value = Math.max(0, Math.round(Number(e.target.value) || 0));
        quantities[e.target.dataset.item] = value;
      }
      if (e.target.name === "extra") {
        e.target.closest(".addon").classList.toggle("is-selected", e.target.checked);
      }
      update();
    });
    el.form.addEventListener("change", update);
    el.form.addEventListener("submit", (e) => e.preventDefault());

    $("resetBtn").addEventListener("click", () => {
      el.form.reset();
      selectedCartId = cfg.carts[0].id;
      quantities = {};
      el.cartOptions.querySelectorAll(".cart-option").forEach((o, i) => {
        o.querySelector("input").checked = i === 0;
        o.classList.toggle("is-selected", i === 0);
      });
      el.hours.value = cfg.duration.includedHours;
      renderMenu();
      renderExtras();
      update();
    });

    $("printBtn").addEventListener("click", () => window.print());

    /* The pinned total is only useful where the estimate is off-screen. */
    el.mobileBar.hidden = false;
    document.body.classList.add("has-mobile-bar");
    $("mobileBarBtn").addEventListener("click", () => {
      $("quote").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    update();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

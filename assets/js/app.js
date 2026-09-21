/* =============================================================================
   APP  —  builds the form from pricing-config.js and keeps the estimate live.
   ========================================================================== */
(function () {
  "use strict";

  const cfg = PRICING;
  const $ = (id) => document.getElementById(id);

  const money = new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    maximumFractionDigits: 2,
  });
  /* Whole amounts read better without ".00" in the big total. */
  const moneyRound = new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    maximumFractionDigits: 0,
  });
  const fmt = (n) => (Number.isInteger(n) ? moneyRound.format(n) : money.format(n));

  const el = {
    form: $("quoteForm"),
    cartOptions: $("cartOptions"),
    addons: $("addons"),
    date: $("date"),
    guests: $("guests"),
    hours: $("hours"),
    staff: $("staff"),
    distance: $("distance"),
    isHoliday: $("isHoliday"),
    hoursValue: $("hoursValue"),
    staffValue: $("staffValue"),
    servingsHint: $("servingsHint"),
    staffHint: $("staffHint"),
    travelHint: $("travelHint"),
    dateHint: $("dateHint"),
    total: $("quoteTotal"),
    sub: $("quoteSub"),
    warnings: $("quoteWarnings"),
    body: $("breakdownBody"),
    foot: $("breakdownFoot"),
    mobileBar: $("mobileBar"),
    mobileBarTotal: $("mobileBarTotal"),
  };

  let selectedPackageId = cfg.packages[0].id;

  /* --- Static text from the config ------------------------------------ */
  function applyBusinessText() {
    document.title = `Cart hire cost calculator — ${cfg.business.name}`;
    document.querySelectorAll("[data-business-name]").forEach((n) => {
      n.textContent = cfg.business.name;
    });
    document.querySelectorAll("[data-business-tagline]").forEach((n) => {
      n.textContent = cfg.business.tagline;
    });
    document.querySelectorAll("[data-business-disclaimer]").forEach((n) => {
      n.textContent = cfg.business.disclaimer;
    });
    document.querySelectorAll("[data-travel-unit]").forEach((n) => {
      n.textContent = cfg.travel.unit;
    });
  }

  /* --- Apply the limits from the config to the inputs ------------------ */
  function applyLimits() {
    const L = cfg.limits;
    el.guests.min = L.minGuests;
    el.guests.max = L.maxGuests;
    el.guests.value = L.defaultGuests;
    el.hours.min = L.minHours;
    el.hours.max = L.maxHours;
    el.hours.value = L.defaultHours;
    el.distance.max = cfg.travel.maxDistance;
    el.distance.value = L.defaultDistance;
    el.staff.max = cfg.staffing.maxStaff;
    el.isHoliday.closest(".check-standalone").hidden = cfg.surcharges.holidayPercent <= 0;
  }

  /* --- Cart chooser ---------------------------------------------------- */
  function renderPackages() {
    el.cartOptions.innerHTML = "";
    cfg.packages.forEach((pkg, i) => {
      const label = document.createElement("label");
      label.className = "cart-option" + (i === 0 ? " is-selected" : "");
      label.innerHTML = `
        <input type="radio" name="package" value="${pkg.id}" ${i === 0 ? "checked" : ""}>
        <span class="cart-option-emoji" aria-hidden="true">${pkg.emoji || "🛒"}</span>
        <strong class="cart-option-name"></strong>
        <span class="cart-option-blurb"></span>
        <span class="cart-option-from">from ${fmt(pkg.basePrice)}</span>`;
      label.querySelector(".cart-option-name").textContent = pkg.name;
      label.querySelector(".cart-option-blurb").textContent = pkg.blurb;
      el.cartOptions.appendChild(label);
    });

    el.cartOptions.addEventListener("change", (e) => {
      if (e.target.name !== "package") return;
      selectedPackageId = e.target.value;
      el.cartOptions.querySelectorAll(".cart-option").forEach((o) => {
        o.classList.toggle("is-selected", o.querySelector("input").checked);
      });
      syncStaffMinimum();
      renderAddons();
      update();
    });
  }

  /* --- Add-ons (only those available for the selected cart) ------------ */
  function addonPriceLabel(addon) {
    switch (addon.type) {
      case "perGuest":   return `${fmt(addon.price)} per guest`;
      case "perServing": return `${fmt(addon.price)} per serving`;
      case "perHour":    return `${fmt(addon.price)} per hour`;
      default:           return fmt(addon.price);
    }
  }

  function renderAddons() {
    const previously = new Set(selectedAddons());
    el.addons.innerHTML = "";

    const available = cfg.addons.filter(
      (a) => !a.carts || a.carts.includes(selectedPackageId)
    );

    if (!available.length) {
      el.addons.innerHTML = '<p class="hint">No add-ons for this cart.</p>';
      return;
    }

    available.forEach((addon) => {
      const checked = previously.has(addon.id);
      const label = document.createElement("label");
      label.className = "addon" + (checked ? " is-selected" : "");
      label.innerHTML = `
        <input type="checkbox" name="addon" value="${addon.id}" ${checked ? "checked" : ""}>
        <span>
          <span class="addon-name"></span>
          <span class="addon-note"></span>
          <span class="addon-price">${addonPriceLabel(addon)}</span>
        </span>`;
      label.querySelector(".addon-name").textContent = addon.name;
      label.querySelector(".addon-note").textContent = addon.note || "";
      el.addons.appendChild(label);
    });
  }

  function selectedAddons() {
    return Array.from(
      el.addons.querySelectorAll('input[name="addon"]:checked')
    ).map((i) => i.value);
  }

  /* --- A cart's included staff is the floor for the staff slider ------- */
  function syncStaffMinimum() {
    const pkg = cfg.packages.find((p) => p.id === selectedPackageId);
    el.staff.min = pkg.includedStaff;
    if (Number(el.staff.value) < pkg.includedStaff) el.staff.value = pkg.includedStaff;
  }

  /* --- Reading the form ------------------------------------------------ */
  function readInput() {
    return {
      packageId: selectedPackageId,
      guests: Number(el.guests.value),
      hours: Number(el.hours.value),
      staff: Number(el.staff.value),
      distance: Number(el.distance.value),
      date: el.date.value,
      isHoliday: el.isHoliday.checked,
      addons: selectedAddons(),
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
    el.total.textContent = fmt(q.total);
    el.mobileBarTotal.textContent = fmt(q.total);
    el.sub.textContent =
      `${q.package.name} · ${q.guests} guests · ${q.hours} h · ` +
      `about ${fmt(q.perGuest)} per guest`;

    /* Line items */
    el.body.innerHTML = "";
    q.lines.forEach((l) => el.body.appendChild(row(l.label, l.detail, fmt(l.amount))));

    /* Totals block */
    el.foot.innerHTML = "";
    if (q.discount || q.tax || q.minimumTopUp) {
      el.foot.appendChild(row("Subtotal", "", fmt(q.subtotal)));
    }
    if (q.discount) {
      el.foot.appendChild(row(q.discount.label, "", `−${fmt(q.discount.amount)}`, "row-discount"));
    }
    if (q.minimumTopUp) {
      el.foot.appendChild(row(q.minimumTopUp.label, q.minimumTopUp.detail, fmt(q.minimumTopUp.amount)));
    }
    if (q.tax) {
      el.foot.appendChild(row(q.tax.label, "", fmt(q.tax.amount)));
    }
    el.foot.appendChild(row("Total estimate", "", fmt(q.total), "row-total"));
    if (q.deposit) {
      el.foot.appendChild(row(q.deposit.label, "", fmt(q.deposit.amount), "row-deposit"));
    }

    /* Warnings */
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
    el.staffValue.textContent = q.staff;

    el.servingsHint.textContent =
      `We plan for about ${q.servings} servings (${q.package.servingsPerGuest} per guest).`;

    const short = q.recommendedStaff > q.staff;
    el.staffHint.textContent = short
      ? `We'd suggest ${q.recommendedStaff} staff for this many servings.`
      : "Enough staff to keep the queue short.";
    el.staffHint.classList.toggle("is-alert", short);

    const t = cfg.travel;
    el.travelHint.textContent =
      q.distance <= t.freeRadius
        ? `Within our free ${t.freeRadius} ${t.unit} radius — no travel charge.`
        : `${Math.round(q.distance - t.freeRadius)} ${t.unit} beyond the free radius is charged.`;
    el.travelHint.classList.toggle("is-alert", q.distance > t.freeRadius);

    el.dateHint.textContent = el.date.value
      ? describeDate(el.date.value)
      : "Weekends and peak season cost a little more.";
  }

  function describeDate(value) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return "";
    const weekday = date.toLocaleDateString(cfg.locale, { weekday: "long" });
    const notes = [];
    const s = cfg.surcharges;
    if (s.weekendPercent > 0 && (date.getDay() === 0 || date.getDay() === 6)) {
      notes.push(`weekend rate +${s.weekendPercent}%`);
    }
    if (s.peakMonthPercent > 0 && (s.peakMonths || []).includes(m)) {
      notes.push(`${(s.peakMonthLabel || "peak season").toLowerCase()} +${s.peakMonthPercent}%`);
    }
    return notes.length ? `${weekday} — ${notes.join(", ")}.` : `${weekday} — standard rate.`;
  }

  /* --- The one function that runs on every change ---------------------- */
  function update() {
    const q = calculateQuote(readInput(), cfg);
    renderHints(q);
    renderQuote(q);
  }

  /* --- Theme ----------------------------------------------------------- */
  function initTheme() {
    const root = document.documentElement;
    let stored = null;
    try { stored = localStorage.getItem("cartapp-theme"); } catch (e) { /* private mode */ }
    if (stored === "light" || stored === "dark") root.setAttribute("data-theme", stored);

    $("themeToggle").addEventListener("click", () => {
      const isDark = root.getAttribute("data-theme") === "dark" ||
        (!root.hasAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      const next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("cartapp-theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* --- Wire everything up ---------------------------------------------- */
  function init() {
    applyBusinessText();
    applyLimits();
    renderPackages();
    syncStaffMinimum();
    renderAddons();
    initTheme();

    el.form.addEventListener("input", (e) => {
      if (e.target.name === "addon") {
        e.target.closest(".addon").classList.toggle("is-selected", e.target.checked);
      }
      update();
    });
    el.form.addEventListener("change", update);
    el.form.addEventListener("submit", (e) => e.preventDefault());

    $("resetBtn").addEventListener("click", () => {
      el.form.reset();
      selectedPackageId = cfg.packages[0].id;
      applyLimits();
      el.cartOptions.querySelectorAll(".cart-option").forEach((o, i) => {
        o.querySelector("input").checked = i === 0;
        o.classList.toggle("is-selected", i === 0);
      });
      syncStaffMinimum();
      renderAddons();
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

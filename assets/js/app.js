/* =============================================================================
   APP  —  builds the form from pricing-config.js and keeps the estimate live.
   ========================================================================== */
(function () {
  "use strict";

  const cfg = PRICING;
  const $ = (id) => document.getElementById(id);

  /* The language in play. A visitor's choice is remembered on their device. */
  let lang = cfg.defaultLanguage || "en";
  const say = (key, vars) => t(key, lang, vars);
  const nameOf = (item) => localised(item, "name", lang);
  const noteOf = (item) => localised(item, "note", lang);

  /* Rials are written to 3 decimals (baisa); `decimals` in the config sets it. */
  const dp = Number.isInteger(cfg.decimals) ? cfg.decimals : 2;
  let money = null;
  function buildFormatter() {
    money = new Intl.NumberFormat(localised(cfg, "locale", lang) || cfg.locale, {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    });
  }
  const fmt = (n) => money.format(n);

  const GROUP_NAMES = {
    en: { icecream: "Ice cream", drinks: "Drinks" },
    ar: { icecream: "آيس كريم", drinks: "مشروبات" },
  };
  const groupName = (group) =>
    (GROUP_NAMES[lang] || GROUP_NAMES.en)[group] || group;
  /* How much the +/− buttons move once an item is in the order. */
  const STEP = 10;

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
    minimumBanner: $("minimumBanner"),
    menuMinimumNote: $("menuMinimumNote"),
    enquiryFields: $("enquiryFields"),
    sentPanel: $("sentPanel"),
    sentBody: $("sentBody"),
    sendBtn: $("sendBtn"),
    sendStatus: $("sendStatus"),
    eventType: $("eventType"),
    companyGroup: $("companyGroup"),
    eventDate: $("eventDate"),
    dateHint: $("dateHint"),
    chooseLaterNote: $("chooseLaterNote"),
    relayForm: $("relayForm"),
    relayFrame: $("relayFrame"),
  };

  let selectedCartId = cfg.carts[0].id;
  /* Cup counts are kept here rather than read off the inputs, so switching
     cart does not lose what the customer already typed. */
  let quantities = {};
  /* Quantities for the extras the customer counts out (cookies, branded cups). */
  let extraQuantities = {};

  /* --- Static text from the config ------------------------------------ */
  function applyBusinessText() {
    document.title = `${cfg.business.name} — Cart hire cost calculator`;
    document.querySelectorAll("[data-business-name]").forEach((n) => {
      n.textContent = cfg.business.name;
    });
    document.querySelectorAll("[data-business-tagline]").forEach((n) => {
      n.textContent = localised(cfg.business, "tagline", lang);
    });
    document.querySelectorAll("[data-business-disclaimer]").forEach((n) => {
      n.textContent = localised(cfg.business, "disclaimer", lang);
    });
    $("footerText").textContent = say("footer", { name: cfg.business.name });
  }

  /* --- The order minimum, said once at the top and once by the menu ---- */
  function applyMinimumText() {
    el.minimumBanner.textContent = say("startsAt", {
      fee: fmt(cfg.serviceFee),
      hours: cfg.duration.includedHours,
      cups: cfg.minimumCups,
    });
    /* Name any item whose own minimum is higher, so it is no surprise. */
    const higher = cfg.menu
      .filter((item) => Number.isFinite(item.minCups) && item.minCups > cfg.minimumCups)
      .map((item) =>
        say("servedFromItem", { name: nameOf(item), cups: item.minCups })
      );
    el.menuMinimumNote.textContent = say("servedFrom", {
      cups: cfg.minimumCups,
      higher: higher.length ? `, ${higher.join(", ")}` : "",
    });
    el.chooseLaterNote.textContent = localised(cfg.messages, "chooseLater", lang);
  }

  /* --- Cart chooser ---------------------------------------------------- */
  function renderCarts() {
    el.cartOptions.innerHTML = "";
    cfg.carts.forEach((cart) => {
      const chosen = cart.id === selectedCartId;
      const label = document.createElement("label");
      label.className = "cart-option" + (chosen ? " is-selected" : "");
      label.innerHTML = `
        <input type="radio" name="cart" value="${cart.id}" ${chosen ? "checked" : ""}>
        <span class="cart-option-emoji" aria-hidden="true">${cart.emoji || "🛒"}</span>
        <strong class="cart-option-name"></strong>
        <span class="cart-option-blurb"></span>
        <span class="cart-option-from">${say("fromCups", { cups: cfg.minimumCups })}</span>`;
      label.querySelector(".cart-option-name").textContent = nameOf(cart);
      label.querySelector(".cart-option-blurb").textContent =
        localised(cart, "blurb", lang);
      el.cartOptions.appendChild(label);
    });
  }

  /* Wired once, not on every redraw. */
  function wireCartChooser() {
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

  /* -----------------------------------------------------------------------
     One row with a counter. The menu and the extras that are counted out
     share it, so both behave the same way.
  --------------------------------------------------------------------- */
  function counterRow(opts) {
    const row = document.createElement("div");
    row.className = "menu-item";
    row.innerHTML = `
      <div class="menu-item-text">
        <span class="menu-item-name"></span>
        <span class="menu-item-note"></span>
        <span class="menu-item-price">${opts.priceLabel}</span>
        <span class="menu-item-min">${opts.minLabel}</span>
      </div>
      <div class="qty">
        <button type="button" class="qty-btn" data-step="-${STEP}"
                aria-label="${opts.lessLabel}">−</button>
        <input type="number" class="qty-input" inputmode="numeric"
               min="0" max="5000" step="${STEP}" value="${opts.value || 0}"
               data-item="${opts.id}" data-store="${opts.store}"
               data-min="${opts.min}" aria-label="${opts.inputLabel}">
        <button type="button" class="qty-btn" data-step="${STEP}"
                aria-label="${opts.moreLabel}">+</button>
      </div>`;
    row.querySelector(".menu-item-name").textContent = opts.name;
    row.querySelector(".menu-item-note").textContent = opts.note || "";
    return row;
  }

  /* Where a counter's value is kept. */
  function storeFor(name) {
    return name === "extra" ? extraQuantities : quantities;
  }

  /* Wires every counter inside a container. Called after each redraw, on
     freshly made elements, so no listener is ever bound twice. */
  function wireCounters(container) {
    container.querySelectorAll(".qty-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.parentElement.querySelector(".qty-input");
        const min = Number(input.dataset.min);
        const current = Number(input.value) || 0;
        const step = Number(button.dataset.step);

        /* From nothing, the first press jumps straight to the minimum. At the
           minimum, stepping down clears it rather than landing on a quantity
           we do not supply. */
        let next;
        if (step > 0) {
          next = current === 0 ? Math.max(min, step) : current + step;
        } else if (current <= min) {
          next = 0;
        } else {
          next = Math.max(min, current + step);
        }

        input.value = next;
        storeFor(input.dataset.store)[input.dataset.item] = next;
        update();
      });
    });

    /* A typed number is corrected when the customer leaves the box, so they
       are never told off mid-keystroke. */
    container.querySelectorAll(".qty-input").forEach((input) => {
      input.addEventListener("change", () => {
        const min = Number(input.dataset.min);
        const typed = Math.round(Number(input.value) || 0);
        const corrected = typed <= 0 ? 0 : Math.max(typed, min);
        input.value = corrected;
        storeFor(input.dataset.store)[input.dataset.item] = corrected;
        update();
      });
    });
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
        heading.textContent = groupName(group);
        el.menu.appendChild(heading);
      }

      items.forEach((item) => {
        const min = itemMinimum(item, cfg);
        el.menu.appendChild(
          counterRow({
            id: item.id,
            store: "menu",
            min,
            value: quantities[item.id] || 0,
            name: nameOf(item),
            note: noteOf(item),
            priceLabel: say("perCup", { amount: fmt(item.pricePerCup) }),
            minLabel: say("fromCups", { cups: min }),
            lessLabel: say("fewerCups", { name: nameOf(item) }),
            moreLabel: say("moreCups", { name: nameOf(item) }),
            inputLabel: say("cupsOf", { name: nameOf(item) }),
          })
        );
      });
    });

    wireCounters(el.menu);
  }

  /* --- Extras, filtered to the ones this cart can offer ---------------- */
  function renderExtras() {
    const cart = currentCart();
    const previously = new Set(selectedExtras());
    el.extras.innerHTML = "";

    /* Extras with a quantity get a counter each, in their own row. */
    const counted = cfg.quantityExtras || [];
    if (counted.length) {
      const list = document.createElement("div");
      list.className = "extra-counters";
      counted.forEach((extra) => {
        const min = extraMinimum(extra);
        const keys = unitKeys(extra);
        list.appendChild(
          counterRow({
            id: extra.id,
            store: "extra",
            min,
            value: extraQuantities[extra.id] || 0,
            name: nameOf(extra),
            note: noteOf(extra),
            priceLabel: say(keys.per, { amount: fmt(extra.pricePerUnit) }),
            /* A minimum of one is no minimum worth announcing. */
            minLabel: min > 1 ? say(keys.from, { cups: min }) : "",
            lessLabel: say("fewerOf", { name: nameOf(extra) }),
            moreLabel: say("moreOf", { name: nameOf(extra) }),
            inputLabel: say("howMany", { name: nameOf(extra) }),
          })
        );
      });
      el.extras.appendChild(list);
      wireCounters(list);
    }

    /* Everything else stays a tick box. */
    const boxes = document.createElement("div");
    boxes.className = "addons";

    cfg.cupExtras
      .filter((e) => e.appliesTo === "all" || cart.serves.includes(e.appliesTo))
      .map((e) => ({
        ...e,
        priceLabel: say("perCup", { amount: fmt(e.pricePerCup) }),
        kind: "cup",
      }))
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
        label.querySelector(".addon-name").textContent = nameOf(extra);
        label.querySelector(".addon-note").textContent = noteOf(extra);
        boxes.appendChild(label);
      });

    el.extras.appendChild(boxes);
  }

  function selectedExtras(kind) {
    const selector = kind
      ? `input[name="extra"][data-kind="${kind}"]:checked`
      : 'input[name="extra"]:checked';
    return Array.from(el.extras.querySelectorAll(selector)).map((i) => i.value);
  }

  /* --- Locations -------------------------------------------------------- */
  function renderLocations() {
    const chosen = el.location.value;
    el.location.innerHTML = "";
    cfg.locations.forEach((loc) => {
      const option = document.createElement("option");
      option.value = loc.id;
      option.textContent =
        loc.charge > 0
          ? `${nameOf(loc)} (+${fmt(loc.charge)})`
          : nameOf(loc);
      el.location.appendChild(option);
    });
    if (chosen) el.location.value = chosen;
  }

  /* --- The event date --------------------------------------------------- */
  function initEventDate() {
    /* The picker itself refuses past dates; validation catches typed ones. */
    el.eventDate.min = isoDate(new Date());
    el.eventDate.addEventListener("change", renderDateHint);
    renderDateHint();
  }

  function renderDateHint() {
    const value = el.eventDate.value;
    if (!value) {
      el.dateHint.textContent = say("dateNeeded");
      return;
    }
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    el.dateHint.textContent = Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString(localised(cfg, "locale", lang) || cfg.locale, {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
  }

  /* --- Event types ------------------------------------------------------ */
  function renderEventTypes() {
    const chosen = el.eventType.value;
    el.eventType.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = say("pleaseChoose");
    el.eventType.appendChild(placeholder);

    cfg.enquiry.eventTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      option.textContent = nameOf(type);
      el.eventType.appendChild(option);
    });
    if (chosen) el.eventType.value = chosen;

    syncCompanyField();
  }

  function wireEventTypes() {
    el.eventType.addEventListener("change", syncCompanyField);
  }

  /* The company name is only asked for when the event type needs it. */
  function syncCompanyField() {
    const type = eventTypeById(el.eventType.value, cfg);
    el.companyGroup.hidden = !(type && type.needsCompanyName);
  }

  function readDetails() {
    return {
      name: $("custName").value,
      eventTypeId: el.eventType.value,
      companyName: $("companyName").value,
      phone: $("phone").value,
      email: $("custEmail").value,
      eventDate: el.eventDate.value,
      notes: $("notes").value,
    };
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
      extraQuantities,
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
      ? say("summary", {
          cart: nameOf(q.cart),
          cups: q.totalCups,
          hours: q.hours,
          perCup: fmt(q.perCup),
        })
      : say("chooseCups");

    el.body.innerHTML = "";
    el.foot.innerHTML = "";

    if (showPrice) {
      q.lines.forEach((l) => el.body.appendChild(row(l.label, l.detail, fmt(l.amount))));
      if (q.tax) {
        el.foot.appendChild(row(say("subtotal"), "", fmt(q.subtotal)));
        el.foot.appendChild(row(q.tax.label, "", fmt(q.tax.amount)));
      }
      el.foot.appendChild(row(say("totalEstimate"), "", fmt(q.total), "row-total"));
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
        ? say("hoursExtra", {
            count: extra,
            unit: say(extra === 1 ? "hour" : "hours"),
            included,
            rate: fmt(cfg.duration.extraHourRate),
          })
        : say("hoursIncluded", { hours: included });

    el.locationHint.textContent =
      q.location.charge > 0
        ? say("travelCharge", {
            place: nameOf(q.location),
            amount: fmt(q.location.charge),
          })
        : say("noTravelCharge", { place: nameOf(q.location) });

    el.cupsTotal.textContent = q.hasOrder
      ? say("cupsTotal", { cups: q.totalCups })
      : say("nothingChosen");
  }

  /* Highlight the rows the customer has actually ordered. */
  function markChosenItems() {
    document.querySelectorAll(".qty-input").forEach((input) => {
      const ordered = (storeFor(input.dataset.store)[input.dataset.item] || 0) > 0;
      input.closest(".menu-item").classList.toggle("is-chosen", ordered);
    });
  }

  /* --- The one function that runs on every change ---------------------- */
  function update() {
    const q = calculateQuote(readInput(), cfg, lang);
    markChosenItems();
    renderHints(q);
    renderQuote(q);
    refreshErrors();
  }

  /* --- Sending the enquiry ---------------------------------------------- */

  const ERROR_FIELDS = [
    "eventDate", "name", "eventTypeId", "companyName", "phone", "email", "cups",
  ];

  /* Errors appear only once someone has tried to send. After that they are
     kept live, so a message clears the moment its field is put right. */
  let hasTriedToSend = false;

  function showErrors(errors) {
    ERROR_FIELDS.forEach((field) => {
      const node = $("err" + field.charAt(0).toUpperCase() + field.slice(1));
      if (node) node.textContent = errors[field] || "";
    });
  }

  function refreshErrors() {
    if (!hasTriedToSend) return;
    const quote = calculateQuote(readInput(), cfg, lang);
    showErrors(
      validateEnquiry(readDetails(), quote, cfg, new Date(), lang).errors
    );
  }

  function setSending(sending) {
    el.sendBtn.disabled = sending;
    el.sendBtn.textContent = say(sending ? "sending" : "send");
  }

  /* When a send cannot go through, the customer is handed their own email
     app with the enquiry already written, so nothing is lost. */
  function offerMailtoFallback(details, quote, message) {
    el.sendStatus.className = "send-status is-error";
    el.sendStatus.textContent = "";

    const text = document.createElement("span");
    text.textContent = message + " ";
    const link = document.createElement("a");
    link.href = enquiryMailto(details, quote, cfg);
    link.textContent = say("sendByEmail");
    el.sendStatus.append(text, link);
  }

  function showSent(details) {
    el.enquiryFields.hidden = true;
    el.sentPanel.hidden = false;
    const name = (details.name || "").trim().split(/\s+/)[0];
    const later = localised(cfg.messages, "chooseLater", lang);
    el.sentBody.textContent = say("sentBody", {
      name: name ? say("namePrefix", { name }) : "",
      phone: details.phone.trim(),
      later: later ? `${later} ` : "",
    });
    el.sentPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitEnquiry() {
    const quote = calculateQuote(readInput(), cfg, lang);
    const details = readDetails();
    const { ok, errors } = validateEnquiry(details, quote, cfg, new Date(), lang);

    hasTriedToSend = true;
    showErrors(errors);
    el.sendStatus.className = "send-status";
    el.sendStatus.textContent = "";

    if (!ok) {
      /* Send focus to the first thing that needs fixing. */
      const firstField = ERROR_FIELDS.find((f) => errors[f]);
      const input = {
        name: "custName", eventTypeId: "eventType", email: "custEmail",
      }[firstField] || firstField;
      const node = $(input) || $("cupsTotal");
      if (node && node.focus) node.focus();
      else if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    /* In mailto mode the customer's own email app does the sending. */
    if (cfg.enquiry.mode === "mailto") {
      window.location.href = enquiryMailto(
        details, calculateQuote(readInput(), cfg, "en"), cfg
      );
      showSent(details);
      return;
    }

    const endpoint = enquiryEndpoint(cfg);
    if (!endpoint) {
      offerMailtoFallback(details, quote, say("notSetUp"));
      return;
    }

    setSending(true);
    try {
      /* The email is always in English: it is read by the business, whatever
         language the customer used on the page. */
      const englishQuote = calculateQuote(readInput(), cfg, "en");
      await postToRelay(endpoint, buildRelayFields(details, englishQuote, cfg));
      showSent(details);
    } catch (err) {
      offerMailtoFallback(details, quote, say("sendFailed"));
    } finally {
      setSending(false);
    }
  }

  /* The page the relay sends the frame back to once it has the enquiry.
     It belongs to this site, so we can read the frame's address and be sure. */
  function relayConfirmUrl() {
    return new URL("assets/relay-ok.html", window.location.href).href;
  }

  /* -----------------------------------------------------------------------
     Posts the enquiry as an ordinary form, into a hidden frame, so the
     customer never leaves the page.

     This is deliberately not a fetch. A page is commonly allowed to post a
     form to another site while being forbidden from fetching it, so the post
     goes through where a fetch is refused outright.

     Knowing it worked takes care. The frame fires a load event even for an
     error page, so a load on its own proves nothing. Instead the relay is
     asked to send the frame back to a page on this site once it has the
     enquiry: only then can the frame's address be read at all, and reading it
     is the proof. Anything else — the relay's own error or activation page, a
     dead network — leaves the frame on a foreign address we cannot read, and
     counts as not sent.
  --------------------------------------------------------------------- */
  function postToRelay(endpoint, fields) {
    return new Promise((resolve, reject) => {
      const confirmUrl = relayConfirmUrl();
      const form = el.relayForm;
      form.action = endpoint;
      form.innerHTML = "";

      Object.entries({ ...fields, _next: confirmUrl }).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value == null ? "" : String(value);
        form.appendChild(input);
      });

      let settled = false;
      const finish = (fn) => (arg) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        el.relayFrame.removeEventListener("load", onLoad);
        fn(arg);
      };

      /* The frame may load more than once on the way — the relay's own page
         first, then ours. Only our page settles it; the rest are ignored and
         the timeout has the last word. */
      function onLoad() {
        let here = null;
        try {
          here = el.relayFrame.contentWindow.location.href;
        } catch (err) {
          return; // still on the relay's domain, so not delivered yet
        }
        if (here && here.split("?")[0].split("#")[0] === confirmUrl.split("?")[0]) {
          finish(resolve)();
        }
      }

      const timer = setTimeout(
        finish(reject), 15000, new Error("Relay did not confirm")
      );

      el.relayFrame.addEventListener("load", onLoad);
      form.submit();
    });
  }

  /* --- Language ---------------------------------------------------------
     Switching redraws everything, because nearly every string on the page
     comes from either the translation table or the pricing config. What the
     customer has already entered is kept: only the words change. */
  function applyLanguage() {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = direction(lang);
    buildFormatter();

    /* Fixed text, keyed in the markup. */
    document.querySelectorAll("[data-t]").forEach((node) => {
      node.textContent = say(node.dataset.t);
    });
    document.querySelectorAll("[data-t-placeholder]").forEach((node) => {
      node.placeholder = say(node.dataset.tPlaceholder);
    });

    $("langLabel").textContent = say("langName");
    $("langToggle").setAttribute("aria-label", say("langSwitchLabel"));

    applyBusinessText();
    applyMinimumText();
    renderCarts();
    renderLocations();
    renderEventTypes();
    renderMenu();
    renderExtras();
    renderDateHint();
    paintTheme();
    update();
  }

  function initLanguage() {
    let stored = null;
    try { stored = localStorage.getItem("cartapp-lang"); } catch (e) { /* private mode */ }
    if (LANGUAGES.includes(stored)) lang = stored;

    $("langToggle").addEventListener("click", () => {
      lang = lang === "en" ? "ar" : "en";
      try { localStorage.setItem("cartapp-lang", lang); } catch (e) { /* ignore */ }
      applyLanguage();
    });
  }

  /* --- Theme ----------------------------------------------------------- */
  const ICON = {
    /* A moon to switch to dark, a sun to switch back. */
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2' +
         'M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  };

  const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    const root = document.documentElement;
    return (
      root.getAttribute("data-theme") === "dark" ||
      (!root.hasAttribute("data-theme") && darkMedia.matches)
    );
  }

  /* Also called when the language changes, to relabel the button. */
  function paintTheme() {
    const dark = isDark();
    $("themeIcon").innerHTML = dark ? ICON.sun : ICON.moon;
    $("themeToggle").setAttribute(
      "aria-label", say(dark ? "themeToLight" : "themeToDark")
    );
  }

  function initTheme() {
    const root = document.documentElement;
    const button = $("themeToggle");
    const media = darkMedia;
    const paint = paintTheme;

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
    el.hours.min = cfg.duration.includedHours;
    el.hours.max = cfg.duration.maxHours;
    el.hours.value = cfg.duration.includedHours;

    initEventDate();
    wireCartChooser();
    wireEventTypes();
    initLanguage();
    initTheme();
    /* Draws the whole page in the chosen language, formatter included. */
    applyLanguage();

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
    el.enquiryFields.addEventListener("input", refreshErrors);
    el.enquiryFields.addEventListener("change", refreshErrors);
    el.form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitEnquiry();
    });

    $("resetBtn").addEventListener("click", () => {
      el.form.reset();
      selectedCartId = cfg.carts[0].id;
      quantities = {};
      extraQuantities = {};
      el.cartOptions.querySelectorAll(".cart-option").forEach((o, i) => {
        o.querySelector("input").checked = i === 0;
        o.classList.toggle("is-selected", i === 0);
      });
      el.hours.value = cfg.duration.includedHours;
      el.eventDate.value = "";
      renderDateHint();
      hasTriedToSend = false;
      showErrors({});
      el.sendStatus.textContent = "";
      el.enquiryFields.hidden = false;
      el.sentPanel.hidden = true;
      syncCompanyField();
      renderMenu();
      renderExtras();
      update();
    });

    $("againBtn").addEventListener("click", () => {
      el.enquiryFields.hidden = false;
      el.sentPanel.hidden = true;
      hasTriedToSend = false;
      showErrors({});
      el.sendStatus.textContent = "";
      ["custName", "companyName", "phone", "custEmail", "notes"].forEach((id) => {
        $(id).value = "";
      });
      renderDateHint();
      el.eventType.value = "";
      syncCompanyField();
      el.enquiryFields.scrollIntoView({ behavior: "smooth", block: "start" });
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

/* =============================================================================
   CALCULATOR  —  pure pricing logic, no DOM. Edit prices in pricing-config.js.

   The price is built from cups: the customer says how many of each menu item
   they want, and everything else follows from that.
   ========================================================================== */

/* Wording comes from i18n.js: a global in the browser, a require under Node.
   The name is unique to this file — these are plain scripts sharing one global
   scope, where a repeated `const` stops the second file dead. */
const CALC_I18N =
  typeof module !== "undefined" && module.exports
    ? require("./i18n.js")
    : { t: window.t, localised: window.localised };

/* Rounds to a number of decimal places. Rials use 3 (baisa), most
   currencies use 2 — set `decimals` in pricing-config.js. */
function roundTo(n, decimals) {
  const f = Math.pow(10, Number.isInteger(decimals) ? decimals : 2);
  return Math.round((n + Number.EPSILON) * f) / f;
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/* The smallest quantity we serve of one item: its own minimum if it sets one,
   otherwise the shop-wide minimum. The cup counters are held to this, so an
   order below it cannot be built in the first place. */
function itemMinimum(item, config) {
  return Number.isFinite(item.minCups) ? item.minCups : config.minimumCups;
}

/* A raw cup count, cleaned up: whole cups, and either none at all or at least
   the item's minimum. */
function normaliseCups(raw, item, config) {
  const cups = Math.round(Number(raw) || 0);
  if (cups <= 0) return 0;
  return Math.max(cups, itemMinimum(item, config));
}

/* The menu items a given cart can serve. */
function menuForCart(cart, config) {
  return config.menu.filter((item) => cart.serves.includes(item.group));
}

/* Which words an extra is counted in: pieces or cups. Only the wording
   differs — the arithmetic is the same either way. */
const UNIT_KEYS = {
  piece: { per: "perPiece", from: "fromPieces", times: "piecesTimes" },
  cup: { per: "perCup", from: "fromCups", times: "cupsTimes" },
};

function unitKeys(item) {
  return UNIT_KEYS[item && item.unit] || UNIT_KEYS.cup;
}

/* The smallest quantity we supply of an extra the customer counts out. */
function extraMinimum(extra) {
  return Number.isFinite(extra.minQty) ? extra.minQty : 1;
}

/* A raw quantity, cleaned up: whole units, and either none or at least the
   minimum. The counters hold to this, so it can never be too small. */
function normaliseQty(raw, extra) {
  const qty = Math.round(Number(raw) || 0);
  if (qty <= 0) return 0;
  return Math.max(qty, extraMinimum(extra));
}

/* The per-cup extras that make sense for a given cart. */
function cupExtrasForCart(cart, config) {
  return config.cupExtras.filter(
    (extra) => extra.appliesTo === "all" || cart.serves.includes(extra.appliesTo)
  );
}

/* How many cups an extra is counted on: ice cream cups, drinks cups, or all.
   Only items the cart actually serves are counted, so cups typed against one
   cart never follow the customer to another. */
function cupsForScope(scope, quantities, config, cart) {
  return config.menu.reduce((sum, item) => {
    if (cart && !cart.serves.includes(item.group)) return sum;
    if (scope !== "all" && item.group !== scope) return sum;
    return sum + (quantities[item.id] || 0);
  }, 0);
}

/* -----------------------------------------------------------------------------
   Groups whose total falls short of their own minimum.

   A per-item minimum is held by its counter, but a rule about a total belongs
   to no single counter, so it is checked here. A group nothing was ordered
   from is not held to anything.
--------------------------------------------------------------------------- */
function groupShortfalls(quantities, config, cart, lang) {
  const minimums = config.groupMinimums || {};
  return Object.keys(minimums)
    .filter((group) => cart.serves.includes(group))
    .map((group) => {
      const total = config.menu.reduce(
        (sum, item) =>
          item.group === group ? sum + (quantities[item.id] || 0) : sum,
        0
      );
      return { group, total, minimum: minimums[group], short: minimums[group] - total };
    })
    .filter((row) => row.total > 0 && row.short > 0)
    .map((row) => ({
      ...row,
      message: CALC_I18N.t("groupShort", lang, {
        group: CALC_I18N.t(`group_${row.group}`, lang),
        total: row.total,
        minimum: row.minimum,
        short: row.short,
      }),
    }));
}

/* -----------------------------------------------------------------------------
   calculateQuote(input, config)

   input = {
     cartId,
     quantities: { gelato: 120, matcha: 40, … },   cups per menu item
     locationId,
     hours,
     cupExtras: [ids],
     flatExtras: [ids],
   }

   Returns every line the customer sees, plus warnings.
--------------------------------------------------------------------------- */
function calculateQuote(input, config, lang = "en") {
  const t = (key, vars) => CALC_I18N.t(key, lang, vars);
  const name = (item) => CALC_I18N.localised(item, "name", lang);

  const cart = config.carts.find((c) => c.id === input.cartId) || config.carts[0];
  const round = (n) => roundTo(n, config.decimals);

  /* Keep only the items this cart serves, each held to its minimum. The form
     remembers what was typed against other carts, but none of it is charged. */
  const quantities = {};
  menuForCart(cart, config).forEach((item) => {
    const cups = normaliseCups((input.quantities || {})[item.id], item, config);
    if (cups > 0) quantities[item.id] = cups;
  });

  const lines = [];
  const warnings = [];

  /* 1. The service fee every booking starts with ------------------------ */
  lines.push({
    label: CALC_I18N.localised(config, "serviceFeeLabel", lang) || "Cart service fee",
    detail: t("serviceFeeDetail", {
      cart: name(cart),
      hours: config.duration.includedHours,
    }),
    amount: config.serviceFee,
  });

  /* 2. The menu — only what this cart serves, and only what was ordered -- */
  const items = menuForCart(cart, config);
  let totalCups = 0;

  items.forEach((item) => {
    const cups = quantities[item.id] || 0;
    if (cups <= 0) return;

    totalCups += cups;
    lines.push({
      label: name(item),
      detail: t("cupsTimes", { cups, price: item.pricePerCup }),
      amount: cups * item.pricePerCup,
    });
  });

  /* 3. Extras charged per cup -------------------------------------------- */
  const chosenCupExtras = (input.cupExtras || [])
    .map((id) => config.cupExtras.find((e) => e.id === id))
    .filter((e) => e && (e.appliesTo === "all" || cart.serves.includes(e.appliesTo)));

  chosenCupExtras.forEach((extra) => {
    const scopeCups = cupsForScope(extra.appliesTo, quantities, config, cart);
    if (scopeCups <= 0) return;

    const billed = extra.minCups ? Math.max(scopeCups, extra.minCups) : scopeCups;
    lines.push({
      label: name(extra),
      detail: t("cupsTimes", { cups: billed, price: extra.pricePerCup }),
      amount: billed * extra.pricePerCup,
    });
  });

  /* 3b. Extras the customer counts out for themselves ---------------------- */
  (config.quantityExtras || []).forEach((extra) => {
    const qty = normaliseQty((input.extraQuantities || {})[extra.id], extra);
    if (qty <= 0) return;

    lines.push({
      label: name(extra),
      detail: t(unitKeys(extra).times, { cups: qty, price: extra.pricePerUnit }),
      amount: qty * extra.pricePerUnit,
    });
  });

  /* 4. Extras charged once ------------------------------------------------ */
  (input.flatExtras || [])
    .map((id) => config.flatExtras.find((e) => e.id === id))
    .filter(Boolean)
    .forEach((extra) => {
      lines.push({
        label: name(extra),
        detail: CALC_I18N.localised(extra, "note", lang),
        amount: extra.price,
      });
    });

  /* 5. Location ----------------------------------------------------------- */
  const location =
    config.locations.find((l) => l.id === input.locationId) || config.locations[0];
  if (location.charge > 0) {
    lines.push({
      label: t("travelTo", { place: name(location) }),
      detail: t("outsideBase", { place: name(config.locations[0]) }),
      amount: location.charge,
    });
  }

  /* 6. Hours beyond what the service fee covers --------------------------- */
  const hours = clamp(
    Math.round(input.hours),
    config.duration.includedHours,
    config.duration.maxHours
  );
  const extraHours = Math.max(0, hours - config.duration.includedHours);
  if (extraHours > 0) {
    lines.push({
      label: t("additionalHours"),
      detail: t("hoursTimes", {
        hours: extraHours,
        rate: config.duration.extraHourRate,
      }),
      amount: extraHours * config.duration.extraHourRate,
    });
  }

  /* 7. Totals -------------------------------------------------------------- */
  const subtotal = round(lines.reduce((sum, l) => sum + l.amount, 0));

  const tax =
    config.tax.percent > 0
      ? {
          label: `${CALC_I18N.localised(config.tax, "label", lang)} (${config.tax.percent}%)`,
          amount: round(subtotal * (config.tax.percent / 100)),
        }
      : null;

  const total = round(subtotal + (tax ? tax.amount : 0));

  const deposit =
    config.deposit.percent > 0
      ? {
          label: `${CALC_I18N.localised(config.deposit, "label", lang)} (${config.deposit.percent}%)`,
          amount: round(total * (config.deposit.percent / 100)),
        }
      : null;

  /* 8. Is there anything to quote? -----------------------------------------
     Every quantity is already held to its minimum by the counters, so the only
     order we cannot price is an empty one. */
  const hasOrder = totalCups > 0;
  if (!hasOrder) {
    warnings.push(t("chooseCupsLong"));
  }

  /* The one rule no counter can hold on its own. */
  const shortfalls = groupShortfalls(quantities, config, cart, lang);
  shortfalls.forEach((row) => warnings.push(row.message));

  return {
    cart,
    location,
    hours,
    totalCups,
    hasOrder,
    shortfalls,
    /* Cups per group, so the page can count a group's progress live. */
    groupTotals: cart.serves.reduce((totals, group) => {
      totals[group] = cupsForScope(group, quantities, config, cart);
      return totals;
    }, {}),
    lines: lines.map((l) => ({ ...l, amount: round(l.amount) })),
    subtotal,
    tax,
    total,
    deposit,
    perCup: totalCups > 0 ? round(total / totalCups) : 0,
    warnings,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateQuote, menuForCart, cupExtrasForCart, cupsForScope, groupShortfalls,
    itemMinimum, normaliseCups, extraMinimum, normaliseQty, unitKeys,
    roundTo, clamp,
  };
}

/* =============================================================================
   CALCULATOR  —  pure pricing logic, no DOM. Edit prices in pricing-config.js.

   The price is built from cups: the customer says how many of each menu item
   they want, and everything else follows from that.
   ========================================================================== */

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

/* The menu items a given cart can serve. */
function menuForCart(cart, config) {
  return config.menu.filter((item) => cart.serves.includes(item.group));
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
function calculateQuote(input, config) {
  const cart = config.carts.find((c) => c.id === input.cartId) || config.carts[0];
  const round = (n) => roundTo(n, config.decimals);

  /* Keep only the items this cart serves, cleaned up to whole cups. The form
     remembers what was typed against other carts, but none of it is charged. */
  const quantities = {};
  menuForCart(cart, config).forEach((item) => {
    const ordered = Math.round(Number((input.quantities || {})[item.id]) || 0);
    if (ordered > 0) quantities[item.id] = ordered;
  });

  const lines = [];
  const warnings = [];

  /* 1. The service fee every booking starts with ------------------------ */
  lines.push({
    label: config.serviceFeeLabel || "Cart service fee",
    detail: `${cart.name}, ${config.duration.includedHours} hours of service`,
    amount: config.serviceFee,
  });

  /* 2. The menu — only what this cart serves, and only what was ordered -- */
  const items = menuForCart(cart, config);
  let totalCups = 0;

  items.forEach((item) => {
    const ordered = quantities[item.id] || 0;
    if (ordered <= 0) return;

    totalCups += ordered;

    /* An item with a minimum is billed at that minimum. */
    const billed = item.minCups ? Math.max(ordered, item.minCups) : ordered;
    const detail =
      billed > ordered
        ? `${ordered} cups ordered, ${billed} cup minimum × ${item.pricePerCup}`
        : `${billed} cups × ${item.pricePerCup}`;

    lines.push({ label: item.name, detail, amount: billed * item.pricePerCup });

    if (billed > ordered) {
      warnings.push(
        `${item.name} is served from ${item.minCups} cups up, so ${item.minCups} ` +
        `cups are charged.`
      );
    }
  });

  /* 3. Extras charged per cup -------------------------------------------- */
  const chosenCupExtras = (input.cupExtras || [])
    .map((id) => config.cupExtras.find((e) => e.id === id))
    .filter((e) => e && (e.appliesTo === "all" || cart.serves.includes(e.appliesTo)));

  chosenCupExtras.forEach((extra) => {
    const scopeCups = cupsForScope(extra.appliesTo, quantities, config, cart);
    if (scopeCups <= 0) return;

    const billed = extra.minCups ? Math.max(scopeCups, extra.minCups) : scopeCups;
    const detail =
      billed > scopeCups
        ? `${scopeCups} cups, ${billed} cup minimum × ${extra.pricePerCup}`
        : `${billed} cups × ${extra.pricePerCup}`;

    lines.push({ label: extra.name, detail, amount: billed * extra.pricePerCup });
  });

  /* 4. Extras charged once ------------------------------------------------ */
  (input.flatExtras || [])
    .map((id) => config.flatExtras.find((e) => e.id === id))
    .filter(Boolean)
    .forEach((extra) => {
      lines.push({ label: extra.name, detail: extra.note || "", amount: extra.price });
    });

  /* 5. Location ----------------------------------------------------------- */
  const location =
    config.locations.find((l) => l.id === input.locationId) || config.locations[0];
  if (location.charge > 0) {
    lines.push({
      label: `Travel to ${location.name}`,
      detail: "Outside Muscat",
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
      label: "Additional hours",
      detail: `${extraHours} h × ${config.duration.extraHourRate}`,
      amount: extraHours * config.duration.extraHourRate,
    });
  }

  /* 7. Totals -------------------------------------------------------------- */
  const subtotal = round(lines.reduce((sum, l) => sum + l.amount, 0));

  const tax =
    config.tax.percent > 0
      ? {
          label: `${config.tax.label} (${config.tax.percent}%)`,
          amount: round(subtotal * (config.tax.percent / 100)),
        }
      : null;

  const total = round(subtotal + (tax ? tax.amount : 0));

  const deposit =
    config.deposit.percent > 0
      ? {
          label: `${config.deposit.label} (${config.deposit.percent}%)`,
          amount: round(total * (config.deposit.percent / 100)),
        }
      : null;

  /* 8. Is this a bookable order? ------------------------------------------ */
  const meetsMinimum = totalCups >= config.minimumCups;
  if (totalCups === 0) {
    warnings.push("Choose how many cups you would like to see a price.");
  } else if (!meetsMinimum) {
    warnings.push(
      `Our smallest booking is ${config.minimumCups} cups — ` +
      `${config.minimumCups - totalCups} more to go.`
    );
  }

  return {
    cart,
    location,
    hours,
    totalCups,
    meetsMinimum,
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
    calculateQuote, menuForCart, cupExtrasForCart, cupsForScope, roundTo, clamp,
  };
}

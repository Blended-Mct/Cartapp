/* =============================================================================
   Tests for the pricing logic.   Run with:  npm test
   These use their own fixed prices, so they keep passing when you edit
   assets/js/pricing-config.js.
   ========================================================================== */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateQuote, cupsForScope, itemMinimum, normaliseCups, roundTo } =
  require("../assets/js/calculator.js");

/* A small, predictable price list — easy to check the arithmetic by hand. */
const cfg = {
  currency: "OMR",
  locale: "en-OM",
  decimals: 3,
  serviceFee: 30,
  serviceFeeLabel: "Cart service fee",
  minimumCups: 50,
  duration: { includedHours: 2, extraHourRate: 5, maxHours: 10 },
  locations: [
    { id: "muscat", name: "Muscat", charge: 0 },
    { id: "barka", name: "Barka", charge: 15 },
  ],
  carts: [
    { id: "icecream", name: "Ice Cream Cart", blurb: "", emoji: "", serves: ["icecream"] },
    { id: "drinks", name: "Drinks Cart", blurb: "", emoji: "", serves: ["drinks"] },
    { id: "blend", name: "The Blend", blurb: "", emoji: "", serves: ["icecream", "drinks"] },
  ],
  menu: [
    { id: "gelato", group: "icecream", name: "Gelato", pricePerCup: 1 },
    { id: "softserve", group: "icecream", name: "Soft serve", pricePerCup: 1.5, minCups: 200 },
    { id: "espresso", group: "drinks", name: "Espresso", pricePerCup: 1.5 },
    { id: "matcha", group: "drinks", name: "Matcha", pricePerCup: 2 },
    { id: "creamy", group: "drinks", name: "Creamy matcha", pricePerCup: 1.5 },
  ],
  cupExtras: [
    { id: "toppings", name: "Extra toppings", pricePerCup: 0.2, appliesTo: "icecream" },
    { id: "cookies", name: "Cookies", pricePerCup: 0.9, appliesTo: "icecream" },
    { id: "branded_cups", name: "Branded cups", pricePerCup: 0.25, appliesTo: "all" },
  ],
  flatExtras: [
    { id: "female_server", name: "Female server", price: 15 },
    { id: "branded_cart", name: "Branded cart", price: 40 },
  ],
  tax: { percent: 0, label: "VAT" },
  deposit: { percent: 0, label: "Deposit" },
};

/* Baseline: ice cream cart, 100 cups of gelato, in Muscat, 2 hours. */
const base = {
  cartId: "icecream",
  quantities: { gelato: 100 },
  locationId: "muscat",
  hours: 2,
  cupExtras: [],
  flatExtras: [],
};

const q = (over = {}) => calculateQuote({ ...base, ...over }, cfg);
const lineAmount = (quote, label) => {
  const line = quote.lines.find((l) => l.label.startsWith(label));
  return line ? line.amount : null;
};

/* --- The basics ------------------------------------------------------- */

test("every booking starts with the service fee", () => {
  assert.equal(lineAmount(q(), "Cart service fee"), 30);
  assert.equal(lineAmount(q({ quantities: {} }), "Cart service fee"), 30);
});

test("cups are charged at the item's per-cup price", () => {
  const r = q();
  assert.equal(lineAmount(r, "Gelato"), 100);
  assert.equal(r.total, 130); // 30 service fee + 100 cups x 1
  assert.equal(r.totalCups, 100);
});

test("two hours are included and further hours are charged", () => {
  assert.equal(lineAmount(q(), "Additional hours"), null);
  assert.equal(lineAmount(q({ hours: 5 }), "Additional hours"), 15); // 3 x 5
});

test("hours below the included minimum are raised, never credited", () => {
  const r = q({ hours: 0 });
  assert.equal(r.hours, 2);
  assert.equal(lineAmount(r, "Additional hours"), null);
});

test("Muscat is free and Barka carries a flat charge", () => {
  assert.equal(lineAmount(q(), "Travel"), null);
  assert.equal(lineAmount(q({ locationId: "barka" }), "Travel to Barka"), 15);
});

test("an unknown location falls back to the first one", () => {
  assert.equal(q({ locationId: "nowhere" }).location.id, "muscat");
});

/* --- Menu minimums: floors on the quantity, not surprises on the bill --- */

test("an item's minimum is the shop minimum unless it sets its own", () => {
  assert.equal(itemMinimum(cfg.menu[0], cfg), 50);  // gelato, default
  assert.equal(itemMinimum(cfg.menu[1], cfg), 200); // soft serve, its own
});

test("normaliseCups gives either nothing or at least the minimum", () => {
  const gelato = cfg.menu[0];
  assert.equal(normaliseCups(0, gelato, cfg), 0);
  assert.equal(normaliseCups(-5, gelato, cfg), 0);
  assert.equal(normaliseCups(1, gelato, cfg), 50);
  assert.equal(normaliseCups(30, gelato, cfg), 50);
  assert.equal(normaliseCups(120, gelato, cfg), 120);
  assert.equal(normaliseCups(120, cfg.menu[1], cfg), 200); // soft serve floor
});

test("a quantity under the minimum is raised to it, and counted as raised", () => {
  const r = q({ quantities: { gelato: 30 } });
  assert.equal(r.totalCups, 50);
  assert.equal(lineAmount(r, "Gelato"), 50);
  /* The breakdown states what is charged, with nothing to explain away. */
  assert.match(r.lines.find((l) => l.label === "Gelato").detail, /^50 cups/);
});

test("soft serve under 200 is raised to 200", () => {
  const r = q({ quantities: { softserve: 120 } });
  assert.equal(r.totalCups, 200);
  assert.equal(lineAmount(r, "Soft serve"), 300);
});

test("a quantity above the minimum is left alone", () => {
  const r = q({ quantities: { softserve: 260 } });
  assert.equal(r.totalCups, 260);
  assert.equal(lineAmount(r, "Soft serve"), 390);
});

test("raising a quantity is never announced as a warning", () => {
  assert.deepEqual(q({ quantities: { gelato: 30 } }).warnings, []);
  assert.deepEqual(q({ quantities: { softserve: 10 } }).warnings, []);
});

/* --- Which cart serves what ------------------------------------------- */

test("a cart only charges for items it serves", () => {
  const r = q({ cartId: "drinks", quantities: { gelato: 100, matcha: 60 } });
  assert.equal(lineAmount(r, "Gelato"), null);
  assert.equal(lineAmount(r, "Matcha"), 120);
  assert.equal(r.totalCups, 60);
});

test("the blend cart serves ice cream and drinks together", () => {
  const r = q({ cartId: "blend", quantities: { gelato: 100, matcha: 50 } });
  assert.equal(lineAmount(r, "Gelato"), 100);
  assert.equal(lineAmount(r, "Matcha"), 100);
  assert.equal(r.totalCups, 150);
  assert.equal(r.total, 230);
});

test("an unknown cart id falls back to the first cart", () => {
  assert.equal(q({ cartId: "nope" }).cart.id, "icecream");
});

/* --- Extras ------------------------------------------------------------ */

test("a per-cup extra is charged on the cups it applies to", () => {
  const r = q({ quantities: { gelato: 100 }, cupExtras: ["cookies"] });
  assert.equal(lineAmount(r, "Cookies"), 90); // 100 x 0.9
});

test("extra toppings count only ice cream cups, branded cups count all", () => {
  const r = q({
    cartId: "blend",
    quantities: { gelato: 100, matcha: 60 },
    cupExtras: ["toppings", "branded_cups"],
  });
  assert.equal(lineAmount(r, "Extra toppings"), 20);  // 100 ice cream cups x 0.2
  assert.equal(lineAmount(r, "Branded cups"), 40);    // 160 cups x 0.25
});

test("a per-cup extra follows the cups actually charged", () => {
  /* 20 gelato is raised to 50, so the toppings are counted on 50 cups. */
  const r = q({ quantities: { gelato: 20 }, cupExtras: ["toppings"] });
  assert.equal(lineAmount(r, "Extra toppings"), 10); // 50 x 0.2
});

test("a per-cup extra is not charged when nothing it applies to is ordered", () => {
  const r = q({ cartId: "drinks", quantities: { matcha: 60 }, cupExtras: ["branded_cups"] });
  assert.equal(lineAmount(r, "Branded cups"), 15);
  const none = q({ quantities: {}, cupExtras: ["branded_cups"] });
  assert.equal(lineAmount(none, "Branded cups"), null);
});

test("an extra belonging to another cart is ignored", () => {
  const r = q({ cartId: "drinks", quantities: { matcha: 60 }, cupExtras: ["toppings"] });
  assert.equal(lineAmount(r, "Extra toppings"), null);
});

test("flat extras are charged once, whatever the order size", () => {
  const r = q({ flatExtras: ["female_server", "branded_cart"] });
  assert.equal(lineAmount(r, "Female server"), 15);
  assert.equal(lineAmount(r, "Branded cart"), 40);
  assert.equal(r.total, 185); // 30 + 100 + 15 + 40
});

test("cupsForScope counts the right cups", () => {
  const qty = { gelato: 100, softserve: 50, matcha: 30 };
  assert.equal(cupsForScope("icecream", qty, cfg), 150);
  assert.equal(cupsForScope("drinks", qty, cfg), 30);
  assert.equal(cupsForScope("all", qty, cfg), 180);
});

/* --- Having an order at all -------------------------------------------- */

test("an empty order asks for cups instead of quoting", () => {
  const r = q({ quantities: {} });
  assert.equal(r.hasOrder, false);
  assert.equal(r.totalCups, 0);
  assert.equal(r.perCup, 0);
  assert.ok(r.warnings.some((w) => w.includes("Choose how many cups")));
});

test("any order at all is quotable, because the counters enforce the floor", () => {
  assert.equal(q({ quantities: { gelato: 50 } }).hasOrder, true);
  assert.equal(q({ quantities: { gelato: 1 } }).hasOrder, true);
  assert.deepEqual(q({ quantities: { gelato: 50 } }).warnings, []);
});

/* --- Totals ------------------------------------------------------------ */

test("tax applies to the subtotal and the deposit to the total", () => {
  const taxed = {
    ...cfg,
    tax: { percent: 5, label: "VAT" },
    deposit: { percent: 30, label: "Deposit" },
  };
  const r = calculateQuote(base, taxed);
  assert.equal(r.subtotal, 130);
  assert.equal(r.tax.amount, 6.5);
  assert.equal(r.total, 136.5);
  assert.equal(r.deposit.amount, 40.95);
});

test("amounts round to the configured decimal places", () => {
  const r = q({
    cartId: "blend",
    quantities: { gelato: 37, matcha: 13 },
    cupExtras: ["branded_cups"],
  });
  [...r.lines.map((l) => l.amount), r.subtotal, r.total, r.perCup].forEach((a) => {
    assert.equal(a, roundTo(a, 3));
  });
});

test("the per-cup figure matches the total", () => {
  const r = q({ quantities: { gelato: 120 } });
  assert.equal(r.perCup, roundTo(r.total / 120, 3));
});

test("fractional or negative cup counts are cleaned up", () => {
  assert.equal(q({ quantities: { gelato: -20 } }).totalCups, 0);
  assert.equal(q({ quantities: { gelato: 60.6 } }).totalCups, 61);
  assert.equal(q({ quantities: { gelato: 10.6 } }).totalCups, 50); // raised
});

/* --- Cups typed against one cart must not follow to another ------------- */

test("cups for items the cart does not serve are never counted or charged", () => {
  /* The form remembers what was typed for the blend cart; switching to the
     ice cream cart must forget the drinks. */
  const r = q({
    cartId: "icecream",
    quantities: { gelato: 120, matcha: 80, espresso: 50 },
    cupExtras: ["branded_cups"],
  });
  assert.equal(r.totalCups, 120);
  assert.equal(lineAmount(r, "Branded cups"), 30); // 120 cups, not 240
  assert.equal(lineAmount(r, "Matcha"), null);
});

test("cupsForScope respects the cart when one is given", () => {
  const qty = { gelato: 100, matcha: 30 };
  const iceCart = cfg.carts[0];
  assert.equal(cupsForScope("all", qty, cfg, iceCart), 100);
  assert.equal(cupsForScope("all", qty, cfg, cfg.carts[2]), 130);
  assert.equal(cupsForScope("all", qty, cfg), 130); // no cart = count everything
});

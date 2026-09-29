/* =============================================================================
   Tests for writing pricing-config.js back out.

   The admin page is only trustworthy if what it writes reads back as exactly
   what was edited — so most of these are round trips.
   ========================================================================== */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");

const { serialiseConfig, js, num } = require("../assets/js/config-writer.js");
const { PRICING } = require("../assets/js/pricing-config.js");

/* Reads a written config back the way the browser would.

   The result is copied into this realm before being returned: objects made
   inside a vm context carry that context's prototypes, and strict deepEqual
   compares prototypes, so an otherwise identical config would fail on a
   technicality rather than on its contents. */
function readBack(text) {
  const context = { module: { exports: {} } };
  context.exports = context.module.exports;
  vm.createContext(context);
  vm.runInContext(text, context);
  return JSON.parse(JSON.stringify(context.module.exports.PRICING));
}

/* --- The round trip ------------------------------------------------------ */

test("the real config survives being written and read back", () => {
  const back = readBack(serialiseConfig(PRICING));
  assert.deepEqual(back, PRICING);
});

test("what it writes is a file Node can actually load", () => {
  const file = path.join(os.tmpdir(), `pricing-${Date.now()}.js`);
  fs.writeFileSync(file, serialiseConfig(PRICING));
  try {
    assert.deepEqual(require(file).PRICING, PRICING);
  } finally {
    fs.unlinkSync(file);
  }
});

test("an edited config survives too", () => {
  const edited = JSON.parse(JSON.stringify(PRICING));
  edited.serviceFee = 45;
  edited.menu.push({
    id: "affogato", group: "drinks", name: "Affogato",
    name_ar: "أفوجاتو", pricePerCup: 2.25, minCups: 20,
    note: "Espresso over gelato", note_ar: "إسبريسو فوق الجيلاتو",
  });
  edited.menu = edited.menu.filter((item) => item.id !== "softserve");
  edited.locations.push({ id: "sohar", name: "Sohar", name_ar: "صحار", charge: 45 });

  const back = readBack(serialiseConfig(edited));
  assert.deepEqual(back, edited);
  assert.equal(back.menu.find((i) => i.id === "affogato").pricePerCup, 2.25);
  assert.equal(back.menu.some((i) => i.id === "softserve"), false);
});

test("the written file still prices a booking identically", () => {
  const { calculateQuote } = require("../assets/js/calculator.js");
  const input = {
    cartId: "blend",
    quantities: { gelato: 150, matcha: 60 },
    locationId: "barka", hours: 5,
    cupExtras: ["extra_toppings"], flatExtras: ["female_server"],
    extraQuantities: { cookies: 40, branded_cups: 200 },
  };
  const before = calculateQuote(input, PRICING, "en");
  const after = calculateQuote(input, readBack(serialiseConfig(PRICING)), "en");
  assert.equal(after.total, before.total);
  assert.deepEqual(after.lines, before.lines);
});

/* --- Awkward values ------------------------------------------------------ */

test("Arabic, quotes and backslashes come back unharmed", () => {
  const odd = {
    menu: [{
      id: "x",
      name: 'A "quoted" name \\ with a backslash',
      name_ar: "ماتشا بالكريمة — ٣ إضافات",
      note: "Line one\nline two",
    }],
  };
  assert.deepEqual(readBack(serialiseConfig(odd)), odd);
});

test("prices are written the way a person writes them", () => {
  assert.equal(num(0.25), "0.25");
  assert.equal(num(1), "1");
  assert.equal(num(0.1 + 0.2), "0.3");   // not 0.30000000000000004
  assert.equal(num(1.5), "1.5");
  assert.equal(num(2265), "2265");
});

test("an absent value stays absent rather than becoming null", () => {
  /* An item with no minCups must fall back to the shop minimum, and a written
     `minCups: null` would not. */
  const cfg = { menu: [{ id: "a", name: "A", pricePerCup: 1, minCups: undefined }] };
  const text = serialiseConfig(cfg);

  /* Look at the written item, not the whole file: the section comment
     mentions minCups by name, which is not the same as writing one. */
  assert.equal(/^\s*minCups:/m.test(text), false);
  assert.equal("minCups" in readBack(text).menu[0], false);
  assert.deepEqual(readBack(text).menu[0], { id: "a", name: "A", pricePerCup: 1 });
});

test("empty lists and objects are written as empty, not dropped", () => {
  const cfg = { cupExtras: [], groupMinimums: {}, flatExtras: [{ id: "a", name: "A", price: 5 }] };
  assert.deepEqual(readBack(serialiseConfig(cfg)), cfg);
});

test("a key that is not a plain word is quoted", () => {
  assert.match(js({ "not-plain": 1, plain: 2 }, 0), /"not-plain": 1/);
  assert.match(js({ "not-plain": 1, plain: 2 }, 0), /\n\s*plain: 2/);
});

/* --- The file it produces ------------------------------------------------ */

test("the written file keeps its explanation and its section comments", () => {
  const text = serialiseConfig(PRICING);
  assert.match(text, /THIS IS THE ONLY FILE YOU NEED TO EDIT/);
  assert.match(text, /admin page \(admin\.html\)/);
  assert.match(text, /The menu\. `pricePerCup`/);
  assert.match(text, /Extras charged once/);
});

test("it exports the same way the hand-written file does", () => {
  const text = serialiseConfig(PRICING);
  assert.match(text, /^const PRICING = \{/m);
  assert.match(text, /module\.exports = \{ PRICING \}/);
});

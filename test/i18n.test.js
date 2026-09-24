/* =============================================================================
   Tests for the two languages: that nothing is missing, and that the page
   really changes language rather than just claiming to.
   ========================================================================== */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { STRINGS, LANGUAGES, t, localised, direction } =
  require("../assets/js/i18n.js");
const { PRICING } = require("../assets/js/pricing-config.js");
const { calculateQuote } = require("../assets/js/calculator.js");

/* --- The table itself --------------------------------------------------- */

test("every English string has an Arabic one", () => {
  const missing = Object.keys(STRINGS.en).filter((key) => !(key in STRINGS.ar));
  assert.deepEqual(missing, [], `no Arabic for: ${missing.join(", ")}`);
});

test("no Arabic string is left in English by accident", () => {
  /* Anything still identical to the English is almost certainly untranslated.
     The few that are meant to match are listed here on purpose. */
  const sameOnPurpose = ["emailPlaceholder"];
  const untranslated = Object.keys(STRINGS.en).filter(
    (key) =>
      !sameOnPurpose.includes(key) &&
      typeof STRINGS.en[key] === "string" &&
      STRINGS.en[key] === STRINGS.ar[key]
  );
  assert.deepEqual(untranslated, []);
});

test("the placeholders in a string match between languages", () => {
  const holders = (text) => (text.match(/\{(\w+)\}/g) || []).sort().join(",");
  Object.keys(STRINGS.en).forEach((key) => {
    assert.equal(
      holders(STRINGS.ar[key]), holders(STRINGS.en[key]),
      `placeholders differ for "${key}"`
    );
  });
});

test("Arabic reads right to left, English left to right", () => {
  assert.equal(direction("ar"), "rtl");
  assert.equal(direction("en"), "ltr");
});

test("the switch offers the other language, not the current one", () => {
  assert.equal(t("langName", "en"), "العربية");
  assert.equal(t("langName", "ar"), "English");
});

/* --- Looking strings up ------------------------------------------------- */

test("placeholders are filled in", () => {
  assert.equal(
    t("cupsTimes", "en", { cups: 120, price: 1.5 }),
    "120 cups × 1.5"
  );
  assert.match(t("cupsTimes", "ar", { cups: 120, price: 1.5 }), /120.*1\.5/);
});

test("a placeholder with no value is left alone rather than blanked", () => {
  assert.match(t("cupsTimes", "en", { cups: 50 }), /\{price\}/);
});

test("an unknown language falls back to English, an unknown key to itself", () => {
  assert.equal(t("send", "fr"), STRINGS.en.send);
  assert.equal(t("no_such_key", "en"), "no_such_key");
});

/* --- Names that live in the pricing config ------------------------------ */

test("localised prefers the Arabic name and falls back to English", () => {
  const item = { name: "Gelato", name_ar: "جيلاتو", note: "Only English" };
  assert.equal(localised(item, "name", "ar"), "جيلاتو");
  assert.equal(localised(item, "name", "en"), "Gelato");
  assert.equal(localised(item, "note", "ar"), "Only English"); // no Arabic given
  assert.equal(localised(null, "name", "ar"), "");
});

test("every cart, menu item, extra, area and event type has an Arabic name", () => {
  const groups = {
    carts: PRICING.carts,
    menu: PRICING.menu,
    cupExtras: PRICING.cupExtras,
    flatExtras: PRICING.flatExtras,
    locations: PRICING.locations,
    eventTypes: PRICING.enquiry.eventTypes,
  };
  Object.entries(groups).forEach(([group, items]) => {
    items.forEach((item) => {
      assert.ok(item.name_ar, `${group}: "${item.name}" has no name_ar`);
    });
  });
});

test("the wording kept in the pricing config is translated too", () => {
  /* Caught in review: the disclaimer was still English on the Arabic page
     because only the *names* were being checked. */
  const fields = [
    [PRICING.business, "tagline"],
    [PRICING.business, "disclaimer"],
    [PRICING.messages, "chooseLater"],
    [PRICING, "serviceFeeLabel"],
    [PRICING.tax, "label"],
    [PRICING.deposit, "label"],
  ];
  fields.forEach(([holder, field]) => {
    assert.ok(holder[`${field}_ar`], `${field} has no Arabic`);
    assert.notEqual(
      localised(holder, field, "ar"), holder[field],
      `${field} is identical in both languages`
    );
  });
});

test("the notes under menu items and extras are translated", () => {
  [...PRICING.menu, ...PRICING.cupExtras, ...PRICING.flatExtras]
    .filter((item) => item.note)
    .forEach((item) => {
      assert.ok(item.note_ar, `note for "${item.name}" has no Arabic`);
    });
});

test("the carts' descriptions are translated", () => {
  PRICING.carts.forEach((cart) => {
    assert.ok(cart.blurb_ar, `blurb for "${cart.name}" has no Arabic`);
  });
});

/* --- A quote in both languages ------------------------------------------ */

const input = {
  cartId: "blend",
  quantities: { gelato: 120, matcha: 60 },
  locationId: "barka",
  hours: 5,
  cupExtras: ["branded_cups"],
  flatExtras: ["female_server"],
};

test("the same booking costs the same in either language", () => {
  const en = calculateQuote(input, PRICING, "en");
  const ar = calculateQuote(input, PRICING, "ar");
  assert.equal(en.total, ar.total);
  assert.equal(en.totalCups, ar.totalCups);
  assert.equal(en.lines.length, ar.lines.length);
  en.lines.forEach((line, i) => assert.equal(line.amount, ar.lines[i].amount));
});

test("an Arabic quote is actually in Arabic", () => {
  const ar = calculateQuote(input, PRICING, "ar");
  const arabic = /[؀-ۿ]/;
  ar.lines.forEach((line) => {
    assert.match(line.label, arabic, `label not translated: ${line.label}`);
  });
  assert.match(ar.deposit.label, arabic);
});

test("an English quote carries no Arabic", () => {
  const en = calculateQuote(input, PRICING, "en");
  en.lines.forEach((line) => {
    assert.equal(/[؀-ۿ]/.test(line.label), false, line.label);
  });
});

test("a quote with no language given is English, so the email stays readable", () => {
  const plain = calculateQuote(input, PRICING);
  const en = calculateQuote(input, PRICING, "en");
  assert.deepEqual(plain.lines.map((l) => l.label), en.lines.map((l) => l.label));
});

test("both languages are offered", () => {
  assert.deepEqual(LANGUAGES, ["en", "ar"]);
});

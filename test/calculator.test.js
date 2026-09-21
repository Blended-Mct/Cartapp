/* =============================================================================
   Tests for the pricing logic.   Run with:  npm test
   These use their own fixed prices, so they keep passing when you edit
   assets/js/pricing-config.js.
   ========================================================================== */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateQuote, estimateServings, recommendedStaff } =
  require("../assets/js/calculator.js");

/* A small, predictable price list — easy to check the arithmetic by hand. */
const cfg = {
  currency: "USD",
  locale: "en-US",
  packages: [
    {
      id: "coffee", name: "Coffee Cart", emoji: "", blurb: "",
      basePrice: 1000, includedHours: 3, includedServings: 100, includedStaff: 1,
      extraHourRate: 100, perExtraServing: 5, servingsPerGuest: 1.5,
    },
  ],
  staffing: { extraStaffPerHour: 50, servingsPerStaffPerHour: 60, maxStaff: 8 },
  travel: { unit: "km", freeRadius: 20, perUnit: 2, chargeRoundTrip: true, maxDistance: 500 },
  fees: { setupFee: 100, setupFeeLabel: "Set-up", minimumSpend: 0 },
  surcharges: { weekendPercent: 10, holidayPercent: 25, peakMonths: [12], peakMonthPercent: 10, peakMonthLabel: "Peak season" },
  addons: [
    { id: "flat", name: "Flat add-on", type: "flat", price: 200 },
    { id: "perServing", name: "Per serving add-on", type: "perServing", price: 1 },
    { id: "perHour", name: "Per hour add-on", type: "perHour", price: 10 },
    { id: "coffeeOnly", name: "Coffee only", type: "flat", price: 50, carts: ["coffee"] },
    { id: "otherCart", name: "Other cart only", type: "flat", price: 999, carts: ["icecream"] },
  ],
  discounts: [],
  tax: { percent: 0, label: "VAT" },
  deposit: { percent: 0, label: "Deposit" },
  limits: { minGuests: 10, maxGuests: 2000, defaultGuests: 100, minHours: 2, maxHours: 12, defaultHours: 3, defaultDistance: 10 },
};

/* Baseline booking: everything included, nothing extra. Tuesday. */
const base = {
  packageId: "coffee", guests: 10, hours: 3, staff: 1, distance: 10,
  date: "2026-06-02", isHoliday: false, addons: [],
};

const q = (over = {}) => calculateQuote({ ...base, ...over }, cfg);
const lineAmount = (quote, label) => {
  const line = quote.lines.find((l) => l.label.startsWith(label));
  return line ? line.amount : null;
};

test("a booking inside the package costs the base price plus the set-up fee", () => {
  const r = q();
  assert.equal(r.subtotal, 1100);
  assert.equal(r.total, 1100);
  assert.equal(lineAmount(r, "Additional"), null);
});

test("servings are estimated from guests, not taken literally", () => {
  assert.equal(estimateServings(100, cfg.packages[0]), 150);
  assert.equal(estimateServings(33, cfg.packages[0]), 50); // rounds up
});

test("servings above the included allowance are charged", () => {
  const r = q({ guests: 100 }); // 150 servings, 100 included -> 50 x 5
  assert.equal(lineAmount(r, "Additional servings"), 250);
});

test("hours above the included allowance are charged, half hours included", () => {
  assert.equal(lineAmount(q({ hours: 5 }), "Additional service hours"), 200);
  assert.equal(lineAmount(q({ hours: 4.5 }), "Additional service hours"), 150);
});

test("extra staff are charged per person per hour", () => {
  const r = q({ staff: 3, hours: 4 }); // 2 extra x 4 h x 50
  assert.equal(lineAmount(r, "Additional staff"), 400);
});

test("staff below the package minimum is raised, never charged as a credit", () => {
  const r = q({ staff: 0 });
  assert.equal(r.staff, 1);
  assert.equal(lineAmount(r, "Additional staff"), null);
});

test("add-ons are priced by their type", () => {
  assert.equal(lineAmount(q({ addons: ["flat"] }), "Flat add-on"), 200);
  assert.equal(lineAmount(q({ guests: 100, addons: ["perServing"] }), "Per serving"), 150);
  assert.equal(lineAmount(q({ hours: 5, addons: ["perHour"] }), "Per hour"), 50);
});

test("add-ons that belong to another cart are ignored", () => {
  const r = q({ addons: ["coffeeOnly", "otherCart"] });
  assert.equal(lineAmount(r, "Coffee only"), 50);
  assert.equal(lineAmount(r, "Other cart only"), null);
});

test("travel is only charged beyond the free radius, both ways", () => {
  assert.equal(lineAmount(q({ distance: 20 }), "Travel"), null);
  assert.equal(lineAmount(q({ distance: 50 }), "Travel"), 120); // 30 x 2 x 2
});

test("a weekend date adds a surcharge on the service cost, not on travel", () => {
  const r = q({ date: "2026-06-06", distance: 50 }); // Saturday
  assert.equal(lineAmount(r, "Weekend surcharge"), 100); // 10% of 1000, travel excluded
});

test("weekday dates carry no weekend surcharge", () => {
  assert.equal(lineAmount(q({ date: "2026-06-02" }), "Weekend surcharge"), null);
});

test("peak month and public holiday surcharges stack with the weekend", () => {
  const r = q({ date: "2026-12-05", isHoliday: true }); // Saturday in December
  assert.equal(lineAmount(r, "Weekend surcharge"), 100);
  assert.equal(lineAmount(r, "Peak season"), 100);
  assert.equal(lineAmount(r, "Public holiday surcharge"), 250);
});

test("no date means no date-based surcharge", () => {
  const r = q({ date: "" });
  assert.equal(r.lines.some((l) => l.label.includes("surcharge")), false);
});

test("the best qualifying discount tier wins", () => {
  const withTiers = {
    ...cfg,
    discounts: [
      { minSubtotal: 1000, percent: 5, label: "5%" },
      { minSubtotal: 1050, percent: 10, label: "10%" },
      { minSubtotal: 9999, percent: 50, label: "50%" },
    ],
  };
  const r = calculateQuote(base, withTiers);
  assert.equal(r.discount.label, "10%");
  assert.equal(r.discount.amount, 110);
  assert.equal(r.total, 990);
});

test("bookings under the minimum spend are topped up to it", () => {
  const withMin = { ...cfg, fees: { ...cfg.fees, minimumSpend: 1500 } };
  const r = calculateQuote(base, withMin);
  assert.equal(r.minimumTopUp.amount, 400);
  assert.equal(r.total, 1500);
  assert.ok(r.warnings.some((w) => w.includes("minimum")));
});

test("tax applies after the discount, and the deposit after tax", () => {
  const taxed = {
    ...cfg,
    discounts: [{ minSubtotal: 0, percent: 10, label: "10%" }],
    tax: { percent: 20, label: "VAT" },
    deposit: { percent: 50, label: "Deposit" },
  };
  const r = calculateQuote(base, taxed);
  assert.equal(r.subtotal, 1100);
  assert.equal(r.discount.amount, 110);
  assert.equal(r.tax.amount, 198);   // 20% of 990
  assert.equal(r.total, 1188);
  assert.equal(r.deposit.amount, 594);
});

test("guests and hours outside the allowed range are clamped, not rejected", () => {
  assert.equal(q({ guests: -5 }).guests, cfg.limits.minGuests);
  assert.equal(q({ guests: 99999 }).guests, cfg.limits.maxGuests);
  assert.equal(q({ hours: 0 }).hours, cfg.limits.minHours);
  assert.equal(q({ hours: 99 }).hours, cfg.limits.maxHours);
  assert.equal(q({ distance: -10 }).distance, 0);
});

test("understaffed bookings produce a warning with a suggested crew size", () => {
  assert.equal(recommendedStaff(600, 3, cfg), 4); // 60/staff/hour
  const r = q({ guests: 400, hours: 3, staff: 1 }); // 600 servings
  assert.ok(r.warnings.some((w) => w.includes("4")));
  assert.equal(r.recommendedStaff, 4);
});

test("a well-staffed booking produces no staffing warning", () => {
  const r = q({ guests: 100, hours: 3, staff: 1 }); // 150 servings, capacity 180
  assert.equal(r.warnings.some((w) => w.includes("suggest")), false);
});

test("every amount shown is rounded to two decimals", () => {
  const r = q({ guests: 137, hours: 4.5, distance: 33, date: "2026-12-05" });
  const amounts = [...r.lines.map((l) => l.amount), r.subtotal, r.total];
  amounts.forEach((a) => assert.equal(a, Math.round(a * 100) / 100));
});

test("the per-guest figure matches the total", () => {
  const r = q({ guests: 100 });
  assert.equal(r.perGuest, Math.round((r.total / 100) * 100) / 100);
});

test("an unknown cart id falls back to the first cart instead of crashing", () => {
  assert.equal(q({ packageId: "nope" }).package.id, "coffee");
});

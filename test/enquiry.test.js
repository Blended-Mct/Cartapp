/* =============================================================================
   Tests for the enquiry form: what we insist on, and what the email says.
   Run with:  npm test
   ========================================================================== */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateQuote } = require("../assets/js/calculator.js");
const {
  validateEnquiry, buildEnquiryText, buildEnquiryPayload,
  enquiryEndpoint, enquiryMailto, eventTypeById,
} = require("../assets/js/enquiry.js");

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
  ],
  menu: [{ id: "gelato", group: "icecream", name: "Gelato", pricePerCup: 1 }],
  cupExtras: [],
  flatExtras: [],
  tax: { percent: 0, label: "VAT" },
  deposit: { percent: 30, label: "Deposit" },
  enquiry: {
    email: "orders@example.com",
    mode: "formsubmit",
    subject: "New cart enquiry",
    eventTypes: [
      { id: "company", name: "Company event", needsCompanyName: true },
      { id: "private", name: "Private event", needsCompanyName: false },
    ],
  },
};

const quote = calculateQuote(
  {
    cartId: "icecream", quantities: { gelato: 100 },
    locationId: "barka", hours: 3, cupExtras: [], flatExtras: [],
  },
  cfg
);

const tooFewCups = calculateQuote(
  {
    cartId: "icecream", quantities: { gelato: 20 },
    locationId: "muscat", hours: 2, cupExtras: [], flatExtras: [],
  },
  cfg
);

const good = {
  name: "Aisha Al Said",
  eventTypeId: "private",
  companyName: "",
  phone: "9123 4567",
  email: "aisha@example.com",
  eventDate: "2026-11-14",
  notes: "Rooftop venue, no mains power.",
};

const check = (over = {}) => validateEnquiry({ ...good, ...over }, quote, cfg);

/* --- What we insist on -------------------------------------------------- */

test("a complete enquiry passes", () => {
  const { ok, errors } = check();
  assert.equal(ok, true);
  assert.deepEqual(errors, {});
});

test("a name is required", () => {
  assert.ok(check({ name: "" }).errors.name);
  assert.ok(check({ name: " A " }).errors.name); // one letter is not a name
  assert.equal(check({ name: "Ali" }).ok, true);
});

test("an event type must be chosen", () => {
  assert.ok(check({ eventTypeId: "" }).errors.eventTypeId);
  assert.ok(check({ eventTypeId: "wedding" }).errors.eventTypeId);
});

test("a company event also needs the company name", () => {
  assert.ok(check({ eventTypeId: "company", companyName: "" }).errors.companyName);
  assert.equal(check({ eventTypeId: "company", companyName: "Omantel" }).ok, true);
});

test("a private event does not ask for a company name", () => {
  assert.equal(check({ eventTypeId: "private", companyName: "" }).ok, true);
});

test("a phone number is required, but its formatting is not policed", () => {
  assert.ok(check({ phone: "" }).errors.phone);
  assert.ok(check({ phone: "1234" }).errors.phone);
  ["91234567", "9123 4567", "+968 9123 4567", "(968) 9123-4567"].forEach((phone) => {
    assert.equal(check({ phone }).ok, true, `${phone} should be accepted`);
  });
});

test("email is optional but must look like an email when given", () => {
  assert.equal(check({ email: "" }).ok, true);
  assert.ok(check({ email: "not-an-email" }).errors.email);
  assert.ok(check({ email: "missing@domain" }).errors.email);
  assert.equal(check({ email: "a@b.om" }).ok, true);
});

test("an order below the cup minimum cannot be sent", () => {
  const { ok, errors } = validateEnquiry(good, tooFewCups, cfg);
  assert.equal(ok, false);
  assert.ok(errors.cups.includes("50 cups"));
});

/* --- What the email says ------------------------------------------------ */

test("the email carries the customer, the booking and the estimate", () => {
  const text = buildEnquiryText(good, quote, cfg);
  assert.match(text, /Name: Aisha Al Said/);
  assert.match(text, /Event type: Private event/);
  assert.match(text, /Phone: 9123 4567/);
  assert.match(text, /Email: aisha@example\.com/);
  assert.match(text, /Event date: 2026-11-14/);
  assert.match(text, /Cart: Ice Cream Cart/);
  assert.match(text, /Location: Barka/);
  assert.match(text, /Total cups: 100/);
  assert.match(text, /Gelato/);
  assert.match(text, /TOTAL: OMR 150\.000/);
  assert.match(text, /Deposit \(30%\): OMR 45\.000/);
  assert.match(text, /Rooftop venue, no mains power\./);
});

test("empty optional fields are left out of the email rather than left blank", () => {
  const text = buildEnquiryText(
    { ...good, email: "", eventDate: "", notes: "", companyName: "" }, quote, cfg
  );
  assert.equal(/Email:/.test(text), false);
  assert.equal(/Event date:/.test(text), false);
  assert.equal(/Company:/.test(text), false);
  assert.equal(/NOTES FROM THE CUSTOMER/.test(text), false);
  assert.match(text, /Phone: 9123 4567/); // the required ones are still there
});

test("a company enquiry names the company", () => {
  const text = buildEnquiryText(
    { ...good, eventTypeId: "company", companyName: "Omantel" }, quote, cfg
  );
  assert.match(text, /Event type: Company event/);
  assert.match(text, /Company: Omantel/);
});

test("the posted payload carries the fields and the written enquiry", () => {
  const payload = buildEnquiryPayload(good, quote, cfg);
  assert.equal(payload.name, "Aisha Al Said");
  assert.equal(payload.event_type, "Private event");
  assert.equal(payload.phone, "9123 4567");
  assert.equal(payload.cart, "Ice Cream Cart");
  assert.equal(payload.location, "Barka");
  assert.equal(payload.total_cups, "100");
  assert.equal(payload.total_estimate, "OMR 150.000");
  assert.match(payload.enquiry, /TOTAL: OMR 150\.000/);
});

test("values are trimmed before they are sent", () => {
  const payload = buildEnquiryPayload(
    { ...good, name: "  Ali  ", phone: " 9123 4567 " }, quote, cfg
  );
  assert.equal(payload.name, "Ali");
  assert.equal(payload.phone, "9123 4567");
});

/* --- Where it is sent --------------------------------------------------- */

test("formsubmit mode posts to the relay for the configured address", () => {
  assert.equal(
    enquiryEndpoint(cfg),
    "https://formsubmit.co/ajax/orders%40example.com"
  );
});

test("mailto mode has no endpoint to post to", () => {
  assert.equal(enquiryEndpoint({ ...cfg, enquiry: { ...cfg.enquiry, mode: "mailto" } }), null);
});

test("the mailto fallback addresses the business and carries the enquiry", () => {
  const link = enquiryMailto(good, quote, cfg);
  assert.ok(link.startsWith("mailto:orders@example.com?"));
  assert.match(link, /subject=New%20cart%20enquiry/);
  assert.match(decodeURIComponent(link), /Name: Aisha Al Said/);
  assert.match(decodeURIComponent(link), /TOTAL: OMR 150\.000/);
});

test("eventTypeById returns null rather than guessing", () => {
  assert.equal(eventTypeById("private", cfg).name, "Private event");
  assert.equal(eventTypeById("nope", cfg), null);
  assert.equal(eventTypeById("", cfg), null);
});

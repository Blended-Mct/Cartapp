/* =============================================================================
   Tests for the enquiry form: what we insist on, and what the email says.
   Run with:  npm test
   ========================================================================== */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { calculateQuote } = require("../assets/js/calculator.js");
const {
  validateEnquiry, buildEnquiryText, buildEnquiryPayload, buildRelayFields,
  enquiryEndpoint, enquiryMailto, eventTypeById,
} = require("../assets/js/enquiry.js");

const cfg = {
  currency: "OMR",
  locale: "en-OM",
  decimals: 3,
  serviceFee: 30,
  serviceFeeLabel: "Cart service fee",
  minimumCups: 50,
  duration: { includedHours: 3, extraHourRate: 5, maxHours: 10 },
  locations: [
    { id: "muscat", name: "Muscat", charge: 0 },
    { id: "barka", name: "Barka", charge: 15 },
  ],
  carts: [
    { id: "icecream", name: "Ice Cream Cart", blurb: "", emoji: "", serves: ["icecream"] },
    { id: "drinks", name: "Drinks Cart", blurb: "", emoji: "", serves: ["drinks"] },
  ],
  menu: [
    { id: "gelato", group: "icecream", name: "Gelato", pricePerCup: 1 },
    { id: "matcha", group: "drinks", name: "Matcha", pricePerCup: 2, minCups: 10 },
  ],
  groupMinimums: { drinks: 50 },
  cupExtras: [],
  flatExtras: [],
  tax: { percent: 0, label: "VAT" },
  deposit: { percent: 30, label: "Deposit" },
  messages: { chooseLater: "Flavours and toppings are chosen later." },
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

/* The counters cannot produce an under-minimum order, so the only unsendable
   one is empty. */
const emptyOrder = calculateQuote(
  {
    cartId: "icecream", quantities: {},
    locationId: "muscat", hours: 3, cupExtras: [], flatExtras: [],
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

/* A fixed "today", so the date tests do not drift. */
const TODAY = new Date(2026, 8, 24); // 24 September 2026
const check = (over = {}) =>
  validateEnquiry({ ...good, ...over }, quote, cfg, TODAY);

/* --- What we insist on -------------------------------------------------- */

test("a complete enquiry passes", () => {
  const { ok, errors } = check();
  assert.equal(ok, true);
  assert.deepEqual(errors, {});
});

test("the event date is required", () => {
  assert.match(check({ eventDate: "" }).errors.eventDate, /date of your event/);
  assert.match(check({ eventDate: "soon" }).errors.eventDate, /choose a date/);
});

test("a past date is refused, today and future dates are accepted", () => {
  assert.match(check({ eventDate: "2026-09-23" }).errors.eventDate, /has passed/);
  assert.match(check({ eventDate: "2025-12-31" }).errors.eventDate, /has passed/);
  assert.equal(check({ eventDate: "2026-09-24" }).ok, true); // today
  assert.equal(check({ eventDate: "2026-09-25" }).ok, true);
  assert.equal(check({ eventDate: "2027-01-01" }).ok, true);
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

test("an order that breaks a group rule cannot be sent", () => {
  const short = calculateQuote(
    {
      cartId: "drinks", quantities: { matcha: 10 },
      locationId: "muscat", hours: 3, cupExtras: [], flatExtras: [],
    },
    cfg
  );
  const { ok, errors } = validateEnquiry(good, short, cfg, TODAY);
  assert.equal(ok, false);
  /* The customer is told the actual rule, not a generic refusal. */
  assert.match(errors.cups, /50/);
  assert.match(errors.cups, /Drinks/);
});

test("the same order once the group rule is met sends fine", () => {
  const enough = calculateQuote(
    {
      cartId: "drinks", quantities: { matcha: 50 },
      locationId: "muscat", hours: 3, cupExtras: [], flatExtras: [],
    },
    cfg
  );
  assert.equal(validateEnquiry(good, enough, cfg, TODAY).ok, true);
});

test("an empty order cannot be sent", () => {
  const { ok, errors } = validateEnquiry(good, emptyOrder, cfg);
  assert.equal(ok, false);
  assert.match(errors.cups, /how many cups/);
});

test("an order raised to the minimum by the counters sends fine", () => {
  const raised = calculateQuote(
    {
      cartId: "icecream", quantities: { gelato: 20 },
      locationId: "muscat", hours: 3, cupExtras: [], flatExtras: [],
    },
    cfg
  );
  assert.equal(raised.totalCups, 50);
  assert.equal(validateEnquiry(good, raised, cfg).ok, true);
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
  assert.match(text, /TOTAL: OMR 145\.000/);
  assert.match(text, /Deposit \(30%\): OMR 43\.500/);
  assert.match(text, /Rooftop venue, no mains power\./);
});

test("empty optional fields are left out of the email rather than left blank", () => {
  const text = buildEnquiryText(
    { ...good, email: "", notes: "", companyName: "" }, quote, cfg
  );
  assert.equal(/Email:/.test(text), false);
  assert.equal(/Company:/.test(text), false);
  assert.equal(/NOTES FROM THE CUSTOMER/.test(text), false);
  assert.match(text, /Phone: 9123 4567/);      // the required ones are still there
  assert.match(text, /Event date: 2026-11-14/); // the date is never optional
});

test("the email says flavours and toppings come later", () => {
  assert.match(buildEnquiryText(good, quote, cfg), /chosen later/);
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
  assert.equal(payload.total_estimate, "OMR 145.000");
  assert.match(payload.enquiry, /TOTAL: OMR 145\.000/);
});

test("values are trimmed before they are sent", () => {
  const payload = buildEnquiryPayload(
    { ...good, name: "  Ali  ", phone: " 9123 4567 " }, quote, cfg
  );
  assert.equal(payload.name, "Ali");
  assert.equal(payload.phone, "9123 4567");
});

/* --- Where it is sent --------------------------------------------------- */

test("formsubmit mode posts to the plain form endpoint, not the fetch one", () => {
  /* The plain endpoint takes an ordinary form post, which is permitted in
     places a cross-origin fetch is blocked outright. */
  assert.equal(enquiryEndpoint(cfg), "https://formsubmit.co/orders%40example.com");
  assert.equal(enquiryEndpoint(cfg).includes("/ajax/"), false);
});

test("the relay fields carry the enquiry and the relay's own settings", () => {
  const fields = buildRelayFields(good, quote, cfg);
  /* Everything the email needs... */
  assert.equal(fields.name, "Aisha Al Said");
  assert.equal(fields.phone, "9123 4567");
  assert.equal(fields.event_date, "2026-11-14");
  assert.match(fields.enquiry, /TOTAL: OMR 145\.000/);
  /* ...plus the underscore-prefixed settings the relay reads. */
  assert.equal(fields._subject, "New cart enquiry");
  assert.equal(fields._template, "table");
  assert.equal(fields._captcha, "false");
});

test("every relay field is a string, as a form post requires", () => {
  Object.entries(buildRelayFields(good, quote, cfg)).forEach(([key, value]) => {
    assert.equal(typeof value, "string", `${key} should be a string`);
  });
});

test("mailto mode has no endpoint to post to", () => {
  assert.equal(enquiryEndpoint({ ...cfg, enquiry: { ...cfg.enquiry, mode: "mailto" } }), null);
});

test("the mailto fallback addresses the business and carries the enquiry", () => {
  const link = enquiryMailto(good, quote, cfg);
  assert.ok(link.startsWith("mailto:orders@example.com?"));
  assert.match(link, /subject=New%20cart%20enquiry/);
  assert.match(decodeURIComponent(link), /Name: Aisha Al Said/);
  assert.match(decodeURIComponent(link), /TOTAL: OMR 145\.000/);
});

test("eventTypeById returns null rather than guessing", () => {
  assert.equal(eventTypeById("private", cfg).name, "Private event");
  assert.equal(eventTypeById("nope", cfg), null);
  assert.equal(eventTypeById("", cfg), null);
});

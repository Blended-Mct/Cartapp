/* =============================================================================
   CONFIG WRITER  —  turns a pricing config back into pricing-config.js.
   =============================================================================
   The admin page edits the config as data; this writes it out as the file
   again, comments and all, so the file stays as readable and hand-editable as
   the one it replaces. Pure functions, no DOM, so the round trip is testable.
   ========================================================================== */

/* Keys that are safe to write bare; anything else gets quoted. */
const PLAIN_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function quote(text) {
  return JSON.stringify(String(text));
}

/* A number as a person would write it: 0.25, not 2.5e-1, and no stray
   floating-point tails. */
function num(value) {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 1e6) / 1e6);
}

/* Renders a value as JavaScript source. Arrays of plain values stay on one
   line; arrays of objects get a line each, which is how the file reads now. */
function js(value, indent) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);

  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return num(value);
  if (typeof value === "string") return quote(value);

  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    const simple = value.every((v) => typeof v !== "object" || v === null);
    if (simple) return `[${value.map((v) => js(v, 0)).join(", ")}]`;
    return (
      "[\n" +
      value.map((v) => `${inner}${js(v, indent + 1)}`).join(",\n") +
      `,\n${pad}]`
    );
  }

  const keys = Object.keys(value).filter((k) => value[k] !== undefined);
  if (!keys.length) return "{}";
  return (
    "{\n" +
    keys
      .map((k) => {
        const name = PLAIN_KEY.test(k) ? k : quote(k);
        return `${inner}${name}: ${js(value[k], indent + 1)}`;
      })
      .join(",\n") +
    `,\n${pad}}`
  );
}

/* The explanation that sits above each section, so the written file teaches
   the next reader as well as the hand-written one did. */
const SECTION_NOTES = {
  business: "Your business, as it appears at the top of the page.",
  currency: null,
  serviceFee: "What every booking starts at, before anything is chosen.",
  minimumCups:
    "The smallest quantity we serve of any one item. The cup counters hold to\n" +
    "     this: they step straight from 0 up to it, so an order below it cannot be\n" +
    "     built. An item can set a higher one of its own with `minCups`.",
  duration: "Hours covered by the service fee, and the rate for each hour beyond.",
  messages: "Wording shown on the page and repeated in the enquiry email.",
  locations: "The areas you cover. The first is the default.",
  carts: "The carts you offer. `serves` decides which menu groups each one shows.",
  menu:
    "The menu. `pricePerCup` is what one cup costs; `minCups` is this item's own\n" +
    "     minimum where it differs from the one above; `group` ties it to the carts\n" +
    "     that serve it.",
  groupMinimums:
    "Minimums that apply to a whole group rather than one item — the only rule\n" +
    "     the counters cannot hold, so it is checked as the customer orders. A group\n" +
    "     nothing was ordered from is not held to its minimum.",
  cupExtras:
    "Extras charged per cup ordered. `appliesTo` says which cups they count on:\n" +
    '     "icecream", "drinks" or "all".',
  quantityExtras:
    "Extras the customer gives a quantity for, with a counter of their own.\n" +
    '     `minQty` is the smallest we supply; `unit` is "piece" or "cup" and only\n' +
    "     decides the wording.",
  flatExtras: "Extras charged once, whatever the order size.",
  enquiry: "Where enquiries go, and how.",
  tax: "Oman VAT is 5%. 0 means no tax line is shown.",
  deposit: "Shown for information under the total. 0 hides it.",
};

const HEADER = `/* =============================================================================
   BLENDED — PRICING CONFIG
   =============================================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE PRICES.

   Every number is in Omani Rials, written to 3 decimals (baisa):
   1 = 1.000 OMR, 0.25 = 250 baisa.

   You can edit this by hand, or use the admin page (admin.html), which writes
   this file for you. Either way the page reads it the same.
   ========================================================================== */
`;

const FOOTER = `
if (typeof module !== "undefined" && module.exports) module.exports = { PRICING };
`;

/* -----------------------------------------------------------------------------
   serialiseConfig(config)  →  the complete text of pricing-config.js
--------------------------------------------------------------------------- */
function serialiseConfig(config) {
  const parts = Object.keys(config).map((key) => {
    const note = SECTION_NOTES[key];
    const comment = note ? `\n  /* --- ${note} */\n` : "\n";
    return `${comment}  ${key}: ${js(config[key], 1)},`;
  });

  return `${HEADER}\nconst PRICING = {\n${parts.join("\n")}\n};\n${FOOTER}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { serialiseConfig, js, num };
}

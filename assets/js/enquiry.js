/* =============================================================================
   ENQUIRY  —  validating the customer's details and writing out the enquiry.
   Pure functions, no DOM, so they can be tested on their own.
   ========================================================================== */

/* Which event types ask for a company name. */
function eventTypeById(id, config) {
  return (config.enquiry.eventTypes || []).find((t) => t.id === id) || null;
}

/* -----------------------------------------------------------------------------
   validateEnquiry(details, quote, config)

   details = { name, eventTypeId, companyName, phone, email, eventDate, notes }

   Returns { ok, errors } where errors is keyed by field, so each message can
   be shown against the input it belongs to.
--------------------------------------------------------------------------- */
function validateEnquiry(details, quote, config) {
  const errors = {};
  const name = (details.name || "").trim();
  const phone = (details.phone || "").trim();
  const email = (details.email || "").trim();
  const type = eventTypeById(details.eventTypeId, config);

  if (name.length < 2) {
    errors.name = "Please tell us your name.";
  }

  if (!type) {
    errors.eventTypeId = "Please choose the kind of event.";
  } else if (type.needsCompanyName && (details.companyName || "").trim().length < 2) {
    errors.companyName = "Please tell us the company name.";
  }

  /* Loose on purpose: Omani numbers are written many ways, and a form that
     argues about spacing loses enquiries. We only insist on enough digits. */
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    errors.phone = "Please leave a phone number we can reach you on.";
  }

  /* Email is optional, but if given it should look like one. */
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "That email address does not look right.";
  }

  if (!quote.meetsMinimum) {
    errors.cups =
      `Our smallest booking is ${config.minimumCups} cups. ` +
      `Please add more cups before sending.`;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/* -----------------------------------------------------------------------------
   buildEnquiryText(details, quote, config)

   The body of the email. Plain text, so it reads the same in any mail client.
--------------------------------------------------------------------------- */
function buildEnquiryText(details, quote, config) {
  const type = eventTypeById(details.eventTypeId, config);
  const cur = config.currency;
  const dp = Number.isInteger(config.decimals) ? config.decimals : 2;
  const amount = (n) => `${cur} ${n.toFixed(dp)}`;

  const lines = [];

  lines.push("CUSTOMER");
  lines.push(`Name: ${(details.name || "").trim()}`);
  if (type) lines.push(`Event type: ${type.name}`);
  if ((details.companyName || "").trim()) {
    lines.push(`Company: ${details.companyName.trim()}`);
  }
  lines.push(`Phone: ${(details.phone || "").trim()}`);
  if ((details.email || "").trim()) lines.push(`Email: ${details.email.trim()}`);
  if ((details.eventDate || "").trim()) lines.push(`Event date: ${details.eventDate}`);

  lines.push("");
  lines.push("BOOKING");
  lines.push(`Cart: ${quote.cart.name}`);
  lines.push(`Location: ${quote.location.name}`);
  lines.push(`Service hours: ${quote.hours}`);
  lines.push(`Total cups: ${quote.totalCups}`);

  lines.push("");
  lines.push("ESTIMATE");
  quote.lines.forEach((l) => {
    lines.push(`${l.label} — ${l.detail || "—"}: ${amount(l.amount)}`);
  });
  if (quote.tax) {
    lines.push(`Subtotal: ${amount(quote.subtotal)}`);
    lines.push(`${quote.tax.label}: ${amount(quote.tax.amount)}`);
  }
  lines.push(`TOTAL: ${amount(quote.total)}`);
  if (quote.deposit) {
    lines.push(`${quote.deposit.label}: ${amount(quote.deposit.amount)}`);
  }

  if ((details.notes || "").trim()) {
    lines.push("");
    lines.push("NOTES FROM THE CUSTOMER");
    lines.push(details.notes.trim());
  }

  lines.push("");
  lines.push("Sent from the Blended cart cost calculator.");
  lines.push("This estimate is not a binding quotation.");

  return lines.join("\n");
}

/* -----------------------------------------------------------------------------
   The fields posted to the relay. Named so the email reads well.
--------------------------------------------------------------------------- */
function buildEnquiryPayload(details, quote, config) {
  const type = eventTypeById(details.eventTypeId, config);
  return {
    name: (details.name || "").trim(),
    event_type: type ? type.name : "",
    company: (details.companyName || "").trim(),
    phone: (details.phone || "").trim(),
    email: (details.email || "").trim(),
    event_date: (details.eventDate || "").trim(),
    cart: quote.cart.name,
    location: quote.location.name,
    hours: String(quote.hours),
    total_cups: String(quote.totalCups),
    total_estimate: `${config.currency} ${quote.total.toFixed(
      Number.isInteger(config.decimals) ? config.decimals : 2
    )}`,
    enquiry: buildEnquiryText(details, quote, config),
  };
}

/* Where the enquiry is sent, given the configured mode. */
function enquiryEndpoint(config) {
  if (config.enquiry.mode === "formsubmit") {
    return `https://formsubmit.co/ajax/${encodeURIComponent(config.enquiry.email)}`;
  }
  return null;
}

/* The mailto: link used in "mailto" mode, and as the fallback when a send
   fails — the enquiry is never lost, the customer can always send it. */
function enquiryMailto(details, quote, config) {
  const subject = config.enquiry.subject || "New cart enquiry";
  const body = buildEnquiryText(details, quote, config);
  return (
    `mailto:${config.enquiry.email}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateEnquiry, buildEnquiryText, buildEnquiryPayload,
    enquiryEndpoint, enquiryMailto, eventTypeById,
  };
}

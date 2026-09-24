/* =============================================================================
   CALCULATOR  —  pure pricing logic, no DOM. Edit prices in pricing-config.js.
   ========================================================================== */

/* Rounds to a number of decimal places. Rials use 3 (baisa), most
   currencies use 2 — set `decimals` in pricing-config.js. */
function roundTo(n, decimals) {
  const f = Math.pow(10, Number.isInteger(decimals) ? decimals : 2);
  return Math.round((n + Number.EPSILON) * f) / f;
}

/* Kept for callers that just want two decimals. */
function round2(n) {
  return roundTo(n, 2);
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/* Number of drinks/scoops we expect to serve. */
function estimateServings(guests, pkg) {
  return Math.ceil(guests * pkg.servingsPerGuest);
}

/* Staff needed to serve that many servings within the booked hours. */
function recommendedStaff(servings, hours, config) {
  const perStaff = config.staffing.servingsPerStaffPerHour * hours;
  if (perStaff <= 0) return 1;
  return Math.max(1, Math.ceil(servings / perStaff));
}

/* An add-on's cost for this booking. */
function addonAmount(addon, ctx) {
  switch (addon.type) {
    case "perGuest":   return addon.price * ctx.guests;
    case "perServing": return addon.price * ctx.servings;
    case "perHour":    return addon.price * ctx.hours;
    case "flat":
    default:           return addon.price;
  }
}

function addonAppliesTo(addon, packageId) {
  return !addon.carts || addon.carts.includes(packageId);
}

/* Which surcharges apply to the chosen date. */
function activeSurcharges(dateStr, isHoliday, config) {
  const s = config.surcharges;
  // Oman's weekend is Friday & Saturday; set `weekendDays` in the config.
  const weekendDays = s.weekendDays || [0, 6];
  const out = [];
  if (dateStr) {
    // Parse as a local date so the weekday matches what the customer picked.
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) {
      const day = date.getDay();
      if (s.weekendPercent > 0 && weekendDays.includes(day)) {
        out.push({ label: "Weekend surcharge", percent: s.weekendPercent });
      }
      if (s.peakMonthPercent > 0 && (s.peakMonths || []).includes(m)) {
        out.push({ label: s.peakMonthLabel || "Peak season", percent: s.peakMonthPercent });
      }
    }
  }
  if (isHoliday && s.holidayPercent > 0) {
    out.push({ label: "Public holiday surcharge", percent: s.holidayPercent });
  }
  return out;
}

/* -----------------------------------------------------------------------------
   calculateQuote(input, config)

   input = {
     packageId, guests, hours, staff, distance,
     date: "YYYY-MM-DD" | "", isHoliday: bool, addons: [ids]
   }

   Returns a full breakdown: every line the customer sees, plus warnings.
--------------------------------------------------------------------------- */
function calculateQuote(input, config) {
  const pkg =
    config.packages.find((p) => p.id === input.packageId) || config.packages[0];
  const L = config.limits;
  const round = (n) => roundTo(n, config.decimals);

  const guests = clamp(Math.round(input.guests), L.minGuests, L.maxGuests);
  const hours = clamp(input.hours, L.minHours, L.maxHours);
  const distance = clamp(input.distance, 0, config.travel.maxDistance);
  const servings = estimateServings(guests, pkg);
  const staff = clamp(
    Math.round(input.staff),
    pkg.includedStaff,
    config.staffing.maxStaff
  );

  const ctx = { guests, hours, servings };
  const lines = [];
  const warnings = [];

  /* 1. Base package ---------------------------------------------------- */
  lines.push({
    label: `${pkg.name} — base package`,
    detail: `Includes ${pkg.includedHours} h service, ${pkg.includedServings} servings, ${pkg.includedStaff} staff`,
    amount: pkg.basePrice,
    surchargeable: true,
  });

  /* 2. Extra service hours ---------------------------------------------- */
  const extraHours = roundTo(Math.max(0, hours - pkg.includedHours), 2);
  if (extraHours > 0) {
    lines.push({
      label: "Additional service hours",
      detail: `${extraHours} h × ${pkg.extraHourRate}`,
      amount: extraHours * pkg.extraHourRate,
      surchargeable: true,
    });
  }

  /* 3. Servings above what the package includes -------------------------- */
  const extraServings = Math.max(0, servings - pkg.includedServings);
  if (extraServings > 0) {
    lines.push({
      label: "Additional servings",
      detail: `${extraServings} × ${pkg.perExtraServing} (est. ${servings} servings for ${guests} guests)`,
      amount: extraServings * pkg.perExtraServing,
      surchargeable: true,
    });
  }

  /* 4. Extra staff ------------------------------------------------------- */
  const extraStaff = Math.max(0, staff - pkg.includedStaff);
  if (extraStaff > 0) {
    lines.push({
      label: "Additional staff",
      detail: `${extraStaff} × ${hours} h × ${config.staffing.extraStaffPerHour}`,
      amount: extraStaff * hours * config.staffing.extraStaffPerHour,
      surchargeable: true,
    });
  }

  /* 5. Add-ons ----------------------------------------------------------- */
  const chosenAddons = (input.addons || [])
    .map((id) => config.addons.find((a) => a.id === id))
    .filter((a) => a && addonAppliesTo(a, pkg.id));

  chosenAddons.forEach((addon) => {
    const amount = addonAmount(addon, ctx);
    const detail =
      addon.type === "perServing" ? `${servings} servings × ${addon.price}`
      : addon.type === "perGuest"  ? `${guests} guests × ${addon.price}`
      : addon.type === "perHour"   ? `${hours} h × ${addon.price}`
      : addon.note || "";
    lines.push({ label: addon.name, detail, amount, surchargeable: true });
  });

  /* 6. Date surcharges — applied to the service cost only ---------------- */
  const serviceSubtotal = lines
    .filter((l) => l.surchargeable)
    .reduce((sum, l) => sum + l.amount, 0);

  activeSurcharges(input.date, input.isHoliday, config).forEach((s) => {
    lines.push({
      label: s.label,
      detail: `${s.percent}% of service cost`,
      amount: serviceSubtotal * (s.percent / 100),
      surchargeable: false,
    });
  });

  /* 7. Set-up fee -------------------------------------------------------- */
  if (config.fees.setupFee > 0) {
    lines.push({
      label: config.fees.setupFeeLabel || "Set-up & pack-down",
      detail: "Equipment transport, set-up and clear-down",
      amount: config.fees.setupFee,
      surchargeable: false,
    });
  }

  /* 8. Travel ------------------------------------------------------------ */
  const t = config.travel;
  const billableDistance = Math.max(0, distance - t.freeRadius);
  if (billableDistance > 0) {
    const multiplier = t.chargeRoundTrip ? 2 : 1;
    lines.push({
      label: "Travel",
      detail:
        `${roundTo(billableDistance, 2)} ${t.unit} beyond the free ${t.freeRadius} ${t.unit} radius` +
        (t.chargeRoundTrip ? ` × 2 (round trip) × ${t.perUnit}` : ` × ${t.perUnit}`),
      amount: billableDistance * multiplier * t.perUnit,
      surchargeable: false,
    });
  }

  /* 9. Subtotal, discount, minimum spend, tax ---------------------------- */
  let subtotal = round(lines.reduce((sum, l) => sum + l.amount, 0));

  const discountTier = (config.discounts || [])
    .filter((d) => subtotal >= d.minSubtotal)
    .sort((a, b) => b.percent - a.percent)[0];

  const discount = discountTier
    ? { label: discountTier.label, amount: round(subtotal * (discountTier.percent / 100)) }
    : null;

  let afterDiscount = round(subtotal - (discount ? discount.amount : 0));

  let minimumTopUp = null;
  if (config.fees.minimumSpend > 0 && afterDiscount < config.fees.minimumSpend) {
    minimumTopUp = {
      label: "Minimum booking adjustment",
      detail: `Our minimum booking is ${config.fees.minimumSpend}`,
      amount: round(config.fees.minimumSpend - afterDiscount),
    };
    afterDiscount = config.fees.minimumSpend;
  }

  const tax =
    config.tax.percent > 0
      ? {
          label: `${config.tax.label} (${config.tax.percent}%)`,
          amount: round(afterDiscount * (config.tax.percent / 100)),
        }
      : null;

  const total = round(afterDiscount + (tax ? tax.amount : 0));

  const deposit =
    config.deposit.percent > 0
      ? {
          label: `${config.deposit.label} (${config.deposit.percent}%)`,
          amount: round(total * (config.deposit.percent / 100)),
        }
      : null;

  /* 10. Warnings — things the customer should know before booking -------- */
  const needed = recommendedStaff(servings, hours, config);
  if (needed > staff) {
    warnings.push(
      `About ${servings} servings in ${hours} h is a lot for ${staff} staff. ` +
      `We'd suggest ${needed} to keep the queue short.`
    );
  }
  if (distance > t.freeRadius && billableDistance > 0) {
    warnings.push(
      `Your venue is outside our free ${t.freeRadius} ${t.unit} radius, so travel is included above.`
    );
  }
  if (minimumTopUp) {
    warnings.push(
      `This booking is below our minimum of ${config.fees.minimumSpend}, so it has been topped up to the minimum.`
    );
  }

  return {
    package: pkg,
    guests, hours, staff, distance, servings,
    recommendedStaff: needed,
    lines: lines.map((l) => ({ ...l, amount: round(l.amount) })),
    subtotal,
    discount,
    minimumTopUp,
    tax,
    total,
    deposit,
    perGuest: guests > 0 ? round(total / guests) : 0,
    warnings,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateQuote, estimateServings, recommendedStaff, roundTo, round2, clamp,
  };
}

/* =============================================================================
   PRICING CONFIG  —  THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE PRICES
   =============================================================================
   Every number below is a real price in your currency. Change them, save, and
   reload the page. No build step, no server, nothing else to update.
   ========================================================================== */

const PRICING = {

  /* --- Your business -------------------------------------------------- */
  business: {
    name: "Your Catering Co.",
    tagline: "Coffee & ice cream carts for events",
    // Shown under the final price. Good place for "prices are an estimate".
    disclaimer:
      "This is an instant estimate based on the details entered. " +
      "Final pricing is confirmed when your booking is agreed.",
  },

  /* --- Currency --------------------------------------------------------
     currency: 3-letter ISO code, e.g. "USD", "EUR", "GBP", "AED", "AUD".
     locale:   controls number formatting, e.g. "en-US", "en-GB", "de-DE".   */
  currency: "USD",
  locale: "en-US",

  /* --- The carts you offer ---------------------------------------------
     basePrice        : starting price, includes the hours/servings/staff below
     includedHours    : service hours included in basePrice
     includedServings : drinks / scoops included in basePrice
     includedStaff    : staff members included in basePrice
     extraHourRate    : price for each hour beyond includedHours
     perExtraServing  : price for each serving beyond includedServings
     servingsPerGuest : how many servings an average guest has (1.5 = most
                        guests take one, some take two)                      */
  packages: [
    {
      id: "coffee",
      name: "Coffee Cart",
      blurb: "Espresso bar — lattes, cappuccinos, americanos, tea & hot chocolate.",
      emoji: "☕",
      basePrice: 850,
      includedHours: 3,
      includedServings: 100,
      includedStaff: 1,
      extraHourRate: 180,
      perExtraServing: 4.5,
      servingsPerGuest: 1.5,
    },
    {
      id: "icecream",
      name: "Ice Cream Cart",
      blurb: "Scoop cart with cones, cups and a toppings selection.",
      emoji: "🍦",
      basePrice: 750,
      includedHours: 3,
      includedServings: 100,
      includedStaff: 1,
      extraHourRate: 160,
      perExtraServing: 4.0,
      servingsPerGuest: 1.3,
    },
    {
      id: "combo",
      name: "Coffee + Ice Cream",
      blurb: "Both carts, both crews — the full experience for bigger events.",
      emoji: "☕🍦",
      basePrice: 1450,
      includedHours: 3,
      includedServings: 180,
      includedStaff: 2,
      extraHourRate: 300,
      perExtraServing: 4.25,
      servingsPerGuest: 1.8,
    },
  ],

  /* --- Staffing --------------------------------------------------------
     extraStaffPerHour     : charged per additional staff member, per hour
     servingsPerStaffPerHour: how fast one staff member serves. Used only to
                              warn you when a booking needs more staff.       */
  staffing: {
    extraStaffPerHour: 45,
    servingsPerStaffPerHour: 60,
    maxStaff: 8,
  },

  /* --- Travel ----------------------------------------------------------
     Distance is one-way, from your base to the venue.                       */
  travel: {
    unit: "km",              // set to "mi" if you work in miles
    freeRadius: 25,          // no travel charge within this distance
    perUnit: 2.5,            // charge for each unit beyond the free radius
    chargeRoundTrip: true,   // true = distance counted there AND back
    maxDistance: 500,
  },

  /* --- Fixed fees ------------------------------------------------------ */
  fees: {
    setupFee: 120,      // set-up, pack-down and equipment transport. 0 = off.
    setupFeeLabel: "Set-up & pack-down",
    minimumSpend: 750,  // bookings below this are topped up. 0 = off.
  },

  /* --- Date-based surcharges ------------------------------------------
     Percentages are applied to the service cost (not travel/set-up).        */
  surcharges: {
    weekendPercent: 12,      // Saturday & Sunday. 0 = off.
    holidayPercent: 20,      // when the customer ticks "public holiday". 0 = off.
    peakMonths: [11, 12],    // month numbers, 1 = Jan. Here: Nov & Dec.
    peakMonthPercent: 10,    // 0 = off.
    peakMonthLabel: "Peak season",
  },

  /* --- Add-ons ---------------------------------------------------------
     type: "flat"      → charged once
           "perGuest"  → price × number of guests
           "perServing"→ price × estimated servings
           "perHour"   → price × service hours
     carts: which packages it applies to. Omit for "all carts".              */
  addons: [
    { id: "branding",  name: "Custom branded cart",    note: "Your logo on the cart facade & apron", type: "flat",       price: 220 },
    { id: "cups",      name: "Branded cups & sleeves", note: "Printed with your logo",               type: "perServing", price: 0.6 },
    { id: "premium",   name: "Premium bean upgrade",   note: "Single-origin specialty roast",        type: "perServing", price: 0.8, carts: ["coffee", "combo"] },
    { id: "syrups",    name: "Flavoured syrup bar",    note: "6 syrups, customer's choice",          type: "flat",       price: 90,  carts: ["coffee", "combo"] },
    { id: "toppings",  name: "Deluxe toppings bar",    note: "12 toppings & sauces",                 type: "flat",       price: 140, carts: ["icecream", "combo"] },
    { id: "vegan",     name: "Vegan / dairy-free range", note: "Oat, almond & sorbet options",       type: "flat",       price: 110 },
    { id: "generator", name: "Silent power generator", note: "For venues with no mains power",       type: "flat",       price: 180 },
    { id: "latte_art", name: "Latte art & menu board", note: "Hand-written menu, art on request",    type: "flat",       price: 75,  carts: ["coffee", "combo"] },
    { id: "extra_hour_staff", name: "Host / queue manager", note: "Keeps the line moving",           type: "perHour",    price: 35 },
  ],

  /* --- Volume discounts ------------------------------------------------
     The best qualifying tier is applied. Leave the array empty for none.    */
  discounts: [
    { minSubtotal: 2000, percent: 5,  label: "Volume discount (5%)" },
    { minSubtotal: 3500, percent: 8,  label: "Volume discount (8%)" },
    { minSubtotal: 6000, percent: 12, label: "Volume discount (12%)" },
  ],

  /* --- Tax ------------------------------------------------------------- */
  tax: {
    percent: 0,          // e.g. 20 for 20% VAT. 0 = no tax line shown.
    label: "VAT",
  },

  /* --- Deposit ---------------------------------------------------------- */
  deposit: {
    percent: 30,         // 0 = don't show a deposit line
    label: "Deposit to secure the date",
  },

  /* --- Input limits ----------------------------------------------------- */
  limits: {
    minGuests: 10,
    maxGuests: 2000,
    defaultGuests: 100,
    minHours: 2,
    maxHours: 12,
    defaultHours: 3,
    defaultDistance: 15,
  },
};

if (typeof module !== "undefined" && module.exports) module.exports = { PRICING };

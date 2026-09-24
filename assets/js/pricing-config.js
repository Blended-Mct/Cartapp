/* =============================================================================
   PRICING CONFIG  —  THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE PRICES
   =============================================================================
   Every number below is a real price in Omani Rials. Change them, save, and
   reload the page. No build step, no server, nothing else to update.

   Amounts are written to 3 decimal places (baisa), e.g. 1.500 = 1 rial 500 bz.
   ========================================================================== */

const PRICING = {

  /* --- Your business -------------------------------------------------- */
  business: {
    name: "Blended",
    tagline: "Ice cream · drinks · shakes",
    // Shown under the final price. Good place for "prices are an estimate".
    disclaimer:
      "This is an instant estimate based on the details entered. " +
      "Final pricing is confirmed when your booking is agreed.",
  },

  /* --- Currency --------------------------------------------------------
     currency: 3-letter ISO code. "OMR" = Omani Rial.
     locale:   number formatting. "en-OM" English/Oman, "ar-OM" Arabic/Oman.
     decimals: 3 for rials (baisa). Set to 2 for most other currencies.       */
  currency: "OMR",
  locale: "en-OM",
  decimals: 3,

  /* --- The carts you offer ---------------------------------------------
     basePrice        : starting price, includes the hours/servings/staff below
     includedHours    : service hours included in basePrice
     includedServings : scoops / shakes / drinks included in basePrice
     includedStaff    : staff members included in basePrice
     extraHourRate    : price for each hour beyond includedHours
     perExtraServing  : price for each serving beyond includedServings
     servingsPerGuest : how many servings an average guest has (1.5 = most
                        guests take one, some take two)                      */
  packages: [
    {
      id: "icecream",
      name: "Ice Cream Cart",
      blurb: "Scoop cart — cones, cups and a toppings selection.",
      emoji: "🍦",
      basePrice: 280,
      includedHours: 3,
      includedServings: 100,
      includedStaff: 1,
      extraHourRate: 60,
      perExtraServing: 1.5,
      servingsPerGuest: 1.3,
    },
    {
      id: "shakes",
      name: "Shakes & Drinks Cart",
      blurb: "Milkshakes, smoothies and iced drinks, blended to order.",
      emoji: "🥤",
      basePrice: 320,
      includedHours: 3,
      includedServings: 100,
      includedStaff: 1,
      extraHourRate: 70,
      perExtraServing: 1.8,
      servingsPerGuest: 1.5,
    },
    {
      id: "full",
      name: "The Full Blend",
      blurb: "Both carts, both crews — the whole Blended experience.",
      emoji: "🍦🥤",
      basePrice: 550,
      includedHours: 3,
      includedServings: 180,
      includedStaff: 2,
      extraHourRate: 115,
      perExtraServing: 1.6,
      servingsPerGuest: 1.8,
    },
  ],

  /* --- Staffing --------------------------------------------------------
     extraStaffPerHour     : charged per additional staff member, per hour
     servingsPerStaffPerHour: how fast one staff member serves. Used only to
                              warn a customer when a booking needs more staff. */
  staffing: {
    extraStaffPerHour: 18,
    servingsPerStaffPerHour: 60,
    maxStaff: 8,
  },

  /* --- Travel ----------------------------------------------------------
     Distance is one-way, from your base to the venue.                       */
  travel: {
    unit: "km",              // set to "mi" if you work in miles
    freeRadius: 25,          // no travel charge within this distance
    perUnit: 0.9,            // charge for each km beyond the free radius
    chargeRoundTrip: true,   // true = distance counted there AND back
    maxDistance: 600,
  },

  /* --- Fixed fees ------------------------------------------------------ */
  fees: {
    setupFee: 45,       // set-up, pack-down and equipment transport. 0 = off.
    setupFeeLabel: "Set-up & pack-down",
    minimumSpend: 280,  // bookings below this are topped up. 0 = off.
  },

  /* --- Date-based surcharges ------------------------------------------
     Percentages are applied to the service cost (not travel/set-up).
     peakMonths here covers the cooler event season, Nov–Feb.                */
  surcharges: {
    weekendPercent: 10,        // Friday & Saturday in Oman. 0 = off.
    weekendDays: [5, 6],       // 0 = Sunday … 5 = Friday, 6 = Saturday
    holidayPercent: 15,        // when the customer ticks "public holiday". 0 = off.
    peakMonths: [11, 12, 1, 2],
    peakMonthPercent: 8,       // 0 = off.
    peakMonthLabel: "Peak season",
  },

  /* --- Add-ons ---------------------------------------------------------
     type: "flat"      → charged once
           "perGuest"  → price × number of guests
           "perServing"→ price × estimated servings
           "perHour"   → price × service hours
     carts: which packages it applies to. Omit for "all carts".              */
  addons: [
    { id: "branding",  name: "Custom branded cart",     note: "Your event branding on the cart facade",  type: "flat",       price: 85 },
    { id: "cups",      name: "Branded cups & sleeves",  note: "Printed with your logo",                  type: "perServing", price: 0.25 },
    { id: "toppings",  name: "Deluxe toppings bar",     note: "12 toppings & sauces",                    type: "flat",       price: 55,  carts: ["icecream", "full"] },
    { id: "flavours",  name: "Extra flavour range",     note: "Six additional ice cream flavours",       type: "flat",       price: 40,  carts: ["icecream", "full"] },
    { id: "signature", name: "Signature shakes menu",   note: "Our specials, plus a shake named for the event", type: "flat", price: 45, carts: ["shakes", "full"] },
    { id: "fruitbar",  name: "Fresh fruit smoothie bar", note: "Made-to-order fruit smoothies",          type: "flat",       price: 60,  carts: ["shakes", "full"] },
    { id: "vegan",     name: "Vegan / dairy-free range", note: "Oat, almond & sorbet options",           type: "flat",       price: 40 },
    { id: "generator", name: "Silent power generator",  note: "For venues with no mains power",          type: "flat",       price: 70 },
    { id: "menuboard", name: "Hand-written menu board", note: "Illustrated board in the Blended style",  type: "flat",       price: 30 },
    { id: "host",      name: "Host / queue manager",    note: "Keeps the line moving",                   type: "perHour",    price: 14 },
  ],

  /* --- Volume discounts ------------------------------------------------
     The best qualifying tier is applied. Leave the array empty for none.    */
  discounts: [
    { minSubtotal: 750,  percent: 5,  label: "Volume discount (5%)" },
    { minSubtotal: 1300, percent: 8,  label: "Volume discount (8%)" },
    { minSubtotal: 2200, percent: 12, label: "Volume discount (12%)" },
  ],

  /* --- Tax -------------------------------------------------------------
     Oman VAT is 5%. Set percent to 5 if you are VAT-registered and your
     prices above are exclusive of VAT. 0 = no tax line shown.               */
  tax: {
    percent: 0,
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

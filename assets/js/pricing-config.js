/* =============================================================================
   BLENDED — PRICING CONFIG
   =============================================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE PRICES.

   Every number is in Omani Rials, written to 3 decimals (baisa):
   1 = 1.000 OMR, 0.25 = 250 baisa.

   Change a number, save, reload the page. No build step, no server.
   ========================================================================== */

const PRICING = {

  /* --- Your business -------------------------------------------------- */
  business: {
    name: "Blended",
    tagline: "Ice cream · drinks · shakes",
    disclaimer:
      "This is an instant estimate based on the details entered. " +
      "Final pricing is confirmed when your booking is agreed.",
  },

  /* --- Currency --------------------------------------------------------
     decimals: 3 for rials (baisa). Use 2 for most other currencies.        */
  currency: "OMR",
  locale: "en-OM",
  decimals: 3,

  /* --- What every booking starts with ---------------------------------- */
  serviceFee: 30,          // charged once on every booking
  serviceFeeLabel: "Cart service fee",

  /* The smallest quantity we serve of any one menu item. The cup counters
     will not go below it: they step straight from 0 up to this number, so a
     customer can never build an order we would have to turn down. An item can
     set its own higher minimum with `minCups` below.                        */
  minimumCups: 50,

  /* --- How long the cart serves ---------------------------------------- */
  duration: {
    includedHours: 3,      // hours covered by the service fee
    extraHourRate: 5,      // each hour beyond that
    maxHours: 10,
  },

  /* --- Wording shown on the page and repeated in the enquiry email ------ */
  messages: {
    /* Customers often stall trying to pick flavours before they have booked.
       This says they do not have to. */
    chooseLater:
      "Flavours and toppings are chosen later, once your booking is " +
      "confirmed — there is nothing to decide now.",
  },

  /* --- Where the event is ----------------------------------------------
     A drop-down, not a distance. Add a row for each area you cover.        */
  locations: [
    { id: "muscat", name: "Muscat", charge: 0 },
    { id: "barka",  name: "Barka",  charge: 15 },
  ],

  /* --- The three carts -------------------------------------------------
     serves: which menu groups the cart can pour. The menu below is filtered
     by this, so a drinks cart never shows gelato.                          */
  carts: [
    {
      id: "icecream",
      name: "Ice Cream Cart",
      blurb: "Gelato and soft serve, scooped to order.",
      emoji: "🍦",
      serves: ["icecream"],
    },
    {
      id: "drinks",
      name: "Drinks Cart",
      blurb: "Espresso, matcha and iced drinks.",
      emoji: "🥤",
      serves: ["drinks"],
    },
    {
      id: "blend",
      name: "The Blend",
      blurb: "Ice cream and drinks together — the full Blended cart.",
      emoji: "🍦🥤",
      serves: ["icecream", "drinks"],
    },
  ],

  /* --- The menu --------------------------------------------------------
     pricePerCup : what one cup costs
     minCups     : this item's own minimum, when it is higher than the
                   `minimumCups` above. Leave it out to use that default.
     note        : the small print shown under the item. The minimum is added
                   to it automatically, so there is no need to repeat it.    */
  menu: [
    {
      id: "gelato", group: "icecream", name: "Gelato",
      pricePerCup: 1,
      note: "Includes 3 toppings of your choice",
    },
    {
      id: "softserve", group: "icecream", name: "Soft serve",
      pricePerCup: 1.5, minCups: 200,
      note: "Swirled to order, in a cone or a cup",
    },
    {
      id: "espresso", group: "drinks", name: "Coffee — espresso base",
      pricePerCup: 1.5,
      note: "Espresso, americano, latte, cappuccino",
    },
    {
      id: "creamy_espresso", group: "drinks", name: "Creamy espresso",
      pricePerCup: 1.5,
      note: "Espresso over sweet cream",
    },
    {
      id: "matcha", group: "drinks", name: "Matcha",
      pricePerCup: 2,
      note: "Ceremonial grade, iced or hot",
    },
    {
      id: "creamy_matcha", group: "drinks", name: "Creamy matcha",
      pricePerCup: 1.5,
      note: "Matcha over sweet cream",
    },
    {
      id: "other_drinks", group: "drinks", name: "Iced tea & hibiscus",
      pricePerCup: 1.5,
      note: "Refreshing, caffeine-free options",
    },
  ],

  /* --- Extras charged per cup ------------------------------------------
     appliesTo : "icecream", "drinks" or "all" — which cups it is counted on */
  cupExtras: [
    {
      id: "extra_toppings", name: "Extra toppings",
      note: "Beyond the 3 included with gelato",
      pricePerCup: 0.2, appliesTo: "icecream",
    },
    {
      id: "cookies", name: "Cookies",
      note: "Add a cookie to each cup",
      pricePerCup: 0.9, appliesTo: "icecream",
    },
    {
      id: "branded_cups", name: "Branded cups",
      note: "Printed with your logo or event name",
      pricePerCup: 0.25, appliesTo: "all",
    },
  ],

  /* --- Extras charged once ---------------------------------------------- */
  flatExtras: [
    {
      id: "female_server", name: "Female server",
      note: "A female member of staff on the cart",
      price: 15,
    },
    {
      id: "branded_cart", name: "Customised branded cart",
      note: "The cart carries your wedding, brand or event branding",
      price: 40,
    },
  ],

  /* --- Sending enquiries to your inbox ---------------------------------
     A plain website cannot send email by itself, so the form hands the
     enquiry to a relay service which emails it to you.

     email    : where enquiries are sent. This is the default and needs no
                action from the customer — pressing Send emails you directly.
     mode     : "formsubmit" (the default) posts to formsubmit.co, which emails
                the address below. "mailto" instead opens the customer's own
                email app with the enquiry written out, for them to press send;
                only worth using if you would rather no relay saw the details.
     subject  : the subject line of the email you receive.

     ACTIVATION (formsubmit mode, once only): submit one test enquiry from the
     page yourself, then click the confirmation link formsubmit.co emails to
     the address below. Until you do, enquiries are not delivered.           */
  enquiry: {
    email: "Blended.mct@gmail.com",
    mode: "formsubmit",
    subject: "New cart enquiry from the website",

    /* The event types offered in the drop-down. `needsCompanyName` asks for
       a company name when that type is chosen. */
    eventTypes: [
      { id: "company", name: "Company event", needsCompanyName: true },
      { id: "private", name: "Private event", needsCompanyName: false },
    ],
  },

  /* --- Tax -------------------------------------------------------------
     Oman VAT is 5%. Set percent to 5 if you are VAT-registered and the
     prices above are exclusive of VAT. 0 = no tax line shown.              */
  tax: {
    percent: 0,
    label: "VAT",
  },

  /* --- Deposit ---------------------------------------------------------- */
  deposit: {
    percent: 30,         // 0 = don't show a deposit line
    label: "Deposit to secure the date",
  },
};

if (typeof module !== "undefined" && module.exports) module.exports = { PRICING };

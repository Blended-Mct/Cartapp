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
    tagline_ar: "آيس كريم · مشروبات · ميلك شيك",
    disclaimer:
      "This is an instant estimate based on the details entered. " +
      "Final pricing is confirmed when your booking is agreed.",
    disclaimer_ar:
      "هذا تقدير فوري بناءً على ما أدخلته. " +
      "يُؤكَّد السعر النهائي عند الاتفاق على الحجز.",
  },

  /* --- Currency --------------------------------------------------------
     decimals: 3 for rials (baisa). Use 2 for most other currencies.        */
  currency: "OMR",
  locale: "en-OM",
  /* Arabic keeps Western digits, which is how prices are written in Oman.
     For Arabic-Indic numerals (١٢٣) use "ar-OM" instead. */
  locale_ar: "ar-OM-u-nu-latn",
  decimals: 3,

  /* The language the page opens in. A visitor's choice is remembered. */
  defaultLanguage: "en",

  /* --- What every booking starts with ---------------------------------- */
  serviceFee: 30,          // charged once on every booking
  serviceFeeLabel: "Cart service fee",
  serviceFeeLabel_ar: "رسوم خدمة العربة",

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
    chooseLater_ar:
      "تُختار النكهات والإضافات لاحقًا بعد تأكيد الحجز — " +
      "لا حاجة لتحديدها الآن.",
  },

  /* --- Where the event is ----------------------------------------------
     A drop-down, not a distance. Add a row for each area you cover.        */
  locations: [
    { id: "muscat", name: "Muscat", name_ar: "مسقط", charge: 0 },
    { id: "barka",  name: "Barka",  name_ar: "بركاء", charge: 15 },
  ],

  /* --- The three carts -------------------------------------------------
     serves: which menu groups the cart can pour. The menu below is filtered
     by this, so a drinks cart never shows gelato.                          */
  carts: [
    {
      id: "icecream",
      name: "Ice Cream Cart",
      name_ar: "عربة الآيس كريم",
      blurb: "Gelato and soft serve, scooped to order.",
      blurb_ar: "جيلاتو وآيس كريم سوفت، يُقدَّم عند الطلب.",
      emoji: "🍦",
      serves: ["icecream"],
    },
    {
      id: "drinks",
      name: "Drinks Cart",
      name_ar: "عربة المشروبات",
      blurb: "Espresso, matcha and iced drinks.",
      blurb_ar: "إسبريسو وماتشا ومشروبات مثلجة.",
      emoji: "🥤",
      serves: ["drinks"],
    },
    {
      id: "blend",
      name: "The Blend",
      name_ar: "البلند",
      blurb: "Ice cream and drinks together — the full Blended cart.",
      blurb_ar: "آيس كريم ومشروبات معًا — عربة بلند كاملة.",
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
      id: "gelato", group: "icecream", name: "Gelato", name_ar: "جيلاتو",
      pricePerCup: 1,
      note: "Includes 3 toppings of your choice",
      note_ar: "يشمل ٣ إضافات من اختيارك",
    },
    {
      id: "softserve", group: "icecream", name: "Soft serve", name_ar: "آيس كريم سوفت",
      pricePerCup: 1.5, minCups: 200,
      note: "Swirled to order, in a cone or a cup",
      note_ar: "يُحضَّر عند الطلب، في كورن أو كوب",
    },
    {
      id: "espresso", group: "drinks", name: "Coffee — espresso base",
      name_ar: "قهوة بقاعدة إسبريسو",
      pricePerCup: 1.5,
      note: "Espresso, americano, latte, cappuccino",
      note_ar: "إسبريسو، أمريكانو، لاتيه، كابتشينو",
    },
    {
      id: "creamy_espresso", group: "drinks", name: "Creamy espresso",
      name_ar: "إسبريسو بالكريمة",
      pricePerCup: 1.5,
      note: "A milkshake blended with espresso",
      note_ar: "ميلك شيك ممزوج بالإسبريسو",
    },
    {
      id: "matcha", group: "drinks", name: "Matcha", name_ar: "ماتشا",
      pricePerCup: 2, minCups: 10,
      note: "Ceremonial grade, iced or hot",
      note_ar: "درجة احتفالية، باردة أو ساخنة",
    },
    {
      id: "creamy_matcha", group: "drinks", name: "Creamy matcha",
      name_ar: "ماتشا بالكريمة",
      pricePerCup: 1.5,
      note: "A milkshake blended with matcha",
      note_ar: "ميلك شيك ممزوج بالماتشا",
    },
    {
      id: "other_drinks", group: "drinks", name: "Iced tea & hibiscus",
      name_ar: "شاي مثلج وكركديه",
      pricePerCup: 1.5, minCups: 10,
      note: "Refreshing, caffeine-free options",
      note_ar: "خيارات منعشة وخالية من الكافيين",
    },
  ],

  /* --- Minimums that apply to a whole group, not one item --------------
     Matcha and iced tea can be ordered from 10 cups, but the drinks have to
     add up to something worth bringing a cart for. This is the only rule the
     counters cannot enforce on their own — no single counter owns a total —
     so it is stated under the menu, counted live as the customer orders, and
     checked before an enquiry can be sent.

     A group with nothing ordered from it is not held to its minimum.        */
  groupMinimums: {
    drinks: 50,
  },

  /* --- Extras charged per cup ------------------------------------------
     appliesTo : "icecream", "drinks" or "all" — which cups it is counted on */
  cupExtras: [
    {
      id: "extra_toppings", name: "Extra toppings", name_ar: "إضافات تزيين إضافية",
      note: "Beyond the 3 included with gelato",
      note_ar: "زيادةً على الـ٣ المشمولة مع الجيلاتو",
      pricePerCup: 0.2, appliesTo: "icecream",
    },
  ],

  /* --- Extras the customer gives a quantity for -------------------------
     These get their own counter rather than a tick box, because the number
     wanted is rarely the number of cups ordered.

     pricePerUnit : what one costs
     minQty       : the smallest quantity we supply. The counter will not go
                    below it: it steps straight from 0 up to this number.
     unit         : "piece" or "cup" — only decides the wording            */
  quantityExtras: [
    {
      id: "cookies", name: "Cookies", name_ar: "كوكيز",
      note: "Freshly baked, served alongside",
      note_ar: "مخبوزة طازجة، تُقدَّم إلى جانب الطلب",
      pricePerUnit: 0.9, minQty: 1, unit: "piece",
    },
    {
      id: "branded_cups", name: "Branded cups", name_ar: "أكواب بشعارك",
      note: "Printed with your logo or event name",
      note_ar: "مطبوعة بشعارك أو اسم مناسبتك",
      pricePerUnit: 0.25, minQty: 50, unit: "cup",
    },
  ],

  /* --- Extras charged once ---------------------------------------------- */
  flatExtras: [
    {
      id: "female_server", name: "Female server", name_ar: "عاملة ضيافة",
      note: "A female member of staff on the cart",
      note_ar: "موظفة على العربة",
      price: 15,
    },
    {
      id: "branded_cart", name: "Customised branded cart",
      name_ar: "عربة بهوية مناسبتك",
      note: "The cart carries your wedding, brand or event branding",
      note_ar: "تحمل العربة هوية عرسك أو علامتك أو مناسبتك",
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
      { id: "company", name: "Company event", name_ar: "مناسبة شركة", needsCompanyName: true },
      { id: "private", name: "Private event", name_ar: "مناسبة خاصة", needsCompanyName: false },
    ],
  },

  /* --- Tax -------------------------------------------------------------
     Oman VAT is 5%. Set percent to 5 if you are VAT-registered and the
     prices above are exclusive of VAT. 0 = no tax line shown.              */
  tax: {
    percent: 0,
    label: "VAT",
    label_ar: "ضريبة القيمة المضافة",
  },

  /* --- Deposit ---------------------------------------------------------- */
  deposit: {
    percent: 30,         // 0 = don't show a deposit line
    label: "Deposit to secure the date",
    label_ar: "عربون لتثبيت التاريخ",
  },
};

if (typeof module !== "undefined" && module.exports) module.exports = { PRICING };

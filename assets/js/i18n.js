/* =============================================================================
   LANGUAGES  —  every word the page says, in English and Arabic.
   =============================================================================
   To change any wording, edit it here. To correct the Arabic, edit the `ar`
   column — nothing else needs touching.

   Menu items, carts, areas and event types are named in pricing-config.js
   instead, each with an `_ar` twin, because they belong with their prices.
   ========================================================================== */

const STRINGS = {
  en: {
    dir: "ltr",
    langName: "العربية",          // what the switch offers next
    langSwitchLabel: "التبديل إلى العربية",

    pageTitle: "What will my cart cost?",
    pageIntro: "Tell us what you would like served and the price updates as you type.",

    step1: "1. When is your event?",
    step2: "2. Choose your cart",
    step3: "3. Your menu",
    step3Note: "how many cups of each",
    step4: "4. Where and how long",
    step5: "5. Extras",
    step6: "6. Send us your enquiry",
    optional: "optional",

    eventDate: "Event date",
    dateNeeded: "We need the date before we can hold a cart for you.",

    whereIsIt: "Where is it?",
    serviceHours: "Service hours",
    hoursIncluded: "{hours} hours are included in the service fee.",
    hoursExtra: "{count} {unit} beyond the {included} included, at {rate} each.",
    hour: "hour",
    hours: "hours",
    noTravelCharge: "No travel charge within {place}.",
    travelCharge: "{place} carries a {amount} travel charge.",

    startsAt: "Every booking starts at {fee}, which covers {hours} hours of service. " +
              "We serve from {cups} cups of any item.",
    servedFrom: "Each item is served from {cups} cups up{higher}. " +
                "Add as many kinds as you like.",
    servedFromItem: "{name} from {cups}",
    fromCups: "from {cups} cups",
    fromPieces: "from {cups} pieces",
    perCup: "{amount} per cup",
    perPiece: "{amount} per piece",
    piecesTimes: "{cups} pieces × {price}",
    fewerOf: "Fewer {name}",
    moreOf: "More {name}",
    howMany: "How many {name}",
    cupsTotal: "{cups} cups in total.",
    nothingChosen: "Nothing chosen yet.",
    fewerCups: "Fewer cups of {name}",
    moreCups: "More cups of {name}",
    cupsOf: "Cups of {name}",

    enquiryIntro: "We will come back to you with a confirmed quote. Nothing is booked yet.",
    yourName: "Your name",
    fullName: "Full name",
    kindOfEvent: "Kind of event",
    pleaseChoose: "Please choose…",
    companyName: "Company name",
    companyPlaceholder: "Company or organisation",
    phone: "Phone / WhatsApp",
    phonePlaceholder: "9xxx xxxx",
    email: "Email",
    emailPlaceholder: "you@example.com",
    notes: "Anything else we should know?",
    notesPlaceholder: "Venue, timings, flavours, anything at all",
    send: "Send my enquiry",
    sending: "Sending…",
    startOver: "Start over",
    startAnother: "Start another enquiry",

    errDate: "Please tell us the date of your event.",
    errDateFormat: "Please choose a date.",
    errDatePast: "That date has passed — please choose a future date.",
    errName: "Please tell us your name.",
    errEventType: "Please choose the kind of event.",
    errCompany: "Please tell us the company name.",
    errPhone: "Please leave a phone number we can reach you on.",
    errEmail: "That email address does not look right.",
    errCups: "Please choose how many cups you would like.",

    sendFailed: "We could not confirm that was sent — sorry.",
    sendByEmail: "Send it by email instead",
    notSetUp: "This form is not set up to send yet.",
    sentTitle: "Thank you — your enquiry is on its way.",
    namePrefix: "{name}, ",
    sentBody: "{name}we have your enquiry and will be in touch on {phone} with a " +
              "confirmed quote. {later}Your estimate is still on screen — print it " +
              "if you would like a copy.",

    yourEstimate: "Your estimate",
    chooseCups: "Choose your cups to see a price.",
    chooseCupsLong: "Choose how many cups you would like to see a price.",
    summary: "{cart} · {cups} cups · {hours} h · about {perCup} per cup",
    breakdown: "Cost breakdown",
    subtotal: "Subtotal",
    totalEstimate: "Total estimate",
    print: "Print / save as PDF",
    serviceFeeDetail: "{cart}, {hours} hours of service",
    cupsTimes: "{cups} cups × {price}",
    additionalHours: "Additional hours",
    hoursTimes: "{hours} h × {rate}",
    travelTo: "Travel to {place}",
    outsideBase: "Outside {place}",

    footer: "{name} — prices shown are an estimate, not a binding quotation. " +
            "Details you send reach us by email only.",
    themeToDark: "Switch to dark theme",
    themeToLight: "Switch to light theme",
  },

  ar: {
    dir: "rtl",
    langName: "English",
    langSwitchLabel: "Switch to English",

    pageTitle: "كم ستكلّف عربتك؟",
    pageIntro: "أخبرنا بما تودّ تقديمه، وسيتغيّر السعر أثناء الإدخال.",

    step1: "١. متى مناسبتك؟",
    step2: "٢. اختر عربتك",
    step3: "٣. قائمتك",
    step3Note: "كم كوبًا من كل صنف",
    step4: "٤. المكان والمدّة",
    step5: "٥. الإضافات",
    step6: "٦. أرسل طلبك",
    optional: "اختياري",

    eventDate: "تاريخ المناسبة",
    dateNeeded: "نحتاج التاريخ قبل أن نحجز لك العربة.",

    whereIsIt: "أين ستُقام؟",
    serviceHours: "ساعات الخدمة",
    hoursIncluded: "{hours} ساعات مشمولة في رسوم الخدمة.",
    hoursExtra: "{count} {unit} إضافية بعد الـ{included} المشمولة، بواقع {rate} للساعة.",
    hour: "ساعة",
    hours: "ساعات",
    noTravelCharge: "لا توجد رسوم انتقال داخل {place}.",
    travelCharge: "{place} عليها رسوم انتقال {amount}.",

    startsAt: "يبدأ كل حجز من {fee}، وتشمل {hours} ساعات خدمة. " +
              "نقدّم من {cups} كوبًا لكل صنف.",
    servedFrom: "كل صنف يُقدَّم ابتداءً من {cups} كوبًا{higher}. " +
                "أضف ما تشاء من الأصناف.",
    servedFromItem: "{name} من {cups}",
    fromCups: "من {cups} كوبًا",
    fromPieces: "من {cups} قطعة",
    perCup: "{amount} للكوب",
    perPiece: "{amount} للقطعة",
    piecesTimes: "{cups} قطعة × {price}",
    fewerOf: "تقليل {name}",
    moreOf: "زيادة {name}",
    howMany: "كم {name}",
    cupsTotal: "المجموع {cups} كوبًا.",
    nothingChosen: "لم يتم اختيار شيء بعد.",
    fewerCups: "تقليل أكواب {name}",
    moreCups: "زيادة أكواب {name}",
    cupsOf: "أكواب {name}",

    enquiryIntro: "سنعود إليك بعرض سعر مؤكّد. لم يتم الحجز بعد.",
    yourName: "الاسم",
    fullName: "الاسم الكامل",
    kindOfEvent: "نوع المناسبة",
    pleaseChoose: "اختر…",
    companyName: "اسم الشركة",
    companyPlaceholder: "الشركة أو الجهة",
    phone: "الهاتف / واتساب",
    phonePlaceholder: "٩xxx xxxx",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    notes: "هل من شيء آخر تودّ إخبارنا به؟",
    notesPlaceholder: "المكان، التوقيت، النكهات، أي شيء",
    send: "أرسل طلبي",
    sending: "جارٍ الإرسال…",
    startOver: "ابدأ من جديد",
    startAnother: "طلب جديد",

    errDate: "من فضلك أخبرنا بتاريخ مناسبتك.",
    errDateFormat: "من فضلك اختر تاريخًا.",
    errDatePast: "هذا التاريخ قد مضى — اختر تاريخًا قادمًا.",
    errName: "من فضلك أخبرنا باسمك.",
    errEventType: "من فضلك اختر نوع المناسبة.",
    errCompany: "من فضلك أخبرنا باسم الشركة.",
    errPhone: "من فضلك اترك رقم هاتف نتواصل معك عليه.",
    errEmail: "البريد الإلكتروني غير صحيح.",
    errCups: "من فضلك اختر عدد الأكواب.",

    sendFailed: "لم نتمكّن من تأكيد الإرسال — نعتذر.",
    sendByEmail: "أرسله عبر البريد الإلكتروني بدلًا من ذلك",
    notSetUp: "هذا النموذج غير جاهز للإرسال بعد.",
    sentTitle: "شكرًا لك — طلبك في طريقه إلينا.",
    namePrefix: "{name}، ",   /* the Arabic comma, not the Latin one */
    sentBody: "{name}استلمنا طلبك وسنتواصل معك على {phone} بعرض سعر مؤكّد. " +
              "{later}التقدير ما زال ظاهرًا على الشاشة — يمكنك طباعته إن أردت نسخة.",

    yourEstimate: "التقدير المبدئي",
    chooseCups: "اختر الأكواب لعرض السعر.",
    chooseCupsLong: "اختر عدد الأكواب لعرض السعر.",
    summary: "{cart} · {cups} كوبًا · {hours} ساعات · نحو {perCup} للكوب",
    breakdown: "تفصيل التكلفة",
    subtotal: "المجموع الفرعي",
    totalEstimate: "الإجمالي التقديري",
    print: "اطبع أو احفظ PDF",
    serviceFeeDetail: "{cart}، {hours} ساعات خدمة",
    cupsTimes: "{cups} كوبًا × {price}",
    additionalHours: "ساعات إضافية",
    hoursTimes: "{hours} ساعات × {rate}",
    travelTo: "الانتقال إلى {place}",
    outsideBase: "خارج {place}",

    footer: "{name} — الأسعار المعروضة تقديرية وليست عرضًا مُلزِمًا. " +
            "تصلنا بياناتك عبر البريد الإلكتروني فقط.",
    themeToDark: "التبديل إلى الوضع الداكن",
    themeToLight: "التبديل إلى الوضع الفاتح",
  },
};

const LANGUAGES = ["en", "ar"];

/* One string, with {placeholders} filled in. */
function t(key, lang, vars) {
  const table = STRINGS[lang] || STRINGS.en;
  let text = table[key];
  if (text === undefined) text = STRINGS.en[key];
  if (text === undefined) return key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  );
}

/* A name that lives in pricing-config.js, in the chosen language.
   `name` in Arabic comes from `name_ar`, falling back to the English. */
function localised(item, field, lang) {
  if (!item) return "";
  if (lang !== "en") {
    const translated = item[`${field}_${lang}`];
    if (translated) return translated;
  }
  return item[field] || "";
}

/* Which way round the page reads. */
function direction(lang) {
  return t("dir", lang);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STRINGS, LANGUAGES, t, localised, direction };
}

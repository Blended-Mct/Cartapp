# Blended — Cart Hire Cost Calculator

An online calculator for Blended's catering carts. A customer picks a cart, says
how many cups of each item they would like, and sees an itemised cost estimate
in Omani Rials that updates as they type. They can then send the whole thing to
you as an enquiry.

It is a plain website: no server, no database, no accounts, no build step. Open
`index.html` and it works.

---

## Changing your prices

**Everything you charge lives in one file: [`assets/js/pricing-config.js`](assets/js/pricing-config.js).**

Open it, change the numbers, save, reload the page. You never need to touch any
other file. Every setting has a comment above it explaining what it does.

Amounts are in Omani Rials to 3 decimals (baisa): `1` is 1.000 OMR, `0.25` is
250 baisa.

| What | Where in the file |
|---|---|
| Business name and tagline | `business` |
| The service fee every booking starts with | `serviceFee` |
| Smallest order you accept | `minimumCups` |
| Hours included, and the extra-hour rate | `duration` |
| Wording shown on the page and in the email | `messages` |
| Areas you cover and their travel charges | `locations` |
| The three carts and what each one serves | `carts` |
| Menu items and their per-cup prices | `menu` |
| Extras charged per cup | `cupExtras` |
| Extras the customer counts out | `quantityExtras` |
| Extras charged once | `flatExtras` |
| Where enquiries are emailed | `enquiry` |
| VAT | `tax` |
| Deposit percentage | `deposit` |

The page builds itself from this file — add a menu item, an area or an extra and
it appears on the form automatically.

### How a price is built

1. **Service fee** — charged on every booking, covering the included hours
   (currently 3; each hour after that is 5).
2. **The menu** — each item's cups × its `pricePerCup`. Quantities are already
   held at or above each item's minimum by the counters.
3. **Per-cup extras** — counted on the cups they apply to.
4. **Flat extras** — charged once.
5. **Location** — the charge for the chosen area.
6. **Extra hours** — beyond the hours the service fee covers.
7. **VAT**, then the **deposit** figure is shown for information.

### Minimums

There are two kinds.

**Per item.** **`minimumCups`** (currently 50) is the smallest quantity served
of any one item, and an item can set its own with **`minCups`** — soft serve
needs 200, while matcha and iced tea go from 10.

The minimum is enforced **by the cup counter itself**, not checked later:

- The counter steps straight from 0 to the minimum on the first press of **+**.
- Stepping **−** at the minimum clears the item back to 0, rather than landing
  on a quantity you do not serve.
- A number typed under the minimum is corrected upward when the customer leaves
  the box.
- Every item shows its minimum as a badge (*from 50 cups*), so it is known
  before anything is chosen.

So an order below an item's own minimum cannot be built, and there is nothing to
warn about or reject at the end.

**Per group.** `groupMinimums` holds rules about a *total* — currently
`drinks: 50`. Matcha and iced tea can be ordered from 10 cups each, but whatever
is taken from the drinks menu has to come to 50 between them.

This is the one rule a counter cannot hold, because no single counter owns a
total. So instead it is:

- stated under the menu, before anything is chosen
- counted live as the customer orders (*"Drinks: 20 of 50 cups"*)
- shown as a warning beside the price the moment it is broken
- checked again before an enquiry can be sent

A group nothing was ordered from is not held to its minimum, so an ice-cream-only
booking on The Blend is fine. Ice cream cups do not count towards the drinks
total, and a cart that does not serve drinks never sees the rule.

Adding a rule for ice cream is one line: `groupMinimums: { drinks: 50,
icecream: 100 }`.

### Menu items

```js
{
  id: "gelato",            // never change this once it is live
  group: "icecream",       // "icecream" or "drinks" — decides which carts show it
  name: "Gelato",
  pricePerCup: 1,
  minCups: 200,            // optional; leave it out to use `minimumCups`
  note: "Includes 3 toppings of your choice",
}
```

A cart's `serves` list decides which groups it offers, so the drinks cart never
shows gelato and The Blend shows everything.

### Extras

There are three kinds, and which one to use depends on how you charge:

- **`quantityExtras`** get their own counter, because the number wanted is
  rarely the number of cups ordered. Cookies at 0.900 each and branded cups at
  0.250 each work this way. Each has a `minQty` the counter will not go below
  (cookies 1, so effectively none; branded cups 50) and a `unit` of `"piece"` or
  `"cup"`, which only decides the wording.
- **`cupExtras`** are charged per cup ordered, with `appliesTo` saying which
  cups count — `"icecream"`, `"drinks"` or `"all"`. Extra toppings work this
  way, counted on ice cream cups only.
- **`flatExtras`** are charged once, whatever the order size.

### What the customer must fill in

The **event date** is asked for first and is required — it is the thing that
decides whether you are free at all. The date picker will not offer a past date,
and a past one typed in is refused.

Also required: name, kind of event (company events additionally ask the company
name) and a phone number. Email and notes are optional. Error messages appear
only once someone has pressed Send, and then clear as each field is put right.

### Flavours and toppings

`messages.chooseLater` is shown under the menu, repeated on the thank-you panel,
and included at the foot of the email, so nobody stalls trying to pick flavours
before booking. Change the wording there and it changes in all three places.

### Areas

```js
locations: [
  { id: "muscat", name: "Muscat", charge: 0 },
  { id: "barka",  name: "Barka",  charge: 15 },
],
```

Add a row for each area you cover. The first one in the list is the default.

### Turning something off

Set a price to `0` and it disappears from the estimate — that works for
`tax.percent` and `deposit.percent`. To drop a menu item, an extra or an area,
delete its block from the list.

---

## Enquiries by email

**Read this once — there is a step only you can do.**

Pressing *Send my enquiry* emails you directly; that is the default and the
customer does nothing else. Behind it, because a plain website cannot send mail
by itself, the form hands the enquiry to **formsubmit.co**, a free relay that
emails it to the address in `enquiry.email` (currently `Blended.mct@gmail.com`).

### Switching it on

1. Open the calculator and send **one test enquiry** yourself.
2. formsubmit.co emails `Blended.mct@gmail.com` asking you to confirm the
   address. **Click that link.**
3. Enquiries now arrive in your inbox. Do this once; it does not expire.

Until step 2 is done, enquiries are *not* delivered, and the form will say so
rather than pretending they were. That first test enquiry is expected to report
*"We could not confirm that was sent"* — it is what triggers the activation
email. After you click the link, sending works normally.

No relay can skip this: they all make you prove the address is yours before they
will send to it.

### How it is sent

The enquiry is posted as an ordinary form into a hidden frame, so the customer
never leaves the page. It is deliberately **not** a `fetch`: a page is commonly
allowed to post a form to another site while being forbidden from fetching one,
so the form post works in places a fetch is refused outright — which is why the
first version of this failed.

Knowing it arrived takes one more step. A hidden frame reports a successful load
even for an error page, so the relay is asked (`_next`) to send the frame back to
`assets/relay-ok.html`, a page on this site. Only then can the frame's address be
read at all, and reading it is the proof. Anything else — the relay's error or
activation page, a dead network — leaves the frame somewhere unreadable and
counts as not sent. Do not move or rename that file.

### What arrives

One email per enquiry, containing the event date, the customer's name, event
type, company (for company events), phone, their email and notes if given, and
the full itemised estimate down to the total and the deposit figure. It closes
with the note that flavours and toppings are settled after confirmation.

### If the relay is ever down

The customer is shown *"Send it by email instead"*, which opens their own email
app with the whole enquiry already written out. An enquiry is never silently
lost.

### The alternatives

| Option | Set `enquiry.mode` to | Trade-off |
|---|---|---|
| formsubmit.co relay | `"formsubmit"` | Works on any host, free, no code. Enquiry data passes through a third party. |
| Customer's own email app | `"mailto"` | Nothing passes through anyone else, but it depends on the customer having email set up on their phone, and they must press send themselves. |

There is a third route if you outgrow both: your own form endpoint, or a Google
Apps Script bound to your Gmail. That needs a small amount of setup and is worth
it only at volume.

### A note on customer data

Names and phone numbers now leave the page. In `formsubmit` mode they pass
through formsubmit.co on the way to your inbox; nothing is stored in this
website and there is no database. If you would rather no third party saw them,
use `"mailto"` mode.

---

## Running it

Just open `index.html` in a browser — that is enough for everyday use.

To run it on a local web server instead:

```bash
npm start        # serves it at http://localhost:8080
```

### Tests

The pricing rules have a test suite, so you can confirm nothing broke after
editing prices:

```bash
npm test
```

The tests use their own fixed prices, so they keep passing when you change
`pricing-config.js`. They will catch a genuine mistake in the calculation logic.

---

## Putting it online

The site is published to **GitHub Pages** by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml), which runs on every
push to `main`. The tests run first and the deploy waits on them, so a mistake in
the prices stops the deploy rather than reaching customers.

### Switching Pages on (once)

The workflow tries to enable Pages itself, but GitHub refuses that from a
workflow token — *"Resource not accessible by integration"*. It has to be done
by hand, once:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

Then re-run the workflow from the Actions tab (or push anything to `main`). The
site appears at `https://kifahkruce-oss.github.io/Cartapp/` a minute later, and
every push to `main` updates it from then on.

Alternatively, set *Source* to *Deploy from a branch* → `main` → `/ (root)`.
That publishes without the workflow, and so without the tests as a gate.

The repository's default branch is still the working branch it was built on.
To make `main` the default: **Settings → General → Default branch**.

Netlify, Cloudflare Pages and Vercel also work — drag the folder in, no
configuration needed. To put it on your existing website, upload these files to
any folder on your host, or embed it in a page with an iframe:

```html
<iframe src="https://kifahkruce-oss.github.io/Cartapp/"
        style="width:100%;height:1200px;border:0"></iframe>
```

---

## What's in each file

```
.github/workflows/pages.yml    runs the tests, then publishes the site
index.html                     the page
assets/css/styles.css          appearance (colours are tokens at the top)
assets/css/font.css            the display font, embedded
assets/fonts/                  the font file and its licence
assets/img/blended-logo.png    the wordmark, shown in the header
assets/img/blended-shopfront.webp  the illustration at the top of the form
assets/js/i18n.js              every phrase, in English and Arabic
assets/js/pricing-config.js    ← your prices, the only file you need to edit
assets/js/calculator.js        the pricing maths
assets/js/enquiry.js           validating the form and writing the email
assets/js/app.js               builds the form and keeps the estimate live
test/calculator.test.js        tests for the pricing rules
test/enquiry.test.js           tests for the enquiry form
test/i18n.test.js              tests that nothing is left untranslated
```

## The two languages

The page opens in English with an **العربية** button beside the theme switch.
Pressing it swaps the whole page to Arabic and flips the layout right to left.
The choice is remembered on that device, and everything already filled in — the
date, cups, contact details — is kept; only the words change.

Wording lives in two places:

- **[`assets/js/i18n.js`](assets/js/i18n.js)** holds every fixed phrase on the
  page, English beside Arabic. Correct a translation there and nothing else
  needs touching.
- **`pricing-config.js`** names the carts, menu items, extras and areas, each
  with an `_ar` twin (`name` / `name_ar`, `note` / `note_ar`), because those
  belong with their prices.

Anything with no Arabic falls back to the English rather than showing a blank,
and `npm test` fails if a name, note or phrase is missing its Arabic — that is
how the untranslated disclaimer was caught.

Numbers stay in Western digits (`120`, `30.000`) on the Arabic page, which is
how prices are written in Oman. For Arabic-Indic numerals (`١٢٠`) set
`locale_ar: "ar-OM"` in the config.

The enquiry email is **always in English**, whichever language the customer
used, since you are the one reading it.

### Adding a third language

1. Add a column to `STRINGS` in `i18n.js` with the same keys.
2. Add it to `LANGUAGES`.
3. Add `name_xx` / `note_xx` fields in `pricing-config.js`.

The switch currently toggles between two; more than two would want a drop-down.

## Changing the look

All colours are CSS custom properties at the top of `assets/css/styles.css`,
taken from the Blended logo and shopfront illustration:

| Token | Colour | Where it came from |
|---|---|---|
| `--accent` | `#1d6828` | the logo wordmark |
| `--leaf` | `#4ba565` | the shopfront |
| `--coral` | `#e88687` | the interior tiles |
| `--cream` | `#f3e6c8` | the interior walls |
| `--bg` | `#f4f7f1` | the illustration background |

Change a token once and it updates everywhere, in both the light and dark
themes. Dark-mode values are defined twice — once under
`@media (prefers-color-scheme: dark)` and once under `:root[data-theme="dark"]`
for the manual toggle — so edit both.

To swap the logo or the illustration, replace the files in `assets/img/` keeping
the same names.

## Notes

- Nothing is stored in this website and there is no database. Customer details
  are only sent when the customer presses *Send my enquiry* — see
  **Enquiries by email** above.
- Customers can print the estimate or save it as a PDF; only the estimate panel
  is printed, not the form.
- Flavours and toppings are deliberately not asked for — they are settled after
  the booking is confirmed.
- The page follows the visitor's light/dark preference, with a manual toggle in
  the header.
- The display font (Baloo 2, chosen to echo the Blended wordmark) is served from
  this repository, so the page makes no external requests and works offline.
- Works on phones, with the running total pinned to the bottom of the screen.

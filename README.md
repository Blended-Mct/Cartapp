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

**`minimumCups`** (currently 50) is the smallest quantity served of any one
item. A menu item can set a higher one of its own with **`minCups`** — soft
serve is 200.

The minimum is enforced **by the cup counter itself**, not checked later:

- The counter steps straight from 0 to the minimum on the first press of **+**.
- Stepping **−** at the minimum clears the item back to 0, rather than landing
  on a quantity you do not serve.
- A number typed under the minimum is corrected upward when the customer leaves
  the box.
- Every item shows its minimum as a badge (*from 50 cups*), so it is known
  before anything is chosen.

So an order below a minimum cannot be built, and there is nothing to warn about
or reject at the end. The only order that cannot be sent is an empty one.

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

`cupExtras` are charged per cup, and `appliesTo` says which cups they are
counted on — `"icecream"`, `"drinks"` or `"all"`. Extra toppings count only ice
cream cups; branded cups count every cup. They follow the cups actually charged,
so they inherit the counters' minimums automatically.

`flatExtras` are charged once, whatever the order size.

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

The site is static, so it will run anywhere. The free option:

**GitHub Pages** — in this repository go to *Settings → Pages*, set *Source* to
*Deploy from a branch*, pick your branch and the `/ (root)` folder, and save.
A minute later your calculator is live at
`https://kifahkruce-oss.github.io/Cartapp/`.

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
index.html                     the page
assets/css/styles.css          appearance (colours are tokens at the top)
assets/css/font.css            the display font, embedded
assets/fonts/                  the font file and its licence
assets/img/blended-logo.png    the wordmark, shown in the header
assets/img/blended-shopfront.webp  the illustration at the top of the form
assets/js/pricing-config.js    ← your prices, the only file you need to edit
assets/js/calculator.js        the pricing maths
assets/js/enquiry.js           validating the form and writing the email
assets/js/app.js               builds the form and keeps the estimate live
test/calculator.test.js        tests for the pricing rules
test/enquiry.test.js           tests for the enquiry form
```

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

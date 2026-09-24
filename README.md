# Blended — Cart Hire Cost Calculator

An online calculator for Blended's catering carts. A customer picks a cart, says
how many cups of each item they would like, and sees an itemised cost estimate
in Omani Rials that updates as they type.

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
| Areas you cover and their travel charges | `locations` |
| The three carts and what each one serves | `carts` |
| Menu items and their per-cup prices | `menu` |
| Extras charged per cup | `cupExtras` |
| Extras charged once | `flatExtras` |
| VAT | `tax` |
| Deposit percentage | `deposit` |

The page builds itself from this file — add a menu item, an area or an extra and
it appears on the form automatically.

### How a price is built

1. **Service fee** — charged on every booking, covering the included hours.
2. **The menu** — each item's cups × its `pricePerCup`.
3. **Per-cup extras** — counted on the cups they apply to.
4. **Flat extras** — charged once.
5. **Location** — the charge for the chosen area.
6. **Extra hours** — beyond the hours the service fee covers.
7. **VAT**, then the **deposit** figure is shown for information.

### Minimums

Two different kinds, and they behave differently:

- **`minimumCups`** (currently 50) is the smallest booking overall. An order
  below it is still priced, but the customer is told how many cups short they
  are.
- **`minCups` on a menu item or extra** is the smallest quantity served of that
  one thing. Order fewer and **the minimum is charged** — 120 cups of soft serve
  bills as 200, and the breakdown says so in plain words.

### Menu items

```js
{
  id: "gelato",            // never change this once it is live
  group: "icecream",       // "icecream" or "drinks" — decides which carts show it
  name: "Gelato",
  pricePerCup: 1,
  minCups: 200,            // optional; leave it out for no minimum
  note: "Includes 3 toppings of your choice",
}
```

A cart's `serves` list decides which groups it offers, so the drinks cart never
shows gelato and The Blend shows everything.

### Extras

`cupExtras` are charged per cup, and `appliesTo` says which cups they are
counted on — `"icecream"`, `"drinks"` or `"all"`. Extra toppings count only ice
cream cups; branded cups count every cup.

`flatExtras` are charged once, whatever the order size.

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
assets/js/app.js               builds the form and keeps the estimate live
test/calculator.test.js        tests for the pricing rules
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

- The estimate is shown on the page only — nothing is submitted or stored
  anywhere, and no customer details are collected.
- Customers can print the estimate or save it as a PDF; only the estimate panel
  is printed, not the form.
- The page follows the visitor's light/dark preference, with a manual toggle in
  the header.
- The display font (Baloo 2, chosen to echo the Blended wordmark) is served from
  this repository, so the page makes no external requests and works offline.
- Works on phones, with the running total pinned to the bottom of the screen.

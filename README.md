# Cart Hire Cost Calculator

An online calculator for a coffee / ice cream catering cart business. A customer
enters their event details — cart, date, guests, hours, staff, distance, add-ons
— and sees an itemised cost estimate that updates as they type.

It is a plain website: no server, no database, no accounts, no build step. Open
`index.html` and it works.

---

## Changing your prices

**Everything you charge lives in one file: [`assets/js/pricing-config.js`](assets/js/pricing-config.js).**

Open it, change the numbers, save, reload the page. You never need to touch any
other file. Every setting has a comment above it explaining what it does.

The things you will most likely want to change first:

| What | Where in the file |
|---|---|
| Your business name and tagline | `business` |
| Currency (`USD`, `EUR`, `GBP`, `AED`, …) | `currency` and `locale` |
| The carts you offer and what they cost | `packages` |
| What each package includes (hours, servings, staff) | `packages → included…` |
| Price of an extra hour / serving / staff member | `packages → extraHourRate`, `perExtraServing`, `staffing` |
| Travel charges and your free radius | `travel` |
| Set-up fee and minimum booking | `fees` |
| Weekend, holiday and peak-season surcharges | `surcharges` |
| The add-ons list and their prices | `addons` |
| Volume discounts | `discounts` |
| VAT / sales tax | `tax` |
| Deposit percentage | `deposit` |

The page builds itself from this file — add a cart to `packages` or an add-on to
`addons` and it appears on the form automatically.

### Add-on pricing types

Each add-on has a `type` that decides how it is charged:

- `flat` — a single fixed charge
- `perGuest` — price × number of guests
- `perServing` — price × estimated servings
- `perHour` — price × service hours

Add `carts: ["coffee"]` to an add-on to show it only for certain carts. Leave it
out and the add-on shows for all of them.

### Turning something off

Set the price to `0` and it disappears from the estimate. That works for
`setupFee`, `minimumSpend`, `tax.percent`, `deposit.percent`, and every
surcharge. For discounts, use an empty list: `discounts: []`.

---

## How the price is worked out

In order:

1. **Base package** price for the chosen cart.
2. **Extra hours** beyond what the package includes.
3. **Extra servings** — guests are converted to servings using
   `servingsPerGuest` (1.5 means most guests take one and some take two), then
   anything above the included allowance is charged.
4. **Extra staff** beyond the package, charged per person per hour.
5. **Add-ons** the customer ticked.
6. **Date surcharges** (weekend / public holiday / peak season) as a percentage
   of items 1–5. Travel and the set-up fee are deliberately excluded.
7. **Set-up fee**, then **travel** beyond your free radius (doubled if
   `chargeRoundTrip` is on).
8. **Volume discount** — the best qualifying tier.
9. **Minimum booking** top-up, if the total is still below your minimum.
10. **Tax**, then the **deposit** figure is shown for information.

The calculator also warns the customer when the booking looks understaffed for
the number of servings, using `servingsPerStaffPerHour` as the serving rate.

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
assets/js/pricing-config.js    ← your prices, the only file you need to edit
assets/js/calculator.js        the pricing maths
assets/js/app.js               builds the form and keeps the estimate live
test/calculator.test.js        tests for the pricing rules
```

## Notes

- The estimate is shown on the page only — nothing is submitted or stored
  anywhere, and no customer details are collected.
- Customers can print the estimate or save it as a PDF; only the estimate panel
  is printed, not the form.
- The page follows the visitor's light/dark preference, with a manual toggle in
  the header.
- Works on phones, with the running total pinned to the bottom of the screen.

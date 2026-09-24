# Fonts

`baloo2-variable.woff2` — **Baloo 2**, latin subset, variable weight 400–800.
Used for headings and the price figures, to echo the Blended wordmark.

Designed by Ek Type. Licensed under the
[SIL Open Font License 1.1](https://openfontlicense.org/), which permits use,
modification and redistribution — including in commercial work — provided the
font itself is not sold on its own.

The file is served from this repository rather than from Google Fonts, so the
calculator makes no external requests and works offline.

## Regenerating the embedded copy

`assets/css/font.css` holds the same font base64-encoded, so it renders even
when `index.html` is opened directly from disk. If you ever replace the
`.woff2`, regenerate that file with:

```bash
python3 -c "
import base64, pathlib
b64 = base64.b64encode(pathlib.Path('assets/fonts/baloo2-variable.woff2').read_bytes()).decode()
css = pathlib.Path('assets/css/font.css').read_text()
import re
pathlib.Path('assets/css/font.css').write_text(
    re.sub(r'base64,[A-Za-z0-9+/=]+', 'base64,' + b64, css))
"
```

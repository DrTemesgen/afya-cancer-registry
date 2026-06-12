# Localization & the African Union languages

ACR ships with all six **African Union working languages** as first-class UI languages and is structured so
that **any other African language** can be added by dropping in a locale file — matching the AU's own
formula: *"Arabic, English, French, Portuguese, Spanish, Kiswahili and any other African language."*

| Code | Language | Script / direction | Status in repo |
| --- | --- | --- | --- |
| `en` | English | Latin, LTR | full UI |
| `fr` | Français | Latin, LTR | full UI |
| `pt` | Português | Latin, LTR | full UI |
| `es` | Español | Latin, LTR | full UI |
| `sw` | Kiswahili | Latin, LTR | full UI |
| `ar` | العربية (Arabic) | Arabic, **RTL** | full UI + RTL layout |

> Extensible to Amharic (`am`), Hausa (`ha`), Yoruba (`yo`), isiZulu (`zu`), etc. — add `locales/<code>.json`
> and register it.

## How it works

- Built on **i18next / react-i18next**. Each language is a JSON resource in
  [`apps/web/src/i18n/locales/`](../apps/web/src/i18n/locales/).
- The chosen language is persisted and applied on load; the document `dir` attribute flips to `rtl` for
  Arabic, and the layout mirrors automatically (logical CSS properties).
- **Coded value sets** (sex, basis of diagnosis, behaviour, treatment, AU regions, …) carry translated
  labels for all six languages in [`valuesets.ts`](../apps/web/src/core/valuesets.ts), so a clerk sees
  *"Confirmation histologique"* / *"التأكيد النسيجي"* / *"Uthibitisho wa kihistolojia"* rather than a raw code.
- **Clinical classifications** (ICD-O-3, ICD-11) are language-neutral codes; their *display terms* come from
  the official multilingual releases at deploy time. ACR stores the code; the label layer is pluggable.

## Translation workflow

1. Copy `locales/en.json` to `locales/<code>.json`.
2. Translate the values (keys stay in English).
3. Add the language to the `LANGUAGES` list in `i18n/index.ts` (code, native name, `dir`).
4. For coded value-set labels, add the `<code>` entry to each value's `labels` map in `valuesets.ts`.

Medical translations should be reviewed by clinical native speakers; the English strings are the source of
truth and intentionally plain so they translate cleanly.

## Equity note

Number, date and name formatting follow the active locale. Comparative dashboards label benchmarks
("LMIC average", "Global") in the user's language and always show the **data-quality caveats** (coverage,
MV%, DCO%) alongside any cross-country comparison, so the platform informs rather than ranks.

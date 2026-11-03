# Spanish portfolio

The English pages are the source for the shared HTML structure. Spanish copy lives in `locales/es.json`. Both versions use the same styles, scripts, and image files.

After editing an English page, add or update the corresponding Spanish text in `locales/es.json`, then run from the project root:

```sh
node scripts/build-spanish.mjs
```

The builder creates the six pages under `es/`, updates matching EN / ES controls and alternate-language metadata, and adjusts asset and internal page links. It stops before writing if a new English string needs a translation. Edit Spanish copy in the dictionary rather than directly in generated pages.

The original artwork remains in English. FlowDesk remains an English concept and is labeled accordingly in the Spanish portfolio.

Language controls and Spanish layout adjustments are in `languages.css`. The Azurea viewer reads its labels and image descriptions from the localized HTML.

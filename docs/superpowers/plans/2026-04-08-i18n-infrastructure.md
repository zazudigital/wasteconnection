# i18n Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add NL/EN/DE language support using Astro's native i18n, with Dutch content extracted into translation files and EN/DE stubs falling back to Dutch.

**Architecture:** Astro i18n routing with `prefixDefaultLocale: false` (NL has no prefix, EN/DE get `/en/` `/de/` prefixes). All translatable strings extracted into TypeScript translation files. Components use `Astro.currentLocale` + `useTranslations()` helper — no prop drilling. Page templates shared across locales via thin wrapper pages.

**Tech Stack:** Astro 6 native i18n, TypeScript translation files, `getRelativeLocaleUrl()` from `astro:i18n`

---

## File Map

### Create
- `src/i18n/translations/nl.ts` — all Dutch strings extracted from pages/components
- `src/i18n/translations/en.ts` — stub spreading nl, no overrides yet
- `src/i18n/translations/de.ts` — stub spreading nl, no overrides yet
- `src/i18n/index.ts` — `useTranslations()`, `localePath()`, types
- `src/templates/HomePage.astro` — extracted from `src/pages/index.astro`
- `src/templates/ServicesPage.astro` — extracted from `src/pages/diensten.astro`
- `src/templates/AboutPage.astro` — extracted from `src/pages/over-ons.astro`
- `src/templates/ContactPage.astro` — extracted from `src/pages/contact.astro`
- `src/pages/en/index.astro` — thin wrapper
- `src/pages/en/diensten.astro` — thin wrapper
- `src/pages/en/over-ons.astro` — thin wrapper
- `src/pages/en/contact.astro` — thin wrapper
- `src/pages/de/index.astro` — thin wrapper
- `src/pages/de/diensten.astro` — thin wrapper
- `src/pages/de/over-ons.astro` — thin wrapper
- `src/pages/de/contact.astro` — thin wrapper

### Modify
- `astro.config.mjs` — add i18n config
- `src/layouts/Layout.astro` — dynamic `lang`, `og:locale`, hreflang alternates
- `src/components/Header.astro` — translations + language switcher
- `src/components/Footer.astro` — translations + localized links
- `src/components/Stats.astro` — translations
- `src/components/Testimonials.astro` — translations
- `src/components/CTA.astro` — translations
- `src/components/Hero.astro` — minor: default prop labels from translations
- `src/pages/index.astro` — becomes thin wrapper importing HomePage template
- `src/pages/diensten.astro` — becomes thin wrapper importing ServicesPage template
- `src/pages/over-ons.astro` — becomes thin wrapper importing AboutPage template
- `src/pages/contact.astro` — becomes thin wrapper importing ContactPage template

---

### Task 1: Astro i18n Config

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add i18n config to astro.config.mjs**

```js
export default defineConfig({
  site: 'https://wasteconnection.nl',
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'en', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- [ ] **Step 2: Verify dev server still works**

Run: `npm run dev` — should start without errors.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(i18n): add Astro i18n routing config for NL/EN/DE"
```

---

### Task 2: Translation Infrastructure

**Files:**
- Create: `src/i18n/translations/nl.ts`
- Create: `src/i18n/translations/en.ts`
- Create: `src/i18n/translations/de.ts`
- Create: `src/i18n/index.ts`

- [ ] **Step 1: Create `src/i18n/translations/nl.ts`**

Extract ALL Dutch strings from every page and component into a nested TypeScript object. Organize by:
- `meta` — site-wide meta defaults
- `nav` — navigation labels
- `header` — announcement bar, tagline
- `footer` — footer labels, links, charity text, copyright
- `stats` — stat values and labels
- `testimonials` — approaches section
- `cta` — call-to-action text
- `home` — home page content (hero, services list, whyUs section, key figures)
- `diensten` — services page (hero, all 4 service sections with detail arrays, visual break quote)
- `overOns` — about page (hero, mission, values, timeline, charity/sustainability)
- `contact` — contact page (hero, form labels/placeholders, sidebar, collectief info)

Every single user-visible Dutch string must be in this file. No hardcoded Dutch should remain in any `.astro` file except brand names (WasteConnection, WC) and contact data that's locale-independent (phone, email, address).

- [ ] **Step 2: Create `src/i18n/translations/en.ts`**

```ts
import nl from './nl';
const en: typeof nl = { ...nl };
export default en;
```

Spreads entire NL object. When real translations come, override individual keys.

- [ ] **Step 3: Create `src/i18n/translations/de.ts`**

Same pattern as en.ts.

- [ ] **Step 4: Create `src/i18n/index.ts`**

```ts
import nl from './translations/nl';
import en from './translations/en';
import de from './translations/de';

export type Locale = 'nl' | 'en' | 'de';

const translations: Record<Locale, typeof nl> = { nl, en, de };

// Deep key access: t('home.hero.title') → string
// Also works for objects/arrays: t('home.services.items') → array
function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((o, k) => o?.[k], obj);
}

export function useTranslations(locale: string | undefined) {
  const l = (locale || 'nl') as Locale;
  const dict = translations[l];
  return (key: string) => getNestedValue(dict, key);
}

export function localePath(locale: string | undefined, path: string): string {
  const l = locale || 'nl';
  if (l === 'nl') return path;
  return `/${l}${path}`;
}

export const localeMap: Record<Locale, { label: string; ogLocale: string }> = {
  nl: { label: 'NL', ogLocale: 'nl_NL' },
  en: { label: 'EN', ogLocale: 'en_US' },
  de: { label: 'DE', ogLocale: 'de_DE' },
};

export const locales: Locale[] = ['nl', 'en', 'de'];
```

- [ ] **Step 5: Verify imports work**

Run: `npm run dev` — no import errors.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): add translation files and useTranslations helper"
```

---

### Task 3: Refactor Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Add locale-aware head tags**

- Import `localeMap`, `locales`, `localePath` from `../i18n`
- Use `Astro.currentLocale` for `lang` attribute
- Dynamic `og:locale` from `localeMap`
- Add `<link rel="alternate" hreflang="...">` for all 3 locales + `x-default`
- Keep all existing functionality

Key changes:
```astro
---
import { localeMap, locales, localePath } from '../i18n';
const locale = Astro.currentLocale || 'nl';
const ogLocale = localeMap[locale as keyof typeof localeMap].ogLocale;
const pagePath = Astro.url.pathname.replace(/^\/(en|de)/, '') || '/';
---
<html lang={locale}>
  <head>
    ...
    <meta property="og:locale" content={ogLocale} />
    {locales.map(l => (
      <link rel="alternate" hreflang={l} href={new URL(localePath(l, pagePath), Astro.site)} />
    ))}
    <link rel="alternate" hreflang="x-default" href={new URL(pagePath, Astro.site)} />
    ...
  </head>
```

- [ ] **Step 2: Verify pages render with correct lang attribute**

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(i18n): locale-aware Layout with hreflang alternates"
```

---

### Task 4: Refactor Components

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/Stats.astro`
- Modify: `src/components/Testimonials.astro`
- Modify: `src/components/CTA.astro`

- [ ] **Step 1: Refactor Header.astro**

- Import `useTranslations`, `localePath`, `locales`, `localeMap` from `../i18n`
- Replace hardcoded nav labels with `t('nav.home')` etc.
- Replace announcement text with `t('header.announcement')`
- All `href` values through `localePath(locale, '/diensten')` etc.
- Add language switcher after desktop nav (before phone CTA):

```astro
<div class="flex items-center gap-1 ml-3 border-l border-border-default pl-3">
  {locales.map(l => (
    <a
      href={localePath(l, pagePath)}
      class:list={[
        'px-2 py-1 text-xs font-bold transition-colors',
        l === locale ? 'text-primary' : 'text-ink-subtle hover:text-primary',
      ]}
      aria-label={`Switch to ${localeMap[l].label}`}
    >
      {localeMap[l].label}
    </a>
  ))}
</div>
```

Also add switcher in mobile menu.

- [ ] **Step 2: Refactor Footer.astro**

- Replace all hardcoded labels with `t()` calls
- Links through `localePath()`
- Footer text: quickLinks labels, serviceLinks labels, section headings, charity text, copyright, bottom links

- [ ] **Step 3: Refactor Stats.astro**

- Replace "Bedrijven", "Sinds 2005", "Gecertificeerd", "Afvalstromen" with `t('stats.*')`

- [ ] **Step 4: Refactor Testimonials.astro**

- Move `approaches` array content to translations
- Read from `t('testimonials.approaches')` as array
- Keep layout/HTML structure as-is

- [ ] **Step 5: Refactor CTA.astro**

- Replace heading, description, button text, phone label with `t('cta.*')`

- [ ] **Step 6: Verify all components render correctly**

Run dev server, check all 4 pages visually — should look identical to before.

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat(i18n): refactor all components to use translations"
```

---

### Task 5: Extract Page Templates + Refactor Pages

**Files:**
- Create: `src/templates/HomePage.astro`
- Create: `src/templates/ServicesPage.astro`
- Create: `src/templates/AboutPage.astro`
- Create: `src/templates/ContactPage.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/diensten.astro`
- Modify: `src/pages/over-ons.astro`
- Modify: `src/pages/contact.astro`

- [ ] **Step 1: Create HomePage.astro template**

Move the entire content of `src/pages/index.astro` into `src/templates/HomePage.astro`. Replace all hardcoded Dutch strings with `t()` calls. The template reads from translations for:
- Page meta (title, description)
- Hero props
- Services section (label, heading, description, items array, viewAll link)
- Why Us section (label, heading, description, reasons array)
- Key figures (values and labels)

- [ ] **Step 2: Reduce index.astro to thin wrapper**

```astro
---
import HomePage from '../templates/HomePage.astro';
---
<HomePage />
```

- [ ] **Step 3: Create ServicesPage.astro template**

Same pattern — extract diensten.astro content, replace Dutch with `t('diensten.*')` calls. Service detail arrays (`afvalhoutDetails`, `bandenDetails`, etc.) come from translations.

- [ ] **Step 4: Reduce diensten.astro to thin wrapper**

- [ ] **Step 5: Create AboutPage.astro template**

Extract over-ons.astro. Values array, timeline array, mission text, sustainability grid — all from `t('overOns.*')`.

- [ ] **Step 6: Reduce over-ons.astro to thin wrapper**

- [ ] **Step 7: Create ContactPage.astro template**

Extract contact.astro. Form labels, placeholders, select options, sidebar text — all from `t('contact.*')`.

- [ ] **Step 8: Reduce contact.astro to thin wrapper**

- [ ] **Step 9: Verify all 4 pages render identically to before**

Visual check + `npm run build` succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/templates/ src/pages/
git commit -m "feat(i18n): extract page templates, pages become thin wrappers"
```

---

### Task 6: Create EN/DE Page Wrappers

**Files:**
- Create: `src/pages/en/index.astro`
- Create: `src/pages/en/diensten.astro`
- Create: `src/pages/en/over-ons.astro`
- Create: `src/pages/en/contact.astro`
- Create: `src/pages/de/index.astro`
- Create: `src/pages/de/diensten.astro`
- Create: `src/pages/de/over-ons.astro`
- Create: `src/pages/de/contact.astro`

- [ ] **Step 1: Create all 8 EN/DE page wrappers**

Each file is identical in structure — 3 lines:

```astro
---
import HomePage from '../../templates/HomePage.astro';
---
<HomePage />
```

(Substituting the correct template for each page.)

The locale is automatically detected from the URL by Astro (`Astro.currentLocale`), so no locale prop is needed.

- [ ] **Step 2: Verify `/en/` and `/de/` routes work**

Visit `http://localhost:4322/en/` and `http://localhost:4322/de/` — should render Dutch content (since stubs fall back to NL). Language switcher should show correct active locale.

- [ ] **Step 3: Verify `npm run build` succeeds**

All 12 pages (4 per locale) should generate successfully.

- [ ] **Step 4: Commit**

```bash
git add src/pages/en/ src/pages/de/
git commit -m "feat(i18n): add EN/DE page wrappers (Dutch fallback until translated)"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Expected: all pages generate, no errors, no warnings about missing translations.

- [ ] **Step 2: Verify sitemap includes locale URLs**

Check `dist/sitemap-0.xml` — should include NL, EN, DE URLs.

- [ ] **Step 3: Verify hreflang tags**

Check page source for correct `<link rel="alternate" hreflang="...">` tags on each locale variant.

- [ ] **Step 4: Verify language switcher navigation**

- NL page → click EN → goes to `/en/...`
- EN page → click NL → goes to `/...`
- DE page → click EN → goes to `/en/...`

- [ ] **Step 5: Commit any final fixes**

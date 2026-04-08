# i18n Infrastructure for WasteConnection

## Goal
Add multi-language support (NL/EN/DE) using Astro's native i18n routing. Dutch content stays as-is. EN/DE are stubs that fall back to Dutch until real translations are provided.

## URL Strategy
- `/` `/diensten` `/over-ons` `/contact` — Dutch (default, no prefix)
- `/en/` `/en/diensten` `/en/over-ons` `/en/contact` — English
- `/de/` `/de/diensten` `/de/over-ons` `/de/contact` — German

Same slugs across all languages. Can translate slugs later for SEO if needed.

## File Structure

```
src/
  i18n/
    translations/
      nl.ts          # All Dutch strings extracted from pages/components
      en.ts          # Stubs — spreads nl, overrides nothing yet
      de.ts          # Stubs — spreads nl, overrides nothing yet
    index.ts         # t(), useTranslations(), localePath(), getLocale()
  pages/
    index.astro      # Dutch (default) — uses t('nl', ...)
    diensten.astro
    over-ons.astro
    contact.astro
    en/              # Thin wrappers (~5 lines each)
      index.astro
      diensten.astro
      over-ons.astro
      contact.astro
    de/              # Same thin wrappers
      index.astro
      diensten.astro
      over-ons.astro
      contact.astro
```

## Translation File Shape

Nested objects with dot-path access:

```ts
// nl.ts
export default {
  nav: {
    home: 'Home',
    diensten: 'Diensten',
    overOns: 'Over Ons',
    contact: 'Contact',
  },
  home: {
    hero: {
      title: 'Het collectief dat u sterker maakt',
      subtitle: '...',
      ctaText: 'Neem Contact Op',
      secondaryCtaText: 'Bekijk Diensten',
    },
    services: {
      label: 'Onze Diensten',
      heading: 'Vier afvalstromen, een collectief',
      description: '...',
      viewAll: 'Alle Diensten Bekijken',
      items: [
        { number: '01', title: 'Afvalhout', description: '...' },
        // ...
      ],
    },
    // ...
  },
  // ...
} as const;
```

## i18n Utility (`src/i18n/index.ts`)

```ts
type Locale = 'nl' | 'en' | 'de';

// t(locale, 'home.hero.title') — deep key lookup, falls back to nl
function t(locale: Locale, key: string): string

// localePath(locale, '/diensten') → '/en/diensten' or '/diensten'
function localePath(locale: Locale, path: string): string

// getLocale(Astro) — derives locale from URL
function getLocale(astro: AstroGlobal): Locale

// getAlternateUrls(Astro) — returns hreflang alternates
function getAlternateUrls(astro: AstroGlobal): { locale: string; url: string }[]
```

## Component Changes

All components receive `locale` prop:
- **Layout.astro** — `lang={locale}`, `og:locale` dynamic, adds `<link rel="alternate" hreflang="...">` tags
- **Header.astro** — nav labels from `t()`, language switcher (NL/EN/DE), links use `localePath()`
- **Footer.astro** — all labels from `t()`, links use `localePath()`
- **Hero.astro** — already prop-driven, no change needed (text comes from page)
- **Stats.astro** — labels from `t()`
- **Testimonials.astro** — content from `t()`
- **CTA.astro** — text from `t()`

## Language Switcher

In Header, after nav links (desktop) and at top of mobile menu:
- Three text links: NL | EN | DE
- Active locale is bold/highlighted
- Links to same page path in other locale
- Compact, no flags (cleaner B2B look)

## SEO

- `<html lang="nl|en|de">`
- `<meta property="og:locale" content="nl_NL|en_US|de_DE">`
- `<link rel="alternate" hreflang="nl" href="...">` for all 3 locales + `x-default`
- Sitemap generates all locale URLs
- Canonical URL per locale

## Astro Config

```js
export default defineConfig({
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'en', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

## What's NOT in scope
- Actual EN/DE translations (stubs only)
- Translated URL slugs
- Language detection/redirect
- Cookie/localStorage language preference

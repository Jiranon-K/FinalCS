# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Person Tracking & Facial Recognition System** built with Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, and DaisyUI. The application focuses on tracking people in classroom environments using facial recognition technology.

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Build & Production
npm run build        # Create production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint checks
```

## Architecture

### State Management Pattern

This project uses **React Context API** for global state management with three main contexts:

1. **ThemeContext** ([src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx))
   - Manages DaisyUI theme selection (35 total themes)
   - 21 light themes: light, cupcake, bumblebee, emerald, corporate, retro, valentine, garden, lofi, pastel, fantasy, wireframe, cmyk, autumn, acid, lemonade, winter, nord, sunset, caramellatte, silk
   - 14 dark themes: dark, synthwave, cyberpunk, halloween, forest, aqua, black, luxury, dracula, business, night, coffee, dim, abyss
   - Persists theme to localStorage
   - Updates `data-theme` attribute on `<html>` element
   - Provides `isMounted` flag to prevent hydration mismatches

2. **LocaleContext** ([src/i18n/LocaleContext.tsx](src/i18n/LocaleContext.tsx))
   - Handles bilingual support (Thai/English)
   - Default locale: Thai (`th`)
   - Provides type-safe translations via the `t` object
   - Persists locale to localStorage
   - Translation files: [src/i18n/locales/th.json](src/i18n/locales/th.json) and [src/i18n/locales/en.json](src/i18n/locales/en.json)

3. **ToastContext** ([src/contexts/ToastContext.tsx](src/contexts/ToastContext.tsx))
   - Toast notification system with auto-dismiss
   - Supports types: success, error, warning, info
   - Default duration: 3000ms
   - Methods: `showToast()`, `hideToast()`, `clearAllToasts()`

### Context Provider Hierarchy

The root layout wraps the app in this specific order (from outer to inner):

```tsx
<ThemeProvider>
  <LocaleProvider>
    <ToastProvider>
      <Drawer>{children}</Drawer>
      <ToastContainer />
    </ToastProvider>
  </LocaleProvider>
</ThemeProvider>
```

This ordering is important because inner contexts may depend on outer ones.

### Custom Hooks Pattern

Access contexts via custom hooks located in [src/hooks/](src/hooks/):
- `useTheme()` - Access theme state and setter
- `useLocale()` - Access locale and translations
- `useToast()` - Access toast notification functions

### Layout Structure

The application uses a **drawer/sidebar pattern**:
- **Drawer** ([src/app/components/Drawer.tsx](src/app/components/Drawer.tsx)): Responsive container
  - Desktop (lg+): Sidebar always visible
  - Mobile: Toggle button with overlay
  - Uses DaisyUI drawer component
- **Sidebar** ([src/app/components/Sidebar.tsx](src/app/components/Sidebar.tsx)): Navigation menu
  - Adaptive width: 24 units when collapsed, 72 units when open

### Internationalization (i18n)

- Locale files define nested translation objects
- Access translations via `t.section.key` (e.g., `t.settings.title`)
- When adding new UI text:
  1. Add keys to both [src/i18n/locales/en.json](src/i18n/locales/en.json) and [src/i18n/locales/th.json](src/i18n/locales/th.json)
  2. Use `useLocale()` hook and access via `t` object
  3. Maintain parallel structure in both files

## TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled
- Target: ES2017
- Use path aliases for imports: `import { Component } from '@/components/Component'`

## Styling

- **TailwindCSS v4** with **DaisyUI** component library
- Font: Noto Sans Thai (supports Thai and Latin scripts)
- Theme switching via `data-theme` attribute on `<html>` element
- DaisyUI provides pre-built components (btn, drawer, card, etc.)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── components/         # Route-specific components (Drawer, Sidebar)
│   ├── settings/          # Settings page route
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   ├── settings/          # Settings-related components
│   └── toast/             # Toast notification components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization
│   └── locales/           # Translation JSON files
└── types/                 # TypeScript type definitions
```

## Key Implementation Patterns

### Client Components
Most components use `'use client'` directive because they:
- Access browser APIs (localStorage, document)
- Use React hooks (useState, useEffect, useContext)
- Handle user interactions

### Hydration Safety
When using localStorage or browser APIs:
1. Check `typeof window !== 'undefined'` before access
2. Use `useEffect` for client-side-only initialization
3. Use `isMounted` flag from ThemeContext when needed to prevent hydration mismatches

### FontAwesome Configuration
FontAwesome is configured to prevent duplicate CSS injection:
```tsx
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
```

## Adding New Features

### Adding a New Page
1. Create route in `src/app/[route-name]/page.tsx`
2. Add navigation link in [src/app/components/Sidebar.tsx](src/app/components/Sidebar.tsx)
3. Add translation keys for the page in both locale files

### Adding a New Context
1. Create context in `src/contexts/[Name]Context.tsx`
2. Add provider to [src/app/layout.tsx](src/app/layout.tsx) in the correct hierarchy
3. Create custom hook in `src/hooks/use[Name].ts`
4. Export types in `src/types/` if needed

### Adding Translations
1. Add keys to [src/i18n/locales/en.json](src/i18n/locales/en.json)
2. Add corresponding keys to [src/i18n/locales/th.json](src/i18n/locales/th.json)
3. Maintain consistent structure across both files
4. Access via `t.section.key` pattern

## Important Notes

- The project defaults to Thai language (`th`) as the primary locale
- Theme persistence uses localStorage and DOM attributes
- All context providers implement localStorage persistence for user preferences
- The drawer is open by default on desktop (`defaultChecked` on drawer toggle)

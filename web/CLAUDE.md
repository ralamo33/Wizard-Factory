# web

A React, TanStack Router and Tailwind app with strict boundary and ESLint rules. The rules below are enforced by `eslint.config.ts` and `.dependency-cruiser.json` unless marked as judgment.

## Where code goes

- **`api/`** owns all trpc and server calls: the trpc client and `queryClient`.
- **`domainViews/<context>/`** displays domain objects, typically ones retrieved from api calls. Named after the backend bounded context (`identity`). `index.ts` is its public API; `queries.ts` is its only door to `api/`. It shows `@wizard/domain` objects and never defines schemas.
- **`genericComponents/`** holds common components like buttons and cards: the beginning of a design system. Imports nothing from `web/src` or `@wizard/*`.
- **`contextsGlobal/`** holds app-wide React contexts.
- **`routes/`** holds TanStack file routes. A route file loads data and composes sections; no real markup.
- **`routes/-<route>/`** holds code used only by that route (`-home` for `index.tsx`); the router ignores `-` folders. `-root` belongs to `__root.tsx` and is the only `-` folder other routes may import.

Placement: used by one route → its `-` folder. Displays a domain object → `domainViews/<context>`. Display-only and reused → `genericComponents`. Route code has one parent: a file in a `-` folder may have only 1 importer (`-root` files up to 3). A second importer means it's shared, so move it to `genericComponents` or `domainViews`, or up into the shared parent.

## Design system

- When the same design is used several times, move it into `genericComponents` or add a variant to an existing component, instead of repeating Tailwind class strings. Judgment.
- Props declare intent, not classes: `size: "small" | "medium" | "large"`, `theme: "primary"`. Judgment.
- Keep designs consistent; `genericComponents` should gradually evolve into the design system.
- Colors come only from the semantic tokens in `src/index.css` (`bg-primary`, `text-muted-foreground`). Palette classes (`text-slate-400`, `bg-white`) and raw colors (hex, `rgb()`, `oklch()`) are banned. The one exception is data visualization: a file named `*Chart.tsx` may use the palette, so charts must use the `Chart` suffix.

## Data down, events up

Containers are route files and `*Section.tsx` files. Everything else is display-only.

- Only containers import data (`queries.ts`, data files in `-` folders, a `domainViews` `index.ts`) or `contextsGlobal`.
- Display components receive data as props and report events through `on*` props, passed `handle*` functions.
- React Query hooks live only in `domainViews/*/queries.ts`.
- `genericComponents` holds no containers.

Why: every dependency is visible in a component's props, so display components stay pure, testable and movable.

## Sharing state

Walk this list top to bottom and stop at the first that fits:

1. Local state, lifted to the nearest container.
2. Composition: pass JSX as `children` instead of drilling props.
3. Server data: the Query cache, via `queries.ts` hooks.
4. Shareable UI state (filters, tabs, pagination): URL search params.
5. Dependencies (`queryClient`, session, feature flags): router context.
6. Parts of one component sharing state: a `*Context.tsx` in `genericComponents`.
7. App-wide client state (toasts, theme toggle): `contextsGlobal`.

zustand, jotai and redux are banned. `createContext` is allowed only in `contextsGlobal` and `genericComponents`.

A context file exports only `XProvider` and `useX`. One context holds state and actions together. The provider value is memoised. `useX` throws when the provider is missing; context files are the only place `throw` is allowed.

## Lists

- Filtering, sorting and paging always belong to the server; the client never sorts or slices domain lists.
- Lists of domain data use `genericComponents/dataTable.tsx`. Raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` and `<caption>` are banned outside `genericComponents`.
- List state lives in URL search params, validated with the domain list query schema (`validateSearch: listUsersQuerySchema`).

## Forms

TanStack Form, validated with the schema from `@wizard/domain`; `web` never imports `zod`. Fields are `genericComponents/textField.tsx`, which requires a `label`. Raw `<input>`, `<select>` and `<textarea>` are banned outside `genericComponents`. Never disable submit for invalid input: submit shows the errors and focuses the first invalid field.

## Accessibility

- Follow all accessibility guidelines. Give key components, especially ones used in e2e tests, proper roles and accessible names.
- `jsx-a11y` strict lints the source. Every e2e test runs axe (WCAG 2.2 AA) through `e2e/fixtures.ts`, so specs import `test` from there. Lint can't see contrast or composed markup, and axe can't see code no test renders, so keep both.
- Animations respect `prefers-reduced-motion`.

## Animation

- Use the `motion` skill whenever making animations.
- Motion (`motion/react`) is the only animation library; the others are banned.
- Durations, easings, springs and staggers come only from the motion tokens: `src/index.css` for CSS, `genericComponents/motionTokens.ts` for Motion. Raw durations, `cubic-bezier()`, literal spring values and arbitrary `duration-[…]`/`ease-[…]` are banned.
- Animate the values the `motion` skill's performance guidance recommends. Judgment.
- CSS animations use `motion-safe:`; Motion respects reduced motion through `MotionConfig` in `main.tsx`.

## When to animate

- By default do not animate
- Animate to direct attention
- Animate to react to user inputs, these are typically routine actions that should recieve routine animations, such as opening a Drawer
- Animate for highly emotional moments, these should recieve special animations

## E2E locators

Use the first that fits:

1. `getByRole(role, { name, exact: true })`: buttons, links, headings and other semantic controls.
2. `getByLabel(text, { exact: true })`: form fields.
3. `getByText(text, { exact: true })`: non-interactive content and assertions.
4. `getByPlaceholder` / `getByAltText`: when 1–3 don't fit.
5. Test IDs: banned. Ask before adding one.

Lint bans raw CSS/XPath locators and `nth()`/`first()`, and requires `exact: true`. Choosing between steps is judgment.

---
name: motion
description: >
  Animation skill for Motion (motion/react, prev Framer Motion) and CSS animation in the web app, plus this repo's motion tokens and lint rules. Provides animation best practices for React and Radix, covering both Motion and plain CSS and when to choose each. Use whenever adding, changing or reviewing any animation, transition, enter/exit, layout or reorder animation, stagger, spring, gesture, hover effect, scroll effect or looping animation, including Tailwind CSS transitions and keyframes; when fixing slow or janky animations; or when upgrading Motion.
argument-hint: "[question, e.g. 'make accordion', 'animate this list', 'fix animation performance on the homepage', 'upgrade']"
---

# Motion

Animation for the web, done properly.

- [Animation best practices](best-practices/index.md): "Animate this button", "Fade this layer in". Platform-specific guidance for vanilla JS, React and Radix, covering both Motion and plain CSS, and when to choose each.

## Upgrading Motion

1. **Read the installed version first.** Check `package.json` for `motion`,
   `framer-motion` or `motion-v`. The guides are written as a
   walk from one version to the next, so the starting point decides which
   sections apply.
2. Swap `framer-motion` imports to `motion/react` and uninstall
   `framer-motion`. They must never both be installed.

## wizard-factory web rules

Follow Motion's guidance above and in `best-practices/`. These are the
constraints this repo adds on top, alongside `web/CLAUDE.md`.

### Library

- Motion is the only animation library. Lint bans `framer-motion`, `gsap`,
  `react-spring`, `react-transition-group` and `@formkit/auto-animate`.
- Import from `motion/react`.
- `<MotionConfig reducedMotion="user">` already wraps the app in
  `web/src/main.tsx`. Don't add another.

### Tokens and the `wizard/motion-tokens` lint rule

All timing comes from `web/src/genericComponents/motionTokens.ts`:

| Token                                         | Value                                                  |
| --------------------------------------------- | ------------------------------------------------------ |
| `spring.snappy`                               | `{ type: "spring", visualDuration: 0.2, bounce: 0 }`   |
| `spring.smooth`                               | `{ type: "spring", visualDuration: 0.35, bounce: 0 }`  |
| `spring.bouncy`                               | `{ type: "spring", visualDuration: 0.4, bounce: 0.3 }` |
| `duration.instant` / `fast` / `base` / `slow` | 0.1 / 0.15 / 0.25 / 0.4 s                              |
| `ease.standard` / `enter` / `exit`            | cubic-bezier arrays                                    |
| `staggerStep`                                 | 0.15 s                                                 |

- Movement, scale and layout transitions use a `spring` token.
- Opacity-only fades can use `duration` with `ease.enter` (in) or
  `ease.exit` (out).
- CSS equivalents live in `web/src/index.css`: `ease-standard`,
  `ease-enter`, `ease-exit`, `duration-instant`/`fast`/`base`/`slow`, and
  named `--animate-*` loops.

The lint rule bans, in Motion transitions, literal `duration`, `delay`, `ease`
and spring values (`type`, `bounce`, `visualDuration`, `stiffness`, `damping`,
`mass`). In CSS it bans numeric or arbitrary Tailwind durations, delays and
easings, `cubic-bezier(`, literal time strings in style animation keys, and
`animate-*` classes without `motion-safe:` or `motion-reduce:`. Computed values
such as `i * staggerStep` are fine. If no token fits, ask before adding one.

### Reduced motion and axe

- Every e2e test runs axe. Content must end visible and readable with no
  animation at all.
- An animation must never hide focusable content from keyboard users: no
  links, buttons or fields left at `opacity: 0` or off-screen while they can
  take focus.

### Where the code goes

- Display components stay display-only: they take the state that drives an
  animation as props and report events through `on*` props.
- Animation state is local UI state in the nearest container. It never goes
  in `contextsGlobal`.
- A pattern used more than once becomes a `genericComponents` component with
  intent props (`variant: "fade" | "rise"`), not copied transition objects.

### Examples

```tsx
import { motion } from "motion/react";
import type { JSX, ReactNode } from "react";

import { duration, ease, spring } from "./motionTokens.ts";

const variants = {
  fade: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: duration.base, ease: ease.enter } },
  },
  rise: {
    hidden: { opacity: 0, y: 16 },
    shown: { opacity: 1, y: 0, transition: spring.smooth },
  },
};

type RevealProps = Readonly<{ variant: "fade" | "rise"; children: ReactNode }>;

export const Reveal = ({ variant, children }: RevealProps): JSX.Element => (
  <motion.div variants={variants[variant]} initial="hidden" animate="shown">
    {children}
  </motion.div>
);
```

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      key="panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: spring.smooth }}
      exit={{ opacity: 0, y: 8, transition: spring.snappy }}
    />
  )}
</AnimatePresence>
```

```tsx
import { motion, stagger } from "motion/react";

import { spring, staggerStep } from "./motionTokens.ts";

const list = { hidden: {}, shown: { transition: { delayChildren: stagger(staggerStep) } } };
const item = { hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0, transition: spring.smooth } };
```

```tsx
<motion.span layoutId={indicatorId} transition={spring.snappy} />
<motion.button whileTap={{ scale: 0.95 }} transition={spring.bouncy} />
```

```tsx
<a className="transition-colors duration-fast ease-standard hover:text-primary" />
<span className="motion-safe:animate-gem-pulse" />
```

### Common mistakes

- Literal `duration: 0.3`, `ease: "easeOut"` or `bounce: 0.2` instead of a
  token.
- Omitting `transition`, so Motion's defaults apply instead of the tokens.
- `animate-*` without `motion-safe:`.
- Putting animation state in a context or a store.

### References

- https://github.com/motiondivision/ai-kit (official skill text above)
- https://motion.dev/docs/react-animation
- https://motion.dev/docs/react-transitions
- https://motion.dev/docs/stagger
- https://motion.dev/docs/react-animate-presence
- https://motion.dev/docs/react-layout-animations
- https://motion.dev/docs/react-motion-config
- https://motion.dev/docs/react-accessibility
- https://motion.dev/docs/react-gestures
- https://motion.dev/docs/performance

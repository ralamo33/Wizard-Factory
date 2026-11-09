import type {User} from '@wizard/domain'

type Order = Readonly<{name: string, gem: string, spren: string, surges: readonly [string, string], color: string}>

const orders: readonly Order[] = [
  {name: 'Windrunners', gem: 'Sapphire', spren: 'Honorspren', surges: ['Adhesion', 'Gravitation'], color: '#3b82f6'},
  {name: 'Skybreakers', gem: 'Smokestone', spren: 'Highspren', surges: ['Gravitation', 'Division'], color: '#94a3b8'},
  {name: 'Dustbringers', gem: 'Ruby', spren: 'Ashspren', surges: ['Division', 'Abrasion'], color: '#ef4444'},
  {name: 'Edgedancers', gem: 'Diamond', spren: 'Cultivationspren', surges: ['Abrasion', 'Progression'], color: '#f8fafc'},
  {name: 'Truthwatchers', gem: 'Emerald', spren: 'Mistspren', surges: ['Progression', 'Illumination'], color: '#10b981'},
  {name: 'Lightweavers', gem: 'Garnet', spren: 'Cryptics', surges: ['Illumination', 'Transformation'], color: '#be123c'},
  {name: 'Elsecallers', gem: 'Zircon', spren: 'Inkspren', surges: ['Transformation', 'Transportation'], color: '#22d3ee'},
  {name: 'Willshapers', gem: 'Amethyst', spren: 'Reachers', surges: ['Transportation', 'Cohesion'], color: '#a855f7'},
  {name: 'Stonewards', gem: 'Topaz', spren: 'Peakspren', surges: ['Cohesion', 'Tension'], color: '#f59e0b'},
  {name: 'Bondsmiths', gem: 'Heliodor', spren: 'The Three', surges: ['Tension', 'Adhesion'], color: '#facc15'},
]

const immortalWords: readonly string[] = ['Life before death.', 'Strength before weakness.', 'Journey before destination.']

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const glyphPoints = (count: number, radius: number): string =>
  Array.from({length: count}, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`
  }).join(' ')

const orderSigil = (): string => `
<svg viewBox="0 0 100 100" class="h-full w-full">
  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="0.6" stroke-dasharray="2 3" />
  <polygon points="${glyphPoints(10, 40)}" fill="none" stroke="currentColor" stroke-width="0.8" />
  <polygon points="${glyphPoints(5, 30)}" fill="none" stroke="currentColor" stroke-width="0.5" />
  ${orders.map((order, i) => {
    const angle = (i / orders.length) * Math.PI * 2 - Math.PI / 2
    return `<circle cx="${(50 + 40 * Math.cos(angle)).toFixed(2)}" cy="${(50 + 40 * Math.sin(angle)).toFixed(2)}" r="3.2" fill="${order.color}" class="gem" style="--gem:${order.color}" />`
  }).join('')}
  <circle cx="50" cy="50" r="8" fill="#e0f2fe" class="gem" style="--gem:#7dd3fc" />
</svg>`

const spheres = (): string =>
  Array.from({length: 28}, (_, i) => {
    const order = orders[i % orders.length]
    const size = 4 + ((i * 7) % 9)
    return `<span class="sphere" style="--c:${order?.color ?? '#7dd3fc'};left:${String((i * 37) % 100)}%;width:${String(size)}px;height:${String(size)}px;animation-delay:-${String((i * 1.7) % 18)}s;animation-duration:${String(14 + ((i * 5) % 12))}s"></span>`
  }).join('')

const orderCard = (order: Order): string => `
<article class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition duration-500 hover:-translate-y-2 hover:border-[var(--c)] hover:shadow-[0_0_40px_-8px_var(--c)]" style="--c:${order.color}">
  <div class="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--c)] opacity-10 blur-3xl transition duration-500 group-hover:opacity-40"></div>
  <div class="mb-4 flex items-center gap-3">
    <span class="gem inline-block h-4 w-4 rotate-45 bg-[var(--c)]" style="--gem:${order.color}"></span>
    <span class="text-xs tracking-[0.3em] text-white/50 uppercase">${order.gem}</span>
  </div>
  <h3 class="font-display text-2xl text-white">${order.name}</h3>
  <p class="mt-1 text-sm text-white/60 italic">Bonded to ${order.spren}</p>
  <div class="mt-5 flex flex-wrap gap-2">
    ${order.surges.map((surge) => `<span class="rounded-full border border-[var(--c)]/40 px-3 py-1 text-xs text-white/80">${surge}</span>`).join('')}
  </div>
</article>`

const squireCard = (user: User, index: number): string => {
  const order = orders[index % orders.length]
  return `
<li class="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md transition hover:border-[var(--c)] hover:bg-white/[0.07]" style="--c:${order?.color ?? '#7dd3fc'}">
  <span class="gem flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--c)]/20 font-display text-lg text-white ring-1 ring-[var(--c)]" style="--gem:${order?.color ?? '#7dd3fc'}">${escapeHtml(user.name.slice(0, 1))}</span>
  <div class="min-w-0">
    <p class="truncate font-display text-lg text-white">${escapeHtml(user.name)}</p>
    <p class="text-xs tracking-widest text-white/50 uppercase">${String(user.age)} years · Squire of the ${order?.name ?? 'Radiants'}</p>
  </div>
</li>`
}

export const page = (users: readonly User[]): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Welcome to the Knights Radiant</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11"></script>
<style type="text/tailwindcss">
  @theme {
    --font-display: "Cinzel", serif;
    --font-title: "Cinzel Decorative", serif;
    --font-body: "Cormorant Garamond", serif;
  }
  .gem { filter: drop-shadow(0 0 6px var(--gem)) drop-shadow(0 0 14px var(--gem)); animation: pulse-gem 4s ease-in-out infinite; }
  @keyframes pulse-gem { 50% { filter: drop-shadow(0 0 2px var(--gem)) drop-shadow(0 0 22px var(--gem)); } }
  .sphere { position: absolute; bottom: -20px; border-radius: 9999px; background: radial-gradient(circle at 35% 35%, white, var(--c) 45%, transparent 70%); box-shadow: 0 0 12px var(--c), 0 0 28px var(--c); animation: rise linear infinite; opacity: 0.8; }
  @keyframes rise { 0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: 0.9; } 50% { transform: translate(30px, -55vh); } 100% { transform: translate(-20px, -110vh); opacity: 0; } }
  .lightning { animation: flash 9s infinite; }
  @keyframes flash { 0%, 91%, 100% { opacity: 0; } 92% { opacity: 0.55; } 93% { opacity: 0.1; } 94% { opacity: 0.7; } 96% { opacity: 0; } }
  .stormlight { background: linear-gradient(90deg, #e0f2fe, #7dd3fc, #ffffff, #38bdf8, #e0f2fe); background-size: 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 6s linear infinite; text-shadow: 0 0 40px rgba(125, 211, 252, 0.35); }
  @keyframes shimmer { to { background-position: 300% 0; } }
  .spin-slow { animation: spin 80s linear infinite; }
  .spin-rev { animation: spin 120s linear infinite reverse; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .rise-in { animation: rise-in 1.2s cubic-bezier(.2,.7,.2,1) both; }
  @keyframes rise-in { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
</style>
</head>
<body class="min-h-screen overflow-x-hidden bg-[#03060f] font-body text-lg text-slate-200 antialiased">
  <div class="pointer-events-none fixed inset-0 -z-10">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a8a_0%,_#0b1430_40%,_#03060f_75%)]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(56,189,248,0.15),_transparent_55%)]"></div>
    <div class="lightning absolute inset-0 bg-[radial-gradient(ellipse_at_70%_10%,_rgba(224,242,254,0.9),_transparent_50%)]"></div>
    <div class="absolute inset-0 overflow-hidden">${spheres()}</div>
  </div>

  <header class="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
    <div class="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 opacity-60">
      <div class="spin-slow h-full w-full text-sky-300/40">${orderSigil()}</div>
    </div>
    <div class="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(120vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-200/10 spin-rev border-dashed"></div>

    <p class="rise-in relative font-display text-sm tracking-[0.5em] text-sky-200/70 uppercase sm:text-base">The Oathpact is renewed</p>
    <h1 class="rise-in stormlight relative mt-6 font-title text-5xl leading-tight font-bold sm:text-7xl lg:text-8xl" style="animation-delay:.2s">Welcome to the<br />Knights Radiant</h1>
    <p class="rise-in relative mt-8 max-w-2xl text-xl text-slate-300 italic sm:text-2xl" style="animation-delay:.5s">The Everstorm has come. The Desolation returns. Ten Orders stand once more against the dark — and a place among them awaits those who would speak the Words.</p>
    <div class="rise-in relative mt-12 flex flex-col gap-4 sm:flex-row" style="animation-delay:.8s">
      <a href="#ideal" class="rounded-full bg-sky-300 px-8 py-3 font-display tracking-widest text-slate-950 uppercase shadow-[0_0_30px_rgba(125,211,252,0.6)] transition hover:scale-105 hover:bg-white hover:shadow-[0_0_60px_rgba(224,242,254,0.9)]">Speak the Words</a>
      <a href="#orders" class="rounded-full border border-sky-200/40 px-8 py-3 font-display tracking-widest text-sky-100 uppercase backdrop-blur transition hover:border-sky-200 hover:bg-sky-200/10">The Ten Orders</a>
    </div>
    <a href="#ideal" class="absolute bottom-10 animate-bounce text-sky-200/60" aria-label="Scroll down">
      <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
    </a>
  </header>

  <section id="ideal" class="relative px-4 py-32">
    <div class="mx-auto max-w-3xl text-center">
      <p class="font-display text-sm tracking-[0.5em] text-sky-300/70 uppercase">The First Ideal</p>
      <h2 class="mt-4 font-title text-3xl text-white sm:text-4xl">The Immortal Words</h2>
      <div class="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
      <ol class="mt-14 space-y-8">
        ${immortalWords.map((line, i) => `<li class="rise-in font-display text-3xl text-sky-50 sm:text-5xl" style="animation-delay:${String(0.3 * i)}s"><span class="drop-shadow-[0_0_18px_rgba(125,211,252,0.7)]">${line}</span></li>`).join('')}
      </ol>
      <p class="mt-14 text-xl text-slate-400 italic">Every Radiant begins here. What comes after depends on the Order — and on the spren who chooses you.</p>
    </div>
  </section>

  <section id="orders" class="relative px-4 py-24">
    <div class="mx-auto max-w-6xl">
      <div class="text-center">
        <p class="font-display text-sm tracking-[0.5em] text-sky-300/70 uppercase">Ten Orders · Ten Surges</p>
        <h2 class="mt-4 font-title text-3xl text-white sm:text-4xl">Choose Your Path</h2>
        <div class="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
      </div>
      <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        ${orders.map(orderCard).join('')}
      </div>
    </div>
  </section>

  <section id="squires" class="relative px-4 py-24">
    <div class="mx-auto max-w-4xl">
      <div class="text-center">
        <p class="font-display text-sm tracking-[0.5em] text-sky-300/70 uppercase">Sworn in Urithiru</p>
        <h2 class="mt-4 font-title text-3xl text-white sm:text-4xl">Our Newest Squires</h2>
        <div class="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
      </div>
      ${users.length === 0
        ? '<p class="mt-12 text-center text-slate-400 italic">The tower awaits its first squire.</p>'
        : `<ul class="mt-12 grid gap-4 sm:grid-cols-2">${users.map(squireCard).join('')}</ul>`}
    </div>
  </section>

  <footer class="border-t border-white/5 px-4 py-12 text-center">
    <p class="font-display text-xs tracking-[0.4em] text-slate-500 uppercase">Journey before destination, Radiant</p>
  </footer>
</body>
</html>`

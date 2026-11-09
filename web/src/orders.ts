export type Order = Readonly<{
  name: string;
  gem: string;
  spren: string;
  surges: readonly [string, string];
  color: string;
}>;

export const stormlightColor = "#7dd3fc";

export const orders: readonly Order[] = [
  { name: "Windrunners", gem: "Sapphire", spren: "Honorspren", surges: ["Adhesion", "Gravitation"], color: "#3b82f6" },
  { name: "Skybreakers", gem: "Smokestone", spren: "Highspren", surges: ["Gravitation", "Division"], color: "#94a3b8" },
  { name: "Dustbringers", gem: "Ruby", spren: "Ashspren", surges: ["Division", "Abrasion"], color: "#ef4444" },
  { name: "Edgedancers", gem: "Diamond", spren: "Cultivationspren", surges: ["Abrasion", "Progression"], color: "#f8fafc" },
  { name: "Truthwatchers", gem: "Emerald", spren: "Mistspren", surges: ["Progression", "Illumination"], color: "#10b981" },
  { name: "Lightweavers", gem: "Garnet", spren: "Cryptics", surges: ["Illumination", "Transformation"], color: "#be123c" },
  { name: "Elsecallers", gem: "Zircon", spren: "Inkspren", surges: ["Transformation", "Transportation"], color: "#22d3ee" },
  { name: "Willshapers", gem: "Amethyst", spren: "Reachers", surges: ["Transportation", "Cohesion"], color: "#a855f7" },
  { name: "Stonewards", gem: "Topaz", spren: "Peakspren", surges: ["Cohesion", "Tension"], color: "#f59e0b" },
  { name: "Bondsmiths", gem: "Heliodor", spren: "The Three", surges: ["Tension", "Adhesion"], color: "#facc15" },
];

export const orderAt = (index: number): Order | undefined => orders[index % orders.length];

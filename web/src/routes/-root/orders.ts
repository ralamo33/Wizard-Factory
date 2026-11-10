export type Order = Readonly<{
  name: string;
  gem: string;
  spren: string;
  surges: readonly [string, string];
}>;

export const orders: readonly Order[] = [
  { name: "Windrunners", gem: "Sapphire", spren: "Honorspren", surges: ["Adhesion", "Gravitation"] },
  { name: "Skybreakers", gem: "Smokestone", spren: "Highspren", surges: ["Gravitation", "Division"] },
  { name: "Dustbringers", gem: "Ruby", spren: "Ashspren", surges: ["Division", "Abrasion"] },
  { name: "Edgedancers", gem: "Diamond", spren: "Cultivationspren", surges: ["Abrasion", "Progression"] },
  { name: "Truthwatchers", gem: "Emerald", spren: "Mistspren", surges: ["Progression", "Illumination"] },
  { name: "Lightweavers", gem: "Garnet", spren: "Cryptics", surges: ["Illumination", "Transformation"] },
  { name: "Elsecallers", gem: "Zircon", spren: "Inkspren", surges: ["Transformation", "Transportation"] },
  { name: "Willshapers", gem: "Amethyst", spren: "Reachers", surges: ["Transportation", "Cohesion"] },
  { name: "Stonewards", gem: "Topaz", spren: "Peakspren", surges: ["Cohesion", "Tension"] },
  { name: "Bondsmiths", gem: "Heliodor", spren: "The Three", surges: ["Tension", "Adhesion"] },
];

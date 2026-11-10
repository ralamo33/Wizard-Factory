import { z } from "zod";

export const orderSchema = z.enum(
  [
    "Windrunners",
    "Skybreakers",
    "Dustbringers",
    "Edgedancers",
    "Truthwatchers",
    "Lightweavers",
    "Elsecallers",
    "Willshapers",
    "Stonewards",
    "Bondsmiths",
  ],
  { error: "Choose one of the ten orders." },
);

export type Order = z.infer<typeof orderSchema>;

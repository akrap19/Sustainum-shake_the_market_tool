import type { Segment } from "@/lib/types";

/**
 * Curated discovery input.
 *
 * Fully blind discovery ("which UK brands run 20+ food-to-go sites?") is not
 * reliable within the timebox and risks inventing companies, so the pipeline
 * starts from a hand-picked shortlist of candidate multi-site UK operators.
 * Everything downstream (registration, location count, contact, verification,
 * scoring) is then enriched live. This list is labelled `manually-reviewed`.
 */

export interface SeedBrand {
  id: string;
  name: string;
  website: string;
  domain: string;
  segment: Segment;
  sicCodes: string[];
  osmBrand: string;
  personName: string;
  personTitle: string;
}

export const seedBrands: SeedBrand[] = [
  { id: "greggs", name: "Greggs plc", website: "https://www.greggs.co.uk", domain: "greggs.co.uk", segment: "Bakery", sicCodes: ["56103", "47240"], osmBrand: "Greggs", personName: "Roisin Currie", personTitle: "Chief Executive Officer" },
  { id: "pret", name: "Pret A Manger", website: "https://www.pret.co.uk", domain: "pret.co.uk", segment: "Food-to-go", sicCodes: ["56102", "56103"], osmBrand: "Pret A Manger", personName: "Clare Clough", personTitle: "Chief Executive Officer" },
  { id: "caffe-nero", name: "Caffè Nero", website: "https://www.caffenero.com", domain: "caffenero.com", segment: "Coffee", sicCodes: ["56102", "56301"], osmBrand: "Caffè Nero", personName: "Will Stratton-Morris", personTitle: "CEO UK" },
  { id: "gails", name: "Gail's Bakery", website: "https://gails.co.uk", domain: "gails.co.uk", segment: "Bakery", sicCodes: ["56103", "10710"], osmBrand: "Gail's", personName: "Tom Molnar", personTitle: "Chief Executive Officer" },
  { id: "itsu", name: "itsu", website: "https://www.itsu.com", domain: "itsu.com", segment: "Food-to-go", sicCodes: ["56103", "56101"], osmBrand: "itsu", personName: "Julian Metcalfe", personTitle: "Founder" },
  { id: "leon", name: "LEON", website: "https://leon.co", domain: "leon.co", segment: "Food-to-go", sicCodes: ["56103", "56101"], osmBrand: "LEON", personName: "Glenn Edwards", personTitle: "Managing Director" },
  { id: "joe-the-juice", name: "Joe & The Juice", website: "https://www.joejuice.com", domain: "joejuice.com", segment: "Coffee", sicCodes: ["56102", "56103"], osmBrand: "Joe & The Juice", personName: "Thomas Noroxe", personTitle: "Chief Supply Chain Officer" },
  { id: "coffee-1", name: "Coffee#1", website: "https://www.coffee1.co.uk", domain: "coffee1.co.uk", segment: "Coffee", sicCodes: ["56102", "56301"], osmBrand: "Coffee#1", personName: "Bruce Newman", personTitle: "Managing Director" },
  { id: "black-sheep", name: "Black Sheep Coffee", website: "https://leavetheherd.com", domain: "leavetheherd.com", segment: "Coffee", sicCodes: ["56102", "56301"], osmBrand: "Black Sheep Coffee", personName: "Gabriel Shohet", personTitle: "Co-Founder" },
  { id: "tortilla", name: "Tortilla Mexican Grill", website: "https://www.tortilla.co.uk", domain: "tortilla.co.uk", segment: "QSR", sicCodes: ["56101", "56103"], osmBrand: "Tortilla", personName: "Brandon Stephens", personTitle: "Chief Executive Officer" },
];

/**
 * Explicit exclusions. Sustainium's own site lists these among its clients /
 * public testimonials, so they are treated as current customers and dropped.
 * Source: https://www.sustainium.se/ (client + testimonial sections).
 */
export const excludedCustomers: Array<{ name: string; reason: string }> = [
  { name: "Starbucks", reason: "Featured Sustainium testimonial — treat as existing relationship." },
  { name: "Burger King", reason: "Listed as a Sustainium client." },
  { name: "KFC", reason: "Listed as a Sustainium client." },
  { name: "Costa Coffee", reason: "Owned by Coca-Cola HBC, a listed Sustainium client — excluded to avoid conflict." },
];

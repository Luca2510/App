import cardsJson from "./cards.json";
import endingsJson from "./endings.json";
import { DecisionCardsFileSchema, EndingsFileSchema } from "./schema";
import { DecisionCard, Ending } from "../engine/types";

declare const __DEV__: boolean | undefined;
const isDev =
  typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

function loadCards(): DecisionCard[] {
  const result = DecisionCardsFileSchema.safeParse(cardsJson);
  if (result.success) return result.data as DecisionCard[];

  if (isDev) {
    throw new Error(`Invalid content/cards.json:\n${result.error.toString()}`);
  }
  // Production: drop nothing silently invalid at the top level — an
  // unparseable content file is not something to play through blind.
  // Individual bad cards are filtered instead, so one bad entry doesn't
  // take down the whole pool.
  const valid: DecisionCard[] = [];
  for (const raw of cardsJson as unknown[]) {
    const single = DecisionCardsFileSchema.element.safeParse(raw);
    if (single.success) valid.push(single.data as DecisionCard);
  }
  return valid;
}

function loadEndings(): Ending[] {
  const result = EndingsFileSchema.safeParse(endingsJson);
  if (result.success) return result.data as Ending[];
  if (isDev) {
    throw new Error(`Invalid content/endings.json:\n${result.error.toString()}`);
  }
  const valid: Ending[] = [];
  for (const raw of endingsJson as unknown[]) {
    const single = EndingsFileSchema.element.safeParse(raw);
    if (single.success) valid.push(single.data as Ending);
  }
  return valid;
}

export const cards: DecisionCard[] = loadCards();
export const endings: Ending[] = loadEndings();
export const STARTING_CARD_ID = "opening_note";

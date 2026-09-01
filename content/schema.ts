import { z } from "zod";

const StatSchema = z.enum(["morality", "wealth", "relationships", "sanity"]);
const CategorySchema = z.enum(["moral", "financial", "relational", "power"]);

const ChoiceSchema = z.object({
  label: z.string().min(1),
  deltas: z.record(StatSchema, z.number().int()).refine((d) => Object.keys(d).length > 0, {
    message: "a choice must move at least one stat",
  }),
  setsFlags: z.array(z.string()).optional(),
  consequenceText: z.string().min(1),
  nextCardId: z.string().optional(),
});

export const DecisionCardSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  prompt: z.string().min(1),
  imageKey: z.string().optional(),
  category: CategorySchema,
  weight: z.number().positive(),
  minTurn: z.number().int().nonnegative().optional(),
  maxTurn: z.number().int().nonnegative().optional(),
  requiredFlags: z.array(z.string()).optional(),
  forbiddenFlags: z.array(z.string()).optional(),
  oneShot: z.boolean().optional(),
  choiceLeft: ChoiceSchema,
  choiceRight: ChoiceSchema,
  isEnding: z.boolean().optional(),
});

export const EndingSchema = z.object({
  id: z.string().min(1),
  triggerStat: StatSchema,
  triggerDirection: z.enum(["floor", "ceiling"]),
  title: z.string().min(1),
  description: z.string().min(1),
  imageKey: z.string().optional(),
  rarity: z.string().min(1),
  requiredFlags: z.array(z.string()).optional(),
});

export const DecisionCardsFileSchema = z.array(DecisionCardSchema);
export const EndingsFileSchema = z.array(EndingSchema);

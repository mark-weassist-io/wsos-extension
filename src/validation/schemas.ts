import { z } from "zod"

export const PersonQuery = z.object({
  person: z.enum(["Michelle", "Dennis"]).optional(),
})

export const SearchQuery = z.object({
  search: z.string().max(200).optional(),
})

export const IdParam = z.object({
  id: z.coerce.number().int().positive(),
})

export const ToggleStepParams = z.object({
  id: z.coerce.number().int().positive(),
  stepDefId: z.coerce.number().int().positive(),
})

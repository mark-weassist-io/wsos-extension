import type { EntityQualityRules } from "./types"

// Reference tables for normalized enum values

export const GENDERS_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_genders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT
)`,
    indexes: [],
  },
  data: {
    required: ["name"],
    unique: ["name"],
    fields: {
      name: { type: "string", minLength: 1, required: true },
    },
    source_priority: {},
    completeness_target: { name: 1.0 },
    merge_strategy: {
      identity_key: "name",
      intra_source_dedup: true,
      conflict_resolution: {},
    },
  },
}

export const ASSIGNMENT_STATUSES_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_assignment_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
)`,
    indexes: [],
  },
  data: {
    required: ["name"],
    unique: ["name"],
    fields: {
      name: { type: "string", minLength: 1, required: true },
    },
    source_priority: {},
    completeness_target: { name: 1.0 },
    merge_strategy: {
      identity_key: "name",
      intra_source_dedup: true,
      conflict_resolution: {},
    },
  },
}

export const ASSIGNMENT_TYPES_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_assignment_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
)`,
    indexes: [],
  },
  data: {
    required: ["name"],
    unique: ["name"],
    fields: {
      name: { type: "string", minLength: 1, required: true },
    },
    source_priority: {},
    completeness_target: { name: 1.0 },
    merge_strategy: {
      identity_key: "name",
      intra_source_dedup: true,
      conflict_resolution: {},
    },
  },
}

export const CHECKIN_STATUSES_RULES: EntityQualityRules = {
  schema: {
    ddl: `CREATE TABLE wa_checkin_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
)`,
    indexes: [],
  },
  data: {
    required: ["name"],
    unique: ["name"],
    fields: {
      name: { type: "string", minLength: 1, required: true },
    },
    source_priority: {},
    completeness_target: { name: 1.0 },
    merge_strategy: {
      identity_key: "name",
      intra_source_dedup: true,
      conflict_resolution: {},
    },
  },
}

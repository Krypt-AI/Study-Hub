/**
 * Version of the built content format. Kept apart from the zod schemas so the app can check
 * it at startup without loading the validation library.
 */
export const CONTENT_SCHEMA_VERSION = 1;

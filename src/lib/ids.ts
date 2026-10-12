/** Random identifier for learner-owned records (UUID v4, also a valid Postgres uuid). */
export function newId(): string {
  return crypto.randomUUID();
}

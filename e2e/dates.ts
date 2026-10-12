/** Local calendar days for tests, matching the app's "YYYY-MM-DD" keys. */
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDaysTo(day: string, amount: number): string {
  const [year = 1970, month = 1, date = 1] = day.split('-').map(Number);
  return todayKey(new Date(year, month - 1, date + amount));
}

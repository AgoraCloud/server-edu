/**
 * Adds days to the given date
 * @param currentDate the current date
 * @param days the number of days to add, defaults to 1
 */
export function addDays(currentDate: Date, days = 1) {
  const newDate = new Date(currentDate);
  newDate.setDate(currentDate.getDate() + days);
  return newDate;
}

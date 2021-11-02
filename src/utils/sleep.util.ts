/**
 * Sleeps for the specified amount of milliseconds
 * (from https://stackoverflow.com/a/46900495/6214781)
 * @param milliseconds the amount of milliseconds to sleep
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

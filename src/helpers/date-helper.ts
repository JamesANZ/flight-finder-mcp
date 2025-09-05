export class DateHelper {
  /**
   * Generate all dates for a given month
   */
  static generateMonthDates(month: string): string[] {
    const [year, monthNum] = month.split("-").map(Number);
    const dates: string[] = [];

    // Get the first day of the month
    const firstDay = new Date(year, monthNum - 1, 1);
    // Get the last day of the month
    const lastDay = new Date(year, monthNum, 0);

    // Generate all dates in the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthNum - 1, day);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  }

  /**
   * Check if a date is a weekend
   */
  static isWeekend(date: string): boolean {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Get day name from date
   */
  static getDayName(date: string): string {
    return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
  }

  /**
   * Format date for display
   */
  static formatDate(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Get month name from date
   */
  static getMonthName(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", { month: "long" });
  }

  /**
   * Check if date is in the future
   */
  static isFutureDate(date: string): boolean {
    const dateObj = new Date(date);
    const now = new Date();
    return dateObj > now;
  }

  /**
   * Get days until date
   */
  static getDaysUntil(date: string): number {
    const dateObj = new Date(date);
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get next business day
   */
  static getNextBusinessDay(date: string): string {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    while (this.isWeekend(nextDay.toISOString().split("T")[0])) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay.toISOString().split("T")[0];
  }

  /**
   * Get previous business day
   */
  static getPreviousBusinessDay(date: string): string {
    let prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);

    while (this.isWeekend(prevDay.toISOString().split("T")[0])) {
      prevDay.setDate(prevDay.getDate() - 1);
    }

    return prevDay.toISOString().split("T")[0];
  }
}

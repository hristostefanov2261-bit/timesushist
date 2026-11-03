// Calculation utilities for financial data

/**
 * Converts hours and minutes to decimal hours
 */
export function timeToDecimalHours(hours: number, minutes: number): number {
  return hours + minutes / 60;
}

/**
 * Calculates base earnings with precision
 */
export function calculateBaseEarnings(
  hours: number,
  minutes: number,
  hourlyRate: number
): number {
  const decimalHours = timeToDecimalHours(hours, minutes);
  const earnings = decimalHours * hourlyRate;
  return Math.round(earnings * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculates additional rate earnings
 */
export function calculateAdditionalRateEarnings(
  hours: number,
  hourlyRate: number,
  coefficient: number,
  fixedAmount: number = 0
): number {
  const earnings = hours * hourlyRate * coefficient + fixedAmount;
  return Math.round(earnings * 100) / 100;
}

/**
 * Calculates total shift earnings
 */
export function calculateTotalEarnings(
  baseEarnings: number,
  additionalEarnings: number = 0,
  bonuses: number = 0,
  deductions: number = 0
): number {
  const total = baseEarnings + additionalEarnings + bonuses - deductions;
  return Math.round(total * 100) / 100;
}

/**
 * Calculates remaining to receive
 */
export function calculateRemaining(
  totalEarnings: number,
  totalPaid: number
): number {
  const remaining = totalEarnings - totalPaid;
  return Math.round(remaining * 100) / 100;
}

/**
 * Formats currency value
 */
export function formatCurrency(value: number, currency: string = 'PLN'): string {
  const formatted = value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

/**
 * Formats time display
 */
export function formatTime(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

/**
 * Formats date based on user preference
 */
export function formatDate(dateString: string, format: string = 'DD.MM.YYYY'): string {
  const date = new Date(dateString + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default: // DD.MM.YYYY
      return `${day}.${month}.${year}`;
  }
}

/**
 * Gets day name in Russian
 */
export function getDayNameRu(dateString: string): string {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const date = new Date(dateString + 'T00:00:00');
  return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

/**
 * Gets month name in Russian
 */
export function getMonthNameRu(date: Date): string {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  return months[date.getMonth()];
}

/**
 * Checks if date is in the first half of month (1-15)
 */
export function isFirstHalf(day: number): boolean {
  return day <= 15;
}

/**
 * Gets period name for half-month period
 */
export function getHalfMonthPeriodName(date: Date): string {
  const day = date.getDate();
  const month = getMonthNameRu(date);
  const year = date.getFullYear();

  if (isFirstHalf(day)) {
    return `1–15 ${month.toLowerCase()} ${year}`;
  } else {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return `16–${lastDay} ${month.toLowerCase()} ${year}`;
  }
}

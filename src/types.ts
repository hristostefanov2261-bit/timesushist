// Types for TimeSushist application

export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  hourly_rate: number; // почасовая ставка по умолчанию
  currency: string; // PLN, EUR, USD, RUB
  date_format: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  minutes: number;
  hourly_rate: number; // может быть переопределена
  base_earnings: number; // часы * ставка
  total_earnings: number; // base + доп. ставки + премии - удержания
  color: 'blue' | 'orange' | 'green' | 'purple' | 'gray';
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftAdditionalRate {
  id: string;
  shift_id: string;
  name: string; // "Сверхурочная", "Выходная", "Праздничная", "Ночная"
  hours: number;
  coefficient: number; // множитель (1.5, 2)
  fixed_amount: number; // фиксированная доплата
  calculated_amount: number; // часы * ставка * коэффициент + фиксированная
  created_at: string;
}

export interface ShiftBonus {
  id: string;
  shift_id: string;
  name: string; // "Премия", "Чаевые", "Компенсация"
  amount: number;
  type: 'bonus' | 'deduction'; // доплата или удержание
  comment?: string;
  created_at: string;
}

export interface PaymentPeriod {
  id: string;
  user_id: string;
  name: string; // "1–15 октября", "16–31 октября"
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  period_type: 'half_month' | 'full_month' | 'week' | 'custom';
  status: 'open' | 'in_progress' | 'closed' | 'partially_paid' | 'fully_paid';
  total_earnings: number; // сумма всех смен в периоде
  total_paid: number; // сумма всех выплат за период
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  period_id: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: 'cash' | 'bank_transfer' | 'other';
  comment?: string;
  created_at: string;
}

export interface PeriodTemplate {
  id: string;
  user_id: string;
  name: string; // "2/2", "5/2", "6/1"
  work_days: number;
  rest_days: number;
  shift_duration: number; // часов в смене
  hourly_rate: number;
  created_at: string;
}

// Calculated statistics
export interface Statistics {
  total_hours: number;
  total_shifts: number;
  total_earnings: number;
  total_bonuses: number;
  total_paid: number;
  remaining_to_receive: number;
  average_earnings_per_shift: number;
  average_hourly_rate: number;
}

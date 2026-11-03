import { useState, useEffect, useCallback } from 'react';
import type { Shift, Payment, PaymentPeriod, UserSettings } from '../types';

interface DataStore {
  shifts: Shift[];
  payments: Payment[];
  periods: PaymentPeriod[];
  settings: UserSettings | null;
}

const DATA_STORAGE_KEY = 'timesushist_data';
const SETTINGS_STORAGE_KEY = 'timesushist_settings';

export const useDataStore = () => {
  const [data, setData] = useState<DataStore>({
    shifts: [],
    payments: [],
    periods: [],
    settings: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DATA_STORAGE_KEY);
      const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setData((prev) => ({ ...prev, ...parsed }));
      }

      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setData((prev) => ({ ...prev, settings: parsedSettings }));
      }

      // Initialize default periods if none exist
      setData((prev) => {
        if (prev.periods.length === 0) {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split('T')[0];
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0];

          return {
            ...prev,
            periods: [
              {
                id: 'default-month',
                user_id: 'current-user',
                name: `${now.toLocaleString('ru-RU', { month: 'long' })} ${now.getFullYear()}`,
                start_date: monthStart,
                end_date: monthEnd,
                period_type: 'full_month',
                status: 'open',
                total_earnings: 0,
                total_paid: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          };
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual save to localStorage (called explicitly, not automatically)
  const saveData = useCallback(async () => {
    try {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify({
        shifts: data.shifts,
        payments: data.payments,
        periods: data.periods,
      }));
      console.log('✅ Data saved to localStorage:', {
        shifts: data.shifts.length,
        payments: data.payments.length,
        periods: data.periods.length,
      });
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMsg);
      console.error('❌ Failed to save:', err);
      return false;
    }
  }, [data]);

  // Shift operations
  const addShift = useCallback(
    (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
      const newShift: Shift = {
        ...shift,
        id: `shift-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        shifts: [...prev.shifts, newShift],
      }));

      return newShift;
    },
    []
  );

  const updateShift = useCallback(
    (shiftId: string, updates: Partial<Shift>) => {
      setData((prev) => ({
        ...prev,
        shifts: prev.shifts.map((s) =>
          s.id === shiftId
            ? { ...s, ...updates, updated_at: new Date().toISOString() }
            : s
        ),
      }));
    },
    []
  );

  const deleteShift = useCallback(
    (shiftId: string) => {
      setData((prev) => ({
        ...prev,
        shifts: prev.shifts.filter((s) => s.id !== shiftId),
      }));
    },
    []
  );

  // Payment operations
  const addPayment = useCallback(
    async (payment: Omit<Payment, 'id' | 'created_at'>) => {
      const newPayment: Payment = {
        ...payment,
        id: `payment-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        payments: [...prev.payments, newPayment],
      }));

      return newPayment;
    },
    []
  );

  const deletePayment = useCallback(
    async (paymentId: string) => {
      setData((prev) => ({
        ...prev,
        payments: prev.payments.filter((p) => p.id !== paymentId),
      }));
    },
    []
  );

  // Period operations
  const addPeriod = useCallback(
    (period: Omit<PaymentPeriod, 'id' | 'created_at' | 'updated_at'>) => {
      const newPeriod: PaymentPeriod = {
        ...period,
        id: `period-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        periods: [...prev.periods, newPeriod],
      }));

      return newPeriod;
    },
    []
  );

  // Settings operations
  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      setData((prev) => {
        const updated = {
          ...prev,
          settings: prev.settings
            ? { ...prev.settings, ...settings }
            : ({
                id: `settings-${Date.now()}`,
                user_id: 'current-user',
                hourly_rate: settings.hourly_rate || 0,
                currency: settings.currency || 'PLN',
                date_format: settings.date_format || 'DD.MM.YYYY',
                theme: settings.theme || 'light',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as UserSettings),
        };
        return updated;
      });
    },
    []
  );

  // Recalculate period totals based on shifts
  const getPeriodStats = useCallback(
    (periodId: string) => {
      const period = data.periods.find((p) => p.id === periodId);
      if (!period) return { total_earnings: 0, total_paid: 0 };

      const shiftsInPeriod = data.shifts.filter(
        (s) => new Date(s.date) >= new Date(period.start_date) && new Date(s.date) <= new Date(period.end_date)
      );

      const totalEarnings = shiftsInPeriod.reduce((sum, s) => sum + s.total_earnings, 0);
      const totalPaid = data.payments
        .filter((p) => p.period_id === periodId)
        .reduce((sum, p) => sum + p.amount, 0);

      return { total_earnings: totalEarnings, total_paid: totalPaid };
    },
    [data.periods, data.shifts, data.payments]
  );

  // Update period stats
  useEffect(() => {
    setData((prev) => {
      const updated = {
        ...prev,
        periods: prev.periods.map((period) => {
          const { total_earnings, total_paid } = getPeriodStats(period.id);
          const status =
            total_earnings === 0
              ? 'open'
              : total_paid === 0
              ? 'in_progress'
              : total_paid < total_earnings
              ? 'partially_paid'
              : 'fully_paid';

          return {
            ...period,
            total_earnings,
            total_paid,
            status: status as PaymentPeriod['status'],
          };
        }),
      };
      return updated;
    });
  }, [data.shifts, data.payments, getPeriodStats]);

  return {
    data,
    isLoading,
    error,
    addShift,
    updateShift,
    deleteShift,
    addPayment,
    deletePayment,
    addPeriod,
    updateSettings,
    getPeriodStats,
    saveData,
  };
};

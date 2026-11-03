import React, { useState, useMemo } from 'react';
import { Card, Select, Badge } from './UI';
import type { Shift, Payment } from '../types';
import { formatDate } from '../lib/calculations';

interface StatisticsViewProps {
  shifts: Shift[];
  payments: Payment[];
  currency: string;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  shifts,
  payments,
  currency,
}) => {
  const [timeRange, setTimeRange] = useState('month');

  // Filter shifts by time range
  const filteredShifts = useMemo(() => {
    try {
      if (!shifts) return [];
      const now = new Date();

      switch (timeRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return shifts.filter((s) => {
            try {
              return new Date(s.date) >= weekAgo;
            } catch {
              return false;
            }
          });
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          return shifts.filter((s) => {
            try {
              return new Date(s.date) >= monthAgo;
            } catch {
              return false;
            }
          });
        case 'all':
        default:
          return shifts;
      }
    } catch (err) {
      console.error('Error filtering shifts:', err);
      return [];
    }
  }, [shifts, timeRange]);

  // Calculate stats
  const stats = useMemo(() => {
    try {
      if (!filteredShifts || filteredShifts.length === 0) {
        return {
          totalHours: 0,
          totalMinutes: 0,
          totalShifts: 0,
          totalEarnings: 0,
          totalPaid: 0,
          avgPerShift: 0,
          avgHourly: 0,
        };
      }

      const totalHours = filteredShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
      const totalMinutes = filteredShifts.reduce((sum, s) => sum + (s.minutes || 0), 0);
      const totalShifts = filteredShifts.length;
      const totalEarnings = filteredShifts.reduce((sum, s) => sum + (s.total_earnings || 0), 0);
      const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const decimalHours = totalHours + totalMinutes / 60;

      return {
        totalHours,
        totalMinutes,
        totalShifts,
        totalEarnings: Math.max(0, totalEarnings),
        totalPaid: Math.max(0, totalPaid),
        avgPerShift: totalShifts > 0 ? totalEarnings / totalShifts : 0,
        avgHourly: decimalHours > 0 ? totalEarnings / decimalHours : 0,
      };
    } catch (err) {
      console.error('Error calculating stats:', err);
      return {
        totalHours: 0,
        totalMinutes: 0,
        totalShifts: 0,
        totalEarnings: 0,
        totalPaid: 0,
        avgPerShift: 0,
        avgHourly: 0,
      };
    }
  }, [filteredShifts, payments]);

  // Daily breakdown for table
  const dailyBreakdown = useMemo(() => {
    try {
      if (!filteredShifts || filteredShifts.length === 0) return [];

      const dataMap = new Map<string, { earnings: number; hours: number; count: number }>();
      filteredShifts.forEach((shift) => {
        if (shift?.date) {
          const existing = dataMap.get(shift.date) || { earnings: 0, hours: 0, count: 0 };
          dataMap.set(shift.date, {
            earnings: existing.earnings + (shift.total_earnings || 0),
            hours: existing.hours + (shift.hours || 0) + (shift.minutes || 0) / 60,
            count: existing.count + 1,
          });
        }
      });

      return Array.from(dataMap.entries())
        .sort((a, b) => String(b[0]).localeCompare(String(a[0])))
        .slice(0, 10)
        .map(([date, data]) => ({
          date: formatDate(String(date), 'DD.MM'),
          earnings: Math.round(data.earnings * 100) / 100,
          hours: Math.round(data.hours * 100) / 100,
        }));
    } catch (err) {
      console.error('Error preparing daily breakdown:', err);
      return [];
    }
  }, [filteredShifts]);

  // Color distribution
  const colorData = useMemo(() => {
    try {
      if (!filteredShifts || filteredShifts.length === 0) return [];

      const colorMap = new Map<string, number>();
      const colorNames: Record<string, string> = {
        blue: 'Обычные',
        orange: 'Сверхурочные',
        green: 'Выходные',
        purple: 'Праздничные',
        gray: 'Без работы',
      };

      filteredShifts.forEach((shift) => {
        const color = String(shift?.color || 'blue');
        const count = colorMap.get(color) || 0;
        colorMap.set(color, count + 1);
      });

      return Array.from(colorMap.entries())
        .map(([color, count]) => ({
          name: colorNames[color] || color,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);
    } catch (err) {
      console.error('Error preparing color data:', err);
      return [];
    }
  }, [filteredShifts]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card className="sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Статистика</h2>
            <p className="text-sm text-gray-600">Финансовая аналитика</p>
          </div>
        </div>

        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: 'week', label: 'За неделю' },
            { value: 'month', label: 'За месяц' },
            { value: 'all', label: 'Всё время' },
          ]}
        />
      </Card>

      {/* Key Stats - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Часы</p>
          <p className="text-2xl font-bold text-primary">
            {stats.totalHours}:{String(stats.totalMinutes % 60).padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalShifts} смен</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Всего заработано</p>
          <p className="text-2xl font-bold text-success">
            {stats.totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{currency}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Получено</p>
          <p className="text-2xl font-bold text-accent">
            {stats.totalPaid.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{currency}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Остаток</p>
          <p className="text-2xl font-bold text-warning">
            {(stats.totalEarnings - stats.totalPaid).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{currency}</p>
        </Card>
      </div>

      {/* Average Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-primary/5 border-l-4 border-primary">
          <p className="text-xs text-gray-500 uppercase font-semibold">Средняя за смену</p>
          <p className="text-xl font-bold text-primary mt-1">
            {stats.avgPerShift.toFixed(2)} {currency}
          </p>
        </Card>
        <Card className="bg-success/5 border-l-4 border-success">
          <p className="text-xs text-gray-500 uppercase font-semibold">Средняя в час</p>
          <p className="text-xl font-bold text-success mt-1">
            {stats.avgHourly.toFixed(2)} {currency}
          </p>
        </Card>
      </div>

      {/* Daily Breakdown Table */}
      {dailyBreakdown.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Последние дни</h3>
          <div className="space-y-2">
            {dailyBreakdown.map((day) => (
              <div key={day.date} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{day.date}</p>
                  <p className="text-xs text-gray-500">{day.hours.toFixed(1)}ч</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">{day.earnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{currency}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Shift Types Distribution */}
      {colorData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Типы смен</h3>
          <div className="space-y-2">
            {colorData.map((item) => {
              const percentage = ((item.value / stats.totalShifts) * 100).toFixed(0);
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-xs font-semibold text-gray-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.name.includes('Обычные')
                            ? 'bg-blue-500'
                            : item.name.includes('Сверхурочные')
                            ? 'bg-orange-500'
                            : item.name.includes('Выходные')
                            ? 'bg-green-500'
                            : item.name.includes('Праздничные')
                            ? 'bg-purple-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="gray">{item.value}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-primary/5 border-l-4 border-primary">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Итого за период</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Смен отработано:</span>
            <span className="font-semibold">{stats.totalShifts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Часов отработано:</span>
            <span className="font-semibold">
              {stats.totalHours}:{String(stats.totalMinutes % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="border-t border-primary/20 pt-1 mt-1 flex justify-between">
            <span className="text-gray-600">Начислено:</span>
            <span className="font-bold text-primary">{stats.totalEarnings.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Получено:</span>
            <span className="font-bold text-success">{stats.totalPaid.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Задолженость:</span>
            <span className="font-bold text-warning">
              {(stats.totalEarnings - stats.totalPaid).toFixed(2)} {currency}
            </span>
          </div>
        </div>
      </Card>

      {/* No data state */}
      {filteredShifts.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-500">Нет данных для отображения</p>
        </Card>
      )}
    </div>
  );
};

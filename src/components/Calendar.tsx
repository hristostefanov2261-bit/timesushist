import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings, Info } from 'lucide-react';
import { Card, Button } from './UI';
import { formatDate, getMonthNameRu } from '../lib/calculations';
import type { Shift } from '../types';

interface CalendarProps {
  shifts: Shift[];
  onShiftClick: (date: string) => void;
  onSettingsClick: () => void;
  currency: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  shifts,
  onShiftClick,
  onSettingsClick,
  currency,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'half'>('month');
  const [showStats, setShowStats] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get shifts map for quick lookup
  const shiftsMap = new Map<string, Shift>();
  shifts.forEach((shift) => {
    shiftsMap.set(shift.date, shift);
  });

  // Calculate stats for current view
  const getVisibleDates = () => {
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const dates: string[] = [];
      for (let i = 1; i <= lastDay.getDate(); i++) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
      return dates;
    } else {
      // Half-month mode: 1-15 or 16-31
      const lastDay = new Date(year, month + 1, 0).getDate();
      const dates: string[] = [];
      const isFirst = new Date().getDate() <= 15;
      const startDay = isFirst ? 1 : 16;
      const endDay = isFirst ? 15 : lastDay;

      for (let i = startDay; i <= endDay; i++) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
      return dates;
    }
  };

  const visibleDates = getVisibleDates();
  const visibleShifts = visibleDates
    .map((date) => shiftsMap.get(date))
    .filter(Boolean) as Shift[];

  const stats = {
    hours: visibleShifts.reduce((sum, s) => sum + s.hours + s.minutes / 60, 0),
    days: visibleShifts.length,
    earnings: visibleShifts.reduce((sum, s) => sum + s.total_earnings, 0),
  };

  const getCalendarDays = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getShiftColor = (shiftType: string) => {
    const colors = {
      blue: 'bg-accent/20 text-accent border-l-4 border-accent',
      orange: 'bg-warning/20 text-warning border-l-4 border-warning',
      green: 'bg-success/20 text-success border-l-4 border-success',
      purple: 'bg-primary/20 text-primary border-l-4 border-primary',
      gray: 'bg-gray-100 text-gray-600',
    };
    return colors[shiftType as keyof typeof colors] || colors.gray;
  };

  const renderCalendarGrid = () => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
      <div className="space-y-2">
        {/* Header with days of week */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div key={day} className="text-xs font-semibold text-gray-500 text-center py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const shift = shiftsMap.get(dateStr);
            const isToday = new Date().toDateString() === new Date(dateStr).toDateString();

            return (
              <button
                key={dateStr}
                onClick={() => onShiftClick(dateStr)}
                className={`aspect-square p-1.5 rounded-lg border-2 transition-colors ${
                  shift
                    ? getShiftColor(shift.color)
                    : 'border-transparent hover:bg-gray-100'
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex flex-col items-center justify-center h-full text-xs">
                  <div className="font-bold text-xs">{day}</div>
                  {shift && (
                    <>
                      <div className="text-xs font-medium mt-0.5">
                        {shift.hours}:{String(shift.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs font-semibold mt-0.5">
                        {shift.total_earnings.toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card className="sticky top-0 z-40">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">TimeSushist</h1>
              <p className="text-sm text-gray-600">
                {getMonthNameRu(currentDate)} {year}
              </p>
            </div>
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="flex-1">
              Сегодня
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="flex-1"
            >
              Месяц
            </Button>
            <Button
              variant={viewMode === 'half' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('half')}
              className="flex-1"
            >
              Половина
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card>{renderCalendarGrid()}</Card>

      {/* Statistics */}
      {showStats && (
        <Card className="border-l-4 border-primary">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Статистика периода</h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-xs text-gray-600 uppercase font-semibold">Часы</p>
              <p className="text-lg font-bold text-primary">
                {Math.floor(stats.hours)}:{String(Math.round((stats.hours % 1) * 60)).padStart(2, '0')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 uppercase font-semibold">Дни</p>
              <p className="text-lg font-bold text-accent">{stats.days}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 uppercase font-semibold">Доход</p>
              <p className="text-lg font-bold text-success">
                {stats.earnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{currency}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => {
              // TODO: navigate to detailed stats
            }}
          >
            <Info size={14} className="mr-1" />
            Подробнее
          </Button>
        </Card>
      )}
    </div>
  );
};

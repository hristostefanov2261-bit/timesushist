import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from './UI';
import type { PaymentPeriod } from '../types';
import { formatDate } from '../lib/calculations';

interface PeriodsViewProps {
  periods: PaymentPeriod[];
  onAddPeriod: () => void;
  onSelectPeriod: (period: PaymentPeriod) => void;
  currency: string;
}

export const PeriodsView: React.FC<PeriodsViewProps> = ({
  periods,
  onAddPeriod,
  onSelectPeriod,
  currency,
}) => {
  const getStatusBadge = (status: PaymentPeriod['status']) => {
    const statuses = {
      open: { label: 'Открыт', variant: 'primary' as const },
      in_progress: { label: 'В процессе', variant: 'warning' as const },
      closed: { label: 'Завершён', variant: 'gray' as const },
      partially_paid: { label: 'Оплачен частично', variant: 'warning' as const },
      fully_paid: { label: 'Оплачен полностью', variant: 'success' as const },
    };
    return statuses[status] || statuses.open;
  };

  const getRemainingAmount = (period: PaymentPeriod) => {
    return period.total_earnings - period.total_paid;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card className="sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Периоды</h2>
            <p className="text-sm text-gray-600">Расчётные периоды</p>
          </div>
          <Button size="sm" onClick={onAddPeriod}>
            <Plus size={16} className="mr-1" />
            Добавить
          </Button>
        </div>
      </Card>

      {/* Periods List */}
      {periods.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500 mb-4">Нет расчётных периодов</p>
          <Button onClick={onAddPeriod}>Создать первый период</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {periods
            .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
            .map((period) => {
              const remaining = getRemainingAmount(period);
              const statusInfo = getStatusBadge(period.status);

              return (
                <div
                  key={period.id}
                  onClick={() => onSelectPeriod(period)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{period.name}</h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(period.start_date)} – {formatDate(period.end_date)}
                        </p>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Начислено</p>
                        <p className="font-bold text-gray-900">
                          {period.total_earnings.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Получено</p>
                        <p className="font-bold text-success">
                          {period.total_paid.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Остаток</p>
                        <p className={`font-bold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
                          {remaining.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-success h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (period.total_paid / period.total_earnings) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {period.total_paid > 0
                          ? `${((period.total_paid / period.total_earnings) * 100).toFixed(0)}% оплачено`
                          : 'Не оплачено'}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </Card>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

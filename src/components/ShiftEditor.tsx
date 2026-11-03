import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal, Button, Input, Select, Card } from './UI';
import type { Shift } from '../types';
import { calculateBaseEarnings, calculateTotalEarnings, formatDate } from '../lib/calculations';

interface ShiftEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Partial<Shift>) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: Shift;
  defaultHourlyRate: number;
  date: string;
  currency: string;
}

export const ShiftEditor: React.FC<ShiftEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultHourlyRate,
  date,
  currency,
}) => {
  const [formData, setFormData] = useState({
    date,
    hours: initialData?.hours || 8,
    minutes: initialData?.minutes || 0,
    hourly_rate: initialData?.hourly_rate || defaultHourlyRate,
    color: (initialData?.color || 'blue') as 'blue' | 'orange' | 'green' | 'purple' | 'gray',
    comment: initialData?.comment || '',
  });

  const [additionalRates, setAdditionalRates] = useState<
    Array<{ name: string; hours: number; coefficient: number; fixed_amount: number }>
  >(initialData ? [] : []);

  const [bonuses, setBonuses] = useState<
    Array<{ name: string; amount: number; type: 'bonus' | 'deduction' }>
  >(initialData ? [] : []);

  // Update formData when date, initialData, or defaultHourlyRate changes
  useEffect(() => {
    setFormData({
      date,
      hours: initialData?.hours || 8,
      minutes: initialData?.minutes || 0,
      hourly_rate: initialData?.hourly_rate || defaultHourlyRate,
      color: (initialData?.color || 'blue') as 'blue' | 'orange' | 'green' | 'purple' | 'gray',
      comment: initialData?.comment || '',
    });
    setAdditionalRates(initialData ? [] : []);
    setBonuses(initialData ? [] : []);
  }, [date, initialData, defaultHourlyRate, isOpen]);

  const [newAdditionalRate, setNewAdditionalRate] = useState({
    name: 'Сверхурочная',
    hours: 0,
    coefficient: 1.5,
    fixed_amount: 0,
  });

  const [newBonus, setNewBonus] = useState({
    name: 'Премия',
    amount: 0,
    type: 'bonus' as 'bonus' | 'deduction',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate earnings
  const baseEarnings = calculateBaseEarnings(
    formData.hours,
    formData.minutes,
    formData.hourly_rate
  );

  const additionalEarnings = additionalRates.reduce((sum, rate) => {
    const earnings = rate.hours * formData.hourly_rate * rate.coefficient + rate.fixed_amount;
    return sum + Math.round(earnings * 100) / 100;
  }, 0);

  const bonusesTotal = bonuses.reduce((sum, bonus) => {
    return bonus.type === 'bonus' ? sum + bonus.amount : sum - bonus.amount;
  }, 0);

  const totalEarnings = calculateTotalEarnings(baseEarnings, additionalEarnings, bonusesTotal);

  const handleAddAdditionalRate = () => {
    if (newAdditionalRate.hours > 0) {
      setAdditionalRates([...additionalRates, newAdditionalRate]);
      setNewAdditionalRate({ name: 'Сверхурочная', hours: 0, coefficient: 1.5, fixed_amount: 0 });
    }
  };

  const handleRemoveAdditionalRate = (index: number) => {
    setAdditionalRates(additionalRates.filter((_, i) => i !== index));
  };

  const handleAddBonus = () => {
    if (newBonus.amount > 0) {
      setBonuses([...bonuses, newBonus]);
      setNewBonus({ name: 'Премия', amount: 0, type: 'bonus' });
    }
  };

  const handleRemoveBonus = (index: number) => {
    setBonuses(bonuses.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        base_earnings: baseEarnings,
        total_earnings: totalEarnings,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm('Вы уверены? Эта смена будет удалена.')) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Смена ${formatDate(date, 'DD.MM.YYYY')}`}
      footer={
        <div className="flex gap-2">
          {initialData && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={isDeleting}
              className="flex-1"
            >
              Удалить
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={isSaving}
            className="flex-1"
          >
            Сохранить
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Basic info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Рабочее время</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Часы"
              type="number"
              min="0"
              max="24"
              value={formData.hours}
              onChange={(e) =>
                setFormData({ ...formData, hours: Math.min(24, Math.max(0, parseInt(e.target.value) || 0)) })
              }
            />
            <Input
              label="Минуты"
              type="number"
              min="0"
              max="59"
              value={formData.minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)),
                })
              }
            />
          </div>
          <Input
            label="Почасовая ставка"
            type="number"
            step="0.01"
            value={formData.hourly_rate}
            onChange={(e) =>
              setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })
            }
            className="mt-3"
          />
          <p className="text-xs text-gray-500 mt-2">
            Отработано: {formData.hours}:{String(formData.minutes).padStart(2, '0')}
          </p>
        </div>

        {/* Additional rates */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Дополнительные ставки</h3>

          {additionalRates.length > 0 && (
            <div className="space-y-2 mb-3">
              {additionalRates.map((rate, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{rate.name}</p>
                    <p className="text-xs text-gray-500">
                      {rate.hours}ч × {rate.coefficient}x = {(rate.hours * rate.coefficient * formData.hourly_rate + rate.fixed_amount).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAdditionalRate(idx)}
                    className="text-danger hover:text-danger/70"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Card className="bg-gray-50 border-0">
            <Select
              label="Тип"
              value={newAdditionalRate.name}
              onChange={(e) =>
                setNewAdditionalRate({ ...newAdditionalRate, name: e.target.value })
              }
              options={[
                { value: 'Сверхурочная', label: 'Сверхурочная' },
                { value: 'Выходная', label: 'Выходная' },
                { value: 'Праздничная', label: 'Праздничная' },
                { value: 'Ночная', label: 'Ночная' },
                { value: 'Другое', label: 'Другое' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                label="Часы"
                type="number"
                min="0"
                value={newAdditionalRate.hours}
                onChange={(e) =>
                  setNewAdditionalRate({
                    ...newAdditionalRate,
                    hours: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Коэффициент"
                type="number"
                step="0.1"
                min="0.1"
                value={newAdditionalRate.coefficient}
                onChange={(e) =>
                  setNewAdditionalRate({
                    ...newAdditionalRate,
                    coefficient: parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAdditionalRate}
              className="w-full mt-2"
            >
              <Plus size={14} className="mr-1" />
              Добавить
            </Button>
          </Card>
        </div>

        {/* Bonuses & Deductions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Доплаты и удержания</h3>

          {bonuses.length > 0 && (
            <div className="space-y-2 mb-3">
              {bonuses.map((bonus, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{bonus.name}</p>
                    <p
                      className={`text-xs font-semibold ${
                        bonus.type === 'bonus' ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {bonus.type === 'bonus' ? '+' : '−'} {bonus.amount.toFixed(2)} {currency}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveBonus(idx)}
                    className="text-danger hover:text-danger/70"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Card className="bg-gray-50 border-0">
            <Input
              label="Название"
              value={newBonus.name}
              onChange={(e) =>
                setNewBonus({ ...newBonus, name: e.target.value })
              }
            />
            <Select
              label="Тип"
              value={newBonus.type}
              onChange={(e) =>
                setNewBonus({ ...newBonus, type: e.target.value as 'bonus' | 'deduction' })
              }
              options={[
                { value: 'bonus', label: 'Доплата' },
                { value: 'deduction', label: 'Удержание' },
              ]}
              className="mt-2"
            />
            <Input
              label="Сумма"
              type="number"
              step="0.01"
              min="0"
              value={newBonus.amount}
              onChange={(e) =>
                setNewBonus({ ...newBonus, amount: parseFloat(e.target.value) || 0 })
              }
              className="mt-2"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBonus}
              className="w-full mt-2"
            >
              <Plus size={14} className="mr-1" />
              Добавить
            </Button>
          </Card>
        </div>

        {/* Color & Comment */}
        <div>
          <Select
            label="Цвет смены"
            value={formData.color}
            onChange={(e) =>
              setFormData({
                ...formData,
                color: e.target.value as 'blue' | 'orange' | 'green' | 'purple' | 'gray',
              })
            }
            options={[
              { value: 'blue', label: '🔵 Обычная' },
              { value: 'orange', label: '🟠 Сверхурочная' },
              { value: 'green', label: '🟢 Выходная' },
              { value: 'purple', label: '🟣 Праздничная' },
              { value: 'gray', label: '⚪ День без работы' },
            ]}
          />
          <Input
            label="Комментарий"
            placeholder="Заметки к смене..."
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            className="mt-3"
          />
        </div>

        {/* Summary */}
        <Card className="bg-primary/5 border-l-4 border-primary">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Базовый заработок:</span>
              <span className="font-semibold">{baseEarnings.toFixed(2)}</span>
            </div>
            {additionalEarnings > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Дополнительные ставки:</span>
                <span className="font-semibold text-warning">+{additionalEarnings.toFixed(2)}</span>
              </div>
            )}
            {bonusesTotal !== 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Доплаты/удержания:</span>
                <span className={`font-semibold ${bonusesTotal > 0 ? 'text-success' : 'text-danger'}`}>
                  {bonusesTotal > 0 ? '+' : ''}{bonusesTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-primary/20 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Итого за смену:</span>
              <span className="font-bold text-lg text-primary">
                {totalEarnings.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

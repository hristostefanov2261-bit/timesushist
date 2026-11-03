import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select, Modal } from './UI';
import type { Payment, PaymentPeriod } from '../types';
import { formatDate } from '../lib/calculations';

interface PaymentsViewProps {
  payments: Payment[];
  periods: PaymentPeriod[];
  onAddPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  currency: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  periods,
  onAddPayment,
  onDeletePayment,
  currency,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    period_id: periods[0]?.id || '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'other',
    comment: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddPayment = async () => {
    if (!formData.period_id || formData.amount <= 0) {
      alert('Заполните все поля');
      return;
    }

    setIsLoading(true);
    try {
      await onAddPayment({
        user_id: '',
        ...formData,
      });
      setShowAddModal(false);
      setFormData({
        period_id: periods[0]?.id || '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        comment: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Удалить выплату?')) return;
    setDeletingId(paymentId);
    try {
      await onDeletePayment(paymentId);
    } finally {
      setDeletingId(null);
    }
  };

  const getPeriodName = (periodId: string) => {
    return periods.find((p) => p.id === periodId)?.name || 'Неизвестный период';
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card className="sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Выплаты</h2>
            <p className="text-sm text-gray-600">Полученные деньги</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-1" />
            Добавить
          </Button>
        </div>

        {/* Total stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Всего получено</p>
            <p className="text-lg font-bold text-success">{getTotalPaid().toFixed(2)}</p>
            <p className="text-xs text-gray-500">{currency}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Операций</p>
            <p className="text-lg font-bold text-primary">{payments.length}</p>
          </div>
        </div>
      </Card>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500 mb-4">Нет выплат</p>
          <Button onClick={() => setShowAddModal(true)}>Записать первую выплату</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments
            .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
            .map((payment) => (
              <Card key={payment.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{payment.amount.toFixed(2)} {currency}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {payment.payment_method === 'cash'
                        ? '💵 Наличные'
                        : payment.payment_method === 'bank_transfer'
                        ? '🏦 Перевод'
                        : '📲 Другое'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {getPeriodName(payment.period_id)} · {formatDate(payment.payment_date)}
                  </p>
                  {payment.comment && <p className="text-xs text-gray-400 mt-1">{payment.comment}</p>}
                </div>
                <button
                  onClick={() => handleDeletePayment(payment.id)}
                  disabled={deletingId === payment.id}
                  className="p-2 hover:bg-danger/10 text-danger rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Добавить выплату"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button size="sm" onClick={handleAddPayment} loading={isLoading} className="flex-1">
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Период"
            value={formData.period_id}
            onChange={(e) => setFormData({ ...formData, period_id: e.target.value })}
            options={periods.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Input
            label="Сумма"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Дата получения"
            type="date"
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
          />
          <Select
            label="Способ получения"
            value={formData.payment_method}
            onChange={(e) =>
              setFormData({
                ...formData,
                payment_method: e.target.value as 'cash' | 'bank_transfer' | 'other',
              })
            }
            options={[
              { value: 'cash', label: '💵 Наличные' },
              { value: 'bank_transfer', label: '🏦 Банковский перевод' },
              { value: 'other', label: '📲 Другое' },
            ]}
          />
          <Input
            label="Комментарий"
            placeholder="Заметки к выплате..."
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

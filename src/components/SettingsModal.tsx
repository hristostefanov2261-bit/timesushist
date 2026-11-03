import React, { useState } from 'react';
import { Modal, Button, Input, Select } from './UI';
import type { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings | null;
  onSave: (settings: Partial<UserSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    hourly_rate: settings?.hourly_rate || 0,
    currency: settings?.currency || 'PLN',
    date_format: (settings?.date_format || 'DD.MM.YYYY') as 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
    theme: (settings?.theme || 'light') as 'light' | 'dark',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave} loading={isSaving} className="flex-1">
            Сохранить
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Финансы</h3>
          <Input
            label="Стандартная почасовая ставка"
            type="number"
            step="0.01"
            min="0"
            value={formData.hourly_rate}
            onChange={(e) =>
              setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })
            }
          />
          <Select
            label="Валюта"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={[
              { value: 'PLN', label: '🇵🇱 PLN (Польский злотый)' },
              { value: 'EUR', label: '🇪🇺 EUR (Евро)' },
              { value: 'USD', label: '🇺🇸 USD (Доллар США)' },
              { value: 'RUB', label: '🇷🇺 RUB (Российский рубль)' },
              { value: 'GBP', label: '🇬🇧 GBP (Британский фунт)' },
              { value: 'CHF', label: '🇨🇭 CHF (Швейцарский франк)' },
              { value: 'CZK', label: '🇨🇿 CZK (Чешская крона)' },
              { value: 'UAH', label: '🇺🇦 UAH (Украинская гривня)' },
              { value: 'BYN', label: '🇧🇾 BYN (Беларусь рубль)' },
              { value: 'KZT', label: '🇰🇿 KZT (Казахский тенге)' },
            ]}
            className="mt-2"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Интерфейс</h3>
          <Select
            label="Формат даты"
            value={formData.date_format}
            onChange={(e) =>
              setFormData({
                ...formData,
                date_format: e.target.value as 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
              })
            }
            options={[
              { value: 'DD.MM.YYYY', label: 'ДД.ММ.ГГГГ (20.10.2023)' },
              { value: 'MM/DD/YYYY', label: 'ММ/ДД/ГГГГ (10/20/2023)' },
              { value: 'YYYY-MM-DD', label: 'ГГГГ-ММ-ДД (2023-10-20)' },
            ]}
          />
          <Select
            label="Тема"
            value={formData.theme}
            onChange={(e) =>
              setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' })
            }
            options={[
              { value: 'light', label: '☀️ Светлая' },
              { value: 'dark', label: '🌙 Тёмная' },
            ]}
            className="mt-2"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            TimeSushist v1.0 • Все данные синхронизируются с облаком • Поддержка: @support
          </p>
        </div>
      </div>
    </Modal>
  );
};

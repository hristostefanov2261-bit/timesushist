import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, CreditCard, LogOut } from 'lucide-react';
import { AppProvider, useNotification } from './contexts/AppContext';
import { Calendar as CalendarView } from './components/Calendar';
import { PeriodsView } from './components/PeriodsView';
import { PaymentsView } from './components/PaymentsView';
import { StatisticsView } from './components/StatisticsView';
import { ShiftEditor } from './components/ShiftEditor';
import { SettingsModal } from './components/SettingsModal';
import { Modal, Button } from './components/UI';
import { useDataStore } from './hooks/useDataStore';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useAuth } from './hooks/useAuth';
import { Toast } from './components/UI';
import './index.css';

type Tab = 'calendar' | 'periods' | 'payments' | 'statistics';

const AppContent: React.FC = () => {
  const { user, token, isLoading: authLoading, isAuthenticated, authenticateTelegram, logout } = useAuth();
  const { addNotification, notifications } = useNotification();
  const { isReady: telegramReady } = useTelegramWebApp();
  const {
    data,
    isLoading,
    addShift,
    updateShift,
    deleteShift,
    addPayment,
    deletePayment,
    addPeriod,
    updateSettings,
    saveData,
  } = useDataStore();

  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Аутентификация при загрузке приложения
  useEffect(() => {
    if (!isAuthenticated && !authLoading && telegramReady) {
      authenticateTelegram().catch((err) => {
        console.error('Failed to authenticate:', err);
        addNotification('Ошибка аутентификации', 'error');
      });
    }
  }, [isAuthenticated, authLoading, telegramReady, authenticateTelegram, addNotification]);

  // Get current shift for editor
  const currentShift = selectedDate
    ? data.shifts.find((s) => s.date === selectedDate)
    : undefined;

  const handleShiftClick = (date: string) => {
    setSelectedDate(date);
    setShowShiftEditor(true);
  };

  const handleSaveShift = async (shiftData: any) => {
    try {
      if (!user) {
        addNotification('Требуется аутентификация', 'error');
        return;
      }

      if (currentShift) {
        updateShift(currentShift.id, shiftData);
        addNotification('Смена обновлена', 'success');
      } else {
        addShift({
          user_id: user.id,
          ...shiftData,
        });
        addNotification('Смена добавлена', 'success');
      }
      // Save to localStorage after making changes
      await saveData();
    } catch (error) {
      addNotification('Ошибка при сохранении', 'error');
    }
  };

  const handleDeleteShift = async () => {
    try {
      if (currentShift) {
        deleteShift(currentShift.id);
        addNotification('Смена удалена', 'success');
        await saveData();
      }
    } catch (error) {
      addNotification('Ошибка при удалении', 'error');
    }
  };

  const handleAddPayment = async (payment: any) => {
    try {
      if (!user) {
        addNotification('Требуется аутентификация', 'error');
        return;
      }

      await addPayment({
        user_id: user.id,
        ...payment,
      });
      addNotification('Выплата добавлена', 'success');
      await saveData();
    } catch (error) {
      addNotification('Ошибка при добавлении выплаты', 'error');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment(paymentId);
      addNotification('Выплата удалена', 'success');
      await saveData();
    } catch (error) {
      addNotification('Ошибка при удалении выплаты', 'error');
    }
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addNotification('Требуется аутентификация', 'error');
      return;
    }

    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    try {
      addPeriod({
        user_id: user.id,
        name: `Период ${now.toLocaleString('ru-RU', { month: 'long' })} ${now.getFullYear()}`,
        start_date: startDate,
        end_date: endDate,
        period_type: 'full_month',
        status: 'open',
        total_earnings: 0,
        total_paid: 0,
      });
      setShowPeriodModal(false);
      addNotification('Период создан', 'success');
      await saveData();
    } catch (error) {
      addNotification('Ошибка при создании периода', 'error');
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral">
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">TimeSushist</h1>
          <p className="text-gray-600 mb-6">Не удалось выполнить вход через Telegram</p>
          <Button onClick={() => authenticateTelegram()}>
            Попробовать ещё раз
          </Button>
        </div>
      </div>
    );
  }

  const currency = data.settings?.currency || 'PLN';
  const defaultHourlyRate = data.settings?.hourly_rate || 0;

  return (
    <div className="flex flex-col h-screen bg-neutral">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 max-w-md mx-auto">
          {activeTab === 'calendar' && (
            <CalendarView
              shifts={data.shifts}
              onShiftClick={handleShiftClick}
              onSettingsClick={() => setShowSettings(true)}
              currency={currency}
            />
          )}

          {activeTab === 'periods' && (
            <PeriodsView
              periods={data.periods}
              onAddPeriod={() => setShowPeriodModal(true)}
              onSelectPeriod={() => {
                // TODO: show period details
              }}
              currency={currency}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              payments={data.payments}
              periods={data.periods}
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
              currency={currency}
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticsView
              shifts={data.shifts}
              payments={data.payments}
              currency={currency}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex gap-1">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs font-medium ${
            activeTab === 'calendar'
              ? 'text-primary bg-primary/10'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar size={20} />
          Календарь
        </button>
        <button
          onClick={() => setActiveTab('periods')}
          className={`flex-1 py-3 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs font-medium ${
            activeTab === 'periods'
              ? 'text-primary bg-primary/10'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 size={20} />
          Периоды
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-3 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs font-medium ${
            activeTab === 'payments'
              ? 'text-primary bg-primary/10'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CreditCard size={20} />
          Выплаты
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex-1 py-3 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs font-medium ${
            activeTab === 'statistics'
              ? 'text-primary bg-primary/10'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 size={20} />
          Статистика
        </button>
      </div>

      {/* Shift Editor Modal */}
      <ShiftEditor
        isOpen={showShiftEditor}
        onClose={() => {
          setShowShiftEditor(false);
          setSelectedDate('');
        }}
        onSave={handleSaveShift}
        onDelete={currentShift ? handleDeleteShift : undefined}
        initialData={currentShift}
        defaultHourlyRate={defaultHourlyRate}
        date={selectedDate}
        currency={currency}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={data.settings}
        onSave={updateSettings}
      />

      {/* Add Period Modal */}
      <Modal
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title="Новый период"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPeriodModal(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button size="sm" onClick={handleAddPeriod} className="flex-1">
              Создать
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Новый период будет создан на текущий месяц.
        </p>
      </Modal>

      {/* Notifications */}
      <div className="fixed bottom-24 left-0 right-0 px-4 space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            message={notification.message}
            type={notification.type}
          />
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

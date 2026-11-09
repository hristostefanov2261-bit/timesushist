import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, CreditCard } from 'lucide-react';
import { AppProvider, useNotification } from './contexts/AppContext';
import { Calendar as CalendarView } from './components/Calendar';
import { PeriodsView } from './components/PeriodsView';
import { PaymentsView } from './components/PaymentsView';
import { StatisticsView } from './components/StatisticsView';
import { ShiftEditor } from './components/ShiftEditor';
import { SettingsModal } from './components/SettingsModal';
import { Modal, Button, Toast } from './components/UI';
import { useDataStore } from './hooks/useDataStore';
import { useAuth } from './hooks/useAuth';
import './index.css';

type Tab = 'calendar' | 'periods' | 'payments' | 'statistics';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, error: authError, isAuthenticated, generateCode, verifyCode, logout } = useAuth();
  const { addNotification, notifications } = useNotification();

  // Код-экран состояние
  const [authScreen, setAuthScreen] = useState<'choose' | 'enter_code'>('choose');
  const [inputCode, setInputCode] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);
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

  // Показываем экран загрузки только в самом начале (очень короткое время)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Ждём максимум 3 секунды, потом всё равно показываем контент
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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

  if (!initialLoadComplete) {
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
    // Экран ввода кода
    if (authScreen === 'enter_code') {
      return (
        <div className="flex items-center justify-center h-screen bg-neutral px-4">
          <div className="w-full max-w-xs">
            <button
              onClick={() => { setAuthScreen('choose'); setInputCode(''); }}
              className="text-sm text-gray-500 mb-6 flex items-center gap-1 hover:text-gray-700"
            >
              ← Назад
            </button>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-center mb-1">Войти по коду</h1>
            <p className="text-gray-500 text-sm text-center mb-6">
              Введи свой 6-значный код
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {authError && <p className="text-red-500 text-sm text-center mb-3">{authError}</p>}
            <Button
              className="w-full"
              disabled={inputCode.length !== 6 || authActionLoading}
              onClick={async () => {
                setAuthActionLoading(true);
                await verifyCode(inputCode);
                setAuthActionLoading(false);
              }}
            >
              {authActionLoading ? 'Проверяю...' : 'Войти'}
            </Button>
          </div>
        </div>
      );
    }

    // Экран выбора: новый или войти
    return (
      <div className="flex items-center justify-center h-screen bg-neutral px-4">
        <div className="w-full max-w-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5">
            <Calendar size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">TimeSushist</h1>
          <p className="text-gray-500 text-sm mb-8">Учёт рабочих смен и выплат</p>

          {authError && <p className="text-red-500 text-sm mb-4">{authError}</p>}

          <Button
            className="w-full mb-3"
            disabled={authActionLoading}
            onClick={async () => {
              setAuthActionLoading(true);
              await generateCode();
              setAuthActionLoading(false);
            }}
          >
            {authActionLoading ? 'Создаю аккаунт...' : 'Создать новый аккаунт'}
          </Button>

          <button
            onClick={() => { setAuthScreen('enter_code'); }}
            className="w-full py-3 text-sm text-primary font-medium hover:underline"
          >
            У меня уже есть код
          </button>
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

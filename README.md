# TimeSushist - Telegram Mini App для учёта рабочих смен

Полнофункциональное веб-приложение для Telegram, которое позволяет отслеживать рабочие смены, рассчитывать заработок и контролировать выплаты.

## ✨ Основные возможности

- 📅 **Календарь смен** — удобный календарь для отметки рабочих дней
- 💰 **Автоматический расчёт заработка** — точные вычисления с поддержкой доп. ставок
- 📊 **Дополнительные ставки** — сверхурочные, выходные, праздничные, ночные часы
- 🎁 **Премии и доплаты** — учёт бонусов и удержаний
- 📆 **Гибкие периоды** — создание разных расчётных периодов
- 💳 **Учёт выплат** — отслеживание полученных денег
- 📈 **Статистика и графики** — финансовая аналитика
- 🌐 **Интеграция с Telegram** — работает прямо в Telegram
- 💾 **Синхронизация данных** — все данные сохраняются в облаке

## 🛠️ Технический стек

### Frontend
- **React 18** + TypeScript
- **Vite** — быстрая сборка
- **Tailwind CSS** — современные стили
- **Lucide Icons** — иконки
- **Recharts** — графики и диаграммы
- **TanStack Query** — синхронизация данных

### Backend
- **Supabase** — PostgreSQL база данных
- **Row Level Security** — защита данных
- **Telegram WebApp SDK** — интеграция с Telegram

## 📋 Структура проекта

```
timesushist/
├── src/
│   ├── components/          # React компоненты
│   │   ├── UI.tsx           # Базовые UI компоненты
│   │   ├── Calendar.tsx     # Календарь смен
│   │   ├── ShiftEditor.tsx  # Редактор смены
│   │   ├── PeriodsView.tsx  # Управление периодами
│   │   ├── PaymentsView.tsx # Учёт выплат
│   │   ├── StatisticsView.tsx # Статистика и графики
│   │   └── SettingsModal.tsx # Настройки
│   ├── contexts/
│   │   └── AppContext.tsx   # Глобальное состояние
│   ├── hooks/
│   │   └── useDataStore.ts  # Управление данными
│   ├── lib/
│   │   ├── supabase.ts      # Supabase клиент
│   │   └── calculations.ts  # Финансовые расчёты
│   ├── types.ts             # TypeScript типы
│   ├── App.tsx              # Главный компонент
│   ├── main.tsx             # Точка входа
│   └── index.css            # Глобальные стили
├── .env.example             # Пример переменных окружения
├── .env.local               # Локальные переменные (не коммитить)
├── tailwind.config.js       # Конфиг Tailwind
├── postcss.config.js        # Конфиг PostCSS
├── vite.config.ts           # Конфиг Vite
├── tsconfig.json            # Конфиг TypeScript
├── package.json             # Зависимости
└── README.md                # Этот файл
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируй `.env.example` в `.env.local` и заполни переменные:

```bash
cp .env.example .env.local
```

Если используешь Supabase:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Запуск в разработке

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

### 4. Сборка для продакшена

```bash
npm run build
```

Готовые файлы будут в папке `dist/`

## 📱 Использование в Telegram

### Локальное тестирование

1. Запусти приложение локально: `npm run dev`
2. Используй Telegram Bot API для тестирования (см. ниже)
3. В браузере открывай DevTools и симулируй мобильный экран

### Публикация как Telegram Mini App

1. **Создай Telegram бота** через @BotFather:
   ```
   /newbot
   ```

2. **Включи Web App функцию**:
   ```
   /setmenubutton
   ```

3. **Развёрни приложение** на сервер (Vercel, Netlify, или собственный):
   ```bash
   npm run build
   # Загрузи папку dist/ на хостинг
   ```

4. **Установи URL Web App** в настройках бота:
   - Перейди в @BotFather
   - Выбери своего бота
   - `/setmenubutton` → укажи URL твоего развёрнутого приложения

5. **Запусти бота** и нажми кнопку "Open App"

## 🔧 Настройка Supabase (опционально)

Если хочешь полнофункциональное облачное сохранение данных:

### 1. Создай проект на Supabase

1. Перейди на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Скопируй URL и API ключ

### 2. Создай таблицы в Supabase

Выполни следующие SQL запросы в SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  hourly_rate DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'PLN',
  date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY',
  theme VARCHAR(10) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  hours INTEGER NOT NULL,
  minutes INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  base_earnings DECIMAL(12,2) NOT NULL,
  total_earnings DECIMAL(12,2) NOT NULL,
  color VARCHAR(20) DEFAULT 'blue',
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment Periods
CREATE TABLE payment_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  period_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'open',
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  period_id UUID NOT NULL REFERENCES payment_periods(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can only see their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

### 3. Настрой Telegram Auth

Используй Telegram WebApp `initData` для аутентификации. Backend должен проверить подпись:

```typescript
// Пример проверки на backend
import crypto from 'crypto';

function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  const [hashStr, ...dataList] = initData.split('&').sort().reverse();
  const data = hashStr.split('=')[1];
  
  const checkString = dataList
    .map(chunk => chunk.split('=').join(' '))
    .join('\n');
  
  const hash = crypto
    .createHmac('sha256', crypto.createHash('sha256').update(botToken).digest())
    .update(checkString)
    .digest('hex');
  
  return hash === data;
}
```

## 💡 Основные компоненты

### Calendar (Календарь)
- Отображение смен с цветовой кодировкой
- Просмотр в режиме месяца или половины месяца
- Быстрая статистика

### ShiftEditor (Редактор смены)
- Добавление часов и минут
- Настройка почасовой ставки
- Добавление дополнительных ставок
- Учёт премий и удержаний
- Выбор цвета и добавление комментариев

### PeriodsView (Периоды)
- Создание расчётных периодов
- Просмотр статуса и прогресса оплаты
- Группировка смен по периодам

### PaymentsView (Выплаты)
- Учёт полученных денег
- Несколько выплат за период
- Отслеживание остатка к получению

### StatisticsView (Статистика)
- Графики заработка по дням
- Диаграмма часов работы
- Сравнение начисленного и полученного
- Распределение типов смен

## 🔐 Безопасность

- **Row Level Security (RLS)** в Supabase — пользователи видят только свои данные
- **Проверка Telegram initData** на backend
- **Валидация всех вводов** на фронтенде
- **HTTPS** для всех соединений в продакшене
- **Локальное хранилище** с возможностью синхронизации

## 📊 Логика расчётов

Все расчёты используют точные числовые значения:

```
Отработанные часы = часы + минуты / 60
Базовый заработок = часы × ставка
Дополнительные = часы_доп × ставка × коэффициент + фиксированная
Итого = базовый + дополнительные + премии - удержания
Остаток = начислено - получено
```

Все итоговые суммы округляются до 2 знаков после запятой.

## 🐛 Решение проблем

### Приложение не загружается
- Проверь, что Node.js >= 16 установлен: `node --version`
- Удали папку `node_modules` и переустанови: `npm install`
- Очисти кэш: `npm run build --force`

### Ошибки Supabase
- Проверь, что URL и ключ правильно указаны в `.env.local`
- Убедись, что в Supabase включена поддержка RLS
- Проверь браузерную консоль на ошибки CORS

### Не работает в Telegram
- Убедись, что приложение развёрнуто на HTTPS
- Проверь, что URL в ботфатхере правильный
- Используй Telegram WebApp для отладки: `tg.WebApp.ready()`

## 📝 Лицензия

MIT

## 🤝 Поддержка

Для вопросов и предложений создавай Issue или свяжись с разработчиком.

---

**TimeSushist** — удобный личный инструмент для учёта рабочих смен и контроля заработка. 💼💰

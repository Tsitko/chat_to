# TODO - Chat To Project

**Дата обновления:** 2025-12-19

## ✅ РЕАЛИЗОВАНО

### Backend
- ✅ Group CRUD эндпоинты (GET, POST, PUT, DELETE /api/groups/)
  - Создание, редактирование, удаление групп
  - Управление аватарами групп
  - Валидация (минимум 2 персонажа, проверка существования)
  - TDD flow: Architecture → Tests (168 тестов) → Implementation (94.5% pass rate)

- ✅ Эндпоинт POST /api/groups/messages/ для групповых сообщений
  - Последовательная обработка ответов от всех персонажей
  - Каждый следующий персонаж видит ответы предыдущих с именами персонажей
  - Детекция эмоций для каждого персонажа
  - Динамическая настройка temperature
  - Обработка частичных ошибок
  - Персонализированные ответы (каждый в своем стиле)
  - Использование знаний из книг (knowledge base search)
  - TDD flow: Architecture → Tests (105 тестов) → Implementation (100% pass rate)

- ✅ Persistent group message storage (Backend)
  - GroupMessageDB модель в database.py
  - GroupMessageRepository для CRUD операций
  - Сохранение user и assistant сообщений в БД
  - GET /api/groups/{id}/messages загружает из БД с пагинацией
  - TDD flow: 82 теста (86.25% passing)

### Frontend
- ✅ UI для управления группами (Telegram-style)
  - Табы "Characters" и "Groups" в sidebar
  - Модальное окно создания/редактирования группы
  - Выбор персонажей через чекбоксы
  - Загрузка аватаров групп
  - TDD flow: Architecture → Tests (155+ тестов) → Implementation (86/86 core tests pass)

- ✅ Групповой чат интерфейс
  - GroupChatWindow для отображения сообщений
  - GroupMessageInput с поддержкой текста и STT
  - Отправка последних 5 сообщений как контекст
  - Оптимистичные UI обновления
  - Отображение имен персонажей в сообщениях

- ✅ Frontend architecture для persistent storage (designed, not implemented yet)
  - useGroupMessages hook
  - groupMessageStoreEnhanced с deduplication
  - useGroupTTS для sequential playback
  - Enhanced UI components
  - 198 тестов написано

---

## 🎯 СЛЕДУЮЩИЕ ЗАДАЧИ

### 1. Реализовать "New Chat" в группах

**Цель:** Добавить функцию очистки истории группового чата аналогично индивидуальным чатам.

**Backend задачи:**
- Эндпоинт DELETE /api/groups/{id}/messages для очистки истории
- Удаление всех сообщений группы из group_messages таблицы
- Логирование операции очистки

**Frontend задачи:**
- Кнопка "New Chat" в GroupChatWindow (аналогично CharacterChatWindow)
- Подтверждение перед очисткой (dialog)
- Очистка локального state (groupMessageStore)
- Вызов DELETE эндпоинта для очистки БД
- Обновление UI после успешной очистки

**Потенциальные сложности и как их избежать:**

1. **Проблема: Race condition между локальной очисткой и БД**
   - Решение: Сначала вызвать API, потом очистить локальный state
   - Использовать optimistic updates только после успешного ответа сервера

2. **Проблема: Пользователь отправил сообщение во время очистки**
   - Решение: Добавить loading state и disabled состояние для input во время очистки
   - Показать spinner или индикатор загрузки

3. **Проблема: Очистка одной группы очищает другую группу**
   - Решение: Проверить что DELETE эндпоинт использует group_id из URL параметра
   - Добавить тесты для multi-group isolation

4. **Проблема: После очистки старые сообщения остаются в conversations KB**
   - Решение: Решить нужно ли очищать conversations KB
   - Если да - добавить логику удаления из ChromaDB
   - Если нет - документировать это поведение

**Пример реализации:**

Backend:
```python
@router.delete("/{group_id}/messages", response_model=dict)
async def clear_group_messages(
    group_id: str,
    group_message_repo: GroupMessageRepository = Depends(get_group_message_repo)
):
    """Clear all messages for a group."""
    await group_message_repo.delete_messages_by_group(group_id)
    return {"success": True, "message": "Group messages cleared"}
```

Frontend:
```typescript
const handleNewChat = async () => {
  if (!confirm('Clear all messages in this group chat?')) return;

  setIsClearing(true);
  try {
    await apiService.clearGroupMessages(groupId);
    groupMessageStore.clearGroupMessages(groupId);
    toast.success('Chat cleared');
  } catch (error) {
    toast.error('Failed to clear chat');
  } finally {
    setIsClearing(false);
  }
};
```

---

### 2. Исправить автопрокрутку в групповом чате

**Проблема:**
При отправке сообщения в группу чат автоматически прокручивается до конца (последнего сообщения последнего персонажа), из-за чего пользователь не видит начало ответов первых персонажей и должен вручную прокручивать вверх.

**Ожидаемое поведение:**
После отправки сообщения чат должен прокручиваться до **начала сообщения первого персонажа**, чтобы пользователь видел все ответы с самого начала.

**Текущее поведение:**
```
[User message]           <- Отправили
[Character 1 response]   <- Нужно прокрутить сюда
[Character 2 response]
[Character 3 response]   <- Сейчас прокручивает сюда
```

**Решение:**

1. **Определить anchor message**:
   - Запомнить ID user message перед отправкой
   - После получения всех ответов найти первое assistant сообщение после этого user message

2. **Прокрутка к первому ответу**:
   - Использовать `scrollIntoView()` с `{ behavior: 'smooth', block: 'start' }`
   - Целью должен быть первый assistant message после user message, а не последний

3. **Обработать edge cases**:
   - Если ответы приходят постепенно (streaming) - прокручивать к первому
   - Если пользователь вручную прокрутил во время генерации - не перебивать
   - Если окно уже показывает нужную область - не прокручивать

**Где править:**

Frontend файлы:
- `frontend/src/components/GroupChatWindow.tsx` - основная логика прокрутки
- `frontend/src/store/groupMessageStore.ts` - возможно добавить флаг для первого сообщения

**Пример реализации:**

```typescript
// В GroupChatWindow.tsx
useEffect(() => {
  if (messages.length === 0) return;

  // Найти последнее user message
  const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
  if (lastUserMessageIndex === -1) return;

  // Найти первое assistant message после него
  const firstResponseIndex = messages.findIndex(
    (m, idx) => idx > lastUserMessageIndex && m.role === 'assistant'
  );

  if (firstResponseIndex !== -1) {
    const firstResponseElement = messageRefs.current[firstResponseIndex];
    firstResponseElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}, [messages]);
```

**Потенциальные сложности:**

1. **Проблема: Прокрутка происходит до завершения рендеринга**
   - Решение: Использовать `setTimeout` или `requestAnimationFrame` после обновления DOM

2. **Проблема: Пользователь читает предыдущие сообщения**
   - Решение: Проверять позицию скролла перед автопрокруткой
   - Не прокручивать если пользователь активно скроллит

3. **Проблема: Streaming ответы приходят по частям**
   - Решение: Прокручивать только один раз при появлении первого assistant message
   - Использовать флаг `hasScrolledToFirstResponse`

---

## 📝 УРОКИ ИЗ ОТЛАДКИ ГРУППОВОГО ЧАТА

### Критические проблемы, которые были решены

#### 1. ✅ ИСПРАВЛЕНО: DateTime comparison errors
**Проблема:** `TypeError: can't compare offset-naive and offset-aware datetimes`
- Сообщения от фронтенда имели timezone, а новые сообщения - нет
- Это ломало сортировку в `_get_message_window`

**Решение:**
- Нормализация всех datetime к naive формату перед сортировкой
- Функция `get_naive_datetime()` в `group_chat_service.py:303-308`

**Урок:** При работе с datetime из разных источников (frontend, backend), всегда нормализуйте формат перед сравнением.

#### 2. ✅ ИСПРАВЛЕНО: Персонажи не различаются в групповых чатах
**Проблема:** Все персонажи отвечали одинаково, копировали ответы друг друга
- В message history показывалось "Ассистент:" вместо имен персонажей
- LLM думал что все ответы написал он сам

**Решение:**
- Добавили поле `character_name` в модель Message (backend + frontend)
- Обновили `format_messages()` чтобы показывать имя вместо "Ассистент"
- Улучшили промпт: явно указали что это групповая беседа, каждый должен дать уникальный ответ

**Файлы изменены:**
- `backend/models/message.py:23` - добавлено поле `character_name`
- `backend/llm/prompt_builder.py:120-127` - обновлен `format_messages()`
- `backend/chat_handler/group_chat_service.py:183` - установка `character_name`
- `frontend/src/types/message.ts:29` - добавлено поле

**Урок:** В групповых чатах LLM нужно явно показывать кто автор каждого сообщения, иначе модель путается.

#### 3. ✅ ИСПРАВЛЕНО: Недостаточно предметные ответы
**Проблема:** Ответы стали персонализированными, но не использовали знания из книг

**Решение:**
- Улучшили промпт: добавили акцент на использование знаний из книг
- Убрали слишком жесткое ограничение "2-4 предложения"
- Попросили приводить конкретные примеры и цитаты
- KB search работает отлично - персонажи получают релевантный контекст

**Файлы изменены:**
- `backend/llm/prompt_builder.py:27-39` - обновлен USER_PROMPT_TEMPLATE

**Урок:** Баланс между персонализацией и предметностью достигается через качественный промпт и акцент на использование knowledge base.

#### 4. ✅ ИСПРАВЛЕНО: 422 Unprocessable Entity
**Проблема:** Фронтенд и бэкенд использовали разные форматы данных
- Frontend отправлял: `{ messages: Message[], character_ids: string[] }`
- Backend ожидал: `{ content: string, character_ids: string[] }`

**Решение:**
- Добавили `group_id` в GroupMessageRequest
- Backend принимает массив messages от фронтенда

**Урок:** При работе с групповыми чатами важно синхронизировать форматы данных между frontend и backend на этапе проектирования.

#### 5. ✅ ИСПРАВЛЕНО: 500 Internal Server Error после первого ответа
**Проблема:** Backend падал после генерации первого персонажа
- `_generate_character_response` использовал `ChatService._generate_response()`
- Этот метод запрашивал БД вместо использования in-memory messages
- Ответы других персонажей еще не были в БД

**Решение:**
- Переписали `_generate_character_response` чтобы использовать `message_window` напрямую
- Удалили зависимость от ChatService
- Реализовали прямой LLM generation flow

**Файлы изменены:**
- `backend/chat_handler/group_chat_service.py:319-476` - новая реализация

**Урок:** В групповых чатах используйте in-memory message window вместо database queries, т.к. новые сообщения еще не сохранены.

### Архитектурные решения

- **Последовательная обработка персонажей** - каждый следующий видит ответы предыдущих с их именами
- **Sliding window контекст** - каждый персонаж получает последние N сообщений
- **Эмоции для каждого персонажа** - индивидуальная детекция эмоций с учетом контекста
- **Partial failure handling** - если один персонаж упал, остальные продолжают
- **Персонализация через промпт** - явные инструкции давать уникальные ответы в своем стиле
- **Knowledge base integration** - каждый персонаж получает релевантный контекст из своих книг

### Полезные команды

```bash
# Запустить бэкенд
cd /home/denis/Projects/chat_to/backend
source ../venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 1310 --reload

# Запустить фронтенд
cd /home/denis/Projects/chat_to/frontend
npm run dev

# Запустить бэкенд тесты
cd /home/denis/Projects/chat_to/backend
source ../venv/bin/activate
pytest tests/backend -k "group" -v

# Запустить фронтенд тесты
cd /home/denis/Projects/chat_to/frontend
npm test

# Проверить эндпоинты
curl http://localhost:1310/api/groups/
curl http://localhost:1310/api/groups/{id}
curl http://localhost:1310/docs
```

---

## 💡 РЕКОМЕНДАЦИИ ДЛЯ БУДУЩИХ ЗАДАЧ

### При работе с групповыми чатами:

1. **Всегда нормализуйте datetime** перед сравнением (убирайте timezone)
2. **Показывайте имена персонажей** в message history для LLM
3. **Используйте in-memory messages** для контекста, не запрашивайте БД
4. **Явно указывайте в промпте** что это групповая беседа
5. **Тестируйте с 3+ персонажами** чтобы увидеть проблемы с уникальностью ответов
6. **Логируйте промпты** во время разработки для отладки

### При добавлении новых фич:

1. **Синхронизируйте типы** между frontend и backend сразу
2. **Добавляйте подробное логирование** на этапе разработки
3. **Тестируйте edge cases** (пустые группы, один персонаж, много персонажей)
4. **Документируйте решения** и причины в комментариях кода

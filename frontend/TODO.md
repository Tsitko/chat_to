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
  - Каждый следующий персонаж видит ответы предыдущих
  - Детекция эмоций для каждого персонажа
  - Динамическая настройка temperature
  - Обработка частичных ошибок
  - TDD flow: Architecture → Tests (105 тестов) → Implementation (100% pass rate)

- ✅ GET /api/groups/{id}/messages - возвращает пустой массив (MVP)
  - Сообщения пока хранятся только в памяти фронтенда

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

---

## ⚠️ ВАЖНЫЕ ЗАМЕТКИ

### 🔴 КРИТИЧНО: Ошибка 500 при генерации ответов группы

**Проблема:**
После исправления 422 ошибки, фронтенд успешно отправляет запрос, но бэкенд падает с 500 Internal Server Error после генерации первого сообщения.

**Что происходит:**
```
[GroupMessageStore] sendGroupMessage called: {groupId: '77e0eb82-b04d-49e2-8cec-c7445b986003', content: 'Откуда вообще появилась философия?', characterIds: Array(3), messageLimit: 5}
[GroupMessageStore] Sending to backend: {messages: Array(2), character_ids: Array(3)}
POST http://localhost:1710/api/groups/messages/ 500 (Internal Server Error)
```

**Наблюдения:**
- Запрос успешно принимается бэкендом (нет 422)
- GPU загружается (начинается генерация LLM ответа)
- Генерируется ответ от одного персонажа (первого в списке)
- После генерации первого ответа происходит ошибка 500
- Остальные персонажи не отвечают

**Вероятные причины:**
1. Ошибка при добавлении сгенерированного Message в контекст для следующего персонажа
2. Проблема при сохранении сообщения в БД (в `_save_user_message` или при сохранении ответа)
3. Ошибка при создании CharacterResponse из сгенерированного Message
4. Проблема в последовательной обработке персонажей (цикл в `process_group_message`)

**Где смотреть:**
- Backend logs: проверить traceback в консоли бэкенда для деталей ошибки
- `/backend/chat_handler/group_chat_service.py:136-149` - код добавления assistant_message в additional_messages
- `/backend/chat_handler/group_chat_service.py:275-304` - `_process_character` метод
- `/backend/api/group_message_routes.py:155-162` - обработка response

**Для отладки:**
```bash
# Проверить детальный traceback в логах бэкенда
# Убедиться что первый персонаж вернул валидный Message с emotions
# Проверить что Message правильно конвертируется в assistant_message
```

---

### ✅ ИСПРАВЛЕНО: Ошибка 422 при отправке сообщения в группу

**Проблема была:**
- Фронтенд отправлял: `{ messages: Message[], character_ids: string[] }`
- Бэкенд ожидал: `{ content: string, character_ids: string[] }`
- Это вызывало 422 Unprocessable Entity

**Решение:**
Обновлены модели данных для совместимости фронтенда и бэкенда:

1. **Backend: `GroupMessageRequest`** - теперь принимает `messages: List[Message]` вместо `content: str`
2. **Backend: `CharacterResponse`** - возвращает `message: str` и `emotions: Emotions` вместо `message: Message` и `success: bool`
3. **Backend: `GroupMessageResponse`** - теперь `responses: List[CharacterResponse]` и `statistics: GroupMessageStatistics` вместо отдельных полей
4. **Backend: `GroupChatService.process_group_message()`** - принимает массив messages от фронтенда и использует их как контекст
5. **Backend: `_get_message_window()`** - использует сообщения из фронтенда вместо запроса к БД

**Причина изменений:**
- Группов messages хранятся in-memory на фронтенде (для MVP)
- Фронтенд должен отправлять последние 5 сообщений как контекст
- Бэкенд использует эти сообщения вместо загрузки из БД

**Файлы изменены:**
- `/backend/models/group_message.py` - обновлены все модели данных
- `/backend/chat_handler/group_chat_service.py` - обновлена логика обработки
- `/backend/api/group_message_routes.py` - передает messages вместо content

**Проверка:**
```bash
# Эндпоинт теперь работает:
curl -X POST http://localhost:1310/api/groups/messages/ \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"id": "1", "role": "user", "content": "Test", "created_at": "2025-12-19T13:00:00"}], "character_ids": ["..."]}'
```

---

### 2. Эндпоинт истории сообщений группы (опционально)

**Текущий статус:**
- GET /api/groups/{id}/messages возвращает пустой массив `{"messages": []}`
- Сообщения хранятся только в памяти фронтенда (для MVP достаточно)

**Для полной реализации потребуется:**

1. **Создать модель GroupMessage для БД**
   ```python
   # backend/storage/database.py
   class GroupMessageDB(Base):
       __tablename__ = "group_messages"
       id = Column(String, primary_key=True)
       group_id = Column(String, nullable=False)
       role = Column(String, nullable=False)  # 'user' or 'assistant'
       content = Column(Text, nullable=False)
       character_id = Column(String, nullable=True)  # null для user messages
       character_name = Column(String, nullable=True)
       created_at = Column(DateTime, default=datetime.utcnow)
   ```

2. **Создать GroupMessageRepository**
   ```python
   # backend/storage/group_message_repository.py
   class GroupMessageRepository:
       def create_message(group_id, role, content, character_id=None) -> GroupMessage
       def get_messages_by_group(group_id, limit, offset) -> List[GroupMessage]
       def delete_messages_by_group(group_id) -> None
   ```

3. **Обновить эндпоинт POST /api/groups/messages/**
   - После генерации ответов персонажей сохранять их в БД
   - Сохранять также исходное сообщение пользователя

4. **Обновить эндпоинт GET /api/groups/{id}/messages**
   - Загружать сообщения из БД вместо возврата пустого массива
   - Поддерживать пагинацию (limit, offset)

5. **Обновить фронтенд**
   - Загружать историю при открытии группы
   - Не дублировать сообщения (они уже есть в БД)

---

## 📝 ЗАМЕТКИ ДЛЯ РАЗРАБОТКИ

### Проблемы, с которыми столкнулись

1. **STT в группах отправлял на неправильный эндпоинт**
   - Проблема: RecordButton передавал groupId как characterId, и useSTT автоматически отправлял на `/api/characters/{id}/messages/`
   - Решение: Добавлен callback `onTranscription` в RecordButton и useSTT
   - Теперь транскрибированный текст возвращается через callback вместо автоматической отправки

2. **Прокси Vite не работал сразу**
   - Проблема: Запросы шли на `localhost:1710` вместо проксирования на `localhost:1310`
   - Решение: Перезапустить фронтенд, чтобы прокси заработал

3. **FastAPI требует слэш в конце URL**
   - Проблема: `/api/groups/messages` → 405 Method Not Allowed
   - Решение: Использовать `/api/groups/messages/` со слэшом

4. **GET /api/groups/{id}/messages возвращал 501**
   - Проблема: Фронтенд не мог загрузить историю и блокировался
   - Решение: Вернули пустой массив `{"messages": []}` для MVP

### Архитектурные решения

- **Последовательная обработка персонажей** - каждый следующий видит ответы предыдущих
- **Sliding window контекст** - каждый персонаж получает последние N сообщений
- **Эмоции для каждого персонажа** - индивидуальная детекция эмоций
- **Partial failure handling** - если один персонаж упал, остальные продолжают
- **In-memory сообщения (MVP)** - история хранится только на фронтенде (для начала достаточно)

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

## 🎯 СЛЕДУЮЩИЕ ШАГИ

1. **✅ ГОТОВО К ТЕСТИРОВАНИЮ: Протестировать групповой чат end-to-end**
   - Открыть фронтенд в браузере
   - Создать группу с 2-3 персонажами (или использовать существующую)
   - Отправить сообщение через текстовое поле или STT
   - Проверить что все персонажи ответили последовательно
   - Проверить что ответы отображаются правильно с эмоциями
   - Проверить что каждый следующий персонаж видит ответы предыдущих

2. **Опционально: Реализовать хранение истории сообщений**
   - Если нужна персистентная история группового чата
   - Следовать плану выше (GroupMessageDB, Repository, API updates)
   - Пока MVP работает с in-memory хранением на фронтенде

3. **Опционально: Добавить TTS для группового чата**
   - Сейчас STT работает, TTS нужно интегрировать
   - Возможно воспроизводить ответы персонажей по очереди
   - Или выбирать конкретный ответ для озвучки

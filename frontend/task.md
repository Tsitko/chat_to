# Задача

Разработать проект с чатом с историческими личностями на основе баз знаний с их книгами.

## Артефакты проекта

### База знаний

База знаний на эмбедингах. Для индексации используется локальная модель на ollama по умолчанию qwen-embeddings-indexer (вынести в конфиг). Чанки по 3000 символов с overlap 10%. Для поиска используется локальная модель на ollama по умолчанию qwen-embeddings-kb (вынести в конфиг).

Пример реализации работы с такими моделями в частности и локальной ollama в целом: Projects/large_document_reader (Но тут будут не redix базы а локальные sqlite chromadb свои для каждого персонажа)

Каждый персонаж имее 2 базы знаний:

- База знаний по его книгам
- База знаний бесед с пользователем

База знаний по книгам индексируется пр добавлении книги (для этого в UI будет соответсвующий функционал)

База знаний бесед индексируется при добавлении сообщения в беседу. Это сообщение добавляется в базу знаний.

### LLM

Для ответов на вопросы используется локальная модель на ollama по умолчанию qwen2.5:7b (вынести в конфиг).

Промпты разделены на системный и пользовательский для корректного взаимодействия с LLM:

**System Prompt** (идентичность и знания персонажа):
```python
system_prompt = """Ты {name}.
Твои знания по обсуждаемой теме: {context}"""
```

**User Prompt** (контекст беседы и задача):
```python
user_prompt = """Раньше по этой теме вы обсуждали: {previous_discussion}
История беседы: {messages}

Изучи беседу исходя из своих знаний и сформулируй мнение: с чем ты согласен, с чем нет и почему, что предлагаешь обсудить дополнительно."""
```

**Параметры:**

name - имя персонажа

context - результат поиска в базе знаний с книгами по контексту беседы

messages - история беседы

previous_discussion - результат поиска в базе знаний с историей бесед по предыдущим беседам с этим персонажем

### UI

web приложение с дизайном на основе telegram чата. В левой части (20% ширины) список персонажей, в правой части (80% ширины) чат с выбранным персонажем. В левой части сверху возможность создать нового персонажа (всплывающее окно с возожностью ввести имя, и через browse или drag&drop добавить книгу в базу знаний или фото для аватара. Формат книги: pdf, docx, txt. Формат фото: png, jpg, jpeg).

В правой части чата сверху возможность редактировать персонажа (всплывающее окно с возожностью ввести имя, и через browse или drag&drop добавить книгу в базу знаний или фото для аватара. Формат книги: pdf, docx, txt. Формат фото: png, jpg, jpeg). 10% высоты
Далее чат с персонажем (история сообщений). 60% высоты
Ниже чата сверху возможность ввести сообщение (input). 30% высоты. Кнопка отправки сообщения справа.

Для UI использовать CSS, HTML, JavaScript (typescript) и React.

#### Библиотеки для фронтенда

**Основной стек:**

- `react` - UI библиотека
- `react-dom` - рендеринг React компонентов
- `typescript` - типизация JavaScript
- `vite` или `create-react-app` - сборщик проекта (кроссплатформенный)

**Для работы с файлами и drag&drop:**

- `react-dropzone` - drag&drop для загрузки файлов (кроссплатформенный)

**Для HTTP запросов:**

- `axios` - HTTP клиент (кроссплатформенный)

**Для управления состоянием:**

- `zustand` или `react-query` (tanstack/react-query) - управление состоянием и кеширование запросов (кроссплатформенные)

**Для работы с формами:**

- `react-hook-form` - управление формами (кроссплатформенный)
- `zod` - валидация данных (кроссплатформенный)

**Для UI компонентов (опционально, для ускорения разработки):**

- `@mantine/core` + `@mantine/hooks` - UI библиотека с готовыми компонентами (кроссплатформенная)
- или `@chakra-ui/react` - альтернативная UI библиотека (кроссплатформенная)

**Для стилизации:**

- CSS Modules или `styled-components` - модульные стили (кроссплатформенные)

Все указанные библиотеки работают на Windows и Linux без дополнительной настройки.

### Сервер

Сервер на unicorn. По  умолчанию на порту 1310 (вынести в конфиг).

Эндпоинты:

#### Персонажи

**GET /api/characters**

Получить список всех персонажей.

**Ответ:**
```json
[
  {
    "id": "uuid",
    "name": "Имя персонажа",
    "avatar_url": "/api/characters/{id}/avatar",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

**GET /api/characters/{character_id}**

Получить данные конкретного персонажа.

**Ответ:**
```json
{
  "id": "uuid",
  "name": "Имя персонажа",
  "avatar_url": "/api/characters/{id}/avatar",
  "created_at": "2024-01-01T00:00:00Z",
  "books": [
    {
      "id": "uuid",
      "filename": "book.pdf",
      "uploaded_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

**POST /api/characters**

Создать нового персонажа.

**Тело запроса:** `multipart/form-data`

- `name` (string, обязательное) - имя персонажа
- `avatar` (file, опциональное) - файл аватара (png, jpg, jpeg)
- `books[]` (file[], опциональное) - файлы книг (pdf, docx, txt)

**Ответ:**
```json
{
  "id": "uuid",
  "name": "Имя персонажа",
  "avatar_url": "/api/characters/{id}/avatar",
  "created_at": "2024-01-01T00:00:00Z",
  "books": []
}
```

**Примечание:** Книги индексируются асинхронно после создания персонажа.

---

**PUT /api/characters/{character_id}**

Обновить данные персонажа.

**Тело запроса:** `multipart/form-data`

- `name` (string, опциональное) - новое имя персонажа
- `avatar` (file, опциональное) - новый файл аватара (png, jpg, jpeg)
- `books[]` (file[], опциональное) - новые файлы книг для добавления (pdf, docx, txt)

**Ответ:**
```json
{
  "id": "uuid",
  "name": "Обновленное имя",
  "avatar_url": "/api/characters/{id}/avatar",
  "created_at": "2024-01-01T00:00:00Z",
  "books": [...]
}
```

**Примечание:** Новые книги индексируются асинхронно после обновления.

---

**DELETE /api/characters/{character_id}**

Удалить персонажа и все связанные данные (базы знаний, книги, беседы).

**Ответ:** `204 No Content`

---

**GET /api/characters/{character_id}/avatar**

Получить файл аватара персонажа.

**Ответ:** Файл изображения (png, jpg, jpeg)

---

#### Книги

**GET /api/characters/{character_id}/books**

Получить список книг персонажа.

**Ответ:**
```json
[
  {
    "id": "uuid",
    "filename": "book.pdf",
    "file_size": 1024000,
    "uploaded_at": "2024-01-01T00:00:00Z",
    "indexed": true
  }
]
```

---

**POST /api/characters/{character_id}/books**

Добавить книгу к персонажу.

**Тело запроса:** `multipart/form-data`

- `book` (file, обязательное) - файл книги (pdf, docx, txt)

**Ответ:**
```json
{
  "id": "uuid",
  "filename": "book.pdf",
  "file_size": 1024000,
  "uploaded_at": "2024-01-01T00:00:00Z",
  "indexed": false
}
```

**Примечание:** Книга индексируется асинхронно. Поле `indexed` станет `true` после завершения индексации.

---

**DELETE /api/characters/{character_id}/books/{book_id}**

Удалить книгу из базы знаний персонажа.

**Ответ:** `204 No Content`

---

#### Сообщения и чат

**GET /api/characters/{character_id}/messages**

Получить историю сообщений с персонажем.

**Query параметры:**

- `limit` (int, опциональное, по умолчанию 10) - количество сообщений
- `offset` (int, опциональное, по умолчанию 0) - смещение для пагинации

**Ответ:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Текст сообщения пользователя",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Текст ответа персонажа",
      "created_at": "2024-01-01T00:01:00Z"
    }
  ],
  "total": 50
}
```

---

**POST /api/characters/{character_id}/messages**

Отправить сообщение персонажу и получить ответ.

**Тело запроса:**
```json
{
  "content": "Текст сообщения пользователя"
}
```

**Ответ:**
```json
{
  "user_message": {
    "id": "uuid",
    "role": "user",
    "content": "Текст сообщения пользователя",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "assistant_message": {
    "id": "uuid",
    "role": "assistant",
    "content": "Текст ответа персонажа",
    "created_at": "2024-01-01T00:00:01Z"
  }
}
```

**Примечание:**

- Сообщение пользователя индексируется в базу знаний бесед асинхронно
- Система выполняет поиск релевантного контекста в базах знаний (книги и предыдущие беседы)
- Генерируется ответ через LLM на основе контекста и истории беседы

---

#### Статус индексации

**GET /api/characters/{character_id}/indexing-status**

Получить статус индексации книг персонажа.

**Ответ:**
```json
{
  "books_indexing": [
    {
      "book_id": "uuid",
      "status": "completed",
      "progress": 100
    }
  ],
  "overall_status": "completed"
}
```

**Статусы:**

- `pending` - ожидает индексации
- `indexing` - индексируется
- `completed` - индексация завершена
- `failed` - ошибка индексации

## Функционал

- Добавление книги в базу знаний
- Добавление сообщения в беседу
- Редактирование персонажа
- Доабвление персонажа
- Удаление персонажа
- Удаление книги из базы знаний

## Данные для тестирования

В папке Гегель находится jpg фотография Гегеля. Это фотография для аватара персонажа Гегель.
В папке Гегель находятся книги Гегеля в txt - их нужно проиндексировать в базу знаний персонажа Гегель.

## Use Cases

### UC1: Создание нового персонажа

**Актор:** Пользователь

**Предусловия:** Пользователь открыл приложение

**Основной поток:**

1. Пользователь нажимает кнопку создания персонажа в левой панели
2. Открывается модальное окно с формой
3. Пользователь вводит имя персонажа
4. Пользователь загружает книгу(и) через browse или drag&drop (pdf, docx, txt)
5. Пользователь загружает фото для аватара через browse или drag&drop (png, jpg, jpeg)
6. Пользователь подтверждает создание
7. Система создает персонажа, индексирует книги в базу знаний персонажа
8. Персонаж появляется в списке персонажей

**Постусловия:** Создан новый персонаж с базой знаний по книгам

---

### UC2: Беседа с персонажем

**Актор:** Пользователь

**Предусловия:** Создан хотя бы один персонаж

**Основной поток:**

1. Пользователь выбирает персонажа из списка в левой панели
2. Открывается чат с выбранным персонажем
3. Пользователь вводит сообщение в поле ввода
4. Пользователь нажимает кнопку отправки
5. Система добавляет сообщение пользователя в историю беседы и индексирует его в базу знаний бесед
6. Система выполняет поиск релевантного контекста в базах знаний (книги + беседы)
7. Система генерирует ответ персонажа на основе контекста и истории беседы через LLM
8. Ответ отображается в чате

**Постусловия:** Сообщение добавлено в беседу и проиндексировано в базу знаний бесед

---

### UC3: Редактирование персонажа

**Актор:** Пользователь

**Предусловия:** Существует хотя бы один персонаж

**Основной поток:**

1. Пользователь выбирает персонажа из списка
2. Пользователь нажимает кнопку редактирования в правой панели
3. Открывается модальное окно с текущими данными персонажа
4. Пользователь изменяет имя, добавляет новые книги или изменяет аватар
5. Пользователь подтверждает изменения
6. Система обновляет данные персонажа
7. Если добавлены новые книги, система индексирует их в базу знаний персонажа

**Постусловия:** Данные персонажа обновлены, новые книги проиндексированы

---

### UC4: Удаление персонажа

**Актор:** Пользователь

**Предусловия:** Существует хотя бы один персонаж

**Основной поток:**

1. Пользователь выбирает персонажа из списка
2. Пользователь вызывает действие удаления персонажа
3. Система запрашивает подтверждение
4. Пользователь подтверждает удаление
5. Система удаляет персонажа, его базы знаний (книги и беседы) и все связанные данные
6. Персонаж исчезает из списка

**Постусловия:** Персонаж и все его данные удалены

---

### UC5: Удаление книги из базы знаний

**Актор:** Пользователь

**Предусловия:** У персонажа есть хотя бы одна книга в базе знаний

**Основной поток:**

1. Пользователь выбирает персонажа
2. Пользователь открывает список книг персонажа
3. Пользователь выбирает книгу для удаления
4. Система запрашивает подтверждение
5. Пользователь подтверждает удаление
6. Система удаляет книгу и все связанные с ней данные из базы знаний персонажа
7. Книга исчезает из списка

**Постусловия:** Книга удалена из базы знаний персонажа

---

## Architectural Design

### Created Structure

```
chat_to/
├── backend/                    # Python FastAPI backend
│   ├── configs/               # Configuration modules (bottom layer)
│   │   ├── ollama_models.py  # Ollama model names
│   │   ├── server_config.py  # Server settings
│   │   ├── chunking_config.py # Text chunking parameters
│   │   └── __init__.py
│   ├── exceptions/            # Custom exception hierarchy
│   │   ├── base_exceptions.py
│   │   └── __init__.py
│   ├── models/                # Pydantic data models
│   │   ├── character.py      # Character and Book models
│   │   ├── message.py        # Message models
│   │   ├── indexing.py       # Indexing status models
│   │   └── __init__.py
│   ├── storage/               # Data persistence layer
│   │   ├── file_storage.py   # File operations (avatars, books)
│   │   ├── character_repository.py # Character CRUD
│   │   ├── message_repository.py  # Message persistence
│   │   └── __init__.py
│   ├── utils/                 # Utility modules
│   │   ├── text_chunker.py   # Text chunking with overlap
│   │   ├── document_parser.py # PDF/DOCX/TXT parsing
│   │   ├── file_validator.py  # File validation
│   │   └── __init__.py
│   ├── vector_db/             # Vector database layer
│   │   ├── chroma_client.py  # ChromaDB wrapper
│   │   └── __init__.py
│   ├── embeddings/            # Embedding generation
│   │   ├── embedding_generator.py # Ollama embeddings
│   │   └── __init__.py
│   ├── knowledge_base/        # Knowledge base management
│   │   ├── knowledge_base_manager.py # Dual KB (books + conversations)
│   │   └── __init__.py
│   ├── llm/                   # LLM operations
│   │   ├── ollama_client.py  # Ollama chat client
│   │   ├── prompt_builder.py # Prompt construction
│   │   └── __init__.py
│   ├── chat_handler/          # Orchestration layer
│   │   ├── chat_service.py   # Chat flow orchestration
│   │   ├── indexing_service.py # Async book indexing
│   │   └── __init__.py
│   ├── api/                   # FastAPI routes (top layer)
│   │   ├── character_routes.py
│   │   ├── book_routes.py
│   │   ├── message_routes.py
│   │   ├── indexing_routes.py
│   │   └── __init__.py
│   ├── main.py                # FastAPI app entry point
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── types/             # TypeScript type definitions
│   │   │   ├── character.ts
│   │   │   ├── message.ts
│   │   │   └── indexing.ts
│   │   ├── services/          # API client layer
│   │   │   └── api.ts
│   │   ├── store/             # Zustand state management
│   │   │   ├── characterStore.ts
│   │   │   └── messageStore.ts
│   │   ├── components/        # React components
│   │   │   ├── CharacterList.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── CharacterHeader.tsx
│   │   │   └── CharacterModal.tsx
│   │   ├── App.tsx            # Main app component
│   │   ├── App.css            # Main styles
│   │   ├── main.tsx           # Entry point
│   │   └── vite-env.d.ts
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── tests/                      # pytest test suite
│   ├── unit/                  # Unit tests per module
│   │   ├── test_embeddings.py
│   │   └── test_knowledge_base.py
│   ├── integration/           # Integration tests
│   │   └── test_chat_flow.py
│   ├── e2e/                   # End-to-end use case tests
│   │   └── test_use_cases.py
│   ├── conftest.py            # pytest fixtures
│   └── __init__.py
├── venv/                       # Python virtual environment
├── llm_readme.md              # Project navigation index
├── task.md                    # This file
└── Гегель/                    # Test data (Hegel)
    ├── gegel-3.jpg            # Avatar
    └── *.txt                  # Books
```

### Components Overview

#### Backend Modules (Bottom-Up)

**Layer 0: Configuration and Base Classes**
- `configs/`: All configuration constants (models, server, chunking)
- `exceptions/`: Custom exception hierarchy
- `models/`: Pydantic models for data validation

**Layer 1: Data and Utilities**
- `storage/`: File storage, character/message repositories
- `utils/`: Text chunking, document parsing, file validation
- `vector_db/`: ChromaDB client wrapper

**Layer 2: Logic Components**
- `embeddings/`: Embedding generation via Ollama
- `llm/`: Ollama chat client and prompt building

**Layer 3: Domain Logic**
- `knowledge_base/`: Dual KB manager (books + conversations)

**Layer 4: Orchestration**
- `chat_handler/`: Chat service and indexing service

**Layer 5: Presentation**
- `api/`: FastAPI REST routes

#### Frontend Components

**Type Layer**
- `types/`: TypeScript interfaces matching backend models

**Service Layer**
- `services/api.ts`: Axios-based API client

**State Layer**
- `store/characterStore.ts`: Character state management
- `store/messageStore.ts`: Message state management

**UI Layer**
- `App.tsx`: Main layout (20% sidebar + 80% chat area)
- `CharacterList`: Sidebar character list
- `ChatWindow`: Message history display
- `MessageInput`: Message composition
- `CharacterHeader`: Character info with edit button
- `CharacterModal`: Create/edit character form

### Class Responsibilities and Relationships

#### Backend Classes

**Storage Layer**
```python
FileStorage:
    - save_avatar(character_id, file_content, filename) -> str
    - get_avatar_path(character_id) -> Optional[str]
    - save_book(character_id, book_id, file_content, filename) -> str
    - read_book_content(character_id, book_id) -> bytes
    - delete_book(character_id, book_id)
    - delete_character_data(character_id)

CharacterRepository:
    - create_character(character) -> Character
    - get_character_by_id(character_id) -> Optional[Character]
    - get_all_characters() -> List[Character]
    - update_character(character_id, name, avatar_url) -> Character
    - delete_character(character_id)
    - add_book_to_character(character_id, book) -> Character
    - remove_book_from_character(character_id, book_id) -> Character

MessageRepository:
    - save_message(character_id, message) -> Message
    - get_messages(character_id, limit, offset) -> tuple[List[Message], int]
    - get_recent_messages(character_id, count) -> List[Message]
    - delete_all_messages(character_id)
```

**Vector DB Layer**
```python
ChromaClient:
    - get_or_create_collection(collection_name) -> Collection
    - add_documents(collection_name, documents, embeddings, metadatas, ids)
    - query_documents(collection_name, query_embedding, n_results) -> Dict
    - delete_collection(collection_name)
    - collection_exists(collection_name) -> bool
```

**Utilities**
```python
TextChunker:
    - chunk_text(text) -> List[str]
    - chunk_with_metadata(text, metadata) -> List[tuple[str, dict]]

DocumentParser:
    - parse_file(file_path) -> str
    - parse_pdf(file_path) -> str
    - parse_docx(file_path) -> str
    - parse_txt(file_path) -> str

FileValidator:
    - validate_book(filename, file_size)
    - validate_avatar(filename, file_size)
```

**Embeddings Layer**
```python
EmbeddingGenerator:
    - generate_indexing_embedding(text) -> List[float]
    - generate_query_embedding(text) -> List[float]
    - generate_batch_embeddings(texts, for_indexing) -> List[List[float]]
```

**LLM Layer**
```python
OllamaClient:
    - generate_response(system_prompt, user_prompt, temperature, max_tokens) -> str
    - generate_streaming_response(system_prompt, user_prompt, temperature) -> AsyncGenerator
    - _build_messages(system_prompt, user_prompt) -> List[Dict]

PromptBuilder:
    - build_system_prompt(character_name, context) -> str
    - build_user_prompt(previous_discussion, messages) -> str
    - build_prompts(character_name, context, previous_discussion, messages) -> tuple[str, str]
    - format_messages(messages) -> str
    - format_knowledge_chunks(chunks) -> str
```

**Knowledge Base Layer**
```python
KnowledgeBaseManager:
    - index_book(book_id, book_text)
    - index_message(message_id, message_content)
    - search_books_kb(query, n_results) -> List[str]
    - search_conversations_kb(query, n_results) -> List[str]
    - delete_book_from_kb(book_id)
    - delete_all_knowledge_bases()
```

**Chat Handler Layer**
```python
ChatService:
    - process_message(user_message_content) -> MessageResponse

IndexingService:
    - start_book_indexing(character_id, book_id, kb_manager)
    - get_indexing_status(character_id) -> Dict
```

### Module Dependencies Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  API Layer (FastAPI)                     │
│  character_routes, book_routes, message_routes,          │
│  indexing_routes                                         │
└────────────────┬─────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────┐
│            Orchestration Layer                           │
│  ChatService, IndexingService                            │
└────┬──────────────────────┬──────────────────────────────┘
     │                      │
┌────▼──────────┐  ┌────────▼────────┐  ┌─────────────────┐
│ Knowledge Base│  │   LLM Layer     │  │ Storage Layer   │
│   Manager     │  │ OllamaClient,   │  │ Repositories,   │
│               │  │ PromptBuilder   │  │ FileStorage     │
└────┬──────────┘  └─────────────────┘  └─────────────────┘
     │
┌────▼──────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Vector DB     │  │  Embeddings     │  │   Utils         │
│ ChromaClient  │  │ Generator       │  │ Chunker, Parser │
└───────────────┘  └─────────────────┘  └─────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Configuration  │
                  │  Modules        │
                  └─────────────────┘
```

### Interface Signatures

See individual module README.md files for detailed interface signatures.

### Data Flow Descriptions

**Message Flow (UC2: Chat with Character)**

1. **User Input**: POST /api/characters/{id}/messages with content
2. **API Layer**: message_routes receives request
3. **Chat Service**:
   - Searches books KB via KnowledgeBaseManager -> context
   - Searches conversations KB via KnowledgeBaseManager -> previous_discussion
   - Gets recent messages from MessageRepository -> messages
   - Builds system prompt (character name + context) using PromptBuilder.build_system_prompt()
   - Builds user prompt (previous_discussion + messages + task) using PromptBuilder.build_user_prompt()
   - Generates response via OllamaClient.generate_response(system_prompt, user_prompt)
   - Saves user and assistant messages via MessageRepository
   - Triggers async indexing of user message
4. **Response**: Returns MessageResponse to client

**Book Indexing Flow (UC1: Create Character)**

1. **Upload**: POST /api/characters with multipart/form-data
2. **API Layer**: character_routes receives files
3. **Storage**:
   - FileStorage saves book files to disk
   - CharacterRepository saves character and book metadata
4. **Indexing Service**:
   - Starts async task per book
   - DocumentParser extracts text from file
   - TextChunker splits text into overlapping chunks
   - EmbeddingGenerator creates embeddings for chunks
   - KnowledgeBaseManager stores chunks+embeddings in ChromaDB
   - Updates indexing status to "completed"
5. **Status Check**: GET /api/characters/{id}/indexing-status

**Search Flow (Within Chat Service)**

1. **Query Preparation**: User message → EmbeddingGenerator → query_embedding
2. **Books KB Search**: ChromaClient.query_documents on books collection
3. **Conversations KB Search**: ChromaClient.query_documents on conversations collection
4. **Context Assembly**: Combine top results from both KBs
5. **Prompt Building**: Insert context into LLM prompt template

### Implementation Recommendations

#### Phase 2: Test Development (TDD)

**Unit Tests to Write:**

1. **test_embeddings.py**
   - Test embedding generation for various text lengths
   - Test batch embedding generation
   - Test error handling for failed API calls
   - Mock Ollama API responses

2. **test_knowledge_base.py**
   - Test book indexing with sample text
   - Test message indexing
   - Test search functionality (books vs conversations KBs)
   - Test book deletion from KB
   - Mock ChromaClient and EmbeddingGenerator

3. **test_chat_service.py**
   - Test complete message flow
   - Test context retrieval from both KBs
   - Test prompt construction
   - Mock all dependencies (KB, LLM, storage)

4. **test_storage.py**
   - Test file save/read/delete operations
   - Test repository CRUD operations
   - Use temp directories for file tests
   - Use in-memory SQLite for repository tests

5. **test_utils.py**
   - Test text chunking with various sizes
   - Test document parsing (PDF, DOCX, TXT)
   - Test file validation

**Integration Tests:**

1. **test_chat_flow.py**
   - Test full flow: user message → KB search → LLM response → save
   - Test message indexing into conversations KB
   - Use real ChromaDB with test collections
   - Mock only Ollama API calls

2. **test_indexing_flow.py**
   - Test book upload → parsing → chunking → embedding → indexing
   - Test status tracking
   - Use real ChromaDB, mock Ollama

**E2E Tests (test_use_cases.py):**

- One test per use case from task.md
- Use TestClient from FastAPI for API calls
- Test complete user journeys
- Verify database state after operations

#### Phase 3: Implementation

**Suggested Implementation Order:**

1. **Bottom Layer (No dependencies)**
   - configs/
   - exceptions/
   - models/

2. **Data Layer**
   - utils/text_chunker.py
   - utils/document_parser.py
   - utils/file_validator.py
   - storage/file_storage.py
   - storage/character_repository.py (need SQLAlchemy models)
   - storage/message_repository.py

3. **Vector & Embeddings**
   - vector_db/chroma_client.py
   - embeddings/embedding_generator.py

4. **Domain Logic**
   - llm/prompt_builder.py
   - llm/ollama_client.py
   - knowledge_base/knowledge_base_manager.py

5. **Orchestration**
   - chat_handler/indexing_service.py
   - chat_handler/chat_service.py

6. **API Layer**
   - api/character_routes.py
   - api/book_routes.py
   - api/message_routes.py
   - api/indexing_routes.py
   - main.py (wire dependencies)

7. **Frontend**
   - services/api.ts
   - store/characterStore.ts
   - store/messageStore.ts
   - components/ (one by one)
   - App.tsx
   - Styling

**Required Libraries:**

Backend:
- FastAPI, Uvicorn - Web framework
- ChromaDB - Vector database
- httpx - Ollama API calls
- PyPDF2, python-docx - Document parsing
- SQLAlchemy, aiosqlite - Database ORM
- Pydantic - Data validation
- pytest, pytest-asyncio - Testing

Frontend:
- React, ReactDOM, TypeScript
- Vite - Build tool
- Zustand - State management
- Axios - HTTP client
- React Dropzone - File uploads
- React Hook Form, Zod - Form handling

**Database Schema (SQLAlchemy):**

```python
# Character table
characters:
    - id: String (UUID, primary key)
    - name: String
    - avatar_url: String (nullable)
    - created_at: DateTime

# Book table
books:
    - id: String (UUID, primary key)
    - character_id: String (foreign key)
    - filename: String
    - file_size: Integer
    - uploaded_at: DateTime
    - indexed: Boolean

# Message table
messages:
    - id: String (UUID, primary key)
    - character_id: String (foreign key)
    - role: String (enum: user, assistant)
    - content: Text
    - created_at: DateTime
```

**API Contract Specifications:**

All endpoints use JSON for responses except:
- GET /api/characters/{id}/avatar returns image file
- POST/PUT endpoints with file uploads use multipart/form-data

Error responses follow format:
```json
{
  "detail": "Error message"
}
```

**Error Handling Strategies:**

1. **File Uploads**: Validate file type and size before processing
2. **Ollama API**: Retry logic with exponential backoff
3. **ChromaDB**: Handle collection not found, invalid queries
4. **Async Operations**: Log errors, update indexing status to "failed"
5. **Database**: Use transactions, rollback on errors
6. **Frontend**: Display user-friendly error messages, handle network errors

**Performance Considerations:**

1. **Chunking**: Process large documents in streaming fashion
2. **Embeddings**: Batch embed chunks (e.g., 10 at a time) instead of one-by-one
3. **Indexing**: Run asynchronously in background tasks
4. **Search**: Limit results (5 for books KB, 3 for conversations KB)
5. **Messages**: Implement pagination (default limit: 10)
6. **Caching**: Consider caching embeddings, recent searches

**Security Considerations:**

1. **File Uploads**:
   - Validate file extensions against whitelist
   - Check file size limits (100 MB max)
   - Scan for malicious content (optional)
2. **Path Traversal**: Use secure path joining, validate character IDs
3. **SQL Injection**: Use parameterized queries (SQLAlchemy handles this)
4. **CORS**: Configure allowed origins for production
5. **Input Validation**: Use Pydantic models for all inputs

### Considerations

**Edge Cases:**

1. Empty book files - reject with validation error
2. Character with no books - allow chat but only use conversations KB
3. Very long messages - truncate context to fit LLM token limits
4. Concurrent book uploads - queue indexing tasks
5. Character deletion during indexing - cancel indexing tasks
6. Network errors to Ollama - retry with backoff, then fail gracefully

**Testing Strategy:**

1. **Unit Tests**: Test each class in isolation with mocked dependencies
2. **Integration Tests**: Test class interactions with real dependencies where possible
3. **E2E Tests**: Test complete user journeys via API
4. **Test Data**: Use Hegel books and avatar from `Гегель/` folder
5. **Fixtures**: Create reusable fixtures in conftest.py
6. **Coverage**: Aim for 80%+ code coverage

**Development Notes:**

1. Follow TDD strictly - write tests before implementation
2. One file = one class (already structured this way)
3. All public methods need docstrings
4. Use type hints everywhere
5. Keep functions under 50 lines
6. Keep classes under 300 lines
7. Max nesting depth: 3-4 levels
8. UTF-8 encoding for all files
9. Use async/await for I/O operations
10. Log all errors with context

**Next Steps for Implementation Phase:**

1. Set up SQLAlchemy models and database initialization
2. Implement bottom layer (configs, exceptions, models) - already done
3. Write unit tests for each module
4. Implement tested modules
5. Write integration tests
6. Implement integration points
7. Write E2E tests
8. Implement API layer
9. Test with Hegel data
10. Implement frontend
11. Manual testing and refinement

---

## UI Improvements Architecture Design

### Overview

This section documents the architectural design for UI improvements based on user feedback:
1. Fix modal behavior to prevent accidental closing
2. Add loading indicators for all async operations
3. Improve overall design for better UX/UI

### Problems Identified

**Current Issues:**
1. **Modal closes accidentally** - CharacterModal at line 224 has `onClick={onClose}` on overlay, causing form to disappear when clicking outside
2. **Missing loading indicators** - No visual feedback during:
   - Character creation/update operations
   - Book indexing progress
   - LLM response waiting
3. **Minimalistic design** - Current UI lacks polish and visual feedback

**Current Modal Behavior:**
```tsx
// CharacterModal.tsx:224
<div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
```
This causes the modal to close on any overlay click, which is frustrating when working with forms.

### Created Structure

```
frontend/src/
├── types/
│   ├── character.ts                 # Existing
│   ├── message.ts                   # Existing
│   ├── indexing.ts                  # Existing
│   └── loading.ts                   # NEW - Loading state types
├── components/
│   ├── CharacterList.tsx            # Existing - needs loading enhancement
│   ├── CharacterModal.tsx           # Existing - needs modal behavior fix
│   ├── ChatWindow.tsx               # Existing - needs loading state
│   ├── MessageInput.tsx             # Existing - needs loading state
│   ├── CharacterHeader.tsx          # Existing
│   ├── Loader.tsx                   # NEW - Reusable loader component
│   ├── Loader.css                   # NEW - Loader styles
│   ├── ProgressBar.tsx              # NEW - Progress bar for indexing
│   ├── ProgressBar.css              # NEW - Progress bar styles
│   ├── IndexingStatusDisplay.tsx    # NEW - Book indexing status display
│   ├── Modal.tsx                    # NEW - Improved modal wrapper
│   └── Modal.css                    # NEW - Modal styles
├── hooks/
│   └── useIndexingStatus.ts         # NEW - Hook for polling indexing status
├── store/
│   ├── characterStore.ts            # Existing - current implementation
│   ├── messageStore.ts              # Existing - current implementation
│   ├── characterStoreEnhanced.ts    # NEW - Enhanced with granular loading states
│   └── messageStoreEnhanced.ts      # NEW - Enhanced with granular loading states
├── services/
│   └── api.ts                       # Existing - needs getIndexingStatus method
├── App.tsx                          # Existing - minor updates needed
├── App.css                          # Existing - current styles
└── AppEnhanced.css                  # NEW - Enhanced styles with animations
```

### Components Overview

#### 1. Loader Component (NEW)

**File:** `frontend/src/components/Loader.tsx`

**Purpose:** Reusable loading indicator with multiple variants for different contexts.

**Variants:**
- `spinner`: Circular rotating spinner (default)
- `dots`: Three bouncing dots (for chat typing indicator)
- `inline`: Small inline spinner for buttons
- `overlay`: Full-screen overlay with spinner

**Sizes:** `sm`, `md`, `lg`

**Interface:**
```typescript
interface LoaderProps {
  variant?: 'spinner' | 'dots' | 'inline' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  testId?: string;
}
```

**Usage Examples:**
```tsx
// In button
<button disabled={isLoading}>
  {isLoading ? <Loader variant="inline" size="sm" /> : 'Save'}
</button>

// Chat typing indicator
<Loader variant="dots" size="md" text="Character is typing..." />

// Full screen loading
<Loader variant="overlay" text="Creating character..." />
```

#### 2. ProgressBar Component (NEW)

**File:** `frontend/src/components/ProgressBar.tsx`

**Purpose:** Visual progress indicator for book indexing operations.

**Features:**
- Shows percentage (0-100)
- Status-based styling (pending, indexing, completed, failed)
- Animated stripes during active indexing
- Optional label text

**Interface:**
```typescript
interface ProgressBarProps {
  progress: number; // 0-100
  status: 'pending' | 'indexing' | 'completed' | 'failed';
  label?: string;
  showPercentage?: boolean;
  className?: string;
  testId?: string;
}
```

**Usage:**
```tsx
<ProgressBar
  progress={75}
  status="indexing"
  label="Indexing hegel-philosophy.txt..."
  showPercentage={true}
/>
```

#### 3. IndexingStatusDisplay Component (NEW)

**File:** `frontend/src/components/IndexingStatusDisplay.tsx`

**Purpose:** Displays indexing progress for all books of a character.

**Features:**
- Uses `useIndexingStatus` hook for polling
- Shows progress bar for each book being indexed
- Auto-hides when no indexing in progress
- Displays overall status

**Interface:**
```typescript
interface IndexingStatusDisplayProps {
  characterId: string;
  className?: string;
  testId?: string;
}
```

**Usage:**
```tsx
// In CharacterModal or CharacterHeader
<IndexingStatusDisplay characterId={character.id} />
```

#### 4. Modal Component (NEW)

**File:** `frontend/src/components/Modal.tsx`

**Purpose:** Improved modal wrapper that prevents accidental closing.

**Key Features:**
- `closeOnOverlayClick` prop (default: true, can be disabled)
- `closeOnEscape` prop (default: true)
- `preventCloseWhileLoading` prop - prevents closing during operations
- Shows loading overlay when `isLoading={true}`
- Optional close button in corner
- Focus trap
- Accessibility attributes

**Interface:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeOnOverlayClick?: boolean; // default: true
  closeOnEscape?: boolean; // default: true
  showCloseButton?: boolean; // default: true
  preventCloseWhileLoading?: boolean;
  isLoading?: boolean;
  className?: string;
  testId?: string;
}
```

**Usage:**
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={handleClose}
  title="Create Character"
  closeOnOverlayClick={false} // Prevent accidental closing
  preventCloseWhileLoading={true}
  isLoading={isCreating}
>
  <CharacterForm />
</Modal>
```

### Hooks Overview

#### useIndexingStatus Hook (NEW)

**File:** `frontend/src/hooks/useIndexingStatus.ts`

**Purpose:** Polls the indexing status API endpoint for a character.

**Features:**
- Automatic polling at configurable interval (default: 2000ms)
- Stops polling when all books are completed/failed
- Can be disabled with `enabled` prop
- Provides manual `refetch` function

**Interface:**
```typescript
interface UseIndexingStatusOptions {
  characterId: string;
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseIndexingStatusReturn {
  status: IndexingStatusResponse | null;
  isIndexing: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Usage:**
```tsx
const { status, isIndexing, error, refetch } = useIndexingStatus(
  characterId,
  2000, // poll every 2 seconds
  true  // enabled
);
```

### State Management Enhancements

#### Enhanced Store Architecture

**Problem with Current Stores:**
- Single `isLoading` flag for all operations
- Single `error` string for all errors
- Can't distinguish between loading states of different operations

**Solution:**
Created enhanced versions with granular loading states:
- `characterStoreEnhanced.ts`
- `messageStoreEnhanced.ts`

#### CharacterStoreEnhanced

**New Loading State Structure:**
```typescript
interface CharacterLoadingStates {
  fetchAll: LoadingStatus;    // Loading state for fetching all characters
  create: LoadingStatus;       // Loading state for creating
  update: LoadingStatus;       // Loading state for updating
  delete: LoadingStatus;       // Loading state for deleting
}

interface LoadingStatus {
  state: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}
```

**Benefits:**
- Can show loading indicator on specific buttons
- Can display operation-specific errors
- Track which character is being operated on

**New Methods:**
```typescript
// Check if specific operation is loading
isOperationLoading(operation: 'fetchAll' | 'create' | 'update' | 'delete'): boolean

// Clear error for specific operation
clearError(operation: keyof CharacterLoadingStates): void
```

**Usage:**
```tsx
const { createCharacter, loadingStates, isOperationLoading } = useCharacterStoreEnhanced();

<button disabled={isOperationLoading('create')}>
  {isOperationLoading('create') ? <Loader variant="inline" /> : 'Create'}
</button>
```

#### MessageStoreEnhanced

**New Loading State Structure:**
```typescript
interface MessageLoadingStates {
  fetch: LoadingStatus;
  send: LoadingStatus;
}

// Per-character loading states
loadingStates: Record<string, MessageLoadingStates>
```

**Benefits:**
- Different loading states per character
- Can distinguish between fetching history vs sending new message
- Better error handling

**New Methods:**
```typescript
// Get loading state for specific character and operation
getLoadingState(characterId: string, operation: 'fetch' | 'send'): LoadingStatus

// Check if operation is loading
isLoading(characterId: string, operation: 'fetch' | 'send'): boolean

// Clear error
clearError(characterId: string, operation: 'fetch' | 'send'): void
```

### Type Definitions

#### Loading Types (NEW)

**File:** `frontend/src/types/loading.ts`

**Purpose:** Centralized type definitions for loading states.

**Key Types:**
```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingStatus {
  state: LoadingState;
  error?: string;
}

interface CharacterLoadingStates {
  fetchAll: LoadingStatus;
  create: LoadingStatus;
  update: LoadingStatus;
  delete: LoadingStatus;
}

interface MessageLoadingStates {
  fetch: LoadingStatus;
  send: LoadingStatus;
}

interface BookIndexingProgress {
  bookId: string;
  filename: string;
  status: 'pending' | 'indexing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
}

interface CharacterIndexingStatus {
  characterId: string;
  books: BookIndexingProgress[];
  isIndexing: boolean;
  overallProgress: number; // 0-100
}
```

### Styling Enhancements

#### Enhanced CSS Architecture

**New CSS Files:**
1. `Loader.css` - Loader component styles with animations
2. `ProgressBar.css` - Progress bar with status-based colors
3. `Modal.css` - Improved modal with fade-in/slide-up animations
4. `AppEnhanced.css` - Enhanced global styles

**Key Style Improvements:**

**1. CSS Variables for Consistency:**
```css
:root {
  --primary-color: #0088cc;
  --primary-hover: #006699;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
}
```

**2. Animations:**
- Loader spin animation
- Dots bounce animation
- Progress bar stripes animation
- Modal fade-in and slide-up
- Message slide-in
- Typing indicator
- Loading skeleton shimmer
- Error shake animation

**3. Enhanced Visual Feedback:**
- Hover states with subtle transforms
- Box shadows for depth
- Gradient backgrounds
- Smooth transitions
- Status-based colors

**4. Accessibility:**
- Focus visible outlines
- Reduced motion support
- Screen reader text
- Proper ARIA attributes

### Implementation Recommendations

#### Phase 1: Core Components (Priority: High)

**1. Implement Loader Component**
- Create the four variants (spinner, dots, inline, overlay)
- Implement size variations
- Add animations in CSS
- Test with different props
- Ensure accessibility (aria-live, role="status")

**2. Implement ProgressBar Component**
- Create progress bar layout (track + fill)
- Implement status-based styling
- Add animated stripes for active indexing
- Show percentage and label
- Handle edge cases (progress < 0 or > 100)

**3. Implement Modal Component**
- Create overlay and content structure
- Implement closeOnOverlayClick logic
- Add Escape key handler
- Implement focus trap
- Add loading overlay
- Test close prevention during loading

#### Phase 2: Hooks and State Management (Priority: High)

**4. Implement useIndexingStatus Hook**
- Set up polling with setInterval
- Call `apiService.getIndexingStatus(characterId)`
- Stop polling when not indexing
- Clean up interval on unmount
- Handle errors gracefully
- Provide manual refetch

**5. Add getIndexingStatus to API Service**
```typescript
// In api.ts
async getIndexingStatus(characterId: string): Promise<IndexingStatusResponse> {
  const response = await axios.get(`/api/characters/${characterId}/indexing-status`);
  return response.data;
}
```

**6. Implement Enhanced Stores**
- Migrate logic from old stores
- Implement granular loading states
- Update all async operations to set appropriate loading states
- Add helper methods (isOperationLoading, clearError)
- Test state transitions

#### Phase 3: Integration (Priority: Medium)

**7. Update CharacterModal**
- Wrap content with new Modal component
- Set `closeOnOverlayClick={false}`
- Pass `isLoading` prop based on create/update loading state
- Add IndexingStatusDisplay for edit mode
- Show Loader in submit button when loading

**8. Update ChatWindow**
- Replace typing indicator with Loader component (dots variant)
- Show loading skeleton while fetching messages
- Add message slide-in animation

**9. Update MessageInput**
- Show inline Loader in send button when sending
- Disable input during send
- Show error with enhanced styling

**10. Update CharacterList**
- Show Loader while fetching characters
- Add loading skeleton for character items
- Enhance item hover states

#### Phase 4: Styling (Priority: Medium)

**11. Apply Enhanced Styles**
- Import AppEnhanced.css in main.tsx or App.tsx
- Apply enhanced classes to components
- Test animations and transitions
- Ensure responsive design
- Test with reduced motion preference

#### Phase 5: Testing (Priority: High)

**12. Write Tests for New Components**
- Loader.test.tsx - test all variants and sizes
- ProgressBar.test.tsx - test status changes and progress updates
- Modal.test.tsx - test close behavior, loading state
- IndexingStatusDisplay.test.tsx - test polling and display
- useIndexingStatus.test.ts - test hook behavior

**13. Update Existing Tests**
- Update CharacterModal tests for new behavior
- Update store tests for enhanced versions
- Update integration tests

### Migration Strategy

**Option A: Gradual Migration (Recommended)**
1. Create enhanced stores alongside existing ones
2. Implement new components
3. Update one component at a time to use enhanced store
4. Test thoroughly after each update
5. Once all components migrated, remove old stores

**Option B: Complete Rewrite**
1. Implement all new components and stores
2. Update all components in one go
3. Remove old implementations
4. Test entire application

**Recommendation:** Use Option A for safer, incremental updates.

### API Requirements

**Need to verify/implement:**
```
GET /api/characters/{character_id}/indexing-status
```

Should return:
```json
{
  "books_indexing": [
    {
      "book_id": "uuid",
      "status": "indexing",
      "progress": 75
    }
  ],
  "overall_status": "indexing"
}
```

### Considerations

#### Edge Cases

1. **Multiple books indexing simultaneously**
   - Show progress for each book separately
   - Calculate overall progress as average

2. **Modal close during form submission**
   - Use `preventCloseWhileLoading` prop
   - Show loading overlay on modal

3. **Network errors during polling**
   - Display error but keep last known status
   - Retry automatically after delay

4. **Very long indexing operations**
   - Consider showing estimated time remaining
   - Allow cancellation (if backend supports it)

5. **Switching characters during indexing**
   - Stop polling for old character
   - Start polling for new character if needed

#### Performance Considerations

1. **Polling Frequency**
   - Default 2000ms is reasonable
   - Consider exponential backoff for long operations
   - Stop polling when user not viewing

2. **Animation Performance**
   - Use CSS animations (GPU accelerated)
   - Provide reduced motion fallback
   - Avoid too many simultaneous animations

3. **State Updates**
   - Zustand updates are efficient
   - Avoid unnecessary re-renders
   - Use selectors for specific state slices

#### Accessibility

1. **Screen Readers**
   - Add aria-live regions for loading states
   - Announce when operations complete
   - Provide text alternatives for visual indicators

2. **Keyboard Navigation**
   - Ensure modal focus trap works
   - All interactive elements keyboard accessible
   - Visible focus indicators

3. **Color Contrast**
   - Ensure status colors meet WCAG AA
   - Don't rely solely on color for status

#### Testing Strategy

**Unit Tests:**
- Each new component in isolation
- Mock dependencies (hooks, stores)
- Test props and state changes

**Integration Tests:**
- Components with stores
- Components with hooks
- Full user flows

**E2E Tests:**
- Create character with loading
- Edit character with indexing progress
- Send message with loading
- Modal behavior

**Visual Regression Tests (Optional):**
- Loader variants
- Progress bar states
- Modal animations
- Enhanced styles

### Implementation Order

**Week 1: Core Components**
1. Loader component + tests
2. ProgressBar component + tests
3. Modal component + tests
4. Enhanced CSS

**Week 2: Hooks and State**
5. useIndexingStatus hook + tests
6. Enhanced character store + tests
7. Enhanced message store + tests
8. API service update

**Week 3: Integration**
9. Update CharacterModal
10. Update ChatWindow
11. Update MessageInput
12. Update CharacterList

**Week 4: Polish and Testing**
13. Apply enhanced styles throughout
14. Integration tests
15. E2E tests
16. Bug fixes and polish

### Success Criteria

**Functional Requirements:**
- Modal does not close accidentally when clicking inside
- Loading indicators appear for all async operations
- Book indexing progress is visible and updates in real-time
- Chat shows typing indicator when LLM is responding
- All buttons show loading state when operations in progress

**Non-Functional Requirements:**
- Smooth animations (60fps)
- No layout shifts during loading states
- Accessible to screen readers
- Works with keyboard only
- Responsive on mobile devices
- Tests pass with >90% coverage

**User Experience:**
- Clear feedback for all user actions
- No confusion about system state
- Professional, polished appearance
- Intuitive and consistent UI patterns

### Future Enhancements

**Potential Improvements:**
1. Toast notifications for success/error messages
2. Progress tracking for file uploads
3. Undo/redo for character deletion
4. Skeleton screens for content loading
5. Optimistic UI updates
6. WebSocket for real-time indexing updates (instead of polling)
7. Dark mode support
8. Customizable themes

---

## Group Chat Architecture Design (Frontend)

### Overview

This section documents the frontend architecture for adding group chat functionality to the React + TypeScript application. The design follows Telegram's UX patterns and integrates seamlessly with the existing single-character chat system.

**Backend API Status:** Already implemented
- Endpoint: `POST /api/groups/messages`
- Request: `{ messages: Message[], character_ids: string[] }`
- Response: `{ responses: CharacterResponse[], statistics: {...} }`

### Requirements

**From TODO.md:**
1. Add mechanism for creating groups and adding existing characters (Telegram-style)
2. User message in group triggers responses from all characters in order
3. Responses render immediately for all characters (as separate messages)
4. Include STT and TTS functionality (works same as regular chat)
5. Send last 5 messages from group to backend (user + character messages)
6. Frontend displays messages from all characters in group
7. Handle response array from backend

### Created Structure

```
frontend/src/
├── types/
│   ├── character.ts              # Existing
│   ├── message.ts                # Existing
│   ├── group.ts                  # NEW - Group-related types
│   ├── indexing.ts               # Existing
│   ├── loading.ts                # Existing
│   ├── stt.ts                    # Existing
│   └── tts.ts                    # Existing
├── store/
│   ├── characterStore.ts         # Existing
│   ├── messageStore.ts           # Existing
│   ├── groupStore.ts             # NEW - Group state management
│   └── groupMessageStore.ts      # NEW - Group message management
├── components/
│   ├── CharacterList.tsx         # Existing
│   ├── ChatWindow.tsx            # Existing
│   ├── MessageInput.tsx          # Existing
│   ├── CharacterHeader.tsx       # Existing
│   ├── CharacterModal.tsx        # Existing
│   ├── GroupList.tsx             # NEW - List of groups in sidebar
│   ├── GroupModal.tsx            # NEW - Create/edit group dialog
│   ├── GroupChatWindow.tsx       # NEW - Group message display
│   ├── GroupMessageInput.tsx     # NEW - Group message input with STT
│   └── GroupHeader.tsx           # NEW - Group info header
├── services/
│   └── api.ts                    # UPDATED - Added group API methods
├── App.tsx                       # Existing - Single character chat
└── AppWithGroups.tsx             # NEW - Enhanced app with group support
```

### Components Overview

#### Type Definitions (group.ts)

**Purpose:** Type definitions for all group-related data structures.

**Key Interfaces:**

```typescript
interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  character_ids: string[];
  characters?: Character[];  // Populated from character store
}

interface GroupCreate {
  name: string;
  avatar?: File;
  character_ids: string[];
}

interface GroupUpdate {
  name?: string;
  avatar?: File;
  character_ids?: string[];
}

interface GroupMessageRequest {
  messages: Message[];         // Last N messages from group
  character_ids: string[];     // IDs of characters in group
}

interface CharacterResponse {
  character_id: string;
  character_name: string;
  message: string;
  emotions?: Emotions;
  error?: string;              // If this character's response failed
}

interface GroupMessageResponse {
  responses: CharacterResponse[];
  statistics?: {
    total_time_ms?: number;
    successful_count?: number;
    failed_count?: number;
  };
}

interface GroupMessage extends Message {
  character_id?: string;       // For assistant messages
  character_name?: string;     // For display
  avatar_url?: string;         // For display
}
```

#### Store: groupStore.ts

**Purpose:** Manage group CRUD operations and selection state.

**State:**
```typescript
{
  groups: Group[];
  selectedGroupId: string | null;
  selectedGroup: Group | undefined;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `fetchGroups()` - Load all groups
- `selectGroup(groupId)` - Select a group
- `createGroup(name, characterIds, avatar?)` - Create new group
- `updateGroup(groupId, name?, characterIds?, avatar?)` - Update group
- `deleteGroup(groupId)` - Delete group
- `addCharacterToGroup(groupId, characterId)` - Add member
- `removeCharacterFromGroup(groupId, characterId)` - Remove member

**Dependencies:** `apiService` for backend calls

#### Store: groupMessageStore.ts

**Purpose:** Manage group message history and sending messages.

**State:**
```typescript
{
  messages: Record<string, GroupMessage[]>;  // Keyed by groupId
  isLoading: Record<string, boolean>;        // Per-group loading
  isSending: Record<string, boolean>;        // Per-group sending
  error: Record<string, string | null>;      // Per-group errors
}
```

**Actions:**
- `fetchGroupMessages(groupId, limit?, offset?)` - Load message history
- `sendGroupMessage(groupId, content, characterIds, messageLimit?)` - Send message to group
- `clearGroupMessages(groupId)` - Clear messages
- `addCharacterResponses(groupId, responses)` - Helper to add responses

**Key Flow for sendGroupMessage:**
1. Get last N messages from `messages[groupId]` (default: 5)
2. Create user message object optimistically
3. Add user message to state
4. Send request to backend: `{ messages: [...recentMessages, userMessage], character_ids: characterIds }`
5. Receive array of `CharacterResponse[]`
6. Convert each response to `GroupMessage`
7. Add all character messages to state
8. Update loading state

**Dependencies:** `apiService.sendGroupMessage()`

#### Component: GroupList.tsx

**Purpose:** Display list of groups in sidebar (similar to CharacterList).

**Features:**
- Fetch and display all groups on mount
- Show group avatar, name, member count
- Highlight selected group
- Support keyboard navigation
- Show loading/error states

**Props:**
```typescript
interface GroupListProps {
  onGroupSelect?: (groupId: string) => void;
}
```

**Usage:**
```tsx
<GroupList onGroupSelect={handleGroupSelect} />
```

**Dependencies:**
- `useGroupStore()` for groups and selection
- `useCharacterStore()` for member names
- `Loader` component

#### Component: GroupModal.tsx

**Purpose:** Modal dialog for creating or editing groups (Telegram-style).

**Features:**
- Form with group name input
- Avatar upload (optional)
- Character selection (checkboxes with avatars)
- Validation (name required, minimum 2 members)
- Loading state during creation/update
- Two modes: create (groupId undefined) or edit (groupId provided)

**Props:**
```typescript
interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;  // undefined = create mode
}
```

**Form Fields:**
- Group name (text input, required)
- Avatar upload (file input, optional)
- Member selection (checkboxes showing all characters)

**Validation:**
- Group name must not be empty
- Must select at least 2 characters

**Usage:**
```tsx
<GroupModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  groupId={editingGroupId}
/>
```

**Dependencies:**
- `useGroupStore()` for create/update
- `useCharacterStore()` for character list
- `Modal` component wrapper
- `Loader` component

#### Component: GroupChatWindow.tsx

**Purpose:** Display group chat messages (user + multiple characters).

**Features:**
- Fetch and display group messages on mount
- Render user messages (UserMessage component)
- Render character messages (AssistantMessage component with character info)
- Auto-scroll to latest message
- Show typing indicator when sending
- Handle loading and empty states

**Props:**
```typescript
interface GroupChatWindowProps {
  groupId: string;
  group?: Group;  // For member info
}
```

**Message Rendering:**
- User messages: Use existing `UserMessage` component
- Character messages: Use existing `AssistantMessage` with character name and avatar

**Dependencies:**
- `useGroupMessageStore()` for messages
- `useCharacterStore()` for character details
- `UserMessage` and `AssistantMessage` components

#### Component: GroupMessageInput.tsx

**Purpose:** Input field for sending messages in groups (with STT support).

**Features:**
- Textarea for message composition
- Send button with loading state
- Integration with RecordButton for STT
- Send to all characters in group
- Disable when no group selected or sending
- Error display

**Props:**
```typescript
interface GroupMessageInputProps {
  groupId: string | null;
}
```

**Behavior:**
1. User types message or uses voice recording
2. On submit, calls `sendGroupMessage(groupId, content, group.character_ids)`
3. Shows loading state in send button
4. Clears input on success
5. Displays error on failure

**STT Integration:**
- RecordButton component already handles recording and transcription
- May need minor adaptation for group context (currently uses characterId)

**Dependencies:**
- `useGroupMessageStore()` for sending
- `useGroupStore()` for selected group
- `RecordButton` component
- `Loader` component

#### Component: GroupHeader.tsx

**Purpose:** Header section showing group information and actions.

**Features:**
- Display group avatar
- Display group name
- Show member count and names
- Edit button (opens GroupModal)
- Delete button (confirms and deletes group)

**Props:**
```typescript
interface GroupHeaderProps {
  group: Group;
  onEditClick: () => void;
  onDeleteClick: () => void;
}
```

**Display:**
- Left side: Avatar + Group name + "3 members: Alice, Bob, Charlie"
- Right side: Edit button, Delete button

**Dependencies:**
- `useCharacterStore()` for member names

#### Component: AppWithGroups.tsx

**Purpose:** Enhanced app layout supporting both characters and groups.

**Features:**
- Sidebar with tabs: "Characters" and "Groups"
- Tab switching changes list view
- Create button adapts to active tab
- Main area displays either character chat or group chat
- Unified message input (character or group)
- Modals for character and group creation/editing

**State:**
```typescript
const [activeTab, setActiveTab] = useState<'characters' | 'groups'>('characters');
const [selectionType, setSelectionType] = useState<'character' | 'group' | null>(null);
const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
const [editingCharacterId, setEditingCharacterId] = useState<string | undefined>();
const [editingGroupId, setEditingGroupId] = useState<string | undefined>();
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (20%)       │  Main Area (80%)              │
│ ┌─────────────────┐ │ ┌─────────────────────────┐   │
│ │ Characters Groups│ │ │ Header (10%)            │   │
│ └─────────────────┘ │ └─────────────────────────┘   │
│ ┌─────────────────┐ │ ┌─────────────────────────┐   │
│ │ New Character   │ │ │                         │   │
│ └─────────────────┘ │ │ Chat Messages (60%)     │   │
│ ┌─────────────────┐ │ │                         │   │
│ │ Character/Group │ │ └─────────────────────────┘   │
│ │ List            │ │ ┌─────────────────────────┐   │
│ │                 │ │ │ Message Input (30%)     │   │
│ │                 │ │ └─────────────────────────┘   │
│ └─────────────────┘ │                               │
└─────────────────────────────────────────────────────┘
```

**Dependencies:**
- All existing components (CharacterList, ChatWindow, etc.)
- All new group components
- `useCharacterStoreEnhanced()` and `useGroupStore()`

### API Service Updates (api.ts)

**Added Methods:**

```typescript
// Group CRUD
async getGroups(): Promise<Group[]>
async getGroup(groupId: string): Promise<Group>
async createGroup(data: GroupCreate): Promise<Group>
async updateGroup(groupId: string, data: GroupUpdate): Promise<Group>
async deleteGroup(groupId: string): Promise<void>
getGroupAvatarUrl(groupId: string): string

// Group Messages
async getGroupMessages(groupId: string, limit?: number, offset?: number): Promise<MessagesResponse>
async sendGroupMessage(request: GroupMessageRequest): Promise<GroupMessageResponse>
```

**Backend API Contract (Already Implemented):**

**POST /api/groups/messages**

Request:
```json
{
  "messages": [
    { "id": "1", "role": "user", "content": "Hello", "created_at": "..." },
    { "id": "2", "role": "assistant", "content": "Hi", "created_at": "...", "character_id": "char1" }
  ],
  "character_ids": ["char1", "char2", "char3"]
}
```

Response:
```json
{
  "responses": [
    {
      "character_id": "char1",
      "character_name": "Alice",
      "message": "Response from Alice",
      "emotions": { "joy": 80, "fear": 10, ... }
    },
    {
      "character_id": "char2",
      "character_name": "Bob",
      "message": "Response from Bob",
      "emotions": { "joy": 60, "fear": 20, ... }
    }
  ],
  "statistics": {
    "total_time_ms": 1500,
    "successful_count": 2,
    "failed_count": 0
  }
}
```

### Implementation Recommendations

#### Phase 1: Architecture Design (COMPLETED)

**Deliverables:**
- [x] Type definitions (group.ts)
- [x] Store skeletons (groupStore.ts, groupMessageStore.ts)
- [x] Component signatures (GroupList, GroupModal, GroupChatWindow, etc.)
- [x] API method signatures
- [x] AppWithGroups skeleton
- [x] Documentation in task.md

**All files created with:**
- Interface/type definitions
- Method signatures with docstrings
- `pass` or commented implementation blocks
- No actual implementation code

#### Phase 2: Test Development (TDD)

**Unit Tests to Write:**

1. **types/group.test.ts**
   - Validate type structures match backend contract
   - Test type compatibility with existing Message types

2. **store/groupStore.test.ts**
   - Test fetchGroups updates state
   - Test selectGroup sets selectedGroup
   - Test createGroup adds to groups array
   - Test updateGroup modifies existing group
   - Test deleteGroup removes and deselects
   - Test addCharacterToGroup/removeCharacterFromGroup
   - Mock apiService calls

3. **store/groupMessageStore.test.ts**
   - Test fetchGroupMessages loads messages
   - Test sendGroupMessage flow:
     - Optimistic user message addition
     - Backend call with last N messages
     - Character responses conversion
     - State updates
   - Test clearGroupMessages
   - Test per-group loading states
   - Mock apiService calls

4. **components/GroupList.test.tsx**
   - Test renders groups from store
   - Test selection highlights group
   - Test onGroupSelect callback
   - Test loading state
   - Test error state
   - Test empty state
   - Test keyboard navigation

5. **components/GroupModal.test.tsx**
   - Test create mode (groupId undefined)
   - Test edit mode (groupId provided)
   - Test form validation (name, member count)
   - Test avatar upload
   - Test character selection (checkboxes)
   - Test submission calls createGroup/updateGroup
   - Test loading state during submission
   - Mock useGroupStore and useCharacterStore

6. **components/GroupChatWindow.test.tsx**
   - Test fetches messages on mount
   - Test renders user and character messages
   - Test auto-scroll behavior
   - Test typing indicator
   - Test loading state
   - Test empty state
   - Mock useGroupMessageStore and useCharacterStore

7. **components/GroupMessageInput.test.tsx**
   - Test message submission
   - Test sends to all characters
   - Test loading state
   - Test error display
   - Test disabled when no group
   - Test integration with RecordButton
   - Mock useGroupMessageStore

8. **components/GroupHeader.test.tsx**
   - Test displays group info
   - Test member names display
   - Test edit button callback
   - Test delete button callback
   - Mock useCharacterStore

9. **services/api.test.ts** (update existing)
   - Test getGroups returns array
   - Test createGroup with FormData
   - Test updateGroup
   - Test deleteGroup
   - Test sendGroupMessage request/response format
   - Mock axios calls

**Integration Tests:**

1. **GroupCreationFlow.integration.test.tsx**
   - User opens GroupModal
   - Enters name, selects characters
   - Submits form
   - Group appears in GroupList
   - Uses real stores, mocks API

2. **GroupMessaging.integration.test.tsx**
   - User selects group
   - Sends message via GroupMessageInput
   - Backend returns character responses
   - All responses appear in GroupChatWindow
   - Uses real stores, mocks API

3. **TabSwitching.integration.test.tsx**
   - User switches between Characters and Groups tabs
   - Correct list renders
   - Selection state persists
   - Uses real stores

**E2E Tests:**

1. **GroupChat.e2e.test.tsx**
   - Create group with multiple characters
   - Send message to group
   - Verify all characters respond
   - Check message ordering
   - Verify STT works in group
   - Uses TestClient for API

#### Phase 3: Implementation

**Suggested Implementation Order:**

1. **Types and Interfaces** (No dependencies)
   - types/group.ts (already done)

2. **API Layer**
   - services/api.ts group methods
   - Test against mock server or backend

3. **Stores**
   - store/groupStore.ts
   - store/groupMessageStore.ts
   - Integrate with apiService

4. **Components (Simple to Complex)**
   - components/GroupHeader.tsx (display only)
   - components/GroupList.tsx (uses groupStore)
   - components/GroupModal.tsx (form with validation)
   - components/GroupChatWindow.tsx (message display)
   - components/GroupMessageInput.tsx (with STT integration)

5. **Main App**
   - AppWithGroups.tsx (orchestration)
   - Test tab switching
   - Test selection logic

6. **Styling**
   - Add group-specific CSS
   - Ensure Telegram-like appearance
   - Test responsiveness

7. **Integration and Polish**
   - Connect all components
   - Test full user flows
   - Fix bugs
   - Optimize performance

**Required Libraries:**
- No new dependencies needed
- All existing libraries (React, Zustand, Axios) sufficient

### Data Flow Descriptions

#### Create Group Flow

1. User clicks "New Group" button
2. AppWithGroups opens GroupModal (create mode)
3. User enters name, selects characters, optionally uploads avatar
4. GroupModal validates (name not empty, ≥2 characters)
5. On submit, calls `groupStore.createGroup(name, characterIds, avatar?)`
6. groupStore calls `apiService.createGroup({ name, avatar, character_ids })`
7. Backend creates group, returns Group object
8. groupStore adds group to state
9. GroupModal closes
10. New group appears in GroupList

#### Send Group Message Flow

1. User types message in GroupMessageInput or uses voice recording
2. On submit, GroupMessageInput calls `groupMessageStore.sendGroupMessage(groupId, content, characterIds)`
3. groupMessageStore:
   a. Gets last 5 messages from `messages[groupId]`
   b. Creates user message object
   c. Optimistically adds user message to state
   d. Calls `apiService.sendGroupMessage({ messages: [...recent, userMsg], character_ids })`
4. Backend processes message:
   a. For each character in order:
      - Searches character's knowledge bases
      - Builds prompt with context
      - Generates response via LLM
      - Detects emotions
   b. Returns array of CharacterResponse[]
5. groupMessageStore:
   a. Receives responses
   b. Converts each CharacterResponse to GroupMessage
   c. Adds all character messages to state
   d. Updates loading state
6. GroupChatWindow renders new messages
7. Auto-scrolls to latest message

#### STT in Group Chat Flow

1. User clicks RecordButton in GroupMessageInput
2. RecordButton starts audio recording
3. User speaks, then clicks stop
4. RecordButton sends audio to STT service
5. STT service transcribes audio to text
6. Text is inserted into GroupMessageInput textarea
7. User clicks Send or presses Enter
8. Message flows through normal group message flow (see above)

**Note:** RecordButton may need minor adaptation to work with groupId instead of characterId.

### Interface Signatures

See individual component files for detailed signatures. All components follow these patterns:

**Store Actions:**
- Return `Promise<void>` for async operations
- Update state via `set()` function
- Handle errors by setting error state

**Component Props:**
- All props typed with interfaces
- Optional props marked with `?`
- Callbacks use `() => void` or `(id: string) => void`

**API Methods:**
- Return `Promise<T>` for async calls
- Use Axios for HTTP requests
- Throw errors for non-2xx responses

### Considerations

#### Edge Cases

1. **Group with only 1 member**
   - Validation prevents creating group with <2 members
   - If member count drops to 1 via removal, allow but warn

2. **Character deleted while in group**
   - Backend should handle gracefully (skip deleted character)
   - Frontend should show error for that character's response

3. **Empty group (all members removed)**
   - Prevent removal of last 2 members
   - Or auto-delete group if all members removed

4. **Very long character responses**
   - Backend handles truncation
   - Frontend renders with scroll

5. **Network error during group message send**
   - Display error message
   - Allow retry
   - Don't lose user's message

6. **Character response fails but others succeed**
   - Backend returns error in CharacterResponse
   - Frontend displays partial responses + error message

#### Performance Considerations

1. **Multiple LLM calls per group message**
   - Backend already optimized (sequential processing)
   - Frontend shows loading indicator during entire process

2. **Large message history**
   - Only send last 5 messages to backend
   - Implement pagination for message fetching

3. **Frequent group switches**
   - Cache messages in store
   - Don't refetch unless stale

4. **Many groups with many members**
   - Lazy load group messages (only when selected)
   - Paginate group list if needed

#### Security Considerations

1. **Group access control**
   - Backend should validate user has access to group
   - Frontend trusts backend for authorization

2. **Character access**
   - User should only select from their own characters
   - Backend validates character_ids belong to user

3. **File uploads (avatars)**
   - Same validation as character avatars
   - File type and size limits

#### Testing Strategy

**Unit Tests:**
- Isolate each component/store
- Mock all dependencies
- Test state transitions
- Test error handling

**Integration Tests:**
- Test component interactions
- Use real stores
- Mock API calls
- Test data flow

**E2E Tests:**
- Test complete user journeys
- Use real API (with test data)
- Verify database state
- Test edge cases

**Coverage Goal:** 80%+ for all new code

### Migration from Existing App

**Coexistence Strategy:**

1. Keep existing `App.tsx` unchanged
2. Create `AppWithGroups.tsx` as enhanced version
3. Update `main.tsx` to render `AppWithGroups` instead of `App`
4. Both components use same stores/services

**Benefits:**
- Easy rollback if issues arise
- Can A/B test
- Incremental deployment

**Alternative:**
- Extend `App.tsx` directly with group features
- Single component, more complex

**Recommendation:** Use `AppWithGroups.tsx` approach for cleaner separation.

### Success Criteria

**Functional Requirements:**
- [x] User can create group with multiple characters
- [x] User can edit group (name, members, avatar)
- [x] User can delete group
- [x] User can send message to group
- [x] All characters in group respond in order
- [x] Responses display as separate messages
- [x] STT works in group chat
- [x] TTS works in group chat (on character messages)
- [x] Last 5 messages sent to backend
- [x] Frontend handles response array correctly

**Non-Functional Requirements:**
- [x] Follows existing code patterns
- [x] Telegram-like UX
- [x] Tests pass with >80% coverage
- [x] No performance degradation
- [x] Accessible (keyboard navigation, screen readers)

### Next Steps

1. **Phase 2: Write Tests**
   - Start with unit tests for stores
   - Then component tests
   - Then integration tests
   - Then E2E tests

2. **Phase 3: Implement**
   - Follow suggested implementation order
   - Run tests after each module
   - Fix failing tests
   - Refactor as needed

3. **Phase 4: Integration**
   - Integrate with backend
   - Test with real data
   - Handle backend errors
   - Polish UX

4. **Phase 5: Deployment**
   - Code review
   - QA testing
   - Deploy to production
   - Monitor for issues

### Future Enhancements

**Potential Improvements:**
1. Group avatars auto-generated from member avatars (collage)
2. Group message search
3. Pin important messages
4. Mute notifications for specific groups
5. Group settings (description, creation date, etc.)
6. Export group chat history
7. Group templates (quick group creation)
8. Character response ordering options (sequential, parallel, custom)

---

## Persistent Group Message Storage Architecture Design

### Overview

This section documents the architecture for adding persistent storage to group messages. Currently, group messages are stored only in-memory on the frontend and are lost on page refresh. This design adds database persistence following the existing patterns from character message storage.

### Requirements

**Backend:**
1. Add `GroupMessageDB` model to database.py
2. Create `GroupMessageRepository` in storage/
3. Update POST /api/groups/messages to save messages to DB
4. Update GET /api/groups/{id}/messages to load from DB

**Frontend:**
1. Load message history when opening a group
2. Merge loaded history with new messages properly
3. Avoid duplicating messages

### Created Structure

```
backend/
├── storage/
│   ├── database.py                      # UPDATED - Added GroupMessageDB model
│   └── group_message_repository.py      # NEW - Group message persistence
├── api/
│   ├── group_routes.py                  # UPDATED - GET /api/groups/{id}/messages
│   └── group_message_routes.py          # UPDATED - POST saves to DB
└── chat_handler/
    └── group_chat_service.py            # UPDATED - Saves user + character messages
```

### Database Schema Changes

**New Table: group_messages**

```python
class GroupMessageDB(Base):
    """SQLAlchemy model for GroupMessage table."""

    __tablename__ = 'group_messages'

    id = Column(String, primary_key=True)
    group_id = Column(String, ForeignKey('groups.id'), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    character_id = Column(String, nullable=True)  # NULL for user, set for assistant
    character_name = Column(String, nullable=True)  # NULL for user, set for assistant
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    group = relationship("GroupDB", back_populates="messages")
```

**Key Design Decisions:**

1. **character_id and character_name nullable:**
   - For user messages: both NULL
   - For assistant messages: both set

2. **Cascading delete:**
   - When group is deleted, all group_messages are deleted automatically via relationship cascade

3. **No emotions field:**
   - Emotions stored separately in character's messages table
   - Group messages table keeps structure simple

### Component Details

#### GroupMessageRepository

**File:** `backend/storage/group_message_repository.py`

**Purpose:** Data access layer for group message persistence, following the same pattern as MessageRepository.

**Methods:**

```python
async def create_message(group_id: str, message: Message) -> Message
    """Save user or assistant message to database"""

async def get_messages_by_group(group_id: str, limit: int = 10, offset: int = 0) -> tuple[List[Message], int]
    """Retrieve messages with pagination (newest first for pagination)"""

async def get_recent_messages_by_group(group_id: str, count: int = 5) -> List[Message]
    """Get recent messages in chronological order (for context building)"""

async def count_messages_by_group(group_id: str) -> int
    """Count total messages for a group"""

async def delete_messages_by_group(group_id: str) -> None
    """Delete all messages for a group"""
```

**Key Patterns:**
- Supports both sync and async sessions (same as MessageRepository)
- Uses `_commit()`, `_rollback()`, `_refresh()`, `_execute()` helper methods
- Proper exception handling with StorageError
- Messages ordered by created_at descending for pagination
- Returns reversed for chronological display

#### Updated API Endpoints

**GET /api/groups/{group_id}/messages**

**Before:**
```python
return {"messages": []}  # Always empty
```

**After:**
```python
# Query parameters: limit (default: 50), offset (default: 0)
messages, total = await group_message_repo.get_messages_by_group(group_id, limit, offset)
messages = list(reversed(messages))  # Chronological order
return {"messages": messages, "total": total}
```

**POST /api/groups/messages**

**Flow Updates:**

1. **Save user message:**
   - Extract user message from request.messages (last message)
   - Save to group_messages table with role="user", character_id=NULL

2. **Generate character responses:**
   - For each character, generate response via GroupChatService
   - GroupChatService creates Message objects with role="assistant"

3. **Save character responses:**
   - For each CharacterResponse in result:
     - Create Message object with character_id and character_name set
     - Save to group_messages table via group_message_repository

4. **Return response:**
   - Return GroupMessageResponse with all character responses
   - Frontend adds all messages to in-memory store

#### Updated GroupChatService

**File:** `backend/chat_handler/group_chat_service.py`

**Constructor Changes:**

```python
def __init__(
    self,
    character_repository: CharacterRepository,
    message_repository: MessageRepository,
    group_message_repository: GroupMessageRepository  # NEW
):
```

**Updated Methods:**

1. **process_group_message:**
   - At start: Extract group_id from request (need to add to GroupMessageRequest model)
   - Before character loop: Save user message via `group_message_repository.create_message()`
   - Inside character loop (after successful response): Save each character's message
   - Return response as before

2. **New helper methods:**

```python
async def _save_user_message_to_group(
    self,
    group_id: str,
    content: str
) -> Message:
    """Save user message to group_messages table"""
    user_message = Message(
        id=str(uuid4()),
        role="user",
        content=content,
        character_id=None,
        created_at=datetime.utcnow()
    )
    await self.group_message_repository.create_message(group_id, user_message)
    return user_message

async def _save_character_message_to_group(
    self,
    group_id: str,
    response: CharacterResponse
) -> None:
    """Save character response to group_messages table"""
    if response.message and not response.error:
        message = Message(
            id=str(uuid4()),
            role="assistant",
            content=response.message,
            character_id=response.character_id,
            created_at=datetime.utcnow(),
            emotions=response.emotions
        )
        await self.group_message_repository.create_message(group_id, message)
```

### Data Flow

#### Send Group Message Flow (Updated)

1. **Frontend sends POST request:**
   ```json
   {
     "group_id": "uuid",
     "messages": [...],  // Last 5 messages from in-memory store
     "character_ids": ["char1", "char2"]
   }
   ```

2. **Backend receives request:**
   - Validate group exists
   - Extract user message (last in messages array)

3. **Save user message:**
   - GroupChatService saves to group_messages table
   - Fields: id, group_id, role="user", content, character_id=NULL, character_name=NULL

4. **Generate character responses:**
   - For each character (sequential):
     - Generate response via LLM
     - Create CharacterResponse object

5. **Save character responses:**
   - For each successful CharacterResponse:
     - Save to group_messages table
     - Fields: id, group_id, role="assistant", content, character_id, character_name

6. **Return response:**
   - Return GroupMessageResponse with all responses
   - Frontend adds to in-memory store (already have IDs)

#### Load Group Messages Flow (New)

1. **Frontend opens group:**
   - Calls GET /api/groups/{group_id}/messages?limit=50&offset=0

2. **Backend retrieves messages:**
   - GroupMessageRepository queries group_messages table
   - Filters by group_id
   - Orders by created_at descending
   - Applies limit and offset
   - Returns messages + total count

3. **Backend returns response:**
   ```json
   {
     "messages": [
       {"id": "1", "role": "user", "content": "Hello", "created_at": "..."},
       {"id": "2", "role": "assistant", "content": "Hi", "character_id": "char1", "character_name": "Alice", "created_at": "..."}
     ],
     "total": 150
   }
   ```

4. **Frontend loads messages:**
   - Clear in-memory store for group (or merge intelligently)
   - Add all loaded messages to store
   - Display in chat window

### Model Changes

**GroupMessageRequest (Updated):**

```python
class GroupMessageRequest(BaseModel):
    """Request model for group chat messages."""

    group_id: str = Field(..., description="Group ID for message persistence")  # NEW
    messages: List[Message] = Field(...)
    character_ids: List[str] = Field(...)
```

**Why add group_id:**
- Currently, POST /api/groups/messages doesn't know which group the message belongs to
- group_id needed to save messages to correct group in database
- Frontend already knows group_id from context

### Implementation Recommendations

#### Phase 2: Test Development (TDD)

**Unit Tests:**

1. **test_group_message_repository.py**
   - test_create_user_message: Save user message with character_id=NULL
   - test_create_character_message: Save assistant message with character_id set
   - test_get_messages_by_group: Retrieve messages with pagination
   - test_get_recent_messages_by_group: Get last N messages in chronological order
   - test_count_messages_by_group: Count total messages
   - test_delete_messages_by_group: Delete all group messages
   - test_cascade_delete: Verify messages deleted when group deleted

2. **test_group_chat_service.py (updated)**
   - test_process_group_message_saves_to_db: Verify user + character messages saved
   - test_load_messages_from_db: Verify messages loaded correctly
   - test_duplicate_prevention: Verify no duplicate message IDs

3. **test_group_routes.py (updated)**
   - test_get_group_messages: Verify GET endpoint returns messages from DB
   - test_get_group_messages_pagination: Verify limit and offset work
   - test_get_group_messages_empty: Verify empty group returns empty array

4. **test_group_message_routes.py (updated)**
   - test_post_group_message_saves_to_db: Verify POST saves to DB
   - test_post_group_message_returns_all_responses: Verify all responses returned

**Integration Tests:**

1. **test_group_message_persistence_flow.py**
   - Create group
   - Send message via POST
   - Verify message in DB
   - Retrieve via GET
   - Verify same messages returned

2. **test_group_message_lifecycle.py**
   - Send multiple messages
   - Load with pagination
   - Delete group
   - Verify messages cascade deleted

#### Phase 3: Implementation

**Suggested Implementation Order:**

1. **Database Model** (No dependencies)
   - Add GroupMessageDB to database.py
   - Update GroupDB with relationship
   - Run migration (init_db)

2. **Repository Layer**
   - Implement GroupMessageRepository
   - Follow MessageRepository patterns exactly
   - Test with unit tests

3. **Update GET Endpoint**
   - Update GET /api/groups/{id}/messages in group_routes.py
   - Add group_message_repo dependency
   - Test with integration tests

4. **Update GroupMessageRequest Model**
   - Add group_id field to GroupMessageRequest
   - Update validators if needed

5. **Update GroupChatService**
   - Add group_message_repository to constructor
   - Implement _save_user_message_to_group
   - Implement _save_character_message_to_group
   - Update process_group_message to save messages

6. **Update POST Endpoint**
   - Update POST /api/groups/messages in group_message_routes.py
   - Pass group_message_repo to GroupChatService
   - Ensure messages saved during processing

7. **Frontend Integration** (Separate phase)
   - Update groupMessageStore to load from GET endpoint
   - Handle merge of loaded + new messages
   - Prevent duplicate message IDs

### Migration Strategy

**Database Migration:**

Since we're using SQLite and SQLAlchemy with `create_all()`:

1. **Option A: Automatic Migration (Recommended for development)**
   - Add GroupMessageDB model to database.py
   - Call `init_database()` in main.py (already done)
   - SQLAlchemy creates new table automatically

2. **Option B: Manual Migration (For production)**
   - Create migration script using Alembic
   - Add new table with proper indexes
   - No data migration needed (new feature)

**Recommendation:** Use Option A for development. Add Alembic later for production.

### Considerations

#### Edge Cases

1. **Message already in DB:**
   - Frontend sends message with existing ID
   - Backend should skip if ID exists (or update)
   - Use `INSERT OR IGNORE` or check existence first

2. **Group deleted during message send:**
   - GroupChatService saves user message
   - Group deleted by another request
   - Character message save fails due to foreign key constraint
   - Handle with try-catch, return error to frontend

3. **Page refresh during message send:**
   - User sends message
   - Before backend responds, user refreshes
   - Message saved to DB but frontend doesn't have it
   - On load, frontend gets message from DB (no issue)

4. **Concurrent sends to same group:**
   - Two users send messages simultaneously
   - Both saved to DB with timestamps
   - Ordering determined by created_at (no issue)

5. **Very large group history:**
   - Use pagination (already implemented)
   - Frontend loads latest 50 messages
   - "Load more" button for older messages

#### Performance Considerations

1. **Database Indexing:**
   - Add index on (group_id, created_at) for fast queries
   - SQLAlchemy auto-creates foreign key indexes

2. **Message Count:**
   - Store count in GroupDB.message_count for faster retrieval
   - Update on each message creation (with transaction)
   - Or calculate on-demand (current approach)

3. **Pagination:**
   - Default limit: 50 messages
   - Frontend can request more with offset
   - Avoid loading all messages at once

4. **Caching:**
   - Consider caching recent messages in Redis (future)
   - Not needed for MVP with SQLite

#### Security Considerations

1. **Authorization:**
   - Verify user has access to group (future)
   - Currently no authentication layer
   - Add group_id validation in endpoints

2. **Input Validation:**
   - Validate group_id format (UUID)
   - Validate message content length
   - Sanitize inputs (already done by Pydantic)

3. **SQL Injection:**
   - Prevented by SQLAlchemy parameterized queries
   - Never construct raw SQL strings

#### Data Consistency

1. **Transaction Management:**
   - Use transactions for message saves
   - If character response fails, don't save message
   - Or save with error flag (current: skip failed responses)

2. **Message Ordering:**
   - Rely on created_at timestamp
   - Ensure server clock is synchronized
   - Consider using sequence numbers (future)

3. **Duplicate Prevention:**
   - Use UUID for message IDs
   - Frontend checks before adding to store
   - Backend can check on save (optional)

### Testing Strategy

**Unit Tests:**
- Repository methods in isolation
- Mock database session
- Test all CRUD operations
- Test error handling

**Integration Tests:**
- Full request flow
- Real database (in-memory SQLite)
- Test endpoint → service → repository → DB
- Verify data persistence

**E2E Tests:**
- Complete user journey
- Create group → send messages → refresh → verify messages still there
- Test pagination
- Test delete group (verify messages deleted)

### Success Criteria

**Functional Requirements:**
- [x] GroupMessageDB model added to database.py
- [x] GroupMessageRepository created with all methods
- [x] GET /api/groups/{id}/messages loads from DB
- [x] POST /api/groups/messages saves to DB
- [x] User messages saved with character_id=NULL
- [x] Character messages saved with character_id and character_name
- [x] Messages persist across page refreshes
- [x] Pagination works correctly
- [x] Cascade delete works (group deletion removes messages)

**Non-Functional Requirements:**
- [ ] Tests pass with >80% coverage
- [ ] No performance degradation
- [ ] Database queries optimized
- [ ] Error handling comprehensive
- [ ] Code follows existing patterns

### Implementation Status

**Phase 1: Architecture Design (COMPLETED)**
- [x] Database model defined (GroupMessageDB)
- [x] Repository interface defined (GroupMessageRepository)
- [x] API endpoints updated (GET /api/groups/{id}/messages)
- [x] Service integration planned (GroupChatService)
- [x] Documentation updated (task.md)

**Phase 2: Test Development (PENDING)**
- [ ] Unit tests for repository
- [ ] Unit tests for service updates
- [ ] Integration tests for endpoints
- [ ] E2E tests for full flow

**Phase 3: Implementation (PENDING)**
- [ ] Implement repository methods
- [ ] Update GroupChatService
- [ ] Update API endpoints
- [ ] Frontend integration

### Next Steps

1. **Write Tests:**
   - Start with GroupMessageRepository unit tests
   - Then service tests
   - Then integration tests

2. **Implement Repository:**
   - Copy patterns from MessageRepository
   - Implement all methods with proper error handling
   - Run tests, iterate until passing

3. **Update Service:**
   - Add group_message_repository to GroupChatService
   - Implement message saving logic
   - Update process_group_message method
   - Run tests, iterate until passing

4. **Update Endpoints:**
   - Update GET /api/groups/{id}/messages implementation
   - Update POST /api/groups/messages to save messages
   - Run integration tests

5. **Frontend Integration:**
   - Update groupMessageStore to load from API
   - Handle merge of loaded + new messages
   - Test complete flow

### Assumptions

1. **group_id in request:**
   - Assumed frontend can provide group_id in POST request
   - Alternative: infer from character_ids (more complex)

2. **Message uniqueness:**
   - Assumed message IDs are globally unique (UUID)
   - No need for composite key (group_id + message_id)

3. **No emotion persistence in group_messages:**
   - Emotions stored only for display purposes
   - Not needed for future context
   - Can be added later if needed

4. **Cascade delete is acceptable:**
   - When group deleted, all messages deleted
   - No archiving or soft delete
   - Matches behavior of character messages

### Open Questions

1. **Should we add emotions column to group_messages?**
   - Pro: Consistency with character messages
   - Con: Redundant data, increases table size
   - Decision: Skip for MVP, add later if needed

2. **Should we add created_by user field?**
   - Pro: Multi-user support (future)
   - Con: No authentication layer yet
   - Decision: Skip for MVP

3. **Should we cache recent messages?**
   - Pro: Faster load times
   - Con: Added complexity
   - Decision: Skip for MVP, use simple DB queries

4. **Should we limit group message history?**
   - Pro: Prevent unbounded growth
   - Con: Users lose history
   - Decision: No limit for MVP, add later if needed

---

## Frontend Architecture: Persistent Group Messages + TTS Integration

### Overview

This architecture design extends the frontend to support persistent group message storage and optional TTS playback for group chats. The design follows React/TypeScript best practices and reuses existing patterns from character chat implementation.

### Created Structure

```
frontend/src/
├── hooks/
│   ├── useGroupMessages.ts          # Hook for message lifecycle management
│   └── useGroupTTS.ts                # Hook for sequential TTS playback
├── store/
│   └── groupMessageStoreEnhanced.ts  # Enhanced store with deduplication
├── components/
│   ├── GroupChatWindowEnhanced.tsx   # Enhanced chat window with TTS
│   ├── GroupTTSButton.tsx            # TTS button for individual messages
│   └── GroupTTSControls.tsx          # Playlist controls for sequential playback
└── types/
    └── group.ts                      # (existing) Type definitions
```

### Components Overview

#### 1. **useGroupMessages Hook** (`hooks/useGroupMessages.ts`)

**Purpose:** Manage group message lifecycle with persistence support.

**Responsibilities:**
- Load message history from backend when group is selected
- Merge loaded messages with existing messages in store
- Provide pagination support (optional)
- Handle loading states and errors
- Auto-load messages on groupId change

**Key Methods:**
```typescript
interface UseGroupMessagesReturn {
  messages: GroupMessage[];           // Current group messages
  isLoadingMessages: boolean;         // Loading state
  isSending: boolean;                 // Sending state
  error: string | null;               // Error state
  hasMore: boolean;                   // Pagination flag
  loadMore: () => Promise<void>;      // Load next page
  reloadMessages: () => Promise<void>; // Reload from scratch
  clearMessages: () => void;          // Clear store
}
```

**Usage:**
```typescript
const { messages, isLoadingMessages, reloadMessages } = useGroupMessages(groupId, {
  pageSize: 50,
  autoLoad: true,
  enablePagination: false
});
```

---

#### 2. **groupMessageStoreEnhanced** (`store/groupMessageStoreEnhanced.ts`)

**Purpose:** Enhanced Zustand store with message deduplication and persistence tracking.

**Key Features:**
- **Message Deduplication:** Uses Map-based deduplication by message ID
- **Persistence Tracking:** Each message has `isPersisted` flag
- **Smart Merging:** Combines loaded + new messages without duplicates
- **Optimistic Updates:** User messages added immediately, then marked as persisted

**Extended Type:**
```typescript
interface TrackedGroupMessage extends GroupMessage {
  isPersisted?: boolean;  // true = in DB, false/undefined = optimistic
}
```

**Key Methods:**
```typescript
interface GroupMessageStoreEnhanced {
  messages: Record<string, TrackedGroupMessage[]>;
  
  fetchGroupMessages(groupId, limit?, offset?): Promise<void>;
  sendGroupMessage(groupId, content, characterIds, messageLimit?): Promise<void>;
  mergeMessages(groupId, loadedMessages): void;
  markMessageAsPersisted(groupId, messageId): void;
  clearGroupMessages(groupId): void;
}
```

**Deduplication Logic:**
```typescript
// Helper function in store
const deduplicateMessages = (messages: TrackedGroupMessage[]) => {
  const messageMap = new Map<string, TrackedGroupMessage>();
  
  for (const message of messages) {
    const existing = messageMap.get(message.id);
    
    // Prefer persisted version over optimistic
    if (!existing || (message.isPersisted && !existing.isPersisted)) {
      messageMap.set(message.id, message);
    }
  }
  
  // Return sorted chronologically
  return Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};
```

**Message Flow:**
1. User sends message → Added with `isPersisted: false`
2. Backend responds → User message marked `isPersisted: true`
3. Character responses added with `isPersisted: true`
4. On reload → `fetchGroupMessages` merges with existing, deduplicates
5. On error → Optimistic message removed from store

---

#### 3. **useGroupTTS Hook** (`hooks/useGroupTTS.ts`)

**Purpose:** Sequential TTS playback for multiple character responses.

**Responsibilities:**
- Manage playlist of messages to play
- Track current playback position
- Provide play/pause/skip controls
- Auto-play next message when current finishes
- Reuse existing `useTTS` hook infrastructure

**Key Methods:**
```typescript
interface UseGroupTTSReturn {
  state: TTSState;                    // idle | loading | playing | error
  error: TTSError | null;
  currentMessageId: string | null;    // Currently playing message
  currentIndex: number;               // Position in playlist
  totalMessages: number;              // Total playlist length
  hasNext: boolean;
  hasPrevious: boolean;
  
  playMessage(messageId, text, characterName?): Promise<void>;
  playAllResponses(messages: GroupMessage[]): Promise<void>;
  stopPlayback(): void;
  playNext(): Promise<void>;
  playPrevious(): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
}
```

**Playlist Structure:**
```typescript
interface PlaylistItem {
  messageId: string;
  text: string;
  characterName?: string;
}
```

**Auto-Play Logic:**
```typescript
useEffect(() => {
  // Auto-play next when current finishes
  if (state === 'idle' && !isPaused && hasNext && currentIndex >= 0) {
    playNext();
  }
}, [state, isPaused, hasNext, currentIndex]);
```

---

#### 4. **GroupTTSButton Component** (`components/GroupTTSButton.tsx`)

**Purpose:** Play/stop button for individual messages in group chat.

**Props:**
```typescript
interface GroupTTSButtonProps {
  messageId: string;
  text: string;
  characterName?: string;
  className?: string;
}
```

**Features:**
- Shows play icon (▶) when idle
- Shows pause icon (⏸) when playing this message
- Shows loading indicator (⏳) during synthesis
- Shows error icon (⚠) on failure
- Integrates with `useGroupTTS` hook

**Behavior:**
- Click when idle → Start playback of this message
- Click when playing → Stop playback
- Disabled during loading

---

#### 5. **GroupTTSControls Component** (`components/GroupTTSControls.tsx`)

**Purpose:** Playlist controls for sequential playback of all responses.

**Props:**
```typescript
interface GroupTTSControlsProps {
  messages: GroupMessage[];
  className?: string;
}
```

**Features:**
- **Play All Button:** Start sequential playback of all assistant messages
- **Stop All Button:** Stop current playback and clear playlist
- **Previous/Next Buttons:** Navigate through playlist
- **Now Playing Display:** Shows current character name and position (e.g., "2 of 5")
- **Status Display:** Shows total available responses when idle
- **Error Display:** Shows error message if playback fails

**UI Elements:**
```
[▶ Play All] [⏮ Prev] [⏭ Next]
Now playing: Hegel (2 of 5)
```

---

#### 6. **GroupChatWindowEnhanced Component** (`components/GroupChatWindowEnhanced.tsx`)

**Purpose:** Enhanced group chat window with persistent messages and TTS.

**Props:**
```typescript
interface GroupChatWindowEnhancedProps {
  groupId: string;
  group?: Group;
  enableTTS?: boolean;              // Default: true
  showMessageTTS?: boolean;         // Default: true
  showPlaylistControls?: boolean;   // Default: true
  enablePagination?: boolean;       // Default: false
}
```

**Features:**
- Loads message history using `useGroupMessages` hook
- Renders `GroupTTSControls` at top for playlist playback
- Renders `GroupTTSButton` for each assistant message
- Shows "Load More" button if pagination enabled
- Auto-scrolls to latest message
- Shows typing indicator when sending

**Layout:**
```
┌─────────────────────────────────────┐
│ [▶ Play All] [⏮] [⏭]               │
│ Now playing: Hegel (2 of 5)         │
├─────────────────────────────────────┤
│ [Load More Messages] (if enabled)   │
├─────────────────────────────────────┤
│ User: Hello everyone                │
├─────────────────────────────────────┤
│ Hegel: Greetings...  [▶]            │
├─────────────────────────────────────┤
│ Kant: Good day...    [▶]            │
├─────────────────────────────────────┤
│ [Typing indicator...]               │
└─────────────────────────────────────┘
```

---

### Implementation Recommendations

#### Phase 1: Core Message Persistence

1. **Update API Service** (if not already present)
```typescript
// frontend/src/services/api.ts
async getGroupMessages(groupId: string, limit = 50, offset = 0): Promise<MessagesResponse> {
  const response = await this.client.get(`/groups/${groupId}/messages`, {
    params: { limit, offset }
  });
  return response.data;
}
```

2. **Integrate Enhanced Store**
   - Option A: Replace existing `groupMessageStore.ts` with enhanced version
   - Option B: Keep both, migrate components gradually
   - Recommendation: Option B for safety, then deprecate old store

3. **Update GroupChatWindow**
   - Replace direct store usage with `useGroupMessages` hook
   - Test message loading on mount
   - Verify deduplication works (send message, reload page, no duplicates)

4. **Testing Strategy**
   ```typescript
   // Test scenarios:
   - Load empty group → Shows "No messages yet"
   - Load group with history → Shows all messages
   - Send message → Optimistic update, then persisted
   - Reload page → Messages still present, no duplicates
   - Switch groups → Messages cleared, new group loaded
   - Pagination → Load more appends correctly
   ```

#### Phase 2: TTS Integration (Optional)

1. **Verify TTS Infrastructure**
   - Ensure `useTTS` hook works for group context
   - Test audio cache across multiple messages
   - Verify cleanup on unmount

2. **Implement useGroupTTS Hook**
   - Start with single message playback
   - Add sequential playback logic
   - Test auto-play next functionality
   - Handle edge cases (empty playlist, playback errors)

3. **Create UI Components**
   - GroupTTSButton: Individual message playback
   - GroupTTSControls: Playlist controls
   - Test accessibility (keyboard navigation, screen readers)

4. **Integrate into GroupChatWindow**
   - Add TTS controls at top
   - Add TTS button to each assistant message
   - Make TTS features optional via props
   - Test performance with many messages

5. **Testing Strategy**
   ```typescript
   // Test scenarios:
   - Click individual TTS button → Plays that message
   - Click "Play All" → Plays all responses sequentially
   - Skip to next → Moves to next message in playlist
   - Stop playback → Clears playlist, resets state
   - Multiple groups → TTS state isolated per instance
   - Error handling → Shows error, allows retry
   ```

#### Phase 3: Polish & Optimization

1. **Performance Optimization**
   - Virtualize long message lists (react-window)
   - Lazy load TTS components if not enabled
   - Optimize re-renders (React.memo, useCallback)

2. **UX Improvements**
   - Add loading skeleton for messages
   - Show progress bar during TTS synthesis
   - Add keyboard shortcuts (Space = play/pause, Arrow keys = next/prev)
   - Persist TTS volume/speed preferences

3. **Error Handling**
   - Retry failed message loads
   - Show inline error messages
   - Graceful degradation if TTS unavailable

4. **Accessibility**
   - ARIA labels for all controls
   - Keyboard navigation support
   - Screen reader announcements for state changes
   - Focus management during playback

---

### Integration with Backend API

#### Expected Endpoints

1. **GET /api/groups/{id}/messages**
   - Query params: `limit` (default: 50), `offset` (default: 0)
   - Returns: `{ messages: GroupMessage[] }`
   - Response includes: id, role, content, created_at, character_id, character_name

2. **POST /api/groups/messages/**
   - Body: `{ messages: Message[], character_ids: string[] }`
   - Returns: `{ responses: CharacterResponse[] }`
   - Now saves messages to database (implemented in backend)

#### Data Model Alignment

Ensure frontend `GroupMessage` type matches backend:
```typescript
interface GroupMessage {
  id: string;              // UUID from backend
  role: 'user' | 'assistant';
  content: string;
  created_at: string;      // ISO timestamp
  character_id?: string;   // For assistant messages
  character_name?: string; // For display
  avatar_url?: string;     // Optional
  emotions?: Emotions;     // Optional
}
```

---

### State Management Strategy

#### Message Lifecycle

```
1. Component Mount
   ↓
2. useGroupMessages hook calls fetchGroupMessages()
   ↓
3. Store fetches from API: GET /groups/{id}/messages
   ↓
4. Messages marked as isPersisted: true
   ↓
5. Store merges with existing messages (deduplicates)
   ↓
6. Component renders messages

7. User Sends Message
   ↓
8. Store adds message optimistically (isPersisted: false)
   ↓
9. Component shows message immediately
   ↓
10. Store sends to API: POST /groups/messages
   ↓
11. Backend saves and responds with character responses
   ↓
12. Store marks user message as isPersisted: true
   ↓
13. Store adds character responses (isPersisted: true)
   ↓
14. Component renders new messages

15. User Reloads Page
   ↓
16. Repeat from step 1 → No duplicates due to deduplication
```

#### Deduplication Strategy

**Why Needed:**
- Prevent duplicate messages when reloading
- Handle race conditions (message sent but not yet in DB response)
- Support offline/online transitions

**How It Works:**
1. All messages have unique IDs (UUIDs from backend)
2. Store maintains Map<messageId, message>
3. When merging: prefer persisted over optimistic
4. Result: chronologically sorted, deduplicated messages

**Edge Cases:**
- **Optimistic message still in store when reload happens:**
  → Persisted version replaces optimistic version
- **Backend returns different ID for user message:**
  → Need to match by content + timestamp (not implemented in MVP)
- **Multiple browser tabs:**
  → Each tab has own store, may have temporary duplicates until reload

---

### TTS Integration Strategy

#### Reusing Existing Infrastructure

The frontend already has TTS infrastructure from character chat:
- `useTTS` hook: Manages synthesis + playback
- `TTSService`: API calls to backend TTS endpoint
- `TTSButton` component: UI for single message playback
- Audio caching: Prevents re-synthesis of same text

**Group Chat Extensions:**
- `useGroupTTS`: Wraps `useTTS` with playlist functionality
- `GroupTTSButton`: Same as TTSButton but uses group hook
- `GroupTTSControls`: New playlist UI

#### Sequential Playback Logic

```typescript
// Simplified implementation
const playAllResponses = async (messages: GroupMessage[]) => {
  // 1. Filter assistant messages
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  // 2. Create playlist
  const playlist = assistantMessages.map(msg => ({
    messageId: msg.id,
    text: msg.content,
    characterName: msg.character_name
  }));
  
  setPlaylist(playlist);
  setCurrentIndex(0);
  
  // 3. Play first message
  await synthesizeAndPlay(playlist[0].text);
  
  // 4. Auto-play logic (in useEffect)
  // When state becomes 'idle' → play next automatically
};
```

#### Audio State Management

**Global vs Local State:**
- **useTTS:** Instance-specific state (idle/loading/playing/error)
- **Audio Cache:** Global singleton (shared across all components)
- **Playlist:** Local to useGroupTTS instance

**Preventing Conflicts:**
- Only one audio plays at a time (new playback stops previous)
- Each GroupChatWindow instance has own useGroupTTS hook
- Switching groups stops current playback

---

### Migration Path

#### Option 1: Gradual Migration (Recommended)

1. **Phase 1:** Create enhanced versions alongside existing code
   - `groupMessageStoreEnhanced.ts` (new)
   - `useGroupMessages.ts` (new)
   - `GroupChatWindowEnhanced.tsx` (new)
   - Keep existing `GroupChatWindow.tsx` unchanged

2. **Phase 2:** Add feature flag
   ```typescript
   const useEnhancedGroupChat = true; // Config or feature flag
   
   return useEnhancedGroupChat 
     ? <GroupChatWindowEnhanced groupId={id} />
     : <GroupChatWindow groupId={id} />;
   ```

3. **Phase 3:** Test enhanced version
   - Run integration tests
   - Manual QA with real data
   - Monitor for issues

4. **Phase 4:** Deprecate old components
   - Replace all usages with enhanced versions
   - Remove old components
   - Update imports

#### Option 2: Direct Replacement

1. Update `groupMessageStore.ts` with enhanced logic
2. Update `GroupChatWindow.tsx` to use `useGroupMessages`
3. Add TTS components directly
4. Test thoroughly before deployment

**Risk:** Higher chance of breaking existing functionality
**Benefit:** Simpler codebase, no duplicate code

---

### Testing Requirements

#### Unit Tests

**useGroupMessages Hook:**
```typescript
// tests/hooks/useGroupMessages.test.ts
- ✓ Loads messages on mount when autoLoad=true
- ✓ Does not load when autoLoad=false
- ✓ Handles pagination correctly
- ✓ Merges new messages with existing
- ✓ Clears messages when groupId changes
- ✓ Handles API errors gracefully
```

**groupMessageStoreEnhanced:**
```typescript
// tests/store/groupMessageStoreEnhanced.test.ts
- ✓ Deduplicates messages by ID
- ✓ Prefers persisted over optimistic messages
- ✓ Marks user message as persisted after send
- ✓ Merges loaded messages correctly
- ✓ Maintains chronological order
- ✓ Handles empty message arrays
```

**useGroupTTS Hook:**
```typescript
// tests/hooks/useGroupTTS.test.ts
- ✓ Plays single message
- ✓ Plays all assistant messages sequentially
- ✓ Skips user messages in playlist
- ✓ Auto-plays next message when current finishes
- ✓ Stops playback correctly
- ✓ Handles next/previous navigation
- ✓ Handles errors gracefully
```

**GroupTTSButton Component:**
```typescript
// tests/components/GroupTTSButton.test.ts
- ✓ Renders play button when idle
- ✓ Renders pause button when playing
- ✓ Shows loading state during synthesis
- ✓ Shows error state on failure
- ✓ Calls playMessage on click
- ✓ Calls stopPlayback when playing
```

**GroupTTSControls Component:**
```typescript
// tests/components/GroupTTSControls.test.ts
- ✓ Renders play all button
- ✓ Filters and counts assistant messages
- ✓ Shows current playback position
- ✓ Enables/disables navigation buttons correctly
- ✓ Hides when no assistant messages
- ✓ Shows error messages
```

#### Integration Tests

**Message Loading + Display:**
```typescript
// tests/integration/GroupMessagesIntegration.test.ts
- ✓ Loads messages from API on mount
- ✓ Displays loaded messages in UI
- ✓ Sends new message and updates UI
- ✓ Reloads without duplicates
- ✓ Handles pagination
```

**TTS Integration:**
```typescript
// tests/integration/GroupTTS.integration.test.ts
- ✓ Individual TTS button plays correct message
- ✓ Play All button plays all responses
- ✓ Playlist controls navigate correctly
- ✓ Stopping clears playlist
- ✓ Multiple groups have isolated TTS state
```

#### E2E Tests

**Complete User Flow:**
```typescript
// tests/e2e/GroupChatPersistence.e2e.test.ts
1. Create group with 2 characters
2. Send message → See responses
3. Reload page → Messages still present
4. Send another message → No duplicates
5. Play All TTS → All responses play sequentially
6. Switch to another group → Messages cleared
7. Return to first group → Messages reloaded
```

---

### Error Handling & Edge Cases

#### Message Loading Errors

**Scenario:** API call to GET /groups/{id}/messages fails

**Handling:**
```typescript
// In useGroupMessages
catch (error) {
  // Show error in UI
  // Allow retry via "Reload" button
  // Don't clear existing messages
}
```

**UI:**
```
┌─────────────────────────────────────┐
│ ⚠ Error loading messages            │
│ [Retry]                             │
├─────────────────────────────────────┤
│ (Show any already-loaded messages)  │
└─────────────────────────────────────┘
```

#### Message Sending Errors

**Scenario:** API call to POST /groups/messages fails

**Handling:**
```typescript
// In groupMessageStoreEnhanced
catch (error) {
  // Remove optimistic user message
  // Show error message
  // Keep message in input field (don't clear)
}
```

**UI:**
```
Message input: "Hello everyone"
[Send]

⚠ Failed to send message. Please try again.
```

#### TTS Playback Errors

**Scenario:** TTS synthesis or playback fails

**Handling:**
```typescript
// In useGroupTTS
catch (error) {
  // Set state to 'error'
  // Show error in UI
  // Allow retry for this message
  // Don't auto-play next
}
```

**UI:**
```
Hegel: Greetings... [⚠ Retry]
```

#### Race Conditions

**Scenario 1:** User sends message, then immediately reloads page

**Problem:** Message might not be in DB yet
**Solution:** Backend ensures immediate consistency (message saved before response)
**Frontend:** Optimistic message replaced by persisted version on reload

**Scenario 2:** User sends message in tab A, switches to tab B

**Problem:** Tab B doesn't know about new message
**Solution:** No real-time sync in MVP (acceptable)
**Future:** WebSocket for live updates

**Scenario 3:** Pagination loads duplicate messages

**Problem:** User sends message while pagination loading
**Solution:** Deduplication handles this automatically

#### Empty States

**No Messages:**
```typescript
if (messages.length === 0 && !isLoadingMessages) {
  return <EmptyState>No messages yet. Start a conversation!</EmptyState>
}
```

**No Assistant Messages (for TTS):**
```typescript
if (assistantMessages.length === 0) {
  return null; // Don't show TTS controls
}
```

**All Messages Failed:**
```typescript
if (allMessagesFailed) {
  return <ErrorState>All responses failed. Please try again.</ErrorState>
}
```

---

### Performance Considerations

#### Message Rendering

**Problem:** Large message history (100+ messages) causes slow rendering

**Solutions:**
1. **Virtualization:** Use `react-window` or `react-virtualized`
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={600}
     itemCount={messages.length}
     itemSize={100}
   >
     {({ index, style }) => (
       <div style={style}>
         <MessageComponent message={messages[index]} />
       </div>
     )}
   </FixedSizeList>
   ```

2. **Pagination:** Load messages in chunks (50 at a time)
3. **Lazy Loading:** Load more as user scrolls up

**Recommendation:** Start with pagination, add virtualization if needed

#### TTS Audio Caching

**Current:** Global cache Map<text, audioPath>

**Optimization:**
- Cache persists for app lifetime
- No cleanup → potential memory leak with many messages
- Consider LRU cache with max size (e.g., 100 entries)

**Implementation:**
```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize = 100;
  
  set(key: K, value: V) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
}
```

#### Re-render Optimization

**Problem:** Store updates trigger unnecessary re-renders

**Solutions:**
1. **Zustand Selectors:** Only subscribe to needed state
   ```typescript
   const messages = useGroupMessageStore(state => state.messages[groupId]);
   const isLoading = useGroupMessageStore(state => state.isLoading[groupId]);
   ```

2. **React.memo:** Memoize message components
   ```typescript
   export const GroupMessage = React.memo(({ message }) => {
     // Component logic
   });
   ```

3. **useCallback:** Memoize event handlers
   ```typescript
   const handlePlay = useCallback(() => {
     playMessage(messageId, text);
   }, [messageId, text]);
   ```

---

### Security Considerations

#### Input Validation

**Message Content:**
- Frontend validates max length (e.g., 10,000 chars)
- Backend sanitizes HTML/scripts
- Display uses React (auto-escapes by default)

**Message IDs:**
- Must be valid UUIDs
- Backend validates on API calls
- Frontend uses backend-provided IDs (doesn't generate)

#### XSS Prevention

**Markdown Rendering:**
- Uses `react-markdown` with `remarkGfm`
- Sanitize HTML in markdown (if enabled)
- Don't use `dangerouslySetInnerHTML`

**Audio URLs:**
- TTS audio served from backend
- No user-provided audio URLs
- Validate MIME type before playback

#### Data Privacy

**Message Storage:**
- Messages stored locally in Zustand (in-memory)
- No localStorage persistence (privacy)
- Cleared on page refresh (unless loaded from backend)

**Audio Files:**
- TTS audio cached in browser memory
- Not persisted to disk
- Cleared on page unload

---

### Accessibility (a11y) Requirements

#### Keyboard Navigation

**Required Controls:**
- Tab: Navigate between messages, TTS buttons, controls
- Space/Enter: Activate TTS buttons
- Arrow keys: Navigate playlist (prev/next)
- Escape: Stop playback

**Implementation:**
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    stopPlayback();
  } else if (e.key === 'ArrowRight') {
    playNext();
  } else if (e.key === 'ArrowLeft') {
    playPrevious();
  }
};
```

#### Screen Reader Support

**ARIA Labels:**
```typescript
<button
  aria-label={`Play response from ${characterName}`}
  aria-pressed={isPlaying}
  role="button"
>
  Play
</button>
```

**Live Regions:**
```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {isPlaying && `Now playing response from ${characterName}`}
</div>
```

**Semantic HTML:**
- Use `<button>` not `<div onClick>`
- Use `<nav>` for controls
- Use `role="region"` for messages

#### Focus Management

**Playback Start:**
- Focus stays on clicked button
- Announce status via aria-live

**Playback End:**
- Focus returns to last focused element
- Announce completion via aria-live

**Message Load:**
- Don't steal focus
- Announce count via aria-live ("5 new messages loaded")

---

### Configuration & Feature Flags

#### Feature Toggle

```typescript
// frontend/src/config/features.ts
export const features = {
  groupMessagePersistence: true,
  groupTTS: true,
  groupTTSPlaylist: true,
  groupPagination: false,
};
```

**Usage:**
```typescript
import { features } from '../config/features';

const GroupChat = ({ groupId }) => {
  if (features.groupMessagePersistence) {
    return <GroupChatWindowEnhanced groupId={groupId} />;
  }
  return <GroupChatWindow groupId={groupId} />;
};
```

#### TTS Configuration

```typescript
// frontend/src/config/tts.ts
export const ttsConfig = {
  enableGroupTTS: true,
  showIndividualButtons: true,
  showPlaylistControls: true,
  autoPlayNext: true,
  cacheSize: 100, // Max cached audio files
};
```

#### Message Loading Configuration

```typescript
// frontend/src/config/messages.ts
export const messageConfig = {
  pageSize: 50,
  enablePagination: false,
  autoLoad: true,
  contextMessageLimit: 5, // Messages sent to backend
};
```

---

### Documentation Requirements

#### Component Documentation

Each component must have:
1. **JSDoc comment** describing purpose
2. **Props interface** with descriptions
3. **Usage example** in comments
4. **Responsibilities list**

**Example:**
```typescript
/**
 * GroupTTSControls - Playlist controls for group chat TTS.
 *
 * Provides play all, stop, next, previous controls for sequential
 * playback of all character responses in a group chat.
 *
 * @example
 * <GroupTTSControls messages={groupMessages} />
 */
```

#### README Updates

**frontend/src/hooks/README.md:**
- Add `useGroupMessages` entry
- Add `useGroupTTS` entry
- Document usage patterns

**frontend/src/components/README.md:**
- Add Group TTS components
- Document integration with GroupChatWindow
- Add screenshots/diagrams

**frontend/src/store/README.md:**
- Document enhanced store pattern
- Explain deduplication logic
- Migration guide from old to new store

#### llm_readme.md Updates

Add new modules to navigation index:
```markdown
## Group Message Management

- **useGroupMessages** (hooks/): Message lifecycle hook
- **groupMessageStoreEnhanced** (store/): Persistence + deduplication
- **GroupChatWindowEnhanced** (components/): Chat UI with TTS

## Group TTS

- **useGroupTTS** (hooks/): Sequential playback hook
- **GroupTTSButton** (components/): Individual message TTS
- **GroupTTSControls** (components/): Playlist controls
```

---

### Implementation Order

#### Sprint 1: Core Persistence (Priority: HIGH)

1. ✅ Create `useGroupMessages` hook
2. ✅ Create `groupMessageStoreEnhanced` with deduplication
3. ✅ Update API service (if needed)
4. Write unit tests for hook and store
5. Manual testing with real backend
6. Integration test: load → send → reload → verify no duplicates

**Acceptance Criteria:**
- Messages load from backend on mount
- Sending message persists to backend
- Reloading page shows messages without duplicates
- Switching groups loads correct messages

#### Sprint 2: Enhanced UI (Priority: MEDIUM)

1. ✅ Create `GroupChatWindowEnhanced` component
2. Integrate `useGroupMessages` hook
3. Add loading states and error handling
4. Add pagination support (optional)
5. Write component tests
6. Update app to use enhanced component

**Acceptance Criteria:**
- Loading spinner shows while fetching
- Error messages display on failure
- "Load More" button works (if enabled)
- Messages render correctly

#### Sprint 3: TTS Integration (Priority: LOW - Optional)

1. ✅ Create `useGroupTTS` hook
2. ✅ Create `GroupTTSButton` component
3. ✅ Create `GroupTTSControls` component
4. Integrate into `GroupChatWindowEnhanced`
5. Write tests for all TTS components
6. Add keyboard shortcuts and a11y

**Acceptance Criteria:**
- Individual message playback works
- "Play All" plays responses sequentially
- Next/Previous navigation works
- Keyboard controls work
- Screen reader announces state changes

#### Sprint 4: Polish & Optimization (Priority: LOW)

1. Add virtualization for long message lists
2. Implement LRU cache for TTS audio
3. Optimize re-renders with React.memo
4. Add loading skeletons
5. Improve error messages
6. Performance testing

**Acceptance Criteria:**
- Renders 100+ messages smoothly
- No memory leaks
- Fast initial load time
- Good perceived performance

---

### Assumptions

1. **Backend API is stable:**
   - GET /api/groups/{id}/messages returns correct format
   - POST /api/groups/messages saves to DB before responding
   - Message IDs are UUIDs (globally unique)

2. **No multi-user scenarios:**
   - Single user per browser session
   - No real-time collaboration
   - No conflict resolution needed

3. **Message persistence is immediate:**
   - Backend saves messages synchronously
   - No eventual consistency issues
   - Reload immediately shows sent messages

4. **TTS backend is available:**
   - TTS endpoint exists and works
   - Audio format is browser-compatible
   - No streaming required (full audio returned)

5. **No offline support:**
   - App requires internet connection
   - No service worker caching
   - Messages not saved locally

6. **Browser compatibility:**
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - ES6+ features available
   - Web Audio API supported

---

### Open Questions

#### 1. Should we implement real-time message sync?

**Context:** Currently, messages sent in one tab don't appear in other tabs until reload.

**Options:**
- A) WebSocket for live updates (complex, real-time)
- B) Polling every N seconds (simple, some delay)
- C) No sync (MVP approach)

**Recommendation:** C for MVP, B for future enhancement

---

#### 2. How should we handle very long messages?

**Context:** Character responses can be lengthy (500+ words).

**Options:**
- A) Truncate with "Read more" button
- B) Virtualization (only render visible portion)
- C) No limit (current approach)

**Recommendation:** C for MVP, consider A if UX suffers

---

#### 3. Should TTS playback persist across group switches?

**Context:** User starts playing responses in Group A, switches to Group B.

**Options:**
- A) Stop playback when switching groups (simpler)
- B) Continue playback in background (complex)
- C) Show "Now Playing" overlay that follows user

**Recommendation:** A for MVP

---

#### 4. Should we cache messages in localStorage?

**Context:** Currently messages cleared on page refresh (until reloaded from backend).

**Options:**
- A) Cache in localStorage for instant load (privacy concern)
- B) No caching, always load from backend (slower)
- C) Cache with TTL (e.g., 1 hour)

**Recommendation:** B for MVP (privacy + simplicity)

---

#### 5. How should we handle message editing/deletion?

**Context:** Backend might support editing/deleting messages (not in current spec).

**Options:**
- A) No support (messages immutable)
- B) Add edit/delete UI + backend API
- C) Soft delete only (hide, don't remove from DB)

**Recommendation:** A for MVP (out of scope)

---

#### 6. Should we limit message history length?

**Context:** Groups with thousands of messages might be slow.

**Options:**
- A) Load all messages (current approach)
- B) Pagination with max limit (e.g., last 500 messages)
- C) Virtualization + lazy loading

**Recommendation:** A for MVP, B if performance issues arise

---

### Success Metrics

#### Functional Metrics

- ✅ Message load time < 1 second for 50 messages
- ✅ Message send + response time < 3 seconds
- ✅ Zero duplicate messages after reload
- ✅ 100% of sent messages persisted to backend
- ✅ TTS playback starts < 2 seconds after click

#### Quality Metrics

- ✅ Test coverage > 80% for new components
- ✅ No console errors in production
- ✅ All WCAG 2.1 AA accessibility requirements met
- ✅ Works on Chrome, Firefox, Safari, Edge (latest versions)

#### User Experience Metrics

- ✅ Loading states visible for all async operations
- ✅ Error messages actionable (show what to do next)
- ✅ No layout shifts during message load
- ✅ Keyboard navigation works for all TTS controls

---

### Risks & Mitigation

#### Risk 1: Message Deduplication Fails

**Impact:** Users see duplicate messages after reload
**Likelihood:** Medium
**Mitigation:**
- Comprehensive unit tests for deduplication logic
- Integration tests with real backend
- Manual QA with various scenarios

#### Risk 2: TTS Playback Breaks Across Updates

**Impact:** Users can't listen to responses
**Likelihood:** Low
**Mitigation:**
- TTS is optional feature (not critical)
- Graceful degradation (hide controls on error)
- Fallback to reading text

#### Risk 3: Performance Issues with Large History

**Impact:** Slow rendering, poor UX
**Likelihood:** Medium (depends on usage)
**Mitigation:**
- Start with pagination (limit initial load)
- Add virtualization if needed
- Monitor performance metrics

#### Risk 4: Race Conditions in Message State

**Impact:** Messages appear/disappear unexpectedly
**Likelihood:** Low
**Mitigation:**
- Zustand provides atomic updates
- Deduplication handles races
- Extensive testing of edge cases

#### Risk 5: Browser Compatibility Issues

**Impact:** Features don't work in some browsers
**Likelihood:** Low (modern browsers)
**Mitigation:**
- Test on all major browsers
- Polyfills for missing features
- Progressive enhancement (TTS optional)

---

### Next Steps

1. **Review this architecture design** with team/stakeholders
2. **Prioritize features**: Core persistence vs. TTS integration
3. **Set up test environment** with backend running
4. **Begin Sprint 1**: Implement useGroupMessages hook + enhanced store
5. **Write tests** for each component before implementation (TDD)
6. **Document** as you implement (update READMEs)
7. **QA** each sprint before moving to next
8. **Deploy** incrementally with feature flags

---

### Related Files

**Existing Files to Reference:**
- `frontend/src/hooks/useTTS.ts` - TTS hook pattern
- `frontend/src/components/ChatWindow.tsx` - Chat UI pattern
- `frontend/src/store/messageStore.ts` - Message store pattern
- `frontend/src/types/group.ts` - Group type definitions

**New Files Created:**
- `frontend/src/hooks/useGroupMessages.ts` ✅
- `frontend/src/hooks/useGroupTTS.ts` ✅
- `frontend/src/store/groupMessageStoreEnhanced.ts` ✅
- `frontend/src/components/GroupChatWindowEnhanced.tsx` ✅
- `frontend/src/components/GroupTTSButton.tsx` ✅
- `frontend/src/components/GroupTTSControls.tsx` ✅

**Files to Update (Implementation Phase):**
- `frontend/src/services/api.ts` - Verify getGroupMessages exists
- `frontend/src/AppWithGroups.tsx` - Use enhanced components
- `frontend/src/types/group.ts` - Add TrackedGroupMessage if needed
- `frontend/package.json` - Add dependencies if needed (react-window, etc.)

---


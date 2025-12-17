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

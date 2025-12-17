# **Folder-Level README Format (FLRM)**

## **Template**

```markdown
# `[folder-name]/` - [Brief Purpose]

**Purpose:** [1-2 sentences explaining this module's responsibility]

**Tech:** [Languages, frameworks specific to this folder]

## **File Map**
```
[folder]/
├── [file1.ext] - [Single-line description. Main exports/classes]
├── [subfolder/] - [Purpose of subfolder]
└── [fileN.ext] - ...
```

## **Key Components**

### `[component-name]`
* **Files:** `[filename(s)]`
* **Purpose:** [Specific responsibility]
* **Main Entities:** `[ClassName]` - [role], `[functionName]` - [what it does]
* **Input/Output:** [What it takes/returns]
* **Dependencies:** `[../other-module]`, `[external-library]`

## **Interface**
```[language]
// Key function signatures or class definitions
[functionName](param: type): returnType
```

## **Flow**
[Brief data/control flow description. 1-3 bullet points]
```

---

## **Example**

```markdown
# `api/` - Backend HTTP API Layer

**Purpose:** Handles HTTP requests, validation, and routes to business logic.

**Tech:** Python, FastAPI, Pydantic

## **File Map**
```
api/
├── main.py - FastAPI app setup, middleware, route inclusion
├── routes/
│   ├── users.py - User CRUD operations
│   └── auth.py - Authentication endpoints
└── models.py - Pydantic request/response models
```

## **Key Components**

### `User Management`
* **Files:** `routes/users.py`, `models.py`
* **Purpose:** Create, read, update user accounts
* **Main Entities:** `UserRouter` - route registry, `UserCreate` - validation model
* **Input/Output:** JSON requests → User records
* **Dependencies:** `../services/user_service`, `fastapi`

## **Interface**
```python
# routes/users.py
def create_user(user_data: UserCreate) -> UserResponse
def get_user(user_id: int) -> UserResponse

# models.py  
class UserCreate(BaseModel):
    email: str; password: str
```

## **Flow**
- Receives JSON → Validates with Pydantic → Calls service layer → Returns JSON
- JWT tokens required for protected routes
```

This format is:
- **Compact** - minimal verbosity
- **Structured** - predictable sections for LLM parsing
- **Technical** - focuses on code entities and relationships
- **Scalable** - works for any folder level
- **Interconnected** - shows dependencies between modules
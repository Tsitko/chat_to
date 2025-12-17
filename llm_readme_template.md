# **Project Navigation Index**

## **Project Overview**
**Project:** `[project-name]`  
**Purpose:** [1-2 sentences about main project purpose]  
**Tech Stack:** [main technologies, frameworks, languages]  
**Architecture:** [architecture type - monolithic, microservices, MVC, etc.]

## **Module Navigation Map**

```
[project-root]/
├── 📁 [module1]/ - [brief purpose]
│   └── 📄 README.md - FLRM: [coverage status]
├── 📁 [module2]/ - [brief purpose]  
│   └── 📄 README.md - FLRM: [coverage status]
└── 📄 README.md (this file)
```

## **Module Responsibility Matrix**

| Module | Path | Primary Responsibility | Key Components | Entry Points |
|--------|------|------------------------|----------------|--------------|
| `[module-name]` | `[folder-path]` | [main responsibility] | `[Component1]`, `[Component2]` | `[file:function()]` |

## **Cross-Module Dependencies**

```
[Module A] → [Module B]  # [dependency type - data, calls, events]
```

## **Common Edit Patterns**

### **Add New Feature:**
1. **API Endpoint:** `[api-module]/` + `[business-module]/` + `[data-module]/`
2. **Business Logic:** `[business-module]/` + `[data-module]/`
3. **UI Component:** `[frontend-module]/` + `[state-module]/`

### **Modify Data:**
- **Schema:** `[data-module]/` → `[api-module]/` → `[frontend-module]/`
- **Validation:** `[validation-module]/` → `[api-module]/`

## **FLRM Coverage Status**

- ✅ `[module]/` - [coverage details]
- 🔄 `[module]/` - [coverage details]  
- ❌ `[module]/` - [coverage details]

## **LLM Navigation Guidelines**

**For functionality edits:**
1. Find responsibility in Responsibility Matrix
2. Navigate to corresponding FLRM file
3. Use Key Components and Interface from FLRM
4. Check Cross-Module Dependencies

**Example LLM query:**
```
"I need to add [feature]. According to matrix: [module-chain]. Which files need to be created/modified?"
```
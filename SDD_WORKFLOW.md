# Engineering Guidelines: Spec-Driven Development (SDD) Workflow

This document outlines the standard operating procedure for **Spec-Driven Development (SDD)** within the **AI Mini Prompt Router** project. Every feature update, system enhancement, or API integration must strictly adhere to these 5 distinct phases.

---

## 🗺️ SDD Workflow Overview

```text
┌────────────────────────────────────────────────────────┐
│             PHASE 1: DESIGN SPECIFICATION              │
│       - Write schemas, endpoint contracts, SSE flows  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             PHASE 2: REVIEW & ALIGNMENT                │
│       - Cross-team reviews, threat modeling, freeze   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             PHASE 3: PARALLEL DEVELOPMENT              │
│  ┌────────────────────────┴─────────────────────────┐  │
│  ▼                                                  ▼  │
│ [FRONTEND]                                [BACKEND]    │
│  - Mock specs & build UI               - Skeleton APIs │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             PHASE 4: CODING IMPLEMENTATION             │
│       - Complete logic, db queries, UI transitions     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│             PHASE 5: COMPLIANCE & VERIFICATION        │
│       - Schema check, build testing, log review       │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Phase-by-Phase Specification

### Phase 1: Contract & Interface Specification
Before any IDE file is edited or code is written, a formal interface spec must be documented in `SPECIFICATION.md`.

* **Database Contract**: Define new fields, types, indexes, and collections.
* **HTTP / SSE Contract**: Outline HTTP methods, request headers, JSON payloads, response codes, and SSE data structures.
* **Zero-Trust Analysis**: Ensure credentials and API keys are stored locally and passed via contexts (never saved in remote databases).
* **Delivery Artifact**: Updated `SPECIFICATION.md` section representing the absolute target state.

---

### Phase 2: Spec Review & Alignment
Review the technical specification with all participating stakeholders (Frontend, Backend, Security, and Product teams).

* **Contract Validation**: Confirm frontend inputs exactly match backend struct keys.
* **Error Analysis**: Define explicit failure payloads (e.g. status `401`, `429`, or custom streaming SSE `{"error": "message"}` structures).
* **Freeze Specification**: Once approved, freeze the contract. Coding starts only after the spec is frozen.

---

### Phase 3: Parallel Development & API Mocking
Leveraging the frozen contract, frontend and backend developers can execute concurrently without integration blocks.

#### Frontend Workstream
* Set up temporary mock structures using local arrays or Axios interceptors matching the exact spec schema.
* Scaffold components, input forms, and dynamic page states.
* Develop mock state bindings to prove user transitions behave correctly.

#### Backend Workstream
* Generate standard data models and Go structures matching the BSON/JSON tags.
* Build skeleton Echo controllers that return mock responses (e.g., hardcoded JSON or empty streams).
* Stub out repository queries and interface signatures.

---

### Phase 4: Full-Fidelity Coding
Replace the stubs and mock structures with production-grade, highly-optimized logic.

* **Backend Completion**: Wire active database queries, load environment configurations, inject context headers, and code the actual LLM adapter implementations.
* **Frontend Completion**: Transition mock hooks to make active AXIOS requests and SSE stream listeners, wire styling transitions (Tailwind/Framer Motion), and handle dynamic error cards.
* **Security Checks**: Validate token contexts, perform JWT lookups, and ensure client credentials are never logged or stored.

---

### Phase 5: Compliance & Integration Verification
Validate that both systems adhere 100% to the specification contract.

* **Schema Compliance Check**: Verify that data stored in MongoDB matches the exact BSON blueprints.
* **Contract Verification**: Confirm that request headers and payloads match the API endpoints without error.
* **Log Ledger Check**: Review the transactional ledgers inside `usage_logs` to ensure accuracy.
* **Build Correctness**: Verify both Go and frontend production compiles pass without syntactic or TypeScript warnings:
  ```bash
  # Backend
  go build main.go
  
  # Frontend
  npm run build
  ```

---

## ⚖️ Core Golden Rules of SDD
1. **Spec First, Code Second**: If a feature changes during coding, stop, update `SPECIFICATION.md` first, and then resume coding.
2. **Never Break Contracts**: If an API change is required, issue a new route or version, preserving backward compatibility.
3. **Graceful Failures**: Every defined endpoint must specify an error response contract for reliable client-side rendering.

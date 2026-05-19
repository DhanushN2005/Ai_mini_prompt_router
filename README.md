# AI Mini Prompt Router

AI Mini Prompt Router is a production-grade, high-fidelity AI SaaS application built to manage, optimize, and route user prompt payloads dynamically across multiple leading LLM providers, including **OpenAI**, **Anthropic**, **Google Gemini**, and **Groq**. 

By intelligently routing requests based on model configurations, the platform offers dynamic provider fallback capabilities, real-time analytics, and can save up to **60% in token costs** compared to single-provider setups.

---

## 🚀 Key Features

*   **⚡ Server-Sent Event (SSE) Streaming**: Real-time response generation and message-by-message content updates.
*   **🎨 Global Dual-Theme Architecture**: Seamless and persisted Light/Dark modes utilizing responsive CSS variables and transitions.
*   **🛠️ Dynamic Assistant Management**: Customizable persona templates (e.g., Code Architect, Support Specialist, Copywriter), system prompts, and fine-tuned configurations (temperature, max tokens, penalties).
*   **📊 Usage Analytics & Cost Ledger**: Real-time dashboards visualizing token consumption by provider, average blended costs, and detailed transactions logs.
*   **🔒 Secure Tenancy & Authentication**: Encrypted guest and client signup/login using token persistence.
*   **🛡️ Robust SSE Error Pipeline**: Styled inline error notifications capturing API quotas, unauthorized credentials, or server-level network failures gracefully.

---

## 🛠️ Technology Stack

### Backend Gateway
*   **Language**: Go (Golang)
*   **HTTP Framework**: Echo Router
*   **Database**: MongoDB (tenant isolation and logs ledger)
*   **Client Clients**: Official LLM REST APIs

### Frontend Client
*   **Core**: React + TypeScript
*   **Styling**: Custom CSS variable tokenization with responsive layouts
*   **Markdown Parsing**: `react-markdown` + `remark-gfm` for rich text responses
*   **Icons**: Lucide React library

---

## ⚙️ Project Structure

```text
├── backend/
│   ├── config/          # Environment secrets & database configurations
│   ├── controller/      # Auth, bots, and chat handler logic
│   ├── llm/             # LLM adapter implementations (OpenAI, Gemini, Groq, etc.)
│   ├── middleware/      # Auth validations and rate limiting
│   └── main.go          # High-performance Echo backend service
└── frontend/
    ├── src/
    │   ├── api/         # Axios client setup
    │   ├── components/  # ChatMessage, BotCard, Navbar, ProtectedRoute
    │   ├── context/     # Persistent light/dark ThemeProvider
    │   ├── hooks/       # useAuth hook, custom useSSE hook
    │   ├── pages/       # Login, Signup, Chat Dashboard, Bots Management
    │   ├── App.tsx      # Routing table
    │   └── index.css    # Global stylesheet (variables, layouts, keyframe animations)
```

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
- [Go](https://golang.org/doc/install) (version 1.20+)
- [Node.js](https://nodejs.org/en/download) (version 18+)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally or MongoDB Atlas instance

### 2. Backend Gateway Setup
1. Navigate to the `backend/` directory.
2. Create a `.env` configuration file:
   ```env
   PORT=8081
   MONGO_URI=mongodb://localhost:27017/prompt_router
   JWT_SECRET=your_super_secret_jwt_key
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```
3. Run the development server:
   ```bash
   go run main.go
   ```

### 3. Frontend Client Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

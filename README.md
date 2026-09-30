# Agent Seven 🤖✨
### Autonomous AI Agent Command Center & Multi-Agent Orchestration Suite

Agent Seven is a cutting-edge, production-grade AI Agent command center designed for testing, orchestrating, and observing autonomous LLM agents executing multi-step reasoning loops, tool invocations, and live data gathering.

---

## 🌟 Key Features

- **Autonomous ReAct Agent Loop**: Watch the agent iterate through **THINK**, **CALL TOOL**, **OBSERVE**, and **FINAL ANSWER** states in real time.
- **Integrated Tool Ecosystem**: Equipped with built-in tools including **WikipediaQueryRun**, **TavilySearch**, **add**, and **multiply**.
- **Rendered Markdown Preview**: All agent step details and final answers render as clean, formatted Markdown previews (just like GitHub `.md` files).
- **Interactive Playground & Model Lab**: Test multiple LLM providers (ChatGroq, Gemini Pro/Flash models) and prompt configurations.
- **Custom API Keys Management**: Securely input and store your own Gemini and Tavily API keys directly in the browser session.
- **Default Light Mode & Modern UI**: Built with a polished professional Indigo/Violet palette and default light mode (with instant dark mode toggle).
- **Keyboard Shortcuts**: Press **Enter** to instantly run agent tasks (`Shift + Enter` for newlines).
- **Vercel Deployment Ready**: Includes pre-configured `vercel.json` for effortless 1-click deployment.

---

## 🚀 Quick Start & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/agent-seven.git
   cd agent-seven
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:3000`.

---

## 📦 Deployment to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com).
3. Click **Add New → Project** and import your repository.
4. Vercel automatically detects the Vite preset and `vercel.json` configuration.
5. Click **Deploy**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Marked (Markdown rendering)
- **Backend**: Node.js, Express, TypeScript, `@google/genai` SDK
- **Architecture**: ReAct (Reasoning & Acting) Agent Loop with tool calling

---

## 📜 License

MIT License © [Agent Seven]({new Date().getFullYear()})

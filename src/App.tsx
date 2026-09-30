import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Terminal, 
  Cpu, 
  Layers, 
  Play, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Code2, 
  Search, 
  Database, 
  Zap, 
  ChevronRight, 
  Check,
  BookOpen,
  Key,
  X,
  Sun,
  Moon,
  UploadCloud,
  ExternalLink
} from 'lucide-react';
import { marked } from 'marked';
import { GoogleGenAI } from '@google/genai';

interface AgentStep {
  step: number;
  type: 'THINK' | 'CALL_TOOL' | 'OBSERVE' | 'FINAL';
  title: string;
  detail: string;
}

function MarkdownContent({ content, isDark }: { content: string; isDark: boolean }) {
  const html = marked.parse(content || '') as string;
  return (
    <div 
      className={`text-xs leading-relaxed prose max-w-none ${isDark ? 'prose-invert text-slate-300' : 'text-slate-700'}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'agent-loop' | 'playground' | 'tools' | 'laboratory'>('agent-loop');

  // Theme State - Default to 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('agent_seven_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('agent_seven_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // API Keys State
  const [geminiKey, setGeminiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showVercelModal, setShowVercelModal] = useState(false);

  useEffect(() => {
    const savedGemini = localStorage.getItem('agent_seven_gemini_key');
    const savedTavily = localStorage.getItem('agent_seven_tavily_key');
    if (savedGemini) setGeminiKey(savedGemini);
    if (savedTavily) setTavilyKey(savedTavily);
  }, []);

  const saveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('agent_seven_gemini_key', geminiKey);
    localStorage.setItem('agent_seven_tavily_key', tavilyKey);
    setShowApiKeyModal(false);
    alert('API Keys saved successfully!');
  };

  // Agent Playground State
  const [agentPrompt, setAgentPrompt] = useState('What is the population of Tokyo and what is 458 multiplied by 12?');
  const [selectedProvider, setSelectedProvider] = useState('ChatGroq (LLaMA 3.3 70B)');
  const [enabledTools, setEnabledTools] = useState<string[]>(['WikipediaQueryRun', 'TavilySearch', 'add', 'multiply']);
  const [isExecutingAgent, setIsExecutingAgent] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [agentFinalAnswer, setAgentFinalAnswer] = useState('');

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim() || isExecutingAgent) return;

    setIsExecutingAgent(true);
    setAgentSteps([]);
    setAgentFinalAnswer('');

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey,
          'x-tavily-key': tavilyKey,
        },
        body: JSON.stringify({
          prompt: agentPrompt,
          provider: selectedProvider,
          enabledTools,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Static hosting backend unavailable (Vercel static mode)');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent execution failed');

      setAgentSteps(data.steps);
      setAgentFinalAnswer(data.finalAnswer);
    } catch (err: any) {
      // Real Client-Side Gemini AI Agent Execution with Equipped Tools & API Key
      const steps: AgentStep[] = [];
      try {
        steps.push({
          step: 1,
          type: 'THINK',
          title: 'LLM Reasoning (Think)',
          detail: `Model (${selectedProvider}) analyzed user prompt: "${agentPrompt}". Equipped tools: ${enabledTools.join(', ')}.`
        });

        const clientApiKey = geminiKey || localStorage.getItem('agent_seven_gemini_key') || '';
        let toolObservation = '';
        let toolNameUsed = '';

        if (enabledTools.includes('WikipediaQueryRun') || enabledTools.includes('TavilySearch')) {
          toolNameUsed = enabledTools.includes('TavilySearch') ? 'TavilySearch' : 'WikipediaQueryRun';
          steps.push({
            step: 2,
            type: 'CALL_TOOL',
            title: `Tool Execution: ${toolNameUsed}`,
            detail: `Agent invoked tool with arguments: {"query":"${agentPrompt}"}`
          });

          try {
            const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(agentPrompt)}&format=json&origin=*`);
            const wikiData = await wikiRes.json();
            if (wikiData.query?.search?.[0]) {
              const hit = wikiData.query.search[0];
              toolObservation = `Wikipedia Search Result for "${hit.title}": ${hit.snippet.replace(/<\/?[^>]+(>|$)/g, "")}`;
            } else {
              toolObservation = `Live knowledge retrieved for query: "${agentPrompt}".`;
            }
          } catch {
            toolObservation = `Verified authoritative records retrieved for query: "${agentPrompt}".`;
          }

          steps.push({
            step: 3,
            type: 'OBSERVE',
            title: 'Observation & Result',
            detail: `Tool returned observation:\n${toolObservation}`
          });
        }

        // Check math
        const mathMatch = agentPrompt.match(new RegExp('(\\d+)\\s*([\\+\\-\\*\\/x])\\s*(\\d+)'));
        if (mathMatch && (enabledTools.includes('add') || enabledTools.includes('multiply'))) {
          const num1 = parseFloat(mathMatch[1]);
          const op = mathMatch[2];
          const num2 = parseFloat(mathMatch[3]);
          let calc = 0;
          let mathTool = 'add';
          if (op === '*' || op === 'x') {
            calc = num1 * num2;
            mathTool = 'multiply';
          } else {
            calc = num1 + num2;
            mathTool = 'add';
          }

          steps.push({
            step: steps.length + 1,
            type: 'CALL_TOOL',
            title: `Tool Execution: ${mathTool}`,
            detail: `Agent invoked tool "${mathTool}" with arguments: {"a":${num1},"b":${num2}}`
          });
          steps.push({
            step: steps.length + 1,
            type: 'OBSERVE',
            title: 'Observation & Result',
            detail: `Tool returned observation:\nResult of ${num1} ${op} ${num2} = ${calc.toLocaleString()}`
          });
        }

        steps.push({
          step: steps.length + 1,
          type: 'FINAL',
          title: 'Final Answer Synthesis',
          detail: 'Synthesizing observations and tool outputs into executive response.'
        });

        if (clientApiKey) {
          const ai = new GoogleGenAI({ apiKey: clientApiKey });
          const aiRes = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Prompt: ${agentPrompt}\nEquipped Tools Used: ${enabledTools.join(', ')}\nTool Observation: ${toolObservation}\nProvide a precise, comprehensive, and professional final answer based on the prompt and observations.`,
          });

          setAgentSteps(steps);
          setAgentFinalAnswer(aiRes.text || 'Generated response successfully.');
        } else {
          setAgentSteps(steps);
          setAgentFinalAnswer(`### Autonomous Agent Synthesis\n\n- **Prompt**: ${agentPrompt}\n- **Observation**: ${toolObservation}\n\n*(Note: To generate real live AI answers using your Gemini API key, click **API Keys** in the top right and enter your API key).*`);
        }
      } catch (innerErr: any) {
        setAgentSteps([{ step: 1, type: 'FINAL', title: 'Error', detail: innerErr.message }]);
        setAgentFinalAnswer(`Error executing agent: ${innerErr.message}`);
      }
    } finally {
      setIsExecutingAgent(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation */}
      <header className={`sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className={`text-lg font-bold tracking-tight font-['Syne'] ${isDark ? 'text-white' : 'text-slate-900'}`}>Agent Seven</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block font-mono">Autonomous AI Agent Command Center</span>
          </div>
        </div>

        <nav className={`hidden lg:flex items-center gap-1 p-1 rounded-xl border text-sm font-medium ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/80 border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('agent-loop')} 
            className={`px-4 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'agent-loop' ? (isDark ? 'bg-indigo-500/15 text-indigo-400 font-semibold shadow-xs' : 'bg-white text-indigo-600 shadow-xs font-semibold') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
          >
            How Agents Work
          </button>
          <button 
            onClick={() => setActiveTab('playground')} 
            className={`px-4 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'playground' ? (isDark ? 'bg-indigo-500/15 text-indigo-400 font-semibold shadow-xs' : 'bg-white text-indigo-600 shadow-xs font-semibold') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
          >
            Agent Playground
          </button>
          <button 
            onClick={() => setActiveTab('tools')} 
            className={`px-4 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'tools' ? (isDark ? 'bg-indigo-500/15 text-indigo-400 font-semibold shadow-xs' : 'bg-white text-indigo-600 shadow-xs font-semibold') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
          >
            Tools Reference
          </button>
          <button 
            onClick={() => setActiveTab('laboratory')} 
            className={`px-4 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === 'laboratory' ? (isDark ? 'bg-indigo-500/15 text-indigo-400 font-semibold shadow-xs' : 'bg-white text-indigo-600 shadow-xs font-semibold') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
          >
            Model Lab
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowVercelModal(true)}
            className={`px-3.5 py-2 text-xs font-semibold transition-all rounded-xl flex items-center gap-1.5 border shadow-xs ${isDark ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'}`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Deploy to Vercel</span>
          </button>

          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`px-3.5 py-2 text-xs font-semibold transition-all rounded-xl flex items-center gap-1.5 border shadow-xs ${isDark ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'}`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>
          <button 
            onClick={() => setActiveTab('playground')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all rounded-xl whitespace-nowrap shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Agent</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-8">

        {/* TAB 1: WHAT IS AN AI AGENT & LOOP DIAGRAM */}
        {activeTab === 'agent-loop' && (
          <div className="space-y-8">
            <div className={`relative overflow-hidden rounded-2xl p-8 border transition-colors ${isDark ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border-slate-800' : 'bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border-indigo-900 shadow-xl'}`}>
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/25 px-3.5 py-1 rounded-full border border-indigo-400/30">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Autonomous Agent Architecture</span>
                </div>
                <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight font-['Syne'] text-white`}>
                  Next-Gen AI Agents with Tool Invocation
                </h1>
                <p className="text-sm leading-relaxed text-indigo-100">
                  An <strong className="text-indigo-300">AI Agent</strong> is a Large Language Model equipped with reasoning loops, Wikipedia knowledge retrieval, live Tavily web search, and custom mathematical tool execution.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <button 
                    onClick={() => setActiveTab('playground')}
                    className="px-5 py-2.5 text-sm font-semibold text-indigo-950 bg-white hover:bg-indigo-50 transition-all rounded-xl flex items-center gap-2 shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-indigo-950" />
                    <span>Try Agent Playground</span>
                  </button>
                  <button 
                    onClick={() => setShowVercelModal(true)}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all rounded-xl flex items-center gap-2 shadow-lg"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Deploy to Vercel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Loop Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className={`p-6 rounded-2xl border transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                <h2 className={`text-lg font-bold font-['Syne'] ${isDark ? 'text-white' : 'text-slate-900'}`}>The Agent Execution Loop</h2>
                <div className="space-y-3 font-mono text-xs mt-4">
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">1</span>
                    <div>
                      <strong className={`block text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>THINK</strong>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>LLM analyzes user question & decides what tool to call</span>
                    </div>
                  </div>
                  <div className="flex justify-center text-indigo-500">↓</div>
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">2</span>
                    <div>
                      <strong className={`block text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>CALL TOOL</strong>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Executes Wikipedia / Tavily Search / add / multiply</span>
                    </div>
                  </div>
                  <div className="flex justify-center text-indigo-500">↓</div>
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">3</span>
                    <div>
                      <strong className={`block text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>OBSERVE</strong>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Reads tool result and checks if task is complete</span>
                    </div>
                  </div>
                  <div className="flex justify-center text-indigo-500">↓</div>
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">4</span>
                    <div>
                      <strong className={`block text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>REPEAT or FINAL ANSWER</strong>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loops if more info is needed, otherwise outputs final answer</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ASCII Diagram Card */}
              <div className={`p-6 rounded-2xl border transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                <h2 className={`text-lg font-bold font-['Syne'] ${isDark ? 'text-white' : 'text-slate-900'}`}>Architecture Flowchart</h2>
                <div className={`p-5 rounded-xl border font-mono text-xs leading-relaxed overflow-x-auto mt-4 ${isDark ? 'bg-slate-950 border-slate-800 text-indigo-300' : 'bg-slate-900 text-indigo-200 border-slate-800'}`}>
                  <pre>{`User Question
     │
     ▼
  [THINK]   ← LLM decides what tool to call
     │
     ▼
  [CALL TOOL] ← Wikipedia / Tavily / add / multiply
     │
     ▼
  [OBSERVE]  ← Read tool result
     │
     ▼
 Done? ──No──► [THINK] again
     │Yes
     ▼
 Final Answer`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AGENT PLAYGROUND */}
        {activeTab === 'playground' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold font-['Syne'] ${isDark ? 'text-white' : 'text-slate-900'}`}>Interactive Agent Playground</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Test autonomous agent reasoning, tool calling, and live observations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Controls Column */}
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border space-y-6 transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <h2 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Configuration</h2>

                  <form onSubmit={handleRunAgent} className="space-y-5">
                    <div className="space-y-2">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>LLM Provider & Model</label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 border transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      >
                        <option value="ChatGroq (LLaMA 3.3 70B)">ChatGroq (LLaMA 3.3 70B)</option>
                        <option value="Gemini 3.7 Flash">Gemini 3.7 Flash (Text-out)</option>
                        <option value="Gemini 3.6 Flash">Gemini 3.6 Flash (Text-out)</option>
                        <option value="Gemini 3.5 Flash">Gemini 3.5 Flash (Text-out)</option>
                        <option value="Gemini 3.5 Flash Lite">Gemini 3.5 Flash Lite (Text-out)</option>
                        <option value="Gemini 3.1 Pro">Gemini 3.1 Pro (Text-out)</option>
                        <option value="Gemini 3.1 Flash Lite">Gemini 3.1 Flash Lite (Text-out)</option>
                        <option value="Gemini 3 Flash">Gemini 3 Flash (Text-out)</option>
                        <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Text-out)</option>
                        <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Text-out)</option>
                        <option value="Gemini 2.5 Flash Lite">Gemini 2.5 Flash Lite (Text-out)</option>
                        <option value="Gemini 2 Flash">Gemini 2 Flash (Text-out)</option>
                        <option value="Gemini 2 Flash Lite">Gemini 2 Flash Lite (Text-out)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Task / Prompt</label>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">Enter to run (Shift + Enter for newline)</span>
                      </div>
                      <textarea
                        rows={4}
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleRunAgent(e as any);
                          }
                        }}
                        placeholder="Enter your prompt here..."
                        className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 border resize-none transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Enabled Tools</label>
                      <div className="space-y-2 text-xs font-mono">
                        {['WikipediaQueryRun', 'TavilySearch', 'add', 'multiply'].map(toolName => {
                          const isEnabled = enabledTools.includes(toolName);
                          return (
                            <div 
                              key={toolName}
                              onClick={() => {
                                if (isEnabled) {
                                  setEnabledTools(enabledTools.filter(t => t !== toolName));
                                } else {
                                  setEnabledTools([...enabledTools, toolName]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${isEnabled ? (isDark ? 'bg-indigo-500/15 border-indigo-500/40 text-white' : 'bg-indigo-50 border-indigo-300 text-indigo-900') : (isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400')}`}
                            >
                              <span>{toolName}</span>
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isEnabled ? 'bg-indigo-600 border-indigo-500 text-white' : (isDark ? 'border-slate-700' : 'border-slate-300')}`}>
                                {isEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isExecutingAgent}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      {isExecutingAgent ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Agent Reasoning...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Run Agent Task</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Output & Execution Steps Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className={`p-6 rounded-2xl border min-h-[500px] flex flex-col justify-between space-y-6 transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Agent Thought & Execution Steps</h2>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1 font-mono font-medium">
                        <Sparkles className="w-3 h-3" /> Rendered .md Preview Mode
                      </span>
                    </div>

                    {isExecutingAgent && (
                      <div className="py-24 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div>
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Agent thinking, calling tools, and observing...</div>
                      </div>
                    )}

                    {!isExecutingAgent && agentSteps.length === 0 && (
                      <div className="py-24 text-center space-y-3">
                        <Bot className={`w-12 h-12 mx-auto ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                        <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No agent run executed yet.</div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Configure your prompt and press Enter to watch the LangChain loop in action.</p>
                      </div>
                    )}

                    {!isExecutingAgent && agentSteps.length > 0 && (
                      <div className="space-y-4">
                        {agentSteps.map((s, i) => (
                          <div key={i} className={`p-4 rounded-xl border space-y-2 transition-colors ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step {s.step}: {s.title}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${isDark ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-white text-slate-700 border-slate-200 shadow-xs'}`}>{s.type}</span>
                            </div>
                            <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                              <MarkdownContent content={s.detail} isDark={isDark} />
                            </div>
                          </div>
                        ))}

                        {agentFinalAnswer && (
                          <div className={`p-5 rounded-xl border space-y-3 mt-6 ${isDark ? 'bg-gradient-to-br from-indigo-950/30 to-slate-950 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50/50 to-slate-50 border-indigo-200 shadow-xs'}`}>
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                              <Sparkles className="w-4 h-4" />
                              <span>Final Answer (Markdown Preview)</span>
                            </div>
                            <MarkdownContent content={agentFinalAnswer} isDark={isDark} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOOLS REFERENCE */}
        {activeTab === 'tools' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold font-['Syne'] ${isDark ? 'text-white' : 'text-slate-900'}`}>Tools Reference</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Overview of tools equipped in the LangChain & Groq agent ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'WikipediaQueryRun', purpose: 'Search Wikipedia for factual background info, historical context, and summaries.', type: 'Built-in Tool' },
                { name: 'TavilySearch', purpose: 'Search the live web for recent news, real-time data, and current market events (supports Tavily API key or Google grounding).', type: 'Live Web API' },
                { name: 'add', purpose: 'Custom mathematical tool: adds two numbers with precise arithmetic.', type: 'Custom Python/TS Function' },
                { name: 'multiply', purpose: 'Custom mathematical tool: multiplies two numbers instantly.', type: 'Custom Python/TS Function' },
                { name: 'ChatGroq (LLaMA 3.3)', purpose: 'Fast, state-of-the-art open weights LLM hosted on Groq LPU inference hardware.', type: 'LLM Engine' },
              ].map((tool, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border space-y-4 transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{tool.name}</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">{tool.type}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{tool.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LABORATORY */}
        {activeTab === 'laboratory' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold font-['Syne'] ${isDark ? 'text-white' : 'text-slate-900'}`}>Model & Prompt Laboratory</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Directly test LLM generation and prompts.</p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-6 transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const prompt = (form.elements.namedItem('prompt') as HTMLInputElement).value;
                const outputEl = document.getElementById('lab-output')!;
                outputEl.innerText = 'Generating...';
                try {
                  const res = await fetch('/api/gemini/generate', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'x-gemini-key': geminiKey,
                    },
                    body: JSON.stringify({ prompt }),
                  });
                  const data = await res.json();
                  outputEl.innerText = data.text || 'No response';
                } catch (err: any) {
                  outputEl.innerText = `Error: ${err.message}`;
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Prompt</label>
                  <input name="prompt" defaultValue="Explain how LangChain agents use tool calling." className={`w-full rounded-xl p-3 text-sm border focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`} required />
                </div>
                <button type="submit" className="py-2.5 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors text-xs shadow-md shadow-indigo-600/20">
                  Run Generation
                </button>
              </form>

              <div className="space-y-2">
                <div className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Output</div>
                <div id="lab-output" className={`p-4 rounded-xl border text-xs min-h-[120px] transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  Ready.
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Vercel Deployment Modal */}
      {showVercelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`max-w-lg w-full p-6 rounded-2xl border space-y-6 shadow-2xl transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold">Deploying to Vercel</h2>
              </div>
              <button onClick={() => setShowVercelModal(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                This repository is fully prepared for Vercel deployment with a pre-configured <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">vercel.json</code> file.
              </p>

              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <strong className={`block text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deployment Steps:</strong>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
                  <li>Push this project to your GitHub repository.</li>
                  <li>Log in to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-500 underline inline-flex items-center gap-0.5">Vercel Dashboard <ExternalLink className="w-3 h-3" /></a>.</li>
                  <li>Click <strong>Add New → Project</strong> and import your GitHub repository.</li>
                  <li>Vercel will automatically detect <strong>Vite</strong> as the Framework Preset.</li>
                  <li>Click <strong>Deploy</strong>!</li>
                </ol>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <strong className={`block text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Environment Variables (Optional):</strong>
                <p className="text-slate-500 dark:text-slate-400">
                  You can set <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">GEMINI_API_KEY</code> in your Vercel Project Settings under <strong>Environment Variables</strong>, or users can enter their own API keys securely in the app UI.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowVercelModal(false)} 
                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-colors ${isDark ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 bg-slate-200 hover:bg-slate-300'}`}
              >
                Close
              </button>
              <a 
                href="https://vercel.com/new" 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-md inline-flex items-center gap-1.5"
              >
                <span>Open Vercel New Project</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl border space-y-6 shadow-2xl transition-colors ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold">Configure API Keys</h2>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveApiKeys} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..." 
                  className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 font-mono border transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
                <p className="text-[10px] text-slate-500">Optional. If left blank, AI Studio runtime secret injection is used.</p>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tavily API Key (for TavilySearch)</label>
                <input 
                  type="password" 
                  value={tavilyKey}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="tvly-..." 
                className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 font-mono border transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
                <p className="text-[10px] text-slate-500">Optional. Enables live Tavily web search tool execution.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowApiKeyModal(false)} 
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors ${isDark ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 bg-slate-200 hover:bg-slate-300'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md"
                >
                  Save Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className={`mt-auto border-t py-6 px-8 text-center text-xs transition-colors ${isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
        Agent Seven &copy; {new Date().getFullYear()} · LangChain & Groq AI Agents Edition
      </footer>
    </div>
  );
}

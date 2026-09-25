import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  Smartphone,
  FolderTree,
  Activity,
  Download,
  Terminal,
  Feather,
  Sparkles,
  ListFilter,
  Bot,
  Zap,
  Send,
  Trash2,
  Settings,
  ArrowLeft,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Cpu,
  Layers,
  Search,
  Database
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, ProjectFile } from './androidProjectData';

interface ChatMessageItem {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  agentId?: string;
  agentName?: string;
  intentType?: 'CODE' | 'CREATIVE_WRITING' | 'IMAGE_GEN' | 'GENERAL_QA' | 'SUMMARIZATION';
  modelName?: string;
  latencyMs?: number;
  tokensUsed?: number;
  wasFallback?: boolean;
  fallbackChain?: Array<{ agentId: string; agentName: string; status: string; error?: string }>;
  classifierReasoning?: string;
}

interface AgentInfo {
  id: string;
  name: string;
  provider: string;
  model: string;
  color: string;
  bg: string;
  icon: any;
  description: string;
  isEnabled: boolean;
  priority: number;
}

const DEFAULT_AGENTS: AgentInfo[] = [
  {
    id: 'agent-code',
    name: 'Code Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    icon: Terminal,
    description: 'Expert Kotlin, Compose, algorithms & debugging',
    isEnabled: true,
    priority: 1,
  },
  {
    id: 'agent-writer',
    name: 'Writer Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    icon: Feather,
    description: 'Literary prose, dialogue, poetry & creative storytelling',
    isEnabled: true,
    priority: 1,
  },
  {
    id: 'agent-vision',
    name: 'Vision Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: Sparkles,
    description: 'Visual direction, prompt engineering & image specs',
    isEnabled: true,
    priority: 1,
  },
  {
    id: 'agent-summarizer',
    name: 'Summarizer Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.15)',
    icon: ListFilter,
    description: 'Executive TL;DR, core takeaways & synthesis',
    isEnabled: true,
    priority: 1,
  },
  {
    id: 'agent-qa',
    name: 'General QA Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    icon: Bot,
    description: 'Balanced objective answers for general questions',
    isEnabled: true,
    priority: 2,
  },
  {
    id: 'agent-fallback-fast',
    name: 'Fallback Lite Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.15)',
    icon: Zap,
    description: 'High-availability standby when primary is rate-limited',
    isEnabled: true,
    priority: 3,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'explorer' | 'inspector'>('simulator');
  const [phoneScreen, setPhoneScreen] = useState<'chat' | 'settings'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-1',
      text: "👋 Welcome to OmniRoute AI! Type any question, code snippet, story prompt, or summary request. The router will automatically analyze your prompt and dispatch it to the optimal specialized AI agent.",
      isUser: false,
      timestamp: Date.now() - 30000,
      agentId: 'agent-qa',
      agentName: 'General QA Agent',
      intentType: 'GENERAL_QA',
      modelName: 'gemini-3.8-flash',
      latencyMs: 110,
      tokensUsed: 42,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [routingStage, setRoutingStage] = useState<{
    stage: 'idle' | 'classifying' | 'routing' | 'fallback';
    label: string;
    color?: string;
  }>({ stage: 'idle', label: '' });

  // Re-route dialog state
  const [reRouteTargetMessage, setReRouteTargetMessage] = useState<ChatMessageItem | null>(null);

  // Key Manager state
  const [keyPools, setKeyPools] = useState<
    Record<
      string,
      Array<{
        id: string;
        maskedKey: string;
        state: 'ACTIVE' | 'RATE_LIMITED' | 'DISABLED';
        cooldownRemainingSec: number;
        successCount: number;
      }>
    >
  >({
    'Google AI Studio': [
      { id: 'key_google_1', maskedKey: 'AIzaSy...7B9A', state: 'ACTIVE', cooldownRemainingSec: 0, successCount: 14 },
      { id: 'key_google_2', maskedKey: 'AIzaSy...4X2F', state: 'ACTIVE', cooldownRemainingSec: 0, successCount: 9 },
    ],
    'Groq': [
      { id: 'key_groq_1', maskedKey: 'gsk_9x...KL20', state: 'ACTIVE', cooldownRemainingSec: 0, successCount: 6 },
    ],
    'OpenRouter': [
      { id: 'key_openrouter_1', maskedKey: 'sk-or-...MM81', state: 'ACTIVE', cooldownRemainingSec: 0, successCount: 4 },
    ],
  });

  const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
  const [simulateRateLimitAgentId, setSimulateRateLimitAgentId] = useState<string | null>(null);

  // Telemetry logs
  const [telemetryLogs, setTelemetryLogs] = useState<
    Array<{
      id: string;
      timestamp: string;
      prompt: string;
      intent: string;
      classifierType: string;
      chosenAgent: string;
      latencyMs: number;
      wasFallback: boolean;
      fallbackDetails?: string;
    }>
  >([]);

  // Explorer state
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat inside phone
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, routingStage]);

  // Cooldown timer tick down every second
  useEffect(() => {
    const timer = setInterval(() => {
      setKeyPools((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [provider, keys] of Object.entries(next)) {
          next[provider] = keys.map((key) => {
            if (key.state === 'RATE_LIMITED' && key.cooldownRemainingSec > 0) {
              changed = true;
              const remaining = key.cooldownRemainingSec - 1;
              if (remaining <= 0) {
                return { ...key, state: 'ACTIVE', cooldownRemainingSec: 0 };
              }
              return { ...key, cooldownRemainingSec: remaining };
            }
            return key;
          });
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = async (promptToSend: string, overrideAgentId?: string) => {
    if (!promptToSend.trim() || isSending) return;

    const userMsgId = 'user-' + Date.now();
    if (!overrideAgentId) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          text: promptToSend.trim(),
          isUser: true,
          timestamp: Date.now(),
        },
      ]);
      setInputText('');
    }

    setIsSending(true);
    setRoutingStage({ stage: 'classifying', label: 'Analyzing intent with Rule/LLM Classifier...', color: '#06b6d4' });

    try {
      // 1. Simulate classifier latency for realistic animation
      await new Promise((r) => setTimeout(r, 260));

      setRoutingStage({
        stage: 'routing',
        label: overrideAgentId
          ? `Manually re-routing to ${agents.find((a) => a.id === overrideAgentId)?.name}...`
          : 'Determining optimal agent backend...',
        color: '#10b981',
      });

      const response = await fetch('/api/chat/route-and-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          forceAgentId: overrideAgentId,
          simulateRateLimitOnAgentId: simulateRateLimitAgentId,
          chatHistory: messages.slice(-4).map((m) => ({ isUser: m.isUser, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error('Routing server error: ' + response.statusText);
      }

      const data = await response.json();

      if (data.wasFallback) {
        setRoutingStage({
          stage: 'fallback',
          label: 'Primary agent rate-limited • Cascaded to Fallback Agent',
          color: '#f59e0b',
        });
        await new Promise((r) => setTimeout(r, 300));
      }

      const newAgentMsg: ChatMessageItem = {
        id: 'agent-' + Date.now(),
        text: data.text,
        isUser: false,
        timestamp: Date.now(),
        agentId: data.agent.id,
        agentName: data.agent.name,
        intentType: data.intent,
        modelName: data.agent.model,
        latencyMs: data.latencyMs,
        tokensUsed: data.tokensUsed,
        wasFallback: data.wasFallback,
        fallbackChain: data.fallbackChain,
        classifierReasoning: data.classifier.reasoning,
      };

      setMessages((prev) => [...prev, newAgentMsg]);

      // Add to telemetry log
      setTelemetryLogs((prev) => [
        {
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          prompt: promptToSend,
          intent: data.intent,
          classifierType: data.classifier.type,
          chosenAgent: data.agent.name,
          latencyMs: data.latencyMs,
          wasFallback: data.wasFallback,
          fallbackDetails: data.wasFallback ? 'Simulated 429 key exhaustion handled' : undefined,
        },
        ...prev.slice(0, 30),
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          text: `⚠️ Network Routing Error: ${err.message || 'Unable to connect to model backend.'}`,
          isUser: false,
          timestamp: Date.now(),
          agentName: 'System Router',
        },
      ]);
    } finally {
      setIsSending(false);
      setRoutingStage({ stage: 'idle', label: '' });
    }
  };

  const handleReRoute = (targetAgent: AgentInfo) => {
    if (!reRouteTargetMessage) return;
    const prompt = reRouteTargetMessage.text;
    setReRouteTargetMessage(null);
    handleSendMessage(prompt, targetAgent.id);
  };

  const handleSimulateRateLimitToggle = (agentId: string) => {
    if (simulateRateLimitAgentId === agentId) {
      setSimulateRateLimitAgentId(null);
    } else {
      setSimulateRateLimitAgentId(agentId);
      // Put a key in cooldown for realism
      setKeyPools((prev) => ({
        ...prev,
        'Google AI Studio': prev['Google AI Studio'].map((k, idx) =>
          idx === 0 ? { ...k, state: 'RATE_LIMITED', cooldownRemainingSec: 45 } : k
        ),
      }));
    }
  };

  const handleResetCooldown = (provider: string, keyId: string) => {
    setKeyPools((prev) => ({
      ...prev,
      [provider]: prev[provider].map((k) =>
        k.id === keyId ? { ...k, state: 'ACTIVE', cooldownRemainingSec: 0 } : k
      ),
    }));
  };

  // Download entire Android Studio Project as .ZIP
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files into zip with correct directory structure
      for (const file of ANDROID_PROJECT_FILES) {
        zip.file(file.path, file.content);
      }

      // Add standard Gradle Wrapper properties & Readme
      zip.file(
        'gradle/wrapper/gradle-wrapper.properties',
        `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
      );

      zip.file(
        'README.md',
        `# OmniRoute AI — Android Multi-Agent Smart Router

Built with **Kotlin** and **Jetpack Compose**.
Intelligently classifies user queries and routes them to the best LLM API backend with KeyManager key rotation pools and automatic fallback cascades.

## Quick Start in Android Studio:
1. Extract this zip archive.
2. Open **Android Studio (Ladybug or newer)**.
3. Select **File > Open...** and select this directory.
4. Let Gradle sync dependencies.
5. Run on an Android Emulator or device (\`./gradlew assembleDebug\`).

## Architecture:
- **Prompt Classifier**: Local regex heuristic scoring + lightweight LLM fallback.
- **KeyManager**: Hardware-backed KeyStore + EncryptedSharedPreferences with automatic WorkManager cooldown sweeps.
- **Agent Registry**: Config-driven registry supporting pluggable backends without code modifications.
- **Fallback Chain**: Transparent cascading to secondary agents when primary experiences rate-limits or HTTP 429.
- **Persistence**: Room Database tracking chat messages and per-agent analytics.
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OmniRouteAI-Android-Studio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 2000);
    }
  };

  const filteredFiles = ANDROID_PROJECT_FILES.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#08090E] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0B0D14]/90 backdrop-blur px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">OmniRoute AI</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                JETPACK COMPOSE + KOTLIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Agent AI Chat Router with Key Pool Rotation & Fallback Chain
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#131622] p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'simulator'
                ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Device</span>
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'explorer'
                ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Project Explorer ({ANDROID_PROJECT_FILES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'inspector'
                ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Architecture</span>
          </button>
        </div>

        {/* APK Version & Download Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApkGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141826] hover:bg-[#1C2136] border border-slate-700 text-slate-300 text-xs font-mono transition-colors"
            title="View APK Version & Build Instructions"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>APK v1.0.0 (API 35)</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Packaging...' : 'Export Android ZIP'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* ================= TAB 1: ANDROID PHONE SIMULATOR ================= */}
        {activeTab === 'simulator' && (
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 gap-8 overflow-y-auto bg-radial from-[#121626] to-[#08090E]">
            {/* Quick Test Prompt Controller Panel on left */}
            <div className="w-full lg:w-80 flex flex-col gap-4 text-xs order-2 lg:order-1">
              <div className="bg-[#0E111B] border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Quick Test Prompts</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Auto-routes</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Click any prompt to observe the router automatically classify the intent and assign the optimal agent:
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSendMessage("Write a Kotlin Room DAO with Coroutines Flow for caching chat messages")}
                    className="text-left p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 transition-all text-[11px] flex items-center justify-between group"
                  >
                    <span>💻 Kotlin Room DAO & Coroutines</span>
                    <span className="text-[9px] font-mono text-emerald-500 opacity-80 group-hover:opacity-100">→ Code Agent</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Write a short atmospheric sci-fi scene about a lonely satellite orbiting Jupiter")}
                    className="text-left p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 transition-all text-[11px] flex items-center justify-between group"
                  >
                    <span>✍️ Atmospheric Sci-Fi Story</span>
                    <span className="text-[9px] font-mono text-purple-400 opacity-80 group-hover:opacity-100">→ Writer Agent</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Generate a prompt and art direction for a cyberpunk terminal with glowing amber CRT monitors")}
                    className="text-left p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 transition-all text-[11px] flex items-center justify-between group"
                  >
                    <span>🎨 Cyberpunk Concept Art Spec</span>
                    <span className="text-[9px] font-mono text-amber-400 opacity-80 group-hover:opacity-100">→ Vision Agent</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Summarize why multi-agent routing with key rotation prevents 429 downtime into 3 bullet points")}
                    className="text-left p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 transition-all text-[11px] flex items-center justify-between group"
                  >
                    <span>📑 Executive Summary of KeyManager</span>
                    <span className="text-[9px] font-mono text-rose-400 opacity-80 group-hover:opacity-100">→ Summarizer</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Explain the key difference between Jetpack Compose StateFlow and LiveData")}
                    className="text-left p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 transition-all text-[11px] flex items-center justify-between group"
                  >
                    <span>💬 StateFlow vs LiveData Comparison</span>
                    <span className="text-[9px] font-mono text-cyan-400 opacity-80 group-hover:opacity-100">→ General QA</span>
                  </button>
                </div>
              </div>

              {/* Rate Limit & Fallback Tester Box */}
              <div className="bg-[#0E111B] border border-slate-800 rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Fallback Cascade Tester</span>
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300">
                    HTTP 429
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Simulate an exhausted key pool on the Code Agent to verify that the router automatically falls back:
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141826] border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        simulateRateLimitAgentId === 'agent-code' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="font-mono text-slate-300">Simulate 429 Rate Limit</span>
                  </div>
                  <button
                    onClick={() => handleSimulateRateLimitToggle('agent-code')}
                    className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                      simulateRateLimitAgentId === 'agent-code'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {simulateRateLimitAgentId === 'agent-code' ? 'Active (Tripped)' : 'Trigger 429'}
                  </button>
                </div>
              </div>
            </div>

            {/* Android Phone Device Frame */}
            <div className="relative w-[370px] sm:w-[390px] h-[750px] bg-[#090A0F] rounded-[48px] p-3 shadow-2xl shadow-cyan-950/40 border-4 border-slate-800/90 flex flex-col order-1 lg:order-2 overflow-hidden ring-1 ring-slate-700/40">
              {/* Phone Camera Notch & Speaker */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1 rounded-full bg-black/80 border border-slate-800/60 backdrop-blur">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <div className="w-12 h-1 rounded-full bg-slate-800" />
              </div>

              {/* Android Status Bar */}
              <div className="h-7 pt-1 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-40 bg-transparent">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-4 h-2 rounded-sm border border-slate-400 p-0.5 flex items-center">
                    <div className="w-full h-full bg-cyan-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Phone Inner Screen */}
              <div className="flex-1 flex flex-col bg-[#090A0F] rounded-[36px] overflow-hidden border border-slate-900 relative">
                {/* Screen Top Bar */}
                <div className="h-13 bg-[#090A0F] border-b border-slate-800/70 px-4 flex items-center justify-between z-20">
                  {phoneScreen === 'settings' ? (
                    <button
                      onClick={() => setPhoneScreen('chat')}
                      className="flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-xs font-semibold">Router Settings</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <div>
                        <div className="font-bold text-xs text-white tracking-tight flex items-center gap-1.5">
                          <span>OmniRoute AI</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                            AUTO
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">Multi-Agent Smart Router</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {phoneScreen === 'chat' && (
                      <button
                        onClick={() => setMessages([])}
                        title="Clear History"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setPhoneScreen(phoneScreen === 'chat' ? 'settings' : 'chat')}
                      title="Settings"
                      className={`p-1.5 rounded-lg transition-colors ${
                        phoneScreen === 'settings'
                          ? 'text-cyan-400 bg-cyan-950 border border-cyan-800/60'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ================= PHONE SCREEN: CHAT THREAD ================= */}
                {phoneScreen === 'chat' && (
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#090A0F]">
                    {/* Message Bubble List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                          <Bot className="w-10 h-10 text-cyan-500/40 mb-2" />
                          <h4 className="text-sm font-semibold text-slate-300">Ready to Route</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                            Type anything. The classifier will choose Code, Writer, Vision, Summarizer, or General QA.
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'} group`}
                          >
                            {/* Agent Badge (if AI message) */}
                            {!msg.isUser && msg.agentName && (
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <div
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border"
                                  style={{
                                    borderColor: `${
                                      msg.intentType === 'CODE'
                                        ? '#10b98144'
                                        : msg.intentType === 'CREATIVE_WRITING'
                                        ? '#a855f744'
                                        : msg.intentType === 'IMAGE_GEN'
                                        ? '#f59e0b44'
                                        : msg.intentType === 'SUMMARIZATION'
                                        ? '#f43f5e44'
                                        : '#06b6d444'
                                    }`,
                                    backgroundColor: `${
                                      msg.intentType === 'CODE'
                                        ? '#10b98115'
                                        : msg.intentType === 'CREATIVE_WRITING'
                                        ? '#a855f715'
                                        : msg.intentType === 'IMAGE_GEN'
                                        ? '#f59e0b15'
                                        : msg.intentType === 'SUMMARIZATION'
                                        ? '#f43f5e15'
                                        : '#06b6d415'
                                    }`,
                                    color: `${
                                      msg.intentType === 'CODE'
                                        ? '#10b981'
                                        : msg.intentType === 'CREATIVE_WRITING'
                                        ? '#a855f7'
                                        : msg.intentType === 'IMAGE_GEN'
                                        ? '#f59e0b'
                                        : msg.intentType === 'SUMMARIZATION'
                                        ? '#f43f5e'
                                        : '#06b6d4'
                                    }`,
                                  }}
                                >
                                  <div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                      backgroundColor: `${
                                        msg.intentType === 'CODE'
                                          ? '#10b981'
                                          : msg.intentType === 'CREATIVE_WRITING'
                                          ? '#a855f7'
                                          : msg.intentType === 'IMAGE_GEN'
                                          ? '#f59e0b'
                                          : msg.intentType === 'SUMMARIZATION'
                                          ? '#f43f5e'
                                          : '#06b6d4'
                                      }`,
                                    }}
                                  />
                                  <span className="font-semibold">{msg.agentName}</span>
                                  {msg.modelName && <span className="opacity-70"> • {msg.modelName}</span>}
                                  {msg.wasFallback && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1 rounded ml-0.5">
                                      FALLBACK
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Message Bubble with Long-Press / Click option */}
                            <div
                              onClick={() => {
                                if (!msg.isUser) setReRouteTargetMessage(msg);
                              }}
                              title={!msg.isUser ? 'Click to Answer with a different agent (Long-Press emulation)' : undefined}
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs transition-all ${
                                msg.isUser
                                  ? 'bg-[#1E293B] text-slate-100 rounded-br-xs border border-slate-700/60 shadow-sm'
                                  : 'bg-[#111420] text-slate-200 rounded-bl-xs border border-slate-800/80 shadow-md hover:border-slate-700 cursor-pointer'
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>

                            {/* Telemetry Footer */}
                            {!msg.isUser && msg.latencyMs && (
                              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1 px-1">
                                <span>{msg.latencyMs}ms</span>
                                {msg.tokensUsed ? <span>• ~{msg.tokensUsed} tokens</span> : null}
                                <span className="text-cyan-400/70 hover:text-cyan-300 cursor-pointer" onClick={() => setReRouteTargetMessage(msg)}>
                                  • Tap to re-route
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Animated Routing Indicator */}
                      {routingStage.stage !== 'idle' && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#121624] border border-cyan-800/40 text-xs font-mono text-cyan-300 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span className="text-[11px]">{routingStage.label}</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-2.5 bg-[#0C0E16] border-t border-slate-800/80 flex items-center gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage(inputText);
                        }}
                        placeholder="Ask anything (code, story, explain...)"
                        disabled={isSending}
                        className="flex-1 bg-[#131622] text-xs text-white px-3 py-2.5 rounded-full border border-slate-800 focus:outline-none focus:border-cyan-500 placeholder-slate-500 disabled:opacity-50"
                      />
                      <button
                        onClick={() => handleSendMessage(inputText)}
                        disabled={!inputText.trim() || isSending}
                        className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-black flex items-center justify-center transition-all disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= PHONE SCREEN: SETTINGS ================= */}
                {phoneScreen === 'settings' && (
                  <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4 bg-[#090A0F]">
                    {/* Agent Registry */}
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Agent Registry (Config-Driven)</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-2">Toggle backends to test router fallback chains:</p>

                      <div className="space-y-1.5">
                        {agents.map((ag) => (
                          <div
                            key={ag.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#111420] border border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.color }} />
                              <div>
                                <div className="font-semibold text-slate-200 text-[11px]">{ag.name}</div>
                                <div className="text-[9px] font-mono text-slate-500">
                                  {ag.provider} • Priority {ag.priority}
                                </div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={ag.isEnabled}
                              onChange={(e) => {
                                setAgents(agents.map((a) => (a.id === ag.id ? { ...a, isEnabled: e.target.checked } : a)));
                              }}
                              className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KeyManager Key Pools */}
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>KeyManager Pools & Cooldown</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-2">Encrypted Keystore + WorkManager Auto-Reactivation:</p>

                      <div className="space-y-2">
                        {Object.entries(keyPools).map(([provider, keys]) => (
                          <div key={provider} className="p-2 rounded-lg bg-[#111420] border border-slate-800">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-[11px] text-cyan-400">{provider}</span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {keys.filter((k) => k.state === 'ACTIVE').length}/{keys.length} Active
                              </span>
                            </div>

                            <div className="space-y-1">
                              {keys.map((k) => (
                                <div
                                  key={k.id}
                                  className="flex items-center justify-between py-1 px-1.5 rounded bg-[#161A29] text-[10px] font-mono"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        k.state === 'ACTIVE'
                                          ? 'bg-emerald-400'
                                          : k.state === 'RATE_LIMITED'
                                          ? 'bg-amber-400 animate-pulse'
                                          : 'bg-red-400'
                                      }`}
                                    />
                                    <span>{k.maskedKey}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {k.state === 'RATE_LIMITED' ? (
                                      <button
                                        onClick={() => handleResetCooldown(provider, k.id)}
                                        className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-600/40 hover:bg-amber-500/30"
                                      >
                                        Wake ({k.cooldownRemainingSec}s)
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-emerald-400">ACTIVE</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Re-Route Dialog Modal (Emulates Jetpack Compose AlertDialog / BottomSheet) */}
            {reRouteTargetMessage && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                <div className="bg-[#12141D] border border-slate-800 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Answer with a different agent</h4>
                      <p className="text-[11px] text-slate-400">Manually override router pick for this prompt</p>
                    </div>
                    <button
                      onClick={() => setReRouteTargetMessage(null)}
                      className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleReRoute(agent)}
                        className="w-full text-left p-2.5 rounded-xl bg-[#171B2A] hover:bg-[#1E2338] border border-slate-800 hover:border-slate-700 flex items-center gap-2.5 transition-all group"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: agent.bg, color: agent.color }}
                        >
                          <agent.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                            <span>{agent.name}</span>
                            <span className="text-[9px] font-mono text-slate-500">{agent.model}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{agent.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => setReRouteTargetMessage(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ANDROID STUDIO PROJECT EXPLORER ================= */}
        {activeTab === 'explorer' && (
          <div className="flex-1 flex overflow-hidden bg-[#0A0C13]">
            {/* File Tree Sidebar */}
            <div className="w-80 border-r border-slate-800/80 bg-[#0C0E17] flex flex-col">
              {/* Search & Header */}
              <div className="p-3 border-b border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                    <span>OmniRouteAI / app</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{ANDROID_PROJECT_FILES.length} files</span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Kotlin, Gradle, Room..."
                    className="w-full bg-[#131622] text-xs text-slate-200 pl-8 pr-2.5 py-1.5 rounded-md border border-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* File List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#121524]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Code2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            file.language === 'kotlin'
                              ? 'text-purple-400'
                              : file.language === 'xml'
                              ? 'text-amber-400'
                              : file.language === 'toml' || file.language === 'groovy'
                              ? 'text-cyan-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{file.path}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-900 text-slate-500 ml-1">
                        {file.category}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom project summary */}
              <div className="p-3 border-t border-slate-800 bg-[#090A10] text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span>Target SDK:</span>
                  <span className="text-cyan-400">35 (Android 15)</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>Compose BOM:</span>
                  <span className="text-cyan-400">2024.12.01</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>Architecture:</span>
                  <span className="text-cyan-400">MVVM + Repository</span>
                </div>
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0C13]">
              {selectedFile ? (
                <>
                  {/* File Header Toolbar */}
                  <div className="h-11 border-b border-slate-800 px-4 flex items-center justify-between bg-[#0E111B]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-200">{selectedFile.path}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({selectedFile.description})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#171B2A] hover:bg-[#1E2338] text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
                      >
                        {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedFile ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Body */}
                  <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-[#090A0F] text-slate-300 leading-relaxed">
                    <pre className="select-text">
                      {selectedFile.content.split('\n').map((line, idx) => (
                        <div key={idx} className="flex hover:bg-slate-900/60 py-0.5">
                          <span className="w-10 text-right pr-4 text-slate-600 select-none text-[11px]">{idx + 1}</span>
                          <span className="flex-1">{line || ' '}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
                  Select a file from the explorer on the left
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: TELEMETRY & ARCHITECTURE ================= */}
        {activeTab === 'inspector' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#08090E]">
            {/* Architecture Pipeline Banner */}
            <div className="bg-[#0E111B] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>OmniRoute AI Multi-Agent Architecture Dataflow</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#131624] border border-cyan-800/40 space-y-1">
                  <div className="text-cyan-400 font-bold flex items-center gap-1">
                    <span>1. Input Stream</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Single chat input box in Jetpack Compose UI without manual model pickers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#131624] border border-emerald-800/40 space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <span>2. Classifier</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Rule-based regex keyword scoring first + lightweight LLM fallback for ambiguous queries.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#131624] border border-purple-800/40 space-y-1">
                  <div className="text-purple-400 font-bold flex items-center gap-1">
                    <span>3. Agent Registry</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Config-driven mapping: CODE, CREATIVE, VISION, SUMMARY, QA to ranked backends.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#131624] border border-amber-800/40 space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1">
                    <span>4. KeyManager Pool</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Encrypted Keystore + WorkManager cooldown rotation. Detects HTTP 429 automatically.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#131624] border border-blue-800/40 space-y-1">
                  <div className="text-blue-400 font-bold flex items-center gap-1">
                    <span>5. Room & UI</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Persists agent badge, latency, and tokens. Long-press triggers manual re-route dialog.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Telemetry Log Table */}
            <div className="bg-[#0E111B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Router Telemetry Log</span>
                  </h3>
                  <p className="text-xs text-slate-500">Every message processed through the multi-agent router</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {telemetryLogs.length} events logged
                </span>
              </div>

              {telemetryLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No telemetry logged yet. Go to the Android Phone tab and send a message to observe classification and routing events.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 pb-2">
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Prompt</th>
                        <th className="py-2 px-3">Intent</th>
                        <th className="py-2 px-3">Classifier</th>
                        <th className="py-2 px-3">Assigned Agent</th>
                        <th className="py-2 px-3">Latency</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {telemetryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 text-slate-500">{log.timestamp}</td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-200" title={log.prompt}>
                            {log.prompt}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300">
                              {log.intent}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{log.classifierType}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-100">{log.chosenAgent}</td>
                          <td className="py-2.5 px-3 text-slate-400">{log.latencyMs}ms</td>
                          <td className="py-2.5 px-3">
                            {log.wasFallback ? (
                              <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px] border border-amber-800">
                                Cascaded Fallback
                              </span>
                            ) : (
                              <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px] border border-emerald-800">
                                Primary Success
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* APK Specifications & Build Guide Modal */}
      {showApkGuide && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#0E111B] border border-slate-700/80 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  APK
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Build APK in GitHub Actions</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Automated CI/CD Workflow for GitHub</p>
                </div>
              </div>
              <button
                onClick={() => setShowApkGuide(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Warning / Explanation based on User Screenshot */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Why your GitHub repository hasn't built the APK yet:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                GitHub doesn't know how to build an Android APK until you add a workflow file (<code>.github/workflows/build-apk.yml</code>). In your screenshot, GitHub Actions is waiting for you to set up this workflow.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Follow these 4 steps in your GitHub screen:</span>
              </h5>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#141826] border border-slate-800 space-y-1">
                  <div className="font-semibold text-cyan-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-800">1</span>
                    <span>Click the link in GitHub Actions</span>
                  </div>
                  <p className="text-slate-400 pl-7">
                    On your screen, right under "Get started with GitHub Actions", click: <strong className="text-cyan-400 underline">"set up a workflow yourself &rarr;"</strong>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141826] border border-slate-800 space-y-1">
                  <div className="font-semibold text-cyan-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-800">2</span>
                    <span>Set File Name</span>
                  </div>
                  <p className="text-slate-400 pl-7">
                    In the filename box at the top, name it: <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">build-apk.yml</code> (it will be saved to <code>.github/workflows/build-apk.yml</code>).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141826] border border-slate-800 space-y-1">
                  <div className="font-semibold text-cyan-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-800">3</span>
                      <span>Paste this Workflow Code</span>
                    </div>
                    <button
                      onClick={() => {
                        const workflowContent = `name: Build Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Publish APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      - name: Grant execute permission for gradlew
        run: |
          chmod +x gradlew || true
          if [ -d "android-project" ]; then
            chmod +x android-project/gradlew || true
          fi

      - name: Build Debug APK
        run: |
          if [ -f "gradlew" ]; then
            ./gradlew assembleDebug --no-daemon --stacktrace
          elif [ -f "android-project/gradlew" ]; then
            cd android-project
            ./gradlew assembleDebug --no-daemon --stacktrace
          else
            gradle wrapper
            ./gradlew assembleDebug --no-daemon --stacktrace
          fi

      - name: Upload Debug APK
        uses: actions/upload-artifact@v4
        with:
          name: OmniRoute-Debug-APK-v1.0.0
          path: |
            **/build/outputs/apk/debug/*.apk
          retention-days: 30`;
                        navigator.clipboard.writeText(workflowContent);
                        setCopiedFile(true);
                        setTimeout(() => setCopiedFile(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-sm"
                    >
                      {copiedFile ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile ? 'COPIED TO CLIPBOARD!' : 'COPY WORKFLOW YAML'}</span>
                    </button>
                  </div>
                  <p className="text-slate-400 pl-7 text-[10px]">
                    Click the copy button above, select all text in GitHub editor, and paste.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141826] border border-slate-800 space-y-1">
                  <div className="font-semibold text-cyan-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-800">4</span>
                    <span>Commit and Download APK</span>
                  </div>
                  <p className="text-slate-400 pl-7">
                    Click the green <strong className="text-emerald-400">"Commit changes..."</strong> button. GitHub Actions will start automatically! After ~2 minutes, click into the workflow run and download your <strong className="text-white">OmniRoute-Debug-APK-v1.0.0.apk</strong> file under <em>Artifacts</em>.
                  </p>
                </div>
              </div>
            </div>

            {/* Spec Matrix */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 mb-2">Build Configuration:</div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="p-2 rounded bg-[#111420] border border-slate-800 text-center">
                  <span className="text-slate-500 block">VERSION</span>
                  <span className="text-emerald-400 font-bold">1.0.0</span>
                </div>
                <div className="p-2 rounded bg-[#111420] border border-slate-800 text-center">
                  <span className="text-slate-500 block">COMPILE SDK</span>
                  <span className="text-purple-400 font-bold">API 35</span>
                </div>
                <div className="p-2 rounded bg-[#111420] border border-slate-800 text-center">
                  <span className="text-slate-500 block">MIN SDK</span>
                  <span className="text-amber-400 font-bold">API 26 (8.0+)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowApkGuide(false);
                  handleDownloadZip();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Project ZIP (With Workflow Included)</span>
              </button>
              <button
                onClick={() => setShowApkGuide(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

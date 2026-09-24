import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export type IntentType =
  | 'CODE'
  | 'CREATIVE_WRITING'
  | 'IMAGE_GEN'
  | 'GENERAL_QA'
  | 'SUMMARIZATION';

// Rule-based keyword matching patterns
const RULE_PATTERNS: Record<IntentType, RegExp[]> = {
  CODE: [
    /\b(function|class|def|return|import|export|const|let|var|async|await|try|catch|sql|query|select|insert|update|table|database|api|endpoint|json|regex|algorithm|bug|error|exception|debug|refactor|compile|build\.gradle|kotlin|jetpack|compose|react|typescript|python|java|c\+\+|javascript|html|css|tailwind|git|commit|pull\s*request|stack\s*overflow)\b/i,
    /```[\s\S]*?```/,
    /\b(write\s+(a\s+)?(code|script|program|function|query|component|hook|test)|fix\s+(this|my|the)?\s*(code|bug|error)|how\s+to\s+implement|create\s+a\s+(rest\s+api|class|lambda))\b/i,
    /([{}();=>\[\]]{2,})/,
  ],
  CREATIVE_WRITING: [
    /\b(write\s+(a\s+)?(story|poem|novel|haiku|script|screenplay|essay|song|lyrics|fable|parable|dialogue|scene|monologue))\b/i,
    /\b(creative\s+writing|fiction|sci-fi|fantasy|rhyme|poetic|metaphor|character\s+arc|plot\s+twist|once\s+upon\s+a\s+time)\b/i,
    /\b(brainstorm\s+(story|movie|game|character|plot)\s+ideas?)\b/i,
  ],
  IMAGE_GEN: [
    /\b(generate|create|draw|make|render|paint|sketch|illustrate)\s+(an?\s+)?(image|picture|photo|illustration|icon|wallpaper|logo|drawing|artwork|graphic|portrait)\b/i,
    /\b(visualize|image\s+of|photo\s+of|picture\s+of|depict|in\s+the\s+style\s+of\s+digital\s+art|3d\s+render|photorealistic)\b/i,
  ],
  SUMMARIZATION: [
    /\b(summarize|summary|summarise|tl;?dr|tldr|key\s+takeaways|brief\s+overview|main\s+points|executive\s+summary|synopsis|condense|digest|in\s+a\s+nutshell)\b/i,
    /\b(sum\s+up|give\s+me\s+the\s+gist|bullet\s+points?\s+of)\b/i,
  ],
  GENERAL_QA: [
    /\b(who|what|when|where|why|how|explain|compare|define|difference\s+between|pros\s+and\s+cons|guide|overview|history\s+of|recommend|suggest)\b/i,
  ],
};

function classifyByRules(prompt: string): { intent: IntentType; confidence: number; matches: string[] } | null {
  const scores: Record<IntentType, { score: number; matches: string[] }> = {
    CODE: { score: 0, matches: [] },
    CREATIVE_WRITING: { score: 0, matches: [] },
    IMAGE_GEN: { score: 0, matches: [] },
    SUMMARIZATION: { score: 0, matches: [] },
    GENERAL_QA: { score: 0, matches: [] },
  };

  for (const [intentKey, patterns] of Object.entries(RULE_PATTERNS) as [IntentType, RegExp[]][]) {
    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        scores[intentKey].score += 1;
        scores[intentKey].matches.push(match[0]);
      }
    }
  }

  // Find max score
  let maxIntent: IntentType = 'GENERAL_QA';
  let maxScore = 0;
  for (const [intentKey, data] of Object.entries(scores) as [IntentType, { score: number; matches: string[] }][]) {
    if (data.score > maxScore) {
      maxScore = data.score;
      maxIntent = intentKey;
    }
  }

  if (maxScore >= 1) {
    const confidence = Math.min(0.98, 0.70 + maxScore * 0.1);
    return {
      intent: maxIntent,
      confidence,
      matches: scores[maxIntent].matches,
    };
  }

  return null;
}

// Fallback classifier using Gemini 3.8 Flash
async function classifyWithLlm(prompt: string): Promise<{ intent: IntentType; confidence: number; reasoning: string }> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an ultra-fast query router. Classify the user query into exactly one of these intents:
- CODE: Programming, debugging, software architecture, syntax, technical implementations.
- CREATIVE_WRITING: Poetry, fiction, scripts, songs, creative stories, worldbuilding.
- IMAGE_GEN: Prompts asking to create, draw, illustrate, or generate visual imagery.
- SUMMARIZATION: Requests to summarize, distill, extract key bullet points, or TL;DR text.
- GENERAL_QA: General knowledge, reasoning, facts, advice, explanations, open-ended questions.

User Query: "${prompt.slice(0, 1000)}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'One of CODE, CREATIVE_WRITING, IMAGE_GEN, SUMMARIZATION, GENERAL_QA',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence between 0.0 and 1.0',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Brief reason why this intent was selected',
            },
          },
          required: ['intent', 'confidence', 'reasoning'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const validIntents: IntentType[] = ['CODE', 'CREATIVE_WRITING', 'IMAGE_GEN', 'SUMMARIZATION', 'GENERAL_QA'];
    const chosenIntent: IntentType = validIntents.includes(parsed.intent) ? parsed.intent : 'GENERAL_QA';

    return {
      intent: chosenIntent,
      confidence: parsed.confidence || 0.85,
      reasoning: parsed.reasoning || 'Classified via LLM classifier fallback',
    };
  } catch (err) {
    console.error('LLM classification error:', err);
    return {
      intent: 'GENERAL_QA',
      confidence: 0.6,
      reasoning: 'Classifier fallback default to GENERAL_QA due to transient error',
    };
  }
}

// Agent definitions for response generation
interface AgentDef {
  id: string;
  name: string;
  provider: string;
  model: string;
  badgeColor: string;
  badgeBg: string;
  icon: string;
  systemInstruction: string;
}

const AGENT_CATALOG: Record<string, AgentDef> = {
  'agent-code': {
    id: 'agent-code',
    name: 'Code Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    icon: 'Terminal',
    systemInstruction:
      'You are Code Agent, an elite software engineering AI specializing in clean, idiomatic code, architecture design, and precise debugging. Structure responses with concise explanations, clean code blocks with language tags, and highlighted edge cases. If discussing Android/Kotlin/Jetpack Compose, use modern 2025/2026 idiomatic practices.',
  },
  'agent-writer': {
    id: 'agent-writer',
    name: 'Writer Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    icon: 'Feather',
    systemInstruction:
      'You are Writer Agent, an imaginative literary AI master of prose, poetry, pacing, character voice, and metaphor. Craft captivating, expressive writing with vivid descriptions and emotional resonance.',
  },
  'agent-vision': {
    id: 'agent-vision',
    name: 'Vision Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    icon: 'Sparkles',
    systemInstruction:
      'You are Vision Agent, specializing in visual composition, image concept design, art direction, and visual synthesis. When asked to generate or describe an image, provide rich, highly sensory descriptions, lighting details, camera lens, color grading palette, and structured prompt engineering parameters for diffusion models.',
  },
  'agent-summarizer': {
    id: 'agent-summarizer',
    name: 'Summarizer Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    badgeColor: '#f43f5e',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    icon: 'ListFilter',
    systemInstruction:
      'You are Summarizer Agent, an analytical intelligence that distills complex information into crisp, structured executive summaries. Always format with: 1. Executive TL;DR (1-2 sentences), 2. Core Takeaways (bullet points), 3. Actionable Insights or Implications.',
  },
  'agent-qa': {
    id: 'agent-qa',
    name: 'General QA Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    badgeColor: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    icon: 'Bot',
    systemInstruction:
      'You are General QA Agent, a versatile, balanced, and knowledgeable AI assistant. Provide direct, objective, and well-organized responses to any inquiry with clear structure and factual clarity.',
  },
  'agent-fallback-fast': {
    id: 'agent-fallback-fast',
    name: 'Fallback Lite Agent',
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    badgeColor: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    icon: 'Zap',
    systemInstruction:
      'You are Fallback Lite Agent, activated when the primary specialized agent experienced rate-limiting or service cooldown. Provide immediate, dependable, and high-speed answers.',
  },
};

// Intent to ranked agents map
const INTENT_ROUTING_TABLE: Record<IntentType, string[]> = {
  CODE: ['agent-code', 'agent-fallback-fast', 'agent-qa'],
  CREATIVE_WRITING: ['agent-writer', 'agent-fallback-fast', 'agent-qa'],
  IMAGE_GEN: ['agent-vision', 'agent-fallback-fast', 'agent-qa'],
  SUMMARIZATION: ['agent-summarizer', 'agent-fallback-fast', 'agent-qa'],
  GENERAL_QA: ['agent-qa', 'agent-fallback-fast', 'agent-code'],
};

// POST /api/chat/classify
app.post('/api/chat/classify', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 1. Try rule-based classification first
    const ruleResult = classifyByRules(prompt);
    if (ruleResult && ruleResult.confidence >= 0.75) {
      return res.json({
        intent: ruleResult.intent,
        confidence: ruleResult.confidence,
        classifierType: 'RULE_BASED',
        matches: ruleResult.matches,
        reasoning: `Matched rule patterns: ${ruleResult.matches.slice(0, 3).join(', ')}`,
      });
    }

    // 2. Fallback to lightweight LLM classifier
    const llmResult = await classifyWithLlm(prompt);
    return res.json({
      intent: llmResult.intent,
      confidence: llmResult.confidence,
      classifierType: 'LLM_FALLBACK',
      matches: ruleResult?.matches || [],
      reasoning: llmResult.reasoning,
    });
  } catch (error) {
    console.error('Classification endpoint error:', error);
    res.status(500).json({ error: 'Internal classification error' });
  }
});

// POST /api/chat/route-and-generate
app.post('/api/chat/route-and-generate', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      forceAgentId,
      simulateRateLimitOnAgentId,
      chatHistory = [],
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let intent: IntentType = 'GENERAL_QA';
    let classifierType: 'RULE_BASED' | 'LLM_FALLBACK' | 'MANUAL_OVERRIDE' = 'RULE_BASED';
    let classifierConfidence = 1.0;
    let classifierReasoning = '';

    if (forceAgentId && AGENT_CATALOG[forceAgentId]) {
      classifierType = 'MANUAL_OVERRIDE';
      // Find matching intent for forced agent
      for (const [itemIntent, agentList] of Object.entries(INTENT_ROUTING_TABLE) as [IntentType, string[]][]) {
        if (agentList[0] === forceAgentId) {
          intent = itemIntent;
          break;
        }
      }
      classifierReasoning = `User manually requested re-route to ${AGENT_CATALOG[forceAgentId].name}`;
    } else {
      // Automatic classification
      const ruleResult = classifyByRules(prompt);
      if (ruleResult && ruleResult.confidence >= 0.75) {
        intent = ruleResult.intent;
        classifierConfidence = ruleResult.confidence;
        classifierType = 'RULE_BASED';
        classifierReasoning = `Rule matched: ${ruleResult.matches.slice(0, 3).join(', ')}`;
      } else {
        const llmResult = await classifyWithLlm(prompt);
        intent = llmResult.intent;
        classifierConfidence = llmResult.confidence;
        classifierType = 'LLM_FALLBACK';
        classifierReasoning = llmResult.reasoning;
      }
    }

    // Determine candidate agent chain
    const candidateAgentIds = forceAgentId && AGENT_CATALOG[forceAgentId]
      ? [forceAgentId, 'agent-fallback-fast']
      : INTENT_ROUTING_TABLE[intent] || ['agent-qa', 'agent-fallback-fast'];

    const fallbackChainLog: Array<{
      agentId: string;
      agentName: string;
      status: 'SUCCESS' | 'RATE_LIMITED' | 'ERROR';
      error?: string;
    }> = [];

    let chosenAgent: AgentDef | null = null;
    let generatedText = '';
    let wasFallbackUsed = false;

    // Execute fallback chain
    for (let i = 0; i < candidateAgentIds.length; i++) {
      const candidateId = candidateAgentIds[i];
      const agent = AGENT_CATALOG[candidateId] || AGENT_CATALOG['agent-qa'];

      // Check simulated rate limit for testability
      if (simulateRateLimitOnAgentId === candidateId && i < candidateAgentIds.length - 1) {
        fallbackChainLog.push({
          agentId: candidateId,
          agentName: agent.name,
          status: 'RATE_LIMITED',
          error: `HTTP 429 Too Many Requests (Key pool exhausted cooldown triggered)`,
        });
        wasFallbackUsed = true;
        continue; // Cascade to next in fallback chain
      }

      try {
        // Build conversation messages
        const contentsPayload: any[] = [];
        // Add last 3 messages if provided
        if (Array.isArray(chatHistory)) {
          for (const msg of chatHistory.slice(-4)) {
            contentsPayload.push({
              role: msg.isUser ? 'user' : 'model',
              parts: [{ text: msg.text }],
            });
          }
        }
        contentsPayload.push({
          role: 'user',
          parts: [{ text: prompt }],
        });

        const response = await ai.models.generateContent({
          model: agent.model,
          contents: contentsPayload,
          config: {
            systemInstruction: agent.systemInstruction,
            temperature: intent === 'CREATIVE_WRITING' ? 0.9 : intent === 'CODE' ? 0.2 : 0.7,
          },
        });

        generatedText = response.text || '';
        chosenAgent = agent;
        fallbackChainLog.push({
          agentId: candidateId,
          agentName: agent.name,
          status: 'SUCCESS',
        });
        break; // Successfully answered
      } catch (err: any) {
        console.error(`Agent ${candidateId} failed:`, err?.message || err);
        fallbackChainLog.push({
          agentId: candidateId,
          agentName: agent.name,
          status: 'ERROR',
          error: err?.message || 'Agent invocation failure',
        });
        wasFallbackUsed = true;
      }
    }

    if (!chosenAgent || !generatedText) {
      // Last-ditch emergency response
      chosenAgent = AGENT_CATALOG['agent-fallback-fast'];
      generatedText = `All primary and fallback agent chains were temporarily unavailable. Please retry in a few moments.`;
    }

    const latencyMs = Date.now() - startTime;
    // Simple token estimation: ~4 chars per token
    const estimatedTokens = Math.round((prompt.length + generatedText.length) / 4);

    return res.json({
      text: generatedText,
      intent,
      agent: {
        id: chosenAgent.id,
        name: chosenAgent.name,
        provider: chosenAgent.provider,
        model: chosenAgent.model,
        badgeColor: chosenAgent.badgeColor,
        badgeBg: chosenAgent.badgeBg,
        icon: chosenAgent.icon,
      },
      classifier: {
        type: classifierType,
        confidence: classifierConfidence,
        reasoning: classifierReasoning,
      },
      wasFallback: wasFallbackUsed,
      fallbackChain: fallbackChainLog,
      latencyMs,
      tokensUsed: estimatedTokens,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Route and generate endpoint error:', error);
    res.status(500).json({
      error: 'Failed to route and generate response',
      message: error?.message || 'Unknown error',
    });
  }
});

// GET /api/agents - returns the config-driven list of available agents
app.get('/api/agents', (_req, res) => {
  res.json({
    agents: Object.values(AGENT_CATALOG),
    routingTable: INTENT_ROUTING_TABLE,
  });
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

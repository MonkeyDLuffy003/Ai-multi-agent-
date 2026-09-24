package com.omniroute.ai.router

import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.model.IntentType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Config-driven registry of available AI backend agents.
 * Adding a new agent simply means registering a new AgentConfig without altering routing logic.
 */
class AgentRegistry {

    private val agents = CopyOnWriteArrayList<AgentConfig>()
    private val _agentsFlow = MutableStateFlow<List<AgentConfig>>(emptyList())
    val agentsFlow: StateFlow<List<AgentConfig>> = _agentsFlow.asStateFlow()

    init {
        loadDefaultAgents()
    }

    private fun loadDefaultAgents() {
        val defaultList = listOf(
            AgentConfig(
                id = "agent-code",
                name = "Code Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.CODE, IntentType.GENERAL_QA),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFF10B981,
                iconName = "Terminal"
            ),
            AgentConfig(
                id = "agent-writer",
                name = "Writer Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.CREATIVE_WRITING, IntentType.GENERAL_QA),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFA855F7,
                iconName = "Feather"
            ),
            AgentConfig(
                id = "agent-vision",
                name = "Vision Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.IMAGE_GEN),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFF59E0B,
                iconName = "Sparkles"
            ),
            AgentConfig(
                id = "agent-summarizer",
                name = "Summarizer Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.SUMMARIZATION, IntentType.GENERAL_QA),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFF43F5E,
                iconName = "ListFilter"
            ),
            AgentConfig(
                id = "agent-qa",
                name = "General QA Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.GENERAL_QA),
                priority = 2,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFF06B6D4,
                iconName = "Bot"
            ),
            // High-availability fallback agents across free providers
            AgentConfig(
                id = "agent-groq-llama",
                name = "Groq Llama-3 Fast",
                provider = "Groq",
                modelName = "llama-3.3-70b-versatile",
                endpointUrl = "https://api.groq.com/openai/v1/",
                supportedIntents = listOf(IntentType.CODE, IntentType.GENERAL_QA, IntentType.SUMMARIZATION),
                priority = 3,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFF97316,
                iconName = "Zap"
            ),
            AgentConfig(
                id = "agent-openrouter-free",
                name = "OpenRouter Auto-Free",
                provider = "OpenRouter",
                modelName = "meta-llama/llama-3.2-3b-instruct:free",
                endpointUrl = "https://openrouter.ai/api/v1/",
                supportedIntents = listOf(IntentType.GENERAL_QA, IntentType.CREATIVE_WRITING),
                priority = 4,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFF8B5CF6,
                iconName = "Globe"
            )
        )
        agents.addAll(defaultList)
        _agentsFlow.value = agents.toList()
    }

    fun getAllAgents(): List<AgentConfig> = agents.toList()

    fun getAgentById(id: String): AgentConfig? = agents.find { it.id == id }

    fun getRankedAgentsForIntent(intent: IntentType): List<AgentConfig> {
        return agents
            .filter { it.isEnabled && it.supportedIntents.contains(intent) }
            .sortedBy { it.priority }
    }

    fun toggleAgentEnabled(agentId: String, isEnabled: Boolean) {
        val index = agents.indexOfFirst { it.id == agentId }
        if (index != -1) {
            agents[index] = agents[index].copy(isEnabled = isEnabled)
            _agentsFlow.value = agents.toList()
        }
    }

    fun registerAgent(agent: AgentConfig) {
        agents.add(agent)
        _agentsFlow.value = agents.toList()
    }
}

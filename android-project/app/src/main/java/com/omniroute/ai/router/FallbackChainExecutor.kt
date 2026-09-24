package com.omniroute.ai.router

import com.omniroute.ai.keymanager.KeyManager
import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.network.AgentClient
import com.omniroute.ai.network.AgentExecutionResult

data class FallbackChainResult(
    val executionResult: AgentExecutionResult,
    val executedAgent: AgentConfig,
    val wasFallback: Boolean,
    val attemptsLog: List<AttemptRecord>
)

data class AttemptRecord(
    val agentId: String,
    val agentName: String,
    val isSuccess: Boolean,
    val error: String? = null
)

/**
 * Executes a prioritized chain of agents with KeyManager rotation.
 * If the primary agent is rate-limited or errors, cascades automatically to the next.
 */
class FallbackChainExecutor(
    private val keyManager: KeyManager,
    private val clients: Map<String, AgentClient>
) {

    suspend fun executeChain(
        prompt: String,
        candidateAgents: List<AgentConfig>
    ): FallbackChainResult {
        val attempts = mutableListOf<AttemptRecord>()

        for ((index, agent) in candidateAgents.withIndex()) {
            val apiKeyObj = keyManager.getNextAvailableKey(agent.provider)
            if (apiKeyObj == null) {
                // Provider has no available keys (all rate limited or disabled)
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = false,
                        error = "No active API keys available for provider: ${agent.provider}"
                    )
                )
                continue
            }

            val client = clients[agent.provider]
            if (client == null) {
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = false,
                        error = "No client registered for provider: ${agent.provider}"
                    )
                )
                continue
            }

            val result = client.execute(prompt, agent, apiKeyObj.rawKey)
            if (result.isSuccess) {
                keyManager.markSuccess(agent.provider, apiKeyObj.id)
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = true
                    )
                )
                return FallbackChainResult(
                    executionResult = result,
                    executedAgent = agent,
                    wasFallback = index > 0,
                    attemptsLog = attempts
                )
            } else {
                keyManager.markRateLimited(agent.provider, apiKeyObj.id)
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = false,
                        error = result.errorMessage
                    )
                )
            }
        }

        // All agents in chain failed
        throw IllegalStateException("All agents in fallback chain failed: ${attempts.joinToString { "${it.agentName}: ${it.error}" }}")
    }
}

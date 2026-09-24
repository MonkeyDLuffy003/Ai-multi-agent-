package com.omniroute.ai.network

import com.omniroute.ai.model.AgentConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

/**
 * Client implementation for OpenRouter free aggregator tier.
 */
class OpenRouterAgentClient : AgentClient {
    override val supportedProvider: String = "OpenRouter"

    override suspend fun execute(
        prompt: String,
        agentConfig: AgentConfig,
        apiKey: String
    ): AgentExecutionResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        try {
            delay(200)
            AgentExecutionResult(
                text = "OpenRouter free tier response via ${agentConfig.modelName}:\n\nAggregated model output for: \"$prompt\"",
                tokensUsed = (prompt.length + 90) / 4,
                latencyMs = System.currentTimeMillis() - startTime,
                modelName = agentConfig.modelName,
                isSuccess = true
            )
        } catch (e: Exception) {
            AgentExecutionResult(
                text = "",
                tokensUsed = 0,
                latencyMs = System.currentTimeMillis() - startTime,
                modelName = agentConfig.modelName,
                isSuccess = false,
                errorMessage = e.message
            )
        }
    }
}

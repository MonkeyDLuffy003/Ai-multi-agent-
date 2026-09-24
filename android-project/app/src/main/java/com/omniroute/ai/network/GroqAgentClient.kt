package com.omniroute.ai.network

import com.omniroute.ai.model.AgentConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

/**
 * Client implementation for Groq high-speed inference (Llama 3, Mixtral).
 */
class GroqAgentClient : AgentClient {
    override val supportedProvider: String = "Groq"

    override suspend fun execute(
        prompt: String,
        agentConfig: AgentConfig,
        apiKey: String
    ): AgentExecutionResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        try {
            delay(120) // ultra-low latency emulation
            AgentExecutionResult(
                text = "Fast response from ${agentConfig.name} (${agentConfig.modelName}):\n\nHigh-throughput synthesis for prompt: \"$prompt\"",
                tokensUsed = (prompt.length + 80) / 4,
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

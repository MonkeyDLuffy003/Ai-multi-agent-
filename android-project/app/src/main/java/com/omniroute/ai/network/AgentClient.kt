package com.omniroute.ai.network

import com.omniroute.ai.model.AgentConfig

data class AgentExecutionResult(
    val text: String,
    val tokensUsed: Int,
    val latencyMs: Long,
    val modelName: String,
    val isSuccess: Boolean,
    val errorMessage: String? = null
)

/**
 * Common abstraction for heterogeneous LLM providers.
 * The central router interacts solely through this interface.
 */
interface AgentClient {
    val supportedProvider: String

    suspend fun execute(
        prompt: String,
        agentConfig: AgentConfig,
        apiKey: String
    ): AgentExecutionResult
}

package com.omniroute.ai.data

import com.omniroute.ai.model.AgentMetrics
import com.omniroute.ai.model.ChatMessage
import kotlinx.coroutines.flow.Flow

class ChatRepository(
    private val chatMessageDao: ChatMessageDao,
    private val agentMetricsDao: AgentMetricsDao
) {
    val messagesFlow: Flow<List<ChatMessage>> = chatMessageDao.getAllMessagesFlow()
    val metricsFlow: Flow<List<AgentMetrics>> = agentMetricsDao.getAllMetricsFlow()

    suspend fun saveMessage(message: ChatMessage) {
        chatMessageDao.insertMessage(message)
    }

    suspend fun updateMessage(message: ChatMessage) {
        chatMessageDao.updateMessage(message)
    }

    suspend fun clearHistory() {
        chatMessageDao.clearHistory()
    }

    suspend fun recordMetrics(
        agentId: String,
        agentName: String,
        isSuccess: Boolean,
        wasFallback: Boolean,
        latencyMs: Long,
        tokensUsed: Int
    ) {
        val existing = agentMetricsDao.getMetricsForAgent(agentId) ?: AgentMetrics(
            agentId = agentId,
            agentName = agentName
        )

        val updated = existing.copy(
            totalRequests = existing.totalRequests + 1,
            successfulRequests = if (isSuccess) existing.successfulRequests + 1 else existing.successfulRequests,
            fallbackTriggers = if (wasFallback) existing.fallbackTriggers + 1 else existing.fallbackTriggers,
            totalTokens = existing.totalTokens + tokensUsed,
            totalLatencyMs = existing.totalLatencyMs + latencyMs,
            lastUsedTimestamp = System.currentTimeMillis()
        )
        agentMetricsDao.insertOrUpdateMetrics(updated)
    }
}

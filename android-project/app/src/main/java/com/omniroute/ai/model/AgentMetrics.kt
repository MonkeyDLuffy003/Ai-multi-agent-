package com.omniroute.ai.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "agent_metrics")
data class AgentMetrics(
    @PrimaryKey
    val agentId: String,
    val agentName: String,
    val totalRequests: Int = 0,
    val successfulRequests: Int = 0,
    val rateLimitCount: Int = 0,
    val fallbackTriggers: Int = 0,
    val totalTokens: Long = 0L,
    val totalLatencyMs: Long = 0L,
    val lastUsedTimestamp: Long = 0L
) {
    val averageLatencyMs: Long
        get() = if (successfulRequests > 0) totalLatencyMs / successfulRequests else 0L

    val successRatePercent: Float
        get() = if (totalRequests > 0) (successfulRequests.toFloat() / totalRequests) * 100f else 100f
}

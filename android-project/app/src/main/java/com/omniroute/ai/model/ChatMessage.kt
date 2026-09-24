package com.omniroute.ai.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chat_messages")
data class ChatMessage(
    @PrimaryKey
    val id: String,
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val agentId: String? = null,
    val agentName: String? = null,
    val intentType: IntentType? = null,
    val modelName: String? = null,
    val latencyMs: Long = 0L,
    val tokensUsed: Int = 0,
    val wasFallback: Boolean = false,
    val fallbackDetails: String? = null
)

package com.omniroute.ai.model

/**
 * Config-driven representation of an AI Agent backend.
 * Adding a new agent requires only adding an entry to the registry config.
 */
data class AgentConfig(
    val id: String,
    val name: String,
    val provider: String,
    val modelName: String,
    val endpointUrl: String,
    val supportedIntents: List<IntentType>,
    val priority: Int = 1, // Lower number = higher priority
    val isEnabled: Boolean = true,
    val isFreeTier: Boolean = true,
    val systemPrompt: String = "",
    val badgeColorHex: Long = 0xFF06B6D4,
    val iconName: String = "Bot"
)

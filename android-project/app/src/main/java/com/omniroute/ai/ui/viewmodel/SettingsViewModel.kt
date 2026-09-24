package com.omniroute.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omniroute.ai.data.ChatRepository
import com.omniroute.ai.keymanager.KeyManager
import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.model.AgentMetrics
import com.omniroute.ai.model.ApiKey
import com.omniroute.ai.router.AgentRegistry
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val keyManager: KeyManager,
    private val agentRegistry: AgentRegistry,
    private val repository: ChatRepository
) : ViewModel() {

    val keyPools: StateFlow<Map<String, List<ApiKey>>> = keyManager.poolStateFlow
    val agents: StateFlow<List<AgentConfig>> = agentRegistry.agentsFlow
    val metrics: StateFlow<List<AgentMetrics>> = repository.metricsFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun toggleAgent(agentId: String, isEnabled: Boolean) {
        agentRegistry.toggleAgentEnabled(agentId, isEnabled)
    }

    fun addApiKey(provider: String, rawKey: String) {
        if (rawKey.isNotBlank()) {
            keyManager.addKey(provider, rawKey.trim())
        }
    }

    fun resetKeyCooldown(provider: String, keyId: String) {
        keyManager.resetCooldown(provider, keyId)
    }

    fun simulateRateLimit(provider: String, keyId: String) {
        keyManager.markRateLimited(provider, keyId, cooldownDurationMs = 45_000L)
    }
}

package com.omniroute.ai.keymanager

import com.omniroute.ai.model.ApiKey
import com.omniroute.ai.model.KeyState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Thread-safe multi-provider API key rotation pool.
 * Manages states: ACTIVE, RATE_LIMITED (with cooldown window), DISABLED.
 * Provides getNextAvailableKey() with round-robin rotation and automatic cooldown tracking.
 */
class KeyManager(
    private val keyStore: EncryptedKeyStore
) {
    // Provider -> List of ApiKey objects in memory
    private val keyPools = ConcurrentHashMap<String, MutableList<ApiKey>>()
    private val roundRobinIndices = ConcurrentHashMap<String, AtomicInteger>()

    private val _poolStateFlow = MutableStateFlow<Map<String, List<ApiKey>>>(emptyMap())
    val poolStateFlow: StateFlow<Map<String, List<ApiKey>>> = _poolStateFlow.asStateFlow()

    init {
        // Load initial keys or default developer pool
        seedDefaultKeysIfEmpty()
    }

    private fun seedDefaultKeysIfEmpty() {
        val providers = listOf("Google AI Studio", "Groq", "OpenRouter")
        for (provider in providers) {
            val list = mutableListOf<ApiKey>()
            // Seed a default active key slot per provider
            val id = "key_${provider.lowercase().replace(" ", "_")}_1"
            val masked = "AIzaSy...${provider.take(3).uppercase()}"
            val existing = keyStore.getKey(id) ?: "DEMO_KEY_${provider.uppercase()}"
            keyStore.saveKey(id, existing)
            list.add(
                ApiKey(
                    id = id,
                    provider = provider,
                    rawKey = existing,
                    maskedKey = masked,
                    state = KeyState.ACTIVE
                )
            )
            keyPools[provider] = list
            roundRobinIndices[provider] = AtomicInteger(0)
        }
        updateStateFlow()
    }

    @Synchronized
    fun getNextAvailableKey(provider: String): ApiKey? {
        val pool = keyPools[provider] ?: return null
        if (pool.isEmpty()) return null

        val currentTime = System.currentTimeMillis()

        // Check if any sleeping key has passed its cooldown
        for (i in pool.indices) {
            val key = pool[i]
            if (key.state == KeyState.RATE_LIMITED && currentTime >= key.cooldownUntilEpochMs) {
                pool[i] = key.copy(state = KeyState.ACTIVE, cooldownUntilEpochMs = 0L)
            }
        }

        val availableKeys = pool.filter { it.isAvailable }
        if (availableKeys.isEmpty()) {
            return null // All keys for this provider are exhausted or cooling down
        }

        val indexCounter = roundRobinIndices.getOrPut(provider) { AtomicInteger(0) }
        val nextIndex = (indexCounter.getAndIncrement() and Int.MAX_VALUE) % availableKeys.size
        return availableKeys[nextIndex]
    }

    @Synchronized
    fun markRateLimited(provider: String, keyId: String, cooldownDurationMs: Long = 60_000L) {
        val pool = keyPools[provider] ?: return
        val index = pool.indexOfFirst { it.id == keyId }
        if (index != -1) {
            val current = pool[index]
            pool[index] = current.copy(
                state = KeyState.RATE_LIMITED,
                cooldownUntilEpochMs = System.currentTimeMillis() + cooldownDurationMs,
                failureCount = current.failureCount + 1
            )
            updateStateFlow()
        }
    }

    @Synchronized
    fun markSuccess(provider: String, keyId: String) {
        val pool = keyPools[provider] ?: return
        val index = pool.indexOfFirst { it.id == keyId }
        if (index != -1) {
            val current = pool[index]
            pool[index] = current.copy(
                successCount = current.successCount + 1
            )
            updateStateFlow()
        }
    }

    @Synchronized
    fun addKey(provider: String, rawKey: String) {
        val id = "key_${provider.lowercase().replace(" ", "_")}_${System.currentTimeMillis()}"
        keyStore.saveKey(id, rawKey)
        val masked = if (rawKey.length > 8) "${rawKey.take(6)}...${rawKey.takeLast(4)}" else "••••••••"
        val newKey = ApiKey(
            id = id,
            provider = provider,
            rawKey = rawKey,
            maskedKey = masked,
            state = KeyState.ACTIVE
        )
        val pool = keyPools.getOrPut(provider) { mutableListOf() }
        pool.add(newKey)
        updateStateFlow()
    }

    @Synchronized
    fun resetCooldown(provider: String, keyId: String) {
        val pool = keyPools[provider] ?: return
        val index = pool.indexOfFirst { it.id == keyId }
        if (index != -1) {
            val current = pool[index]
            pool[index] = current.copy(
                state = KeyState.ACTIVE,
                cooldownUntilEpochMs = 0L
            )
            updateStateFlow()
        }
    }

    @Synchronized
    fun checkAndReactivateSleepingKeys() {
        val currentTime = System.currentTimeMillis()
        var changed = false
        for ((_, pool) in keyPools) {
            for (i in pool.indices) {
                val key = pool[i]
                if (key.state == KeyState.RATE_LIMITED && currentTime >= key.cooldownUntilEpochMs) {
                    pool[i] = key.copy(state = KeyState.ACTIVE, cooldownUntilEpochMs = 0L)
                    changed = true
                }
            }
        }
        if (changed) {
            updateStateFlow()
        }
    }

    private fun updateStateFlow() {
        _poolStateFlow.value = keyPools.mapValues { it.value.toList() }
    }
}

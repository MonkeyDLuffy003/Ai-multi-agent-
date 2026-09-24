package com.omniroute.ai.model

data class ApiKey(
    val id: String,
    val provider: String,
    val rawKey: String,
    val maskedKey: String,
    val state: KeyState = KeyState.ACTIVE,
    val cooldownUntilEpochMs: Long = 0L,
    val successCount: Int = 0,
    val failureCount: Int = 0
) {
    val isAvailable: Boolean
        get() = state == KeyState.ACTIVE || (state == KeyState.RATE_LIMITED && System.currentTimeMillis() >= cooldownUntilEpochMs)
}

package com.omniroute.ai.network

import com.omniroute.ai.keymanager.KeyManager
import okhttp3.Interceptor
import okhttp3.Response

/**
 * OkHttp Interceptor that injects dynamic API keys and intercepts HTTP 429 (Rate Limit).
 * If 429 occurs, it notifies KeyManager to place the key on cooldown so the next request rotates immediately.
 */
class KeyRotationInterceptor(
    private val keyManager: KeyManager,
    private val providerResolver: (url: String) -> String,
    private val currentKeySupplier: () -> Pair<String, String>? // Provider to KeyId
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val response = chain.proceed(originalRequest)

        // Check for Rate Limit status code
        if (response.code == 429) {
            val keyInfo = currentKeySupplier()
            if (keyInfo != null) {
                val (provider, keyId) = keyInfo
                // Trigger cooldown for this key
                keyManager.markRateLimited(provider, keyId, cooldownDurationMs = 60_000L)
            }
        } else if (response.isSuccessful) {
            val keyInfo = currentKeySupplier()
            if (keyInfo != null) {
                val (provider, keyId) = keyInfo
                keyManager.markSuccess(provider, keyId)
            }
        }

        return response
    }
}

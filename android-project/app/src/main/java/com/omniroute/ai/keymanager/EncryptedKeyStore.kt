package com.omniroute.ai.keymanager

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Stores API keys securely in hardware-backed Android Keystore + EncryptedSharedPreferences (AES-256-GCM).
 * Never stores keys in plaintext.
 */
class EncryptedKeyStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "omniroute_secure_keys",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveKey(id: String, rawKey: String) {
        sharedPreferences.edit().putString("key_$id", rawKey).apply()
    }

    fun getKey(id: String): String? {
        return sharedPreferences.getString("key_$id", null)
    }

    fun removeKey(id: String) {
        sharedPreferences.edit().remove("key_$id").apply()
    }

    fun getAllKeyIds(): Set<String> {
        return sharedPreferences.all.keys
            .filter { it.startsWith("key_") }
            .map { it.removePrefix("key_") }
            .toSet()
    }
}

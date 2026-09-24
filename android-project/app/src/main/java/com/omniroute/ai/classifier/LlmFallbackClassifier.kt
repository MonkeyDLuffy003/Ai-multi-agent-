package com.omniroute.ai.classifier

import com.omniroute.ai.model.IntentType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Lightweight classifier fallback invoking a free, fast model (e.g. Gemini 3.8 Flash or Flash Lite)
 * when local rules yield confidence below threshold.
 */
class LlmFallbackClassifier(
    private val client: (prompt: String) -> suspend () -> String?
) : IntentClassifier {

    override suspend fun classify(prompt: String): ClassificationResult = withContext(Dispatchers.IO) {
        try {
            val responseText = client(prompt).invoke() ?: return@withContext fallbackDefault()
            val parsedIntent = when {
                responseText.contains("CODE", ignoreCase = true) -> IntentType.CODE
                responseText.contains("CREATIVE", ignoreCase = true) -> IntentType.CREATIVE_WRITING
                responseText.contains("IMAGE", ignoreCase = true) -> IntentType.IMAGE_GEN
                responseText.contains("SUMMAR", ignoreCase = true) -> IntentType.SUMMARIZATION
                else -> IntentType.GENERAL_QA
            }

            ClassificationResult(
                intent = parsedIntent,
                confidence = 0.90f,
                source = ClassifierSource.LLM_FALLBACK,
                reasoning = "Resolved intent via high-speed secondary LLM classification"
            )
        } catch (e: Exception) {
            fallbackDefault()
        }
    }

    private fun fallbackDefault() = ClassificationResult(
        intent = IntentType.GENERAL_QA,
        confidence = 0.50f,
        source = ClassifierSource.LLM_FALLBACK,
        reasoning = "Defaulted to GENERAL_QA after LLM classification exception"
    )
}

package com.omniroute.ai.classifier

import com.omniroute.ai.model.IntentType

data class ClassificationResult(
    val intent: IntentType,
    val confidence: Float,
    val source: ClassifierSource,
    val matchedPatterns: List<String> = emptyList(),
    val reasoning: String = ""
)

enum class ClassifierSource {
    RULE_BASED,
    LLM_FALLBACK,
    MANUAL_OVERRIDE
}

interface IntentClassifier {
    suspend fun classify(prompt: String): ClassificationResult
}

package com.omniroute.ai.classifier

/**
 * Composite classifier that coordinates RuleBasedClassifier and LlmFallbackClassifier.
 * Rules execute first in sub-millisecond time. If confidence < threshold, triggers LLM classifier.
 */
class HybridRouterClassifier(
    private val ruleClassifier: RuleBasedClassifier = RuleBasedClassifier(),
    private val llmClassifier: LlmFallbackClassifier? = null,
    private val confidenceThreshold: Float = 0.70f
) : IntentClassifier {

    override suspend fun classify(prompt: String): ClassificationResult {
        val ruleResult = ruleClassifier.classify(prompt)
        if (ruleResult.confidence >= confidenceThreshold) {
            return ruleResult
        }

        // Delegate to LLM fallback if configured
        if (llmClassifier != null) {
            val llmResult = llmClassifier.classify(prompt)
            if (llmResult.confidence >= 0.70f) {
                return llmResult
            }
        }

        return ruleResult
    }
}

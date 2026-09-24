package com.omniroute.ai.classifier

import com.omniroute.ai.model.IntentType
import java.util.regex.Pattern

/**
 * Fast, zero-latency local regex and keyword scoring classifier.
 * Evaluates developer syntax, creative terms, visual verbs, and summary patterns.
 */
class RuleBasedClassifier : IntentClassifier {

    private val patterns = mapOf(
        IntentType.CODE to listOf(
            Pattern.compile("\\b(fun|val|var|class|interface|function|def|const|let|async|await|return)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(kotlin|compose|android|gradle|ksp|room|retrofit|okhttp|jetpack|coroutine)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(react|typescript|javascript|python|java|c\\+\\+|sql|query|select|table)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("```[\\s\\S]*?```"),
            Pattern.compile("\\b(write\\s+code|fix\\s+bug|compile\\s+error|syntax\\s+error|nullpointerexception|refactor|stack\\s*trace)\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.CREATIVE_WRITING to listOf(
            Pattern.compile("\\b(write\\s+(a\\s+)?(story|poem|novel|haiku|script|screenplay|essay|song|lyrics|fable))\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(creative\\s+writing|fiction|sci-fi|fantasy|rhyme|poetic|dialogue|character\\s+arc|plot\\s+twist)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(once\\s+upon\\s+a\\s+time|in\\s+a\\s+distant\\s+galaxy|the\\s+shadows\\s+whispered)\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.IMAGE_GEN to listOf(
            Pattern.compile("\\b(generate|create|draw|make|render|sketch|paint|illustrate)\\s+(an?\\s+)?(image|picture|photo|illustration|logo|wallpaper|portrait|concept\\s+art)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(visualize|photo\\s+of|picture\\s+of|photorealistic|3d\\s+render|cinematic\\s+lighting|in\\s+the\\s+style\\s+of)\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.SUMMARIZATION to listOf(
            Pattern.compile("\\b(summarize|summary|summarise|tl;?dr|tldr|key\\s+takeaways|brief\\s+overview|main\\s+points|executive\\s+summary|synopsis|condense)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(give\\s+me\\s+the\\s+gist|bullet\\s+points?\\s+of|in\\s+a\\s+nutshell)\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.GENERAL_QA to listOf(
            Pattern.compile("\\b(who|what|when|where|why|how|explain|compare|define|difference\\s+between|pros\\s+and\\s+cons|recommend)\\b", Pattern.CASE_INSENSITIVE)
        )
    )

    override suspend fun classify(prompt: String): ClassificationResult {
        val matchesPerIntent = mutableMapOf<IntentType, MutableList<String>>()

        for ((intent, patternList) in patterns) {
            val list = mutableListOf<String>()
            for (p in patternList) {
                val matcher = p.matcher(prompt)
                while (matcher.find()) {
                    list.add(matcher.group())
                }
            }
            if (list.isNotEmpty()) {
                matchesPerIntent[intent] = list
            }
        }

        // Rank by match frequency
        val bestEntry = matchesPerIntent.maxByOrNull { it.value.size }
        return if (bestEntry != null && bestEntry.value.isNotEmpty()) {
            val confidence = (0.75f + (bestEntry.value.size * 0.08f)).coerceAtMost(0.98f)
            ClassificationResult(
                intent = bestEntry.key,
                confidence = confidence,
                source = ClassifierSource.RULE_BASED,
                matchedPatterns = bestEntry.value,
                reasoning = "Matched rules: ${bestEntry.value.take(3).joinToString(", ")}"
            )
        } else {
            // Low confidence fallback candidate
            ClassificationResult(
                intent = IntentType.GENERAL_QA,
                confidence = 0.45f,
                source = ClassifierSource.RULE_BASED,
                matchedPatterns = emptyList(),
                reasoning = "No strong keyword heuristics detected"
            )
        }
    }
}

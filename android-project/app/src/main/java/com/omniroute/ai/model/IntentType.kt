package com.omniroute.ai.model

/**
 * Categorized intents identified by the Prompt Classifier.
 * Used by the Central Router to match suitable backend agents.
 */
enum class IntentType(
    val displayName: String,
    val description: String,
    val badgeColorHex: Long
) {
    CODE(
        displayName = "Code Agent",
        description = "Programming, debugging, SQL, syntax, system design",
        badgeColorHex = 0xFF10B981
    ),
    CREATIVE_WRITING(
        displayName = "Writer Agent",
        description = "Stories, poems, dialogue, world-building, creative text",
        badgeColorHex = 0xFFA855F7
    ),
    IMAGE_GEN(
        displayName = "Vision Agent",
        description = "Image generation prompts, visual concepts, art direction",
        badgeColorHex = 0xFFF59E0B
    ),
    SUMMARIZATION(
        displayName = "Summarizer Agent",
        description = "Condensing text, bullet points, executive summaries, TL;DR",
        badgeColorHex = 0xFFF43F5E
    ),
    GENERAL_QA(
        displayName = "General QA Agent",
        description = "Broad knowledge, reasoning, factual queries, advice",
        badgeColorHex = 0xFF06B6D4
    )
}

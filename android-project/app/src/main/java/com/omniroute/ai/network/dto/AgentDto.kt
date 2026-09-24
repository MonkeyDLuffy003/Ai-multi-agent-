package com.omniroute.ai.network.dto

import com.google.gson.annotations.SerializedName

data class AgentGenerateRequest(
    @SerializedName("prompt") val prompt: String,
    @SerializedName("model") val model: String,
    @SerializedName("temperature") val temperature: Float = 0.7f,
    @SerializedName("system_instruction") val systemInstruction: String? = null
)

data class AgentGenerateResponse(
    @SerializedName("text") val text: String,
    @SerializedName("tokens_used") val tokensUsed: Int = 0,
    @SerializedName("model") val model: String? = null
)

data class GeminiApiContent(
    @SerializedName("role") val role: String = "user",
    @SerializedName("parts") val parts: List<GeminiApiPart>
)

data class GeminiApiPart(
    @SerializedName("text") val text: String
)

data class GeminiApiRequest(
    @SerializedName("contents") val contents: List<GeminiApiContent>
)

data class GeminiApiResponse(
    @SerializedName("candidates") val candidates: List<GeminiCandidate>?
)

data class GeminiCandidate(
    @SerializedName("content") val content: GeminiCandidateContent?
)

data class GeminiCandidateContent(
    @SerializedName("parts") val parts: List<GeminiApiPart>?
)

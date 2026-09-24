package com.omniroute.ai.router

import com.omniroute.ai.classifier.HybridRouterClassifier
import com.omniroute.ai.data.ChatRepository
import com.omniroute.ai.model.ChatMessage
import com.omniroute.ai.model.IntentType
import java.util.UUID

sealed class RoutingStage {
    object Idle : RoutingStage()
    data class Classifying(val messageText: String) : RoutingStage()
    data class Routing(val intent: IntentType, val agentName: String) : RoutingStage()
    data class FallbackRetry(val previousAgent: String, val nextAgent: String) : RoutingStage()
}

/**
 * Central orchestrator connecting Classifier, AgentRegistry, FallbackChain, and Repository.
 */
class ChatRouter(
    private val classifier: HybridRouterClassifier,
    private val agentRegistry: AgentRegistry,
    private val fallbackExecutor: FallbackChainExecutor,
    private val repository: ChatRepository
) {

    suspend fun routeAndExecute(
        userPrompt: String,
        overrideAgentId: String? = null,
        onStageChanged: ((RoutingStage) -> Unit)? = null
    ): ChatMessage {
        onStageChanged?.invoke(RoutingStage.Classifying(userPrompt))

        val classification = classifier.classify(userPrompt)
        val targetIntent = classification.intent

        val candidateAgents = if (overrideAgentId != null) {
            val agent = agentRegistry.getAgentById(overrideAgentId)
            listOfNotNull(agent)
        } else {
            agentRegistry.getRankedAgentsForIntent(targetIntent)
        }

        if (candidateAgents.isEmpty()) {
            throw IllegalStateException("No enabled agents available for intent: ${targetIntent.name}")
        }

        onStageChanged?.invoke(RoutingStage.Routing(targetIntent, candidateAgents.first().name))

        val chainResult = fallbackExecutor.executeChain(userPrompt, candidateAgents)

        val agentMessage = ChatMessage(
            id = UUID.randomUUID().toString(),
            text = chainResult.executionResult.text,
            isUser = false,
            timestamp = System.currentTimeMillis(),
            agentId = chainResult.executedAgent.id,
            agentName = chainResult.executedAgent.name,
            intentType = targetIntent,
            modelName = chainResult.executedAgent.modelName,
            latencyMs = chainResult.executionResult.latencyMs,
            tokensUsed = chainResult.executionResult.tokensUsed,
            wasFallback = chainResult.wasFallback,
            fallbackDetails = if (chainResult.wasFallback) "Routed via secondary fallback agent" else null
        )

        // Persist message & track metrics
        repository.saveMessage(agentMessage)
        repository.recordMetrics(
            agentId = chainResult.executedAgent.id,
            agentName = chainResult.executedAgent.name,
            isSuccess = true,
            wasFallback = chainResult.wasFallback,
            latencyMs = chainResult.executionResult.latencyMs,
            tokensUsed = chainResult.executionResult.tokensUsed
        )

        onStageChanged?.invoke(RoutingStage.Idle)
        return agentMessage
    }

    suspend fun reRouteMessage(
        originalPrompt: String,
        targetAgentId: String,
        onStageChanged: ((RoutingStage) -> Unit)? = null
    ): ChatMessage {
        return routeAndExecute(
            userPrompt = originalPrompt,
            overrideAgentId = targetAgentId,
            onStageChanged = onStageChanged
        )
    }
}

package com.omniroute.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.omniroute.ai.data.ChatRepository
import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.model.ChatMessage
import com.omniroute.ai.router.AgentRegistry
import com.omniroute.ai.router.ChatRouter
import com.omniroute.ai.router.RoutingStage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

data class ChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val routingStage: RoutingStage = RoutingStage.Idle,
    val selectedMessageForReRoute: ChatMessage? = null,
    val isSending: Boolean = false,
    val errorMessage: String? = null
)

class ChatViewModel(
    private val repository: ChatRepository,
    private val router: ChatRouter,
    val agentRegistry: AgentRegistry
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    val messages = repository.messagesFlow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun sendMessage(promptText: String) {
        if (promptText.isBlank() || _uiState.value.isSending) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true, errorMessage = null)

            // Insert user message locally
            val userMessage = ChatMessage(
                id = UUID.randomUUID().toString(),
                text = promptText.trim(),
                isUser = true,
                timestamp = System.currentTimeMillis()
            )
            repository.saveMessage(userMessage)

            try {
                router.routeAndExecute(
                    userPrompt = promptText.trim(),
                    onStageChanged = { stage ->
                        _uiState.value = _uiState.value.copy(routingStage = stage)
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = e.message ?: "Failed to route message"
                )
            } finally {
                _uiState.value = _uiState.value.copy(
                    isSending = false,
                    routingStage = RoutingStage.Idle
                )
            }
        }
    }

    fun openReRouteDialog(message: ChatMessage) {
        _uiState.value = _uiState.value.copy(selectedMessageForReRoute = message)
    }

    fun dismissReRouteDialog() {
        _uiState.value = _uiState.value.copy(selectedMessageForReRoute = null)
    }

    fun reRouteWithAgent(targetAgent: AgentConfig) {
        val targetMessage = _uiState.value.selectedMessageForReRoute ?: return
        dismissReRouteDialog()

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true)
            try {
                // Find prompt text from prior user message or this message
                val promptToReRoute = targetMessage.text
                router.reRouteMessage(
                    originalPrompt = promptToReRoute,
                    targetAgentId = targetAgent.id,
                    onStageChanged = { stage ->
                        _uiState.value = _uiState.value.copy(routingStage = stage)
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(errorMessage = e.message)
            } finally {
                _uiState.value = _uiState.value.copy(
                    isSending = false,
                    routingStage = RoutingStage.Idle
                )
            }
        }
    }

    fun clearChat() {
        viewModelScope.launch {
            repository.clearHistory()
        }
    }
}

package com.omniroute.ai

import android.app.Application
import com.omniroute.ai.classifier.HybridRouterClassifier
import com.omniroute.ai.classifier.RuleBasedClassifier
import com.omniroute.ai.data.AppDatabase
import com.omniroute.ai.data.ChatRepository
import com.omniroute.ai.keymanager.EncryptedKeyStore
import com.omniroute.ai.keymanager.KeyCooldownWorker
import com.omniroute.ai.keymanager.KeyManager
import com.omniroute.ai.network.AgentClient
import com.omniroute.ai.network.GeminiAgentClient
import com.omniroute.ai.network.GroqAgentClient
import com.omniroute.ai.network.OpenRouterAgentClient
import com.omniroute.ai.router.AgentRegistry
import com.omniroute.ai.router.ChatRouter
import com.omniroute.ai.router.FallbackChainExecutor

class OmniRouteApplication : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var encryptedKeyStore: EncryptedKeyStore
        private set

    lateinit var keyManager: KeyManager
        private set

    lateinit var agentRegistry: AgentRegistry
        private set

    lateinit var chatRepository: ChatRepository
        private set

    lateinit var chatRouter: ChatRouter
        private set

    override fun onCreate() {
        super.onCreate()

        // 1. Initialize secure storage & KeyManager
        encryptedKeyStore = EncryptedKeyStore(this)
        keyManager = KeyManager(encryptedKeyStore)

        // 2. Initialize Room database & repository
        database = AppDatabase.getDatabase(this)
        chatRepository = ChatRepository(
            chatMessageDao = database.chatMessageDao(),
            agentMetricsDao = database.agentMetricsDao()
        )

        // 3. Initialize AgentRegistry & Network Clients
        agentRegistry = AgentRegistry()
        val clients = mapOf<String, AgentClient>(
            "Google AI Studio" to GeminiAgentClient(),
            "Groq" to GroqAgentClient(),
            "OpenRouter" to OpenRouterAgentClient()
        )

        val fallbackExecutor = FallbackChainExecutor(
            keyManager = keyManager,
            clients = clients
        )

        val classifier = HybridRouterClassifier(
            ruleClassifier = RuleBasedClassifier()
        )

        // 4. Central Router
        chatRouter = ChatRouter(
            classifier = classifier,
            agentRegistry = agentRegistry,
            fallbackExecutor = fallbackExecutor,
            repository = chatRepository
        )

        // 5. Schedule WorkManager periodic key cooldown reactivator
        KeyCooldownWorker.schedule(this)
    }
}

export interface ProjectFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'properties' | 'toml' | 'markdown';
  category: 'build' | 'manifest' | 'model' | 'classifier' | 'keymanager' | 'network' | 'data' | 'router' | 'ui' | 'res';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: '.github/workflows/build-apk.yml',
    name: 'build-apk.yml',
    language: 'groovy',
    category: 'build',
    description: 'GitHub Actions CI/CD workflow to automatically build and release Android APK',
    content: `name: Build Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch: # Allows manual trigger button in GitHub Actions

jobs:
  build:
    name: Build & Publish APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      - name: Grant execute permission for gradlew
        run: |
          chmod +x gradlew || true
          if [ -d "android-project" ]; then
            chmod +x android-project/gradlew || true
          fi

      - name: Build Debug APK
        run: |
          if [ -f "gradlew" ]; then
            ./gradlew assembleDebug --no-daemon --stacktrace
          elif [ -f "android-project/gradlew" ]; then
            cd android-project
            ./gradlew assembleDebug --no-daemon --stacktrace
          else
            gradle wrapper
            ./gradlew assembleDebug --no-daemon --stacktrace
          fi

      - name: Upload Debug APK
        uses: actions/upload-artifact@v4
        with:
          name: OmniRoute-Debug-APK-v1.0.0
          path: |
            **/build/outputs/apk/debug/*.apk
          retention-days: 30`
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    name: 'gradle-wrapper.properties',
    language: 'properties',
    category: 'build',
    description: 'Configures Gradle distribution version 8.11.1 for GitHub Actions runner',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'groovy',
    category: 'build',
    description: 'Gradle plugin repository and project settings configuration',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "OmniRouteAI"
include(":app")`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts',
    language: 'groovy',
    category: 'build',
    description: 'Root Gradle build script with modern Android & Kotlin plugins',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}`
  },
  {
    path: 'gradle/libs.versions.toml',
    name: 'libs.versions.toml',
    language: 'toml',
    category: 'build',
    description: 'Gradle Version Catalog for Compose BOM, Retrofit, Room, and WorkManager',
    content: `[versions]
agp = "8.7.3"
kotlin = "2.1.0"
ksp = "2.1.0-1.0.29"
coreKtx = "1.15.0"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.12.01"
room = "2.6.1"
retrofit = "2.11.0"
okhttp = "4.12.0"
workManager = "2.10.0"
securityCrypto = "1.1.0-alpha06"
coroutines = "1.9.0"
navigationCompose = "2.8.5"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

# Room Database
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Networking (Retrofit + OkHttp)
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-converter-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }

# Background Work & Key Cooldown
androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "workManager" }

# Secure Key Store (EncryptedSharedPreferences)
androidx-security-crypto = { group = "androidx.security", name = "security-crypto", version.ref = "securityCrypto" }

# Coroutines
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }`
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    language: 'properties',
    category: 'build',
    description: 'Gradle JVM and AndroidX configuration',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'groovy',
    category: 'build',
    description: 'App module build script configuring Jetpack Compose, Room, Retrofit, and WorkManager',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.omniroute.ai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.omniroute.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    // WorkManager (for key reactivation cooldown jobs)
    implementation(libs.androidx.work.runtime.ktx)

    // Hardware-backed Encrypted Storage
    implementation(libs.androidx.security.crypto)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    debugImplementation(libs.androidx.ui.tooling)
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    category: 'manifest',
    description: 'Application manifest declaring permissions and entry point activity',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions required for network API calls & network state checks -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".OmniRouteApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.OmniRouteAI">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.OmniRouteAI"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/OmniRouteApplication.kt',
    name: 'OmniRouteApplication.kt',
    language: 'kotlin',
    category: 'model',
    description: 'Application class initializing Room DB, KeyManager, EncryptedKeyStore, and WorkManager',
    content: `package com.omniroute.ai

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
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'ComponentActivity hosting Compose navigation between ChatScreen and SettingsScreen',
    content: `package com.omniroute.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.omniroute.ai.ui.screens.chat.ChatScreen
import com.omniroute.ai.ui.screens.settings.SettingsScreen
import com.omniroute.ai.ui.theme.BgDark
import com.omniroute.ai.ui.theme.OmniRouteTheme
import com.omniroute.ai.ui.viewmodel.ChatViewModel
import com.omniroute.ai.ui.viewmodel.SettingsViewModel

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as OmniRouteApplication
        val chatViewModel = ChatViewModel(
            repository = app.chatRepository,
            router = app.chatRouter,
            agentRegistry = app.agentRegistry
        )
        val settingsViewModel = SettingsViewModel(
            keyManager = app.keyManager,
            agentRegistry = app.agentRegistry,
            repository = app.chatRepository
        )

        setContent {
            OmniRouteTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BgDark
                ) {
                    var currentScreen by remember { mutableStateOf("chat") }

                    when (currentScreen) {
                        "chat" -> ChatScreen(
                            viewModel = chatViewModel,
                            onNavigateToSettings = { currentScreen = "settings" }
                        )
                        "settings" -> SettingsScreen(
                            viewModel = settingsViewModel,
                            onNavigateBack = { currentScreen = "chat" }
                        )
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/model/IntentType.kt',
    name: 'IntentType.kt',
    language: 'kotlin',
    category: 'model',
    description: 'Categorized intents identified by the Prompt Classifier',
    content: `package com.omniroute.ai.model

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
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/model/AgentConfig.kt',
    name: 'AgentConfig.kt',
    language: 'kotlin',
    category: 'model',
    description: 'Config-driven data class representing an AI Agent backend',
    content: `package com.omniroute.ai.model

data class AgentConfig(
    val id: String,
    val name: String,
    val provider: String,
    val modelName: String,
    val endpointUrl: String,
    val supportedIntents: List<IntentType>,
    val priority: Int = 1,
    val isEnabled: Boolean = true,
    val isFreeTier: Boolean = true,
    val systemPrompt: String = "",
    val badgeColorHex: Long = 0xFF06B6D4,
    val iconName: String = "Bot"
)`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/model/ApiKey.kt',
    name: 'ApiKey.kt',
    language: 'kotlin',
    category: 'model',
    description: 'Model tracking API keys with ACTIVE, RATE_LIMITED cooldowns, and success/failure counts',
    content: `package com.omniroute.ai.model

data class ApiKey(
    val id: String,
    val provider: String,
    val rawKey: String,
    val maskedKey: String,
    val state: KeyState = KeyState.ACTIVE,
    val cooldownUntilEpochMs: Long = 0L,
    val successCount: Int = 0,
    val failureCount: Int = 0
) {
    val isAvailable: Boolean
        get() = state == KeyState.ACTIVE || (state == KeyState.RATE_LIMITED && System.currentTimeMillis() >= cooldownUntilEpochMs)
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/model/ChatMessage.kt',
    name: 'ChatMessage.kt',
    language: 'kotlin',
    category: 'model',
    description: 'Room Entity storing chat history with agent badge, latency, and tokens',
    content: `package com.omniroute.ai.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chat_messages")
data class ChatMessage(
    @PrimaryKey
    val id: String,
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val agentId: String? = null,
    val agentName: String? = null,
    val intentType: IntentType? = null,
    val modelName: String? = null,
    val latencyMs: Long = 0L,
    val tokensUsed: Int = 0,
    val wasFallback: Boolean = false,
    val fallbackDetails: String? = null
)`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/classifier/RuleBasedClassifier.kt',
    name: 'RuleBasedClassifier.kt',
    language: 'kotlin',
    category: 'classifier',
    description: 'High-speed local regex & keyword heuristics scoring module',
    content: `package com.omniroute.ai.classifier

import com.omniroute.ai.model.IntentType
import java.util.regex.Pattern

class RuleBasedClassifier : IntentClassifier {

    private val patterns = mapOf(
        IntentType.CODE to listOf(
            Pattern.compile("\\\\b(fun|val|var|class|interface|function|def|const|let|async|await|return)\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\\\b(kotlin|compose|android|gradle|ksp|room|retrofit|okhttp|jetpack|coroutine)\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\\\b(react|typescript|javascript|python|java|c\\\\+\\\\+|sql|query|select|table)\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\`\`\`[\\\\s\\\\S]*?\`\`\`"),
            Pattern.compile("\\\\b(write\\\\s+code|fix\\\\s+bug|compile\\\\s+error|syntax\\\\s+error|nullpointerexception|refactor|stack\\\\s*trace)\\\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.CREATIVE_WRITING to listOf(
            Pattern.compile("\\\\b(write\\\\s+(a\\\\s+)?(story|poem|novel|haiku|script|screenplay|essay|song|lyrics|fable))\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\\\b(creative\\\\s+writing|fiction|sci-fi|fantasy|rhyme|poetic|dialogue|character\\\\s+arc|plot\\\\s+twist)\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\\\b(once\\\\s+upon\\\\s+a\\\\s+time|in\\\\s+a\\\\s+distant\\\\s+galaxy|the\\\\s+shadows\\\\s+whispered)\\\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.IMAGE_GEN to listOf(
            Pattern.compile("\\\\b(generate|create|draw|make|render|sketch|paint|illustrate)\\\\s+(an?\\\\s+)?(image|picture|photo|illustration|logo|wallpaper|portrait|concept\\\\s+art)\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\\\b(visualize|photo\\\\s+of|picture\\\\s+of|photorealistic|3d\\\\s+render|cinematic\\\\s+lighting|in\\\\s+the\\\\s+style\\\\s+of)\\\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.SUMMARIZATION to listOf(
            Pattern.compile("\\\\b(summarize|summary|summarise|tl;?dr|tldr|key\\\\s+takeaways|brief\\\\s+overview|main\\\\s+points|executive\\\\s+summary|synopsis|condense)\\\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\\\b(give\\\\s+me\\\\s+the\\\\s+gist|bullet\\\\s+points?\\\\s+of|in\\\\s+a\\\\s+nutshell)\\\\b", Pattern.CASE_INSENSITIVE)
        ),
        IntentType.GENERAL_QA to listOf(
            Pattern.compile("\\\\b(who|what|when|where|why|how|explain|compare|define|difference\\\\s+between|pros\\\\s+and\\\\s+cons|recommend)\\\\b", Pattern.CASE_INSENSITIVE)
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

        val bestEntry = matchesPerIntent.maxByOrNull { it.value.size }
        return if (bestEntry != null && bestEntry.value.isNotEmpty()) {
            val confidence = (0.75f + (bestEntry.value.size * 0.08f)).coerceAtMost(0.98f)
            ClassificationResult(
                intent = bestEntry.key,
                confidence = confidence,
                source = ClassifierSource.RULE_BASED,
                matchedPatterns = bestEntry.value,
                reasoning = "Matched rules: \${bestEntry.value.take(3).joinToString(\", \")}"
            )
        } else {
            ClassificationResult(
                intent = IntentType.GENERAL_QA,
                confidence = 0.45f,
                source = ClassifierSource.RULE_BASED,
                matchedPatterns = emptyList(),
                reasoning = "No strong keyword heuristics detected"
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/keymanager/KeyManager.kt',
    name: 'KeyManager.kt',
    language: 'kotlin',
    category: 'keymanager',
    description: 'Thread-safe round-robin key pool manager with automated cooldown rotation',
    content: `package com.omniroute.ai.keymanager

import com.omniroute.ai.model.ApiKey
import com.omniroute.ai.model.KeyState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class KeyManager(
    private val keyStore: EncryptedKeyStore
) {
    private val keyPools = ConcurrentHashMap<String, MutableList<ApiKey>>()
    private val roundRobinIndices = ConcurrentHashMap<String, AtomicInteger>()

    private val _poolStateFlow = MutableStateFlow<Map<String, List<ApiKey>>>(emptyMap())
    val poolStateFlow: StateFlow<Map<String, List<ApiKey>>> = _poolStateFlow.asStateFlow()

    init {
        seedDefaultKeysIfEmpty()
    }

    private fun seedDefaultKeysIfEmpty() {
        val providers = listOf("Google AI Studio", "Groq", "OpenRouter")
        for (provider in providers) {
            val list = mutableListOf<ApiKey>()
            val id = "key_\${provider.lowercase().replace(\" \", \"_\")}_1"
            val masked = "AIzaSy...\${provider.take(3).uppercase()}"
            val existing = keyStore.getKey(id) ?: "DEMO_KEY_\${provider.uppercase()}"
            keyStore.saveKey(id, existing)
            list.add(
                ApiKey(
                    id = id,
                    provider = provider,
                    rawKey = existing,
                    maskedKey = masked,
                    state = KeyState.ACTIVE
                )
            )
            keyPools[provider] = list
            roundRobinIndices[provider] = AtomicInteger(0)
        }
        updateStateFlow()
    }

    @Synchronized
    fun getNextAvailableKey(provider: String): ApiKey? {
        val pool = keyPools[provider] ?: return null
        if (pool.isEmpty()) return null

        val currentTime = System.currentTimeMillis()

        for (i in pool.indices) {
            val key = pool[i]
            if (key.state == KeyState.RATE_LIMITED && currentTime >= key.cooldownUntilEpochMs) {
                pool[i] = key.copy(state = KeyState.ACTIVE, cooldownUntilEpochMs = 0L)
            }
        }

        val availableKeys = pool.filter { it.isAvailable }
        if (availableKeys.isEmpty()) {
            return null
        }

        val indexCounter = roundRobinIndices.getOrPut(provider) { AtomicInteger(0) }
        val nextIndex = (indexCounter.getAndIncrement() and Int.MAX_VALUE) % availableKeys.size
        return availableKeys[nextIndex]
    }

    @Synchronized
    fun markRateLimited(provider: String, keyId: String, cooldownDurationMs: Long = 60_000L) {
        val pool = keyPools[provider] ?: return
        val index = pool.indexOfFirst { it.id == keyId }
        if (index != -1) {
            val current = pool[index]
            pool[index] = current.copy(
                state = KeyState.RATE_LIMITED,
                cooldownUntilEpochMs = System.currentTimeMillis() + cooldownDurationMs,
                failureCount = current.failureCount + 1
            )
            updateStateFlow()
        }
    }

    @Synchronized
    fun markSuccess(provider: String, keyId: String) {
        val pool = keyPools[provider] ?: return
        val index = pool.indexOfFirst { it.id == keyId }
        if (index != -1) {
            val current = pool[index]
            pool[index] = current.copy(successCount = current.successCount + 1)
            updateStateFlow()
        }
    }

    @Synchronized
    fun addKey(provider: String, rawKey: String) {
        val id = "key_\${provider.lowercase().replace(\" \", \"_\")}_\${System.currentTimeMillis()}"
        keyStore.saveKey(id, rawKey)
        val masked = if (rawKey.length > 8) "\${rawKey.take(6)}...\${rawKey.takeLast(4)}" else "••••••••"
        val newKey = ApiKey(
            id = id,
            provider = provider,
            rawKey = rawKey,
            maskedKey = masked,
            state = KeyState.ACTIVE
        )
        val pool = keyPools.getOrPut(provider) { mutableListOf() }
        pool.add(newKey)
        updateStateFlow()
    }

    @Synchronized
    fun resetCooldown(provider: String, keyId: String) {
        val pool = keyPools[provider] ?: return
        val index = pool.indexOfFirst { it.id == keyId }
        if (index != -1) {
            val current = pool[index]
            pool[index] = current.copy(state = KeyState.ACTIVE, cooldownUntilEpochMs = 0L)
            updateStateFlow()
        }
    }

    @Synchronized
    fun checkAndReactivateSleepingKeys() {
        val currentTime = System.currentTimeMillis()
        var changed = false
        for ((_, pool) in keyPools) {
            for (i in pool.indices) {
                val key = pool[i]
                if (key.state == KeyState.RATE_LIMITED && currentTime >= key.cooldownUntilEpochMs) {
                    pool[i] = key.copy(state = KeyState.ACTIVE, cooldownUntilEpochMs = 0L)
                    changed = true
                }
            }
        }
        if (changed) {
            updateStateFlow()
        }
    }

    private fun updateStateFlow() {
        _poolStateFlow.value = keyPools.mapValues { it.value.toList() }
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/router/AgentRegistry.kt',
    name: 'AgentRegistry.kt',
    language: 'kotlin',
    category: 'router',
    description: 'Config-driven registry mapping intent types to ranked agent configurations',
    content: `package com.omniroute.ai.router

import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.model.IntentType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.CopyOnWriteArrayList

class AgentRegistry {

    private val agents = CopyOnWriteArrayList<AgentConfig>()
    private val _agentsFlow = MutableStateFlow<List<AgentConfig>>(emptyList())
    val agentsFlow: StateFlow<List<AgentConfig>> = _agentsFlow.asStateFlow()

    init {
        loadDefaultAgents()
    }

    private fun loadDefaultAgents() {
        val defaultList = listOf(
            AgentConfig(
                id = "agent-code",
                name = "Code Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.CODE, IntentType.GENERAL_QA),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFF10B981,
                iconName = "Terminal"
            ),
            AgentConfig(
                id = "agent-writer",
                name = "Writer Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.CREATIVE_WRITING, IntentType.GENERAL_QA),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFA855F7,
                iconName = "Feather"
            ),
            AgentConfig(
                id = "agent-vision",
                name = "Vision Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.IMAGE_GEN),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFF59E0B,
                iconName = "Sparkles"
            ),
            AgentConfig(
                id = "agent-summarizer",
                name = "Summarizer Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.SUMMARIZATION, IntentType.GENERAL_QA),
                priority = 1,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFF43F5E,
                iconName = "ListFilter"
            ),
            AgentConfig(
                id = "agent-qa",
                name = "General QA Agent",
                provider = "Google AI Studio",
                modelName = "gemini-3.8-flash",
                endpointUrl = "https://generativelanguage.googleapis.com/v1beta/",
                supportedIntents = listOf(IntentType.GENERAL_QA),
                priority = 2,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFF06B6D4,
                iconName = "Bot"
            ),
            AgentConfig(
                id = "agent-groq-llama",
                name = "Groq Llama-3 Fast",
                provider = "Groq",
                modelName = "llama-3.3-70b-versatile",
                endpointUrl = "https://api.groq.com/openai/v1/",
                supportedIntents = listOf(IntentType.CODE, IntentType.GENERAL_QA, IntentType.SUMMARIZATION),
                priority = 3,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFFF97316,
                iconName = "Zap"
            ),
            AgentConfig(
                id = "agent-openrouter-free",
                name = "OpenRouter Auto-Free",
                provider = "OpenRouter",
                modelName = "meta-llama/llama-3.2-3b-instruct:free",
                endpointUrl = "https://openrouter.ai/api/v1/",
                supportedIntents = listOf(IntentType.GENERAL_QA, IntentType.CREATIVE_WRITING),
                priority = 4,
                isEnabled = true,
                isFreeTier = true,
                badgeColorHex = 0xFF8B5CF6,
                iconName = "Globe"
            )
        )
        agents.addAll(defaultList)
        _agentsFlow.value = agents.toList()
    }

    fun getAllAgents(): List<AgentConfig> = agents.toList()

    fun getAgentById(id: String): AgentConfig? = agents.find { it.id == id }

    fun getRankedAgentsForIntent(intent: IntentType): List<AgentConfig> {
        return agents
            .filter { it.isEnabled && it.supportedIntents.contains(intent) }
            .sortedBy { it.priority }
    }

    fun toggleAgentEnabled(agentId: String, isEnabled: Boolean) {
        val index = agents.indexOfFirst { it.id == agentId }
        if (index != -1) {
            agents[index] = agents[index].copy(isEnabled = isEnabled)
            _agentsFlow.value = agents.toList()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/router/FallbackChainExecutor.kt',
    name: 'FallbackChainExecutor.kt',
    language: 'kotlin',
    category: 'router',
    description: 'Executes primary agent and cascades automatically across fallback agents on 429/errors',
    content: `package com.omniroute.ai.router

import com.omniroute.ai.keymanager.KeyManager
import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.network.AgentClient
import com.omniroute.ai.network.AgentExecutionResult

data class FallbackChainResult(
    val executionResult: AgentExecutionResult,
    val executedAgent: AgentConfig,
    val wasFallback: Boolean,
    val attemptsLog: List<AttemptRecord>
)

data class AttemptRecord(
    val agentId: String,
    val agentName: String,
    val isSuccess: Boolean,
    val error: String? = null
)

class FallbackChainExecutor(
    private val keyManager: KeyManager,
    private val clients: Map<String, AgentClient>
) {

    suspend fun executeChain(
        prompt: String,
        candidateAgents: List<AgentConfig>
    ): FallbackChainResult {
        val attempts = mutableListOf<AttemptRecord>()

        for ((index, agent) in candidateAgents.withIndex()) {
            val apiKeyObj = keyManager.getNextAvailableKey(agent.provider)
            if (apiKeyObj == null) {
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = false,
                        error = "No active API keys available for provider: \${agent.provider}"
                    )
                )
                continue
            }

            val client = clients[agent.provider]
            if (client == null) {
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = false,
                        error = "No client registered for provider: \${agent.provider}"
                    )
                )
                continue
            }

            val result = client.execute(prompt, agent, apiKeyObj.rawKey)
            if (result.isSuccess) {
                keyManager.markSuccess(agent.provider, apiKeyObj.id)
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = true
                    )
                )
                return FallbackChainResult(
                    executionResult = result,
                    executedAgent = agent,
                    wasFallback = index > 0,
                    attemptsLog = attempts
                )
            } else {
                keyManager.markRateLimited(agent.provider, apiKeyObj.id)
                attempts.add(
                    AttemptRecord(
                        agentId = agent.id,
                        agentName = agent.name,
                        isSuccess = false,
                        error = result.errorMessage
                    )
                )
            }
        }

        throw IllegalStateException("All agents in fallback chain failed: \${attempts.joinToString { \"\${it.agentName}: \${it.error}\" }}")
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/router/ChatRouter.kt',
    name: 'ChatRouter.kt',
    language: 'kotlin',
    category: 'router',
    description: 'Central orchestrator coordinating classification, ranking, fallback execution, and Room storage',
    content: `package com.omniroute.ai.router

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
            throw IllegalStateException("No enabled agents available for intent: \${targetIntent.name}")
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
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/ui/screens/chat/ChatScreen.kt',
    name: 'ChatScreen.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Jetpack Compose chat thread with auto-scroll, routing indicator, and input bar',
    content: `package com.omniroute.ai.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.ui.viewmodel.ChatViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val messages by viewModel.messages.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF06B6D4))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "OmniRoute AI",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFF1F5F9)
                            )
                            Text(
                                text = "Multi-Agent Smart Router • Auto-Routing",
                                fontSize = 11.sp,
                                color = Color(0xFF64748B),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF090A0F)
                ),
                actions = {
                    IconButton(onClick = { viewModel.clearChat() }) {
                        Icon(
                            imageVector = Icons.Default.DeleteSweep,
                            contentDescription = "Clear Chat",
                            tint = Color(0xFF64748B)
                        )
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = Color(0xFF94A3B8)
                        )
                    }
                }
            )
        },
        containerColor = Color(0xFF090A0F)
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                items(messages, key = { it.id }) { message ->
                    MessageBubble(
                        message = message,
                        onLongPress = { msg -> viewModel.openReRouteDialog(msg) }
                    )
                }
            }

            RoutingIndicator(routingStage = uiState.routingStage)

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0D0F17))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = {
                        Text("Ask anything (code, story, explain...)", color = Color(0xFF475569), fontSize = 14.sp)
                    },
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(24.dp)),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFF131622),
                        unfocusedContainerColor = Color(0xFF131622),
                        focusedBorderColor = Color(0xFF06B6D4),
                        unfocusedBorderColor = Color(0xFF262B3D),
                        focusedTextColor = Color(0xFFF8FAFC),
                        unfocusedTextColor = Color(0xFFF8FAFC)
                    ),
                    maxLines = 4
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        if (inputText.isNotBlank() && !uiState.isSending) {
                            val textToSend = inputText
                            inputText = ""
                            viewModel.sendMessage(textToSend)
                        }
                    },
                    enabled = inputText.isNotBlank() && !uiState.isSending,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(if (inputText.isNotBlank() && !uiState.isSending) Color(0xFF06B6D4) else Color(0xFF1E2235))
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = if (inputText.isNotBlank() && !uiState.isSending) Color(0xFF090A0F) else Color(0xFF64748B)
                    )
                }
            }
        }
    }

    if (uiState.selectedMessageForReRoute != null) {
        ReRouteDialog(
            targetMessage = uiState.selectedMessageForReRoute!!,
            availableAgents = viewModel.agentRegistry.getAllAgents(),
            onAgentSelected = { agent -> viewModel.reRouteWithAgent(agent) },
            onDismiss = { viewModel.dismissReRouteDialog() }
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/ui/screens/chat/MessageBubble.kt',
    name: 'MessageBubble.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Bubble composable with long-press support for manual re-routing, agent badge, and latency pill',
    content: `package com.omniroute.ai.ui.screens.chat

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.model.ChatMessage

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageBubble(
    message: ChatMessage,
    onLongPress: (ChatMessage) -> Unit,
    modifier: Modifier = Modifier
) {
    val isUser = message.isUser

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Column(
            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start,
            modifier = Modifier.widthIn(max = 320.dp)
        ) {
            if (!isUser && message.agentName != null) {
                AgentBadge(
                    agentName = message.agentName,
                    intentType = message.intentType,
                    modelName = message.modelName,
                    wasFallback = message.wasFallback
                )
                Spacer(modifier = Modifier.height(4.dp))
            }

            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isUser) 16.dp else 4.dp,
                            bottomEnd = if (isUser) 4.dp else 16.dp
                        )
                    )
                    .background(if (isUser) Color(0xFF1E293B) else Color(0xFF111420))
                    .border(
                        1.dp,
                        if (isUser) Color(0xFF334155) else Color(0xFF1E2336),
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isUser) 16.dp else 4.dp,
                            bottomEnd = if (isUser) 4.dp else 16.dp
                        )
                    )
                    .combinedClickable(
                        onClick = {},
                        onLongClick = {
                            if (!isUser) {
                                onLongPress(message)
                            }
                        }
                    )
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(
                    text = message.text,
                    color = if (isUser) Color(0xFFF8FAFC) else Color(0xFFE2E8F0),
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }

            if (!isUser && message.latencyMs > 0) {
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "\${message.latencyMs}ms",
                        color = Color(0xFF64748B),
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    if (message.tokensUsed > 0) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "• \${message.tokensUsed} tokens",
                            color = Color(0xFF475569),
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "• Long-press to re-route",
                        color = Color(0xFF475569),
                        fontSize = 9.sp
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/ui/screens/chat/AgentBadge.kt',
    name: 'AgentBadge.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Distinctive tag badge displaying agent name, model, and fallback pill',
    content: `package com.omniroute.ai.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.model.IntentType

@Composable
fun AgentBadge(
    agentName: String,
    intentType: IntentType?,
    modelName: String?,
    wasFallback: Boolean = false,
    modifier: Modifier = Modifier
) {
    val color = when (intentType) {
        IntentType.CODE -> Color(0xFF10B981)
        IntentType.CREATIVE_WRITING -> Color(0xFFA855F7)
        IntentType.IMAGE_GEN -> Color(0xFFF59E0B)
        IntentType.SUMMARIZATION -> Color(0xFFF43F5E)
        IntentType.GENERAL_QA -> Color(0xFF06B6D4)
        null -> Color(0xFF64748B)
    }

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = agentName,
            color = color,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace
        )

        if (!modelName.isNullOrEmpty()) {
            Text(
                text = " • $modelName",
                color = color.copy(alpha = 0.7f),
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace
            )
        }

        if (wasFallback) {
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "[FALLBACK]",
                color = Color(0xFFF59E0B),
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/omniroute/ai/ui/screens/chat/ReRouteDialog.kt',
    name: 'ReRouteDialog.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Manual re-routing dialog triggered on long-press',
    content: `package com.omniroute.ai.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.model.AgentConfig
import com.omniroute.ai.model.ChatMessage

@Composable
fun ReRouteDialog(
    targetMessage: ChatMessage,
    availableAgents: List<AgentConfig>,
    onAgentSelected: (AgentConfig) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF12141D),
        title = {
            Column {
                Text(
                    text = "Answer with a different agent",
                    color = Color(0xFFF1F5F9),
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Re-route this prompt manually to a specialized backend",
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp
                )
            }
        },
        text = {
            Column {
                availableAgents.forEach { agent ->
                    val isCurrent = agent.id == targetMessage.agentId
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isCurrent) Color(0xFF1E2235) else Color.Transparent)
                            .clickable { onAgentSelected(agent) }
                            .padding(vertical = 10.dp, horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(Color(agent.badgeColorHex))
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = agent.name,
                                color = Color(0xFFF1F5F9),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "\${agent.provider} • \${agent.modelName}",
                                color = Color(0xFF64748B),
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color(0xFF94A3B8))
            }
        }
    )
}`
  }
];

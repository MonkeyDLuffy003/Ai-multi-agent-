package com.omniroute.ai

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
}

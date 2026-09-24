package com.omniroute.ai.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.model.ApiKey
import com.omniroute.ai.model.KeyState

@Composable
fun KeyManagerSection(
    keyPools: Map<String, List<ApiKey>>,
    onAddKey: (provider: String, rawKey: String) -> Unit,
    onResetCooldown: (provider: String, keyId: String) -> Unit,
    onSimulateRateLimit: (provider: String, keyId: String) -> Unit
) {
    var newKeyInput by remember { mutableStateOf("") }
    var selectedProvider by remember { mutableStateOf("Google AI Studio") }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text(
            text = "API Key Pools & Rotation",
            color = Color(0xFFF1F5F9),
            fontSize = 17.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Keys stored in Android Keystore (AES-256-GCM). Automatic cooldown reactivation via WorkManager.",
            color = Color(0xFF64748B),
            fontSize = 12.sp
        )

        Spacer(modifier = Modifier.height(14.dp))

        keyPools.forEach { (provider, keys) ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF111420))
                    .border(1.dp, Color(0xFF1E2336), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = provider,
                        color = Color(0xFF06B6D4),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${keys.count { it.isAvailable }}/${keys.size} Active",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                keys.forEach { key ->
                    val (stateColor, stateLabel) = when (key.state) {
                        KeyState.ACTIVE -> Pair(Color(0xFF10B981), "ACTIVE")
                        KeyState.RATE_LIMITED -> Pair(Color(0xFFF59E0B), "RATE LIMITED (Cooldown)")
                        KeyState.DISABLED -> Pair(Color(0xFFEF4444), "DISABLED")
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(stateColor)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = key.maskedKey,
                                color = Color(0xFFE2E8F0),
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = stateLabel,
                                color = stateColor,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            if (key.state == KeyState.RATE_LIMITED) {
                                OutlinedButton(
                                    onClick = { onResetCooldown(provider, key.id) },
                                    modifier = Modifier.height(28.dp)
                                ) {
                                    Text("Wake", fontSize = 10.sp)
                                }
                            } else {
                                OutlinedButton(
                                    onClick = { onSimulateRateLimit(provider, key.id) },
                                    modifier = Modifier.height(28.dp)
                                ) {
                                    Text("Test 429", fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Add Key Input Row
        Text(
            text = "Add Secondary Key to Pool",
            color = Color(0xFFF1F5F9),
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = newKeyInput,
                onValueChange = { newKeyInput = it },
                placeholder = { Text("Paste key token...", fontSize = 12.sp) },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = {
                    if (newKeyInput.isNotBlank()) {
                        onAddKey(selectedProvider, newKeyInput)
                        newKeyInput = ""
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4))
            ) {
                Text("Add Key", color = Color(0xFF090A0F))
            }
        }
    }
}

package com.omniroute.ai.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.model.AgentMetrics

@Composable
fun AgentStatsSection(
    metricsList: List<AgentMetrics>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth().padding(16.dp)) {
        Text(
            text = "Agent Usage Analytics (Room DB)",
            color = Color(0xFFF1F5F9),
            fontSize = 17.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Tracked per-agent latency, token usage, and automatic fallback triggers.",
            color = Color(0xFF64748B),
            fontSize = 12.sp
        )

        Spacer(modifier = Modifier.height(14.dp))

        if (metricsList.isEmpty()) {
            Text(
                text = "No queries routed yet. Send chat messages to view live telemetry.",
                color = Color(0xFF475569),
                fontSize = 13.sp
            )
        } else {
            metricsList.forEach { metric ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFF111420))
                        .border(1.dp, Color(0xFF1E2336), RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = metric.agentName,
                            color = Color(0xFFF1F5F9),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "${metric.totalRequests} queries",
                            color = Color(0xFF06B6D4),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Avg Latency: ${metric.averageLatencyMs}ms",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = "Fallback Triggers: ${metric.fallbackTriggers}",
                            color = if (metric.fallbackTriggers > 0) Color(0xFFF59E0B) else Color(0xFF64748B),
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}

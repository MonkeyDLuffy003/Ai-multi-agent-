package com.omniroute.ai.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
        // Colored dot
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
}

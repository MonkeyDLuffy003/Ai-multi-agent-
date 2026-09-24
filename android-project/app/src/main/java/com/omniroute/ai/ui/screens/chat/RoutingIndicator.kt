package com.omniroute.ai.ui.screens.chat

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omniroute.ai.router.RoutingStage

@Composable
fun RoutingIndicator(
    routingStage: RoutingStage,
    modifier: Modifier = Modifier
) {
    val isVisible = routingStage !is RoutingStage.Idle

    AnimatedVisibility(
        visible = isVisible,
        enter = fadeIn(),
        exit = fadeOut()
    ) {
        val (displayText, tagColor) = when (routingStage) {
            is RoutingStage.Classifying -> Pair("Analyzing intent via classifier...", Color(0xFF06B6D4))
            is RoutingStage.Routing -> Pair("Routing to ${routingStage.agentName}...", Color(0xFF10B981))
            is RoutingStage.FallbackRetry -> Pair("Primary failed • Cascading to ${routingStage.nextAgent}...", Color(0xFFF59E0B))
            RoutingStage.Idle -> Pair("", Color.Transparent)
        }

        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF12141D))
                    .border(1.dp, tagColor.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 14.dp, vertical = 6.dp)
                    .align(Alignment.CenterStart),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(12.dp),
                    strokeWidth = 2.dp,
                    color = tagColor
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = displayText,
                    color = Color(0xFFF1F5F9),
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

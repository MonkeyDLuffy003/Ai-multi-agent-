package com.omniroute.ai.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.omniroute.ai.model.AgentMetrics
import kotlinx.coroutines.flow.Flow

@Dao
interface AgentMetricsDao {

    @Query("SELECT * FROM agent_metrics")
    fun getAllMetricsFlow(): Flow<List<AgentMetrics>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateMetrics(metrics: AgentMetrics)

    @Query("SELECT * FROM agent_metrics WHERE agentId = :agentId LIMIT 1")
    suspend fun getMetricsForAgent(agentId: String): AgentMetrics?
}

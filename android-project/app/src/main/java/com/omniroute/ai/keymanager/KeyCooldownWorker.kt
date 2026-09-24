package com.omniroute.ai.keymanager

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.omniroute.ai.OmniRouteApplication
import java.util.concurrent.TimeUnit

/**
 * Background WorkManager job that periodically sweeps the key pools,
 * checking cooldown timestamps and reactivating sleeping keys.
 */
class KeyCooldownWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? OmniRouteApplication ?: return Result.failure()
        app.keyManager.checkAndReactivateSleepingKeys()
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "OmniRouteKeyCooldownWorker"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<KeyCooldownWorker>(
                15, TimeUnit.MINUTES
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}

import DoctorAvailabilityService from './DoctorAvailability.service.js';
import cron from 'node-cron';

class TokenSchedulerService {
  constructor() {
    this.doctorAvailabilityService = new DoctorAvailabilityService();
    this.isRunning = false;
    this.scheduledTask = null;
  }

  /**
   * Start the automatic token checker
   * Runs every 5 minutes to check for tokens during doctor unavailability
   */
  start() {
    if (this.isRunning) {
      console.log('[TokenScheduler] Already running');
      return;
    }

    // Run every 5 minutes: */5 * * * *
    // For testing, use every minute: * * * * *
    this.scheduledTask = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('[TokenScheduler] Running automatic token check...');
        
        const result = await this.doctorAvailabilityService.checkAndMarkMissedTokens();
        
        if (result.count > 0) {
          console.log(`[TokenScheduler] ✓ Marked ${result.count} tokens as missed`);
          console.log('[TokenScheduler] Missed tokens:', result.missedTokens);
        } else {
          console.log('[TokenScheduler] ✓ No tokens need to be marked as missed');
        }
      } catch (error) {
        console.error('[TokenScheduler] Error during automatic check:', error);
      }
    });

    this.isRunning = true;
    console.log('[TokenScheduler] ✓ Started - Running every 5 minutes');
    console.log('[TokenScheduler] Will automatically mark tokens as "missed" during doctor breaks and after working hours');
  }

  /**
   * Stop the automatic token checker
   */
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.isRunning = false;
      console.log('[TokenScheduler] Stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: '*/5 * * * * (Every 5 minutes)',
      description: 'Automatically marks tokens as missed during doctor breaks and after working hours'
    };
  }

  /**
   * Manually trigger a check (for testing)
   */
  async triggerManualCheck() {
    try {
      console.log('[TokenScheduler] Manual check triggered...');
      const result = await this.doctorAvailabilityService.checkAndMarkMissedTokens();
      console.log(`[TokenScheduler] Manual check complete: ${result.count} tokens processed`);
      return result;
    } catch (error) {
      console.error('[TokenScheduler] Error during manual check:', error);
      throw error;
    }
  }
}

// Export singleton instance
const tokenScheduler = new TokenSchedulerService();
export default tokenScheduler;

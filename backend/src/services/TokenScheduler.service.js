import DoctorAvailabilityService from './DoctorAvailability.service.js';
import cron from 'node-cron';
import logger from '../config/logger.js';

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
      return;
    }

    // Run every 5 minutes: */5 * * * *
    // For testing, use every minute: * * * * *
    this.scheduledTask = cron.schedule('*/5 * * * *', async () => {
      try {
        const result = await this.doctorAvailabilityService.checkAndMarkMissedTokens();

        if (result.count > 0) {
          logger.info(`Marked ${result.count} tokens as missed`);
        }
      } catch (error) {
        logger.error('[TokenScheduler] Error during automatic check:', error);
      }
    });

    this.isRunning = true;
    logger.info('[TokenScheduler] Started - Running every 5 minutes');
  }

  /**
   * Stop the automatic token checker
   */
  stop() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.isRunning = false;
      logger.info('[TokenScheduler] Stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: '*/5 * * * * (Every 5 minutes)',
      description:
        'Automatically marks tokens as missed during doctor breaks and after working hours',
    };
  }

  /**
   * Manually trigger a check (for testing)
   */
  async triggerManualCheck() {
    try {
      const result = await this.doctorAvailabilityService.checkAndMarkMissedTokens();
      logger.info(`Manual check complete: ${result.count} tokens processed`);
      return result;
    } catch (error) {
      logger.error('[TokenScheduler] Error during manual check:', error);
      throw error;
    }
  }
}

// Export singleton instance
const tokenScheduler = new TokenSchedulerService();
export default tokenScheduler;

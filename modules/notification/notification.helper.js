// Utilities
const logger = require("../../utils/logger");

exports.workerListeners = (worker, queueName, channel) => {
  worker.on("completed", (job) => logger.info(`${channel} job ${job.id} completed`));
  worker.on("failed", (job, error) => logger.error(`${channel} job ${job?.id} failed: ${error.message}`));
  worker.on("error", (error) => logger.error(`${queueName} worker error: ${error.message}`));
  worker.on("stalled", (jobId) => logger.error(`${channel} job ${jobId} stalled`));
};

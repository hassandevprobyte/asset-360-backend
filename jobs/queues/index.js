const Boom = require("@hapi/boom");
const { Queue } = require("bullmq");

// Config
const redis = require("../../config/redis");

// Constants
const QUEUES = require("../../constants/QUEUES");

const queueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: false,
  },
};

const queues = Object.freeze({
  [QUEUES.IN_APP_NOTIFICATION]: new Queue(QUEUES.IN_APP_NOTIFICATION, queueOptions),
  [QUEUES.PUSH_NOTIFICATION]: new Queue(QUEUES.PUSH_NOTIFICATION, queueOptions),
  [QUEUES.EMAIL_NOTIFICATION]: new Queue(QUEUES.EMAIL_NOTIFICATION, queueOptions),
});

const getQueue = (queueName) => {
  const queue = queues[queueName];

  if (!queue) {
    throw Boom.badImplementation(`Queue not found`);
  }

  return queue;
};

exports.enqueue = (queueName, jobName, payload, options = {}) => {
  const queue = getQueue(queueName);

  queue.add(jobName, { payload }, options);
};

exports.dequeue = async (queueName, jobId) => {
  const job = await getQueue(queueName).getJob(jobId);

  if (!job) return false;

  await job.remove();
  return true;
};

exports.getJob = (queueName, jobId) => {
  const queue = getQueue(queueName);

  return queue.getJob(jobId);
};

exports.removeJob = async (queueName, jobId) => {
  const job = await getQueue(queueName).getJob(jobId);

  if (!job) {
    return false;
  }

  await job.remove();

  return true;
};

exports.getQueueCounts = (queueName) => {
  const queue = getQueue(queueName);

  return queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
};

exports.pauseQueue = (queueName) => {
  const queue = getQueue(queueName);

  return queue.pause();
};

exports.resumeQueue = (queueName) => {
  const queue = getQueue(queueName);

  return queue.resume();
};

exports.closeQueue = (queueName) => {
  const queue = getQueue(queueName);

  return queue.close();
};

exports.pauseAllQueues = () => {
  Promise.all(Object.values(queues).map((queue) => queue.pause()));
};

exports.resumeAllQueues = () => {
  Promise.all(Object.values(queues).map((queue) => queue.resume()));
};

exports.closeAllQueues = () => {
  Promise.all(Object.values(queues).map((queue) => queue.close()));
};

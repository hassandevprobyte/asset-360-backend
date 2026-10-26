const Boom = require("@hapi/boom");

// Queues
const notificationQueues = require("./notification.queue");

// Constants
const NOTIFICATION = require("../../constants/NOTIFICATION");

const CHANNEL_QUEUES = {
  [NOTIFICATION.CHANNELS.IN_APP]: notificationQueues.inAppNotificationQueue,
  [NOTIFICATION.CHANNELS.PUSH]: notificationQueues.pushNotificationQueue,
  [NOTIFICATION.CHANNELS.EMAIL]: notificationQueues.emailNotificationQueue,
};

const EVENT_CHANNELS = {
  [NOTIFICATION.EVENTS.ASSET_ASSIGNED]: [...Object.values(NOTIFICATION.CHANNELS)],
  [NOTIFICATION.EVENTS.ASSET_DELETED]: [NOTIFICATION.CHANNELS.IN_APP],
};

exports.publish = async (eventName, payload) => {
  const channels = EVENT_CHANNELS[eventName];

  if (!channels) {
    throw Boom.badRequest(`Unsupported notification event: ${eventName}`);
  }

  return Promise.all(
    channels.map((channel) =>
      CHANNEL_QUEUES[channel].add(eventName, {
        eventName,
        payload,
        channel,
      }),
    ),
  );
};

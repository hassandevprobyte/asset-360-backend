const Boom = require("@hapi/boom");

// Queues
const { inAppNotificationQueue, pushNotificationQueue, emailNotificationQueue } = require("./notification.queue");

// Constants
const NOTIFICATION = require("../../constants/NOTIFICATION");

const CHANNEL_QUEUES = {
  IN_APP: inAppNotificationQueue,
  PUSH: pushNotificationQueue,
  EMAIL: emailNotificationQueue,
};

const EVENT_CHANNELS = {
  [NOTIFICATION.EVENTS.ASSET_ASSIGNED]: ["IN_APP", "EMAIL", "PUSH"],
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

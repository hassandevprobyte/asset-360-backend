const Boom = require("@hapi/boom");

// Services
const notificationService = require("./notification.service");

// Constants
const NOTIFICATION = require("../../constants/NOTIFICATION");

const handlers = {
  [NOTIFICATION.EVENTS.ASSET_ASSIGNED]: notificationService.createNotification,
};

exports.handle = async ({ eventName, payload, channel }) => {
  const handler = handlers[eventName];

  if (!handler) {
    throw Boom.badRequest(`Unsupported notification event: ${eventName}`);
  }

  await handler(payload, channel);
};

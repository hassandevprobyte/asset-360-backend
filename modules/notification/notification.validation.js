const Boom = require("@hapi/boom");

// Repositories
const notificationRepository = require("./notification.repository");

// Constants
const message = require("../../constants/MESSAGE");

exports.throwErrorIfNotificationDoesNotExist = async (notificationId) => {
  const notification = await notificationRepository.getNotificationById(notificationId);

  if (!notification) {
    throw Boom.notFound(message.error.notification.notFound);
  }

  return notification;
};

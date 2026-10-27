// Services
const notificationService = require("./notification.service");

// Utils
const { emitToUsers } = require("../../config/socket");

// Constants
const SOCKET = require("../../constants/SOCKET");

exports.inAppNotificationHandler = async (payload) => {
  const notification = await notificationService.createNotification(payload);

  const notificationPayload = {
    id: notification._id,
    documentId: notification.documentId,
    documentReference: notification.documentReference,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    event: notification.event,
    actionLink: notification.actionLink,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };

  const recipientIds = notification.recipients.map(({ recipient }) => String(recipient));

  emitToUsers(recipientIds, SOCKET.EVENTS.NOTIFICATION.NEW, notificationPayload);

  return notification;
};

exports.pushNotificationHandler = async (payload) => {
  // Firebase implementation
};

exports.emailNotificationHandler = async (payload) => {
  // Email implementation
};

const notificationService = require("./notification.service");

exports.inAppNotificationHandler = async (payload) => {
  return notificationService.createNotification(payload);
};

exports.pushNotificationHandler = async (payload) => {
//   return firebaseService.sendPushNotification({
//     token: payload.deviceToken,
//     title: payload.title,
//     body: payload.body,
//     data: payload.metadata,
//   });
};

exports.emailNotificationHandler = async (payload) => {
//   return emailService.sendEmail({
//     to: payload.email,
//     subject: payload.title,
//     text: payload.body,
//   });
};

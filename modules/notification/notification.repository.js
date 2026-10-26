const Notification = require("./notification.model");

exports.getAllNotifications = async (filters) => {
  return Notification.find(filters);
};

exports.getNotificationsWithPagination = async (filters, offset, pageSize, sort) => {
  return Notification.find(filters).skip(offset).limit(pageSize).sort(sort).lean();
};

exports.getNotificationsCount = async (filters) => {
  return Notification.countDocuments(filters);
};

exports.getNotificationById = async (notificationId) => {
  return Notification.findById(notificationId);
};

exports.getNotificationsByIds = async (ids) => {
  return Notification.find({
    _id: { $in: ids },
  })
    .select("_id")
    .lean();
};

exports.getNotificationsByUserId = async (userId) => {
  return Notification.find({ recipients: { $elemMatch: { recipient: userId, deletedAt: null } } });
};

exports.createNotification = async (payload) => {
  return Notification.create(payload);
};

exports.deleteNotificationById = async (notificationId) => {
  return Notification.findByIdAndDelete(notificationId);
};

exports.updateNotification = async (filters, payload) => {
  return Notification.findByIdAndUpdate(filters, payload, { new: true });
};

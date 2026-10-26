const lodash = require("lodash");

// Repositories
const notificationRepository = require("./notification.repository");

// Validations
const joi = require("../../config");
const joiSchema = require("./notification.schema");
const notificationValidation = require("./notification.validation");

exports.getAllNotifications = async (filters) => {
  return notificationRepository.getAllNotifications(filters);
};

exports.getNotificationsWithPagination = async (payload) => {
  const { filters, page, pageSize, sort } = payload;
  const offset = (page - 1) * pageSize;

  const [notifications, totalCount] = await Promise.all([
    notificationRepository.getNotificationsWithPagination(filters, offset, pageSize, sort),
    notificationRepository.getNotificationsCount(filters),
  ]);

  const meta = { totalCount, totalPages: Math.ceil(totalCount / pageSize), page, pageSize };
  return { data: notifications, meta };
};

exports.getNotificationById = async (notificationId) => {
  joi.validate(notificationId, joiSchema.getNotificationById);

  return notificationValidation.throwErrorIfNotificationDoesNotExist(notificationId);
};

exports.createNotification = async (payload) => {
  const validatedPayload = joi.validate(payload, joiSchema.createNotification);

  return notificationRepository.createNotification(validatedPayload);
};

exports.updateNotification = async (payload) => {
  const validatedPayload = joi.validate(payload, joiSchema.updateNotification);

  const existingNotification = await notificationValidation.throwErrorIfNotificationDoesNotExist(validatedPayload.id);
  const updatePayload = {};

  if (validatedPayload.documentId && String(existingNotification?.documentId) !== String(validatedPayload.documentId)) {
    updatePayload.documentId = validatedPayload.documentId;
  }

  if (validatedPayload.documentReference && existingNotification?.documentReference !== validatedPayload.documentReference) {
    updatePayload.documentReference = validatedPayload.documentReference;
  }

  if (validatedPayload.recipients && !lodash.isEqual(existingNotification?.recipients, validatedPayload.recipients)) {
    updatePayload.recipients = validatedPayload.recipients;
  }

  if (validatedPayload.title && existingNotification?.title !== validatedPayload.title) {
    updatePayload.title = validatedPayload.title;
  }

  if (validatedPayload.body && existingNotification?.body !== validatedPayload.body) {
    updatePayload.body = validatedPayload.body;
  }

  if (validatedPayload.type && existingNotification?.type !== validatedPayload.type) {
    updatePayload.type = validatedPayload.type;
  }

  if (validatedPayload.event && existingNotification?.event !== validatedPayload.event) {
    updatePayload.event = validatedPayload.event;
  }

  if (validatedPayload.actionLink && existingNotification?.actionLink !== validatedPayload.actionLink) {
    updatePayload.actionLink = validatedPayload.actionLink;
  }

  if (validatedPayload.metadata && !lodash.isEqual(existingNotification?.metadata, validatedPayload.metadata)) {
    updatePayload.metadata = validatedPayload.metadata;
  }

  if (!Object.keys(updatePayload).length) return existingNotification;

  return notificationRepository.updateNotification(validatedPayload);
};

exports.deleteNotification = async (notificationId) => {
  joi.validate(notificationId, joiSchema.getNotificationById);

  await notificationValidation.throwErrorIfNotificationDoesNotExist(notificationId);

  await notificationRepository.deleteNotificationById(notificationId);

  return { deletedId: notificationId };
};

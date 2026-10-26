const Joi = require("joi");

// Config
const { objectId } = require("../../config");

// Constants
const MODELS = require("../../constants/MODELS");
const NOTIFICATION = require("../../constants/NOTIFICATION");

exports.getNotificationById = objectId.required();

exports.baseSchema = Joi.object({
  documentId: objectId,
  documentReference: Joi.string().valid(...Object.values(MODELS)),
  recipients: Joi.array()
    .items(
      Joi.object({
        recipient: objectId,
        readAt: Joi.date(),
        deletedAt: Joi.date(),
      }),
    )
    .min(1),
  title: Joi.string().trim().min(2).max(255),
  body: Joi.string().trim(),
  type: Joi.string().valid(...Object.values(NOTIFICATION.TYPES)),
  event: Joi.string().valid(...Object.values(NOTIFICATION.EVENTS)),
  actionLink: Joi.string().trim(),
  metadata: Joi.object().default({}),
});

exports.createNotification = exports.baseSchema.fork(["recipients"], (schema) =>
  schema
    .items(
      Joi.object({
        recipient: objectId.required(),
        readAt: Joi.date(),
        deletedAt: Joi.date(),
      }),
    )
    .min(1)
    .required(),
);

exports.updateNotification = exports.baseSchema.append({ id: objectId.required() });

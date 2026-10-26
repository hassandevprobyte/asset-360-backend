const mongoose = require("mongoose");

// Constants
const MODELS = require("../../constants/MODELS");
const NOTIFICATION = require("../../constants/NOTIFICATION");

// Recipients Schema
const recipientsSchema = {
  _id: false,
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "recipient is required"],
  },
  readAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
};

// Notification Schema
const schema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "documentReference",
      required: [true, "document ID is required"],
    },
    documentReference: {
      type: String,
      enum: Object.values(MODELS),
      required: [true, "document reference is required"],
    },
    recipients: {
      type: [recipientsSchema],
      required: [true, "recipients are required"],
      validate: {
        validator: (recipients) => Array.isArray(recipients) && recipients.length > 0,
        message: "at least one recipient is required",
      },
    },
    title: {
      type: String,
      trim: true,
      required: [true, "title is required"],
    },
    message: {
      type: String,
      trim: true,
      required: [true, "message is required"],
    },
    type: {
      type: String,
      enums: Object.values(NOTIFICATION.TYPES),
      required: [true, "type is required"],
    },
    event: {
      type: String,
      enums: Object.values(NOTIFICATION.EVENTS),
      required: [true, "event is required"],
    },
    actionLink: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

schema.index({
  "recipients.recipient": 1,
  "recipients.readAt": 1,
  createdAt: -1,
});

schema.index({
  documentReference: 1,
  documentId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(MODELS.NOTIFICATION, schema);

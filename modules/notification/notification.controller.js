const asyncHandler = require("express-async-handler");

// Services
const notificationService = require("./notification.service");

// @desc    Get all notification
// @route   GET /api/v1/notifications/all
// @access  Private
exports.getAllNotifications = asyncHandler(async (req, res) => {
  const data = await notificationService.getAllNotifications(req.filters);

  res.status(200).json(data);
});

// @desc    Get notification with pagination
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotificationsWithPagination = asyncHandler(async (req, res) => {
  const payload = {
    filters: req.filters,
    page: req.pagination.page,
    pageSize: req.pagination.pageSize,
    sort: req.pagination.sort,
  };

  const data = await notificationService.getNotificationsWithPagination(payload);

  res.status(200).json(data);
});

// @desc    Get notification by id
// @route   GET /api/v1/notifications/:id
// @access  Private
exports.getNotificationById = asyncHandler(async (req, res) => {
  const data = await notificationService.getNotificationById(req.params.id);

  res.status(200).json(data);
});

// @desc    Create a new notification
// @route   POST /api/v1/notifications
// @access  Private
exports.createNotification = asyncHandler(async (req, res) => {
  const payload = {
    documentId: req.body.documentId,
    documentReference: req.body.documentReference,
    recipients: req.body.recipients,
    title: req.body.title,
    body: req.body.body,
    type: req.body.type,
    event: req.body.event,
    actionLink: req.body.actionLink,
    metadata: req.body.metadata,
  };

  const data = await notificationService.createNotification(payload);

  res.status(201).json(data);
});

// @desc    Update notification
// @route   PATCH /api/v1/notifications/:id
// @access  Private
exports.updateNotification = asyncHandler(async (req, res) => {
  const payload = {
    id: req.params.id,
    documentId: req.body.documentId,
    documentReference: req.body.documentReference,
    recipients: req.body.recipients,
    title: req.body.title,
    body: req.body.body,
    type: req.body.type,
    event: req.body.event,
    actionLink: req.body.actionLink,
    metadata: req.body.metadata,
  };

  const data = await notificationService.updateNotification(payload);

  res.status(200).json(data);
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res) => {
  const data = await notificationService.deleteNotification(req.params.id);

  res.status(200).json(data);
});

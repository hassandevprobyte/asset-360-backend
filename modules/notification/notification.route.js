const express = require("express");
const router = express.Router();

// Controllers
const notificationController = require("./notification.controller");

router.route("/").get(notificationController.getNotificationsWithPagination).post(notificationController.createNotification);
router.route("/all").get(notificationController.getAllNotifications);
router.route("/:id").get(notificationController.getNotificationById).patch(notificationController.updateNotification).delete(notificationController.deleteNotification);

module.exports = router;

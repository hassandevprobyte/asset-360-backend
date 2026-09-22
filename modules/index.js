const express = require("express");
const router = express.Router();

// Middlewares
const checkPermissions = require("../middleware/checkPermissions");
const protect = require("../middleware/authMiddleware");
const queryFilters = require("../middleware/queryFilters");

// Constants
const MODELS = require("../constants/MODELS");

const routes = [
  { path: "/assets", resource: MODELS.ASSET, route: require("./asset/asset.route") },
  { path: "/attachments", resource: MODELS.ATTACHMENT, route: require("./attachment/attachment.route") },
  { path: "/depreciations", resource: MODELS.DEPRECIATION, route: require("./depreciation/depreciation.route") },
  { path: "/picklists", resource: MODELS.PICKLIST, route: require("./picklist/picklist.route") },
  { path: "/roles", resource: MODELS.ROLE, route: require("./role/role.route") },
];

routes.forEach((route) => {
  const middlewares = [];

  if (route.resource) {
    // middlewares.push(checkPermissions(route.resource));
    // middlewares.push(queryFilters(route.resource));
  }

  router.use(route.path, ...middlewares, route.route);
});

// router.use("/auth", require("./auth/auth.route"));

module.exports = router;

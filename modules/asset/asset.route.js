const express = require("express");
const router = express.Router();

// Controllers
const assetController = require("./asset.controller");

// Multer
const uploadMiddleware = require("../../middleware/uploadMiddleware");
const upload = uploadMiddleware({
  destination: "public/uploads/asset",
  uploadType: "fields",
  field: [{ name: "images", maxCount: 10 }],
});

router.route("/").get(assetController.getAssetsWithPagination).post(upload, assetController.createAsset);
router.route("/all").get(assetController.getAllAssets);
router.get("/export", assetController.exportAssets);
router.get("/summary/byGroup", assetController.getAssetsSummaryByGroup);
router.route("/:id").get(assetController.getAssetById).patch(upload, assetController.updateAsset).delete(assetController.deleteAsset);

module.exports = router;

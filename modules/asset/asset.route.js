const express = require("express");
const router = express.Router();

// Controllers
const assetController = require("./asset.controller");

router.route("/").get(assetController.getAssetsWithPagination).post(assetController.createAsset);
router.get("/export", assetController.exportAssets);
router.get("/summary/byGroup", assetController.getAssetsSummaryByGroup);
router.route("/:id").get(assetController.getAssetById).patch(assetController.updateAsset).delete(assetController.deleteAsset);

module.exports = router;

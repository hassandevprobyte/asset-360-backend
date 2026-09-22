const asyncHandler = require("express-async-handler");

// Services
const assetService = require("./asset.service");

// @desc    Get all assets
// @route   GET /api/v1/assets/all
// @access  Private
exports.getAllAssets = asyncHandler(async (req, res) => {
  const data = await assetService.getAllAssets(req.filters);

  res.status(200).json(data);
});

// @desc    Get assets with pagination
// @route   GET /api/v1/assets
// @access  Private
exports.getAssetsWithPagination = asyncHandler(async (req, res) => {
  const payload = {
    filters: req.filters,
    page: req.pagination.page,
    pageSize: req.pagination.pageSize,
    sort: req.pagination.sort,
  };

  const data = await assetService.getAssetsWithPagination(payload);

  res.status(200).json(data);
});

// @desc    Get assets summary by group
// @route   GET /api/v1/assets/summary/byGroup
// @access  Private
exports.getAssetsSummaryByGroup = asyncHandler(async (req, res) => {
  const payload = {
    filters: req.filters,
    primaryGroup: req.query.primaryGroup,
    secondaryGroup: req.query.secondaryGroup,
  };

  const data = await assetService.getAssetsSummaryByGroup(payload);

  res.status(200).json(data);
});

// @desc    Get asset by id
// @route   GET /api/v1/assets/:id
// @access  Private
exports.getAssetById = asyncHandler(async (req, res) => {
  const data = await assetService.getAssetById(req.params.id);

  res.status(200).json(data);
});

// @desc    Create a new asset
// @route   POST /api/v1/assets
// @access  Private
exports.createAsset = asyncHandler(async (req, res) => {
  const payload = {
    // company: req.body.company,
    location: req.body.location,
    employee: req.body.employee,
    category: req.body.category,
    subCategory: req.body.subCategory,
    status: req.body.status,
    purchaseAmount: req.body.purchaseAmount,
    purchaseDate: req.body.purchaseDate,
    hasExpiry: req.body.hasExpiry,
    expiryDate: req.body.expiryDate,
    description: req.body.description,
    serialNumber: req.body.serialNumber,
    condition: req.body.condition,
    warranty: req.body.warranty,
    // createdBy: req.user._id,
  };

  const data = await assetService.createAsset(payload);

  res.status(201).json(data);
});

// @desc    Update asset
// @route   PATCH /api/v1/assets/:id
// @access  Private
exports.updateAsset = asyncHandler(async (req, res) => {
  const payload = {
    id: req.params.id,
    // company: req.body.company,
    location: req.body.location,
    employee: req.body.employee,
    category: req.body.category,
    subCategory: req.body.subCategory,
    status: req.body.status,
    purchaseAmount: req.body.purchaseAmount,
    purchaseDate: req.body.purchaseDate,
    hasExpiry: req.body.hasExpiry,
    expiryDate: req.body.expiryDate,
    description: req.body.description,
    serialNumber: req.body.serialNumber,
    condition: req.body.condition,
    warranty: req.body.warranty,
  };

  const data = await assetService.updateAsset(payload);

  res.status(200).json(data);
});

// @desc    Delete asset
// @route   DELETE /api/v1/assets/:id
// @access  Private
exports.deleteAsset = asyncHandler(async (req, res) => {
  const data = await assetService.deleteAsset(req.params.id);

  res.status(200).json(data);
});

// @desc    Export assets
// @route   GET /api/v1/assets/export
// @access  Private
exports.exportAssets = asyncHandler(async (req, res) => {
  const filters = req.filters;

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=assets_${Date.now()}.xlsx`);

  await assetService.exportAssets(filters, res);
});

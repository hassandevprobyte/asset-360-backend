const Asset = require("./asset.model");

const POPULATION_PIPELINE = [
  { path: "company" },
  { path: "location" },
  { path: "employee" },
  { path: "category" },
  { path: "subCategory" },
  { path: "status" },
  { path: "createdBy" },
];

exports.getAllAssets = async (filters) => {
  return Asset.find(filters).populate(POPULATION_PIPELINE).lean();
};

exports.getAssetsWithPagination = async (filters, offset, pageSize, sort) => {
  return Asset.find(filters).skip(offset).limit(pageSize).sort(sort).populate(POPULATION_PIPELINE).lean();
};

exports.getAssetsCount = async (filters) => {
  return Asset.countDocuments(filters);
};

exports.getAssetsSummaryByGroup = async (filters, primaryGroup, secondaryGroup) => {
  const matchPipeline = [{ $match: filters }];

  const facetPipelines = {
    totals: [{ $group: { _id: null, totalCount: { $sum: 1 }, totalPurchaseAmount: { $sum: "$purchaseAmount" } } }],
    primaryGroupWise: [
      {
        $group: {
          _id: { primaryGroup: `$${primaryGroup}`, secondaryGroup: `$${secondaryGroup}` },
          count: { $sum: 1 },
          purchaseAmount: { $sum: "$purchaseAmount" },
        },
      },
      {
        $group: {
          _id: "$_id.primaryGroup",
          groupType: { $first: primaryGroup },
          secondaryGroupWise: { $push: { _id: "$_id.secondaryGroup", groupType: secondaryGroup, count: "$count", purchaseAmount: "$purchaseAmount" } },
          count: { $sum: "$count" },
          purchaseAmount: { $sum: "$purchaseAmount" },
        },
      },
    ],
    secondaryGroupWise: [{ $group: { _id: `$${secondaryGroup}`, count: { $sum: 1 }, purchaseAmount: { $sum: "$purchaseAmount" } } }],
  };

  const projectionPipeline = [
    {
      $project: {
        primaryGroupWise: 1,
        secondaryGroupWise: 1,
        totalCount: { $arrayElemAt: ["$totals.totalCount", 0] },
        totalPurchaseAmount: { $arrayElemAt: ["$totals.totalPurchaseAmount", 0] },
      },
    },
  ];

  const aggregationPipeline = [...matchPipeline, { $facet: facetPipelines }, ...projectionPipeline];

  const [result = { primaryGroupWise: [], secondaryGroupWise: [], totalCount: 0, totalPurchaseAmount: 0 }] = await Asset.aggregate(aggregationPipeline);

  return result;
};

exports.getAssetById = async (assetId) => {
  return Asset.findById(assetId).populate(POPULATION_PIPELINE).lean();
};

exports.getAssetByCategoryId = async (categoryId) => {
  return Asset.findOne({ category: categoryId });
};

exports.getAssetBySubCategoryId = async (subCategoryId) => {
  return Asset.findOne({ subCategory: subCategoryId });
};

exports.createAsset = async (payload) => {
  return Asset.create(payload);
};

exports.updateAssetById = async (assetId, payload) => {
  return Asset.findByIdAndUpdate(assetId, payload);
};

exports.deleteAssetById = async (assetId) => {
  return Asset.findByIdAndDelete(assetId);
};

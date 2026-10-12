// Utilities
const getGroupListItemsMap = require("../../utils/getGroupListItemsMap");
const isValidObjectId = require("../../utils/isValidObjectId");

exports.transformAssetsSummaryByGroup = async (assetsSummary, primaryGroup, secondaryGroup) => {
  const primaryGroupIds = assetsSummary.primaryGroupWise
    .map((group) => group?._id)
    .filter((id) => id && isValidObjectId(id))
    .map(String);
  const primaryFilters = { _id: { $in: primaryGroupIds } };

  const secondaryGroupIds = assetsSummary.secondaryGroupWise
    .map((group) => group?._id)
    .filter((id) => id && isValidObjectId(id))
    .map(String);
  const secondaryFilters = { _id: { $in: secondaryGroupIds } };

  const [primaryGroupItemsMap, secondaryGroupItemsMap] = await Promise.all([
    getGroupListItemsMap(primaryGroup, primaryFilters),
    getGroupListItemsMap(secondaryGroup, secondaryFilters),
  ]);

  const transformSecondaryGroupWise = (secondaryGroupWise = []) => {
    const secondaryGroupWiseMap = new Map(secondaryGroupWise.map((s) => [String(s._id), s]));

    return Array.from(secondaryGroupItemsMap.values())
      .map((s) => {
        const secondaryGroupData = secondaryGroupWiseMap.get(String(s._id)) || {};

        const _id = s._id || null;
        const title = s.title || "-";
        const color = s.color || null;
        const count = secondaryGroupData.count || 0;
        const purchaseAmount = secondaryGroupData.purchaseAmount || 0;

        return { _id, title, color, count, purchaseAmount };
      })
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  };

  const transformPrimaryGroupWise = (primaryGroupWise = []) => {
    return primaryGroupWise
      .map((primaryGroup) => {
        const primaryGroupFound = primaryGroupItemsMap.get(String(primaryGroup._id));

        return {
          ...primaryGroup,
          title: primaryGroupFound?.title || "-",
          color: primaryGroupFound?.color || null,
          secondaryGroupWise: transformSecondaryGroupWise(primaryGroup?.secondaryGroupWise),
        };
      })
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  };

  const primaryGroupWise = transformPrimaryGroupWise(assetsSummary.primaryGroupWise);
  const secondaryGroupWise = transformSecondaryGroupWise(assetsSummary.secondaryGroupWise);

  return { ...assetsSummary, primaryGroupWise, secondaryGroupWise };
};

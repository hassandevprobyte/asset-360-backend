const lodash = require("lodash");

// Repositories
const assetRepository = require("./asset.repository");

// Validations
const joi = require("../../config");
const joiSchema = require("./asset.schema");
const assetValidation = require("./asset.validation");

// Utilities
const excel = require("../../utils/excel");
const formatAmount = require("../../utils/formatAmount");
const formatDate = require("../../utils/formatDate");
const isSameDay = require("../../utils/isSameDay");
const isValidObjectId = require("../../utils/isValidObjectId");

// Constants
const MODELS = require("../../constants/MODELS");

exports.getAllAssets = async (filters) => {
  return assetRepository.getAllAssets(filters);
};

exports.getAssetsWithPagination = async (payload) => {
  const { filters, page, pageSize, sort } = payload;
  const offset = (page - 1) * pageSize;

  const [assets, totalCount] = await Promise.all([assetRepository.getAssetsWithPagination(filters, offset, pageSize, sort), assetRepository.getAssetsCount(filters)]);

  const meta = { totalCount, totalPages: Math.ceil(totalCount / pageSize), page, pageSize };

  return { data: assets, meta };
};

exports.getAssetsSummaryByGroup = async (payload) => {
  const { filters, primaryGroup, secondaryGroup } = joi.validate(payload, joiSchema.getAssetsSummaryByGroup);

  const assetsSummary = await assetRepository.getAssetsSummaryByGroup(filters, primaryGroup, secondaryGroup);

  return transformAssetsSummaryByGroup(assetsSummary, primaryGroup, secondaryGroup);
};

exports.getAssetById = async (assetId) => {
  joi.validate(assetId, joiSchema.getAssetById);

  return assetValidation.throwErrorIfAssetDoesNotExist(assetId);
};

exports.createAsset = async (payload) => {
  const validatedPayload = joi.validate(payload, joiSchema.createAsset);

  await companyValidation.throwErrorIfCompanyDoesNotExist(validatedPayload.company);
  await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.category);
  const subCategory = await picklistValidation.throwErrorIfPicklistDoesNotExistInParentPicklist(validatedPayload.subCategory, validatedPayload.category);

  if (subCategory.meta?.requiresEmployee) {
    await employeeValidation.throwErrorIfEmployeeDoesNotExist(validatedPayload.employee);
  } else if (validatedPayload.employee) {
    delete validatedPayload.employee;
  }

  if (validatedPayload.status) {
    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.status);
  } else {
    const defaultStatus = await picklistValidation.throwErrorIfDefaultPicklistDoesNotExistInContext(MODELS.ASSET, "status");

    validatedPayload.status = defaultStatus._id;
  }

  if (validatedPayload.location) {
    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.location);
  }

  return assetRepository.createAsset(validatedPayload);
};

exports.updateAsset = async (payload) => {
  const validatedPayload = joi.validate(payload, joiSchema.updateAsset);

  const existingAsset = await assetValidation.throwErrorIfAssetDoesNotExist(validatedPayload.id);

  const updatePayload = {};

  const updatedCategory = validatedPayload.category || existingAsset.category._id.toString();
  const updatedSubCategory = validatedPayload.subCategory || existingAsset.subCategory._id.toString();

  if (validatedPayload.category && validatedPayload.category !== existingAsset.category._id.toString()) {
    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.category);

    updatePayload.category = validatedPayload.category;
  }

  if (validatedPayload.subCategory && validatedPayload.subCategory !== existingAsset.subCategory._id.toString()) {
    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.subCategory);

    updatePayload.subCategory = validatedPayload.subCategory;
  }

  if (validatedPayload.company && validatedPayload.company !== existingAsset.company._id.toString()) {
    await companyValidation.throwErrorIfCompanyDoesNotExist(validatedPayload.company);

    updatePayload.company = validatedPayload.company;
  }

  if (validatedPayload.location && validatedPayload.location !== existingAsset?.location?._id?.toString()) {
    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.location);

    updatePayload.location = validatedPayload.location;
  }

  if (validatedPayload.employee && validatedPayload.employee !== existingAsset?.employee?._id?.toString()) {
    await employeeValidation.throwErrorIfEmployeeDoesNotExist(validatedPayload.employee);

    updatePayload.employee = validatedPayload.employee;
  }

  if (validatedPayload.status && validatedPayload.status !== existingAsset?.status?._id?.toString()) {
    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.status);

    updatePayload.status = validatedPayload.status;
  }

  if (validatedPayload.hasOwnProperty("purchaseAmount") && validatedPayload.purchaseAmount !== existingAsset.purchaseAmount) {
    updatePayload.purchaseAmount = validatedPayload.purchaseAmount;
  }

  if (validatedPayload.purchaseDate && !isSameDay(validatedPayload.purchaseDate, existingAsset.purchaseDate)) {
    updatePayload.purchaseDate = validatedPayload.purchaseDate;
  }

  if (validatedPayload.description && validatedPayload.description !== existingAsset.description) {
    updatePayload.description = validatedPayload.description;
  }

  if (validatedPayload.expiryDate && !isSameDay(validatedPayload.expiryDate, existingAsset.expiryDate)) {
    updatePayload.expiryDate = validatedPayload.expiryDate;
  }

  if (validatedPayload.hasOwnProperty("hasExpiry") && validatedPayload.hasExpiry !== existingAsset.hasExpiry) {
    updatePayload.hasExpiry = validatedPayload.hasExpiry;

    if (updatePayload.hasExpiry === false && existingAsset.expiryDate) {
      updatePayload.$unset = { expiryDate: "" };
    }
  }

  if (updatePayload.category || updatePayload.subCategory) {
    const subCategory = await picklistValidation.throwErrorIfPicklistDoesNotExistInParentPicklist(updatedSubCategory, updatedCategory);

    const requiresEmployee = subCategory.meta?.requiresEmployee;

    if (requiresEmployee && updatePayload.employee) {
      await employeeValidation.throwErrorIfEmployeeDoesNotExist(validatedPayload.employee);
    }

    if (!requiresEmployee && existingAsset.employee) {
      updatePayload.$unset = { ...updatePayload.$unset, employee: "" };
    }
  }

  return assetRepository.updateAssetById(validatedPayload.id, updatePayload);
};

exports.deleteAsset = async (assetId) => {
  joi.validate(assetId, joiSchema.getAssetById);

  await assetValidation.throwErrorIfAssetDoesNotExist(assetId);

  await assetRepository.deleteAssetById(assetId);

  return { deletedId: assetId };
};

exports.exportAssets = async (filters, stream) => {
  const assets = await assetRepository.getAllAssets(filters);

  const columns = [
    { header: "Purchase Date", key: "purchaseDate" },
    { header: "Tag", key: "tag" },
    { header: "Company", key: "company" },
    { header: "Location", key: "location" },
    { header: "Category", key: "category" },
    { header: "Sub Category", key: "subCategory" },
    { header: "Employee", key: "employee" },
    { header: "Purchase Amount", key: "purchaseAmount" },
    { header: "Status", key: "status" },
    { header: "Has Expiry", key: "hasExpiry" },
    { header: "Expiry Date", key: "expiryDate" },
    { header: "Description", key: "description" },
  ];

  const rows = assets.map((asset) => ({
    purchaseDate: formatDate(asset.purchaseDate),
    tag: asset.tag,
    company: lodash.startCase(asset.company?.title ?? ""),
    location: lodash.startCase(asset.location?.title ?? ""),
    category: lodash.startCase(asset.category?.title ?? ""),
    subCategory: lodash.startCase(asset.subCategory?.title ?? ""),
    employee: lodash.startCase(`${asset.employee?.employeeId ?? ""} ${asset.employee?.personal?.firstName ?? ""} ${asset.employee?.personal?.lastName ?? ""}`),
    purchaseAmount: asset.purchaseAmount ? formatAmount(asset.purchaseAmount, "en-PK", { currency: "PKR" }) : null,
    status: lodash.startCase(asset.status?.title ?? ""),
    hasExpiry: asset.hasExpiry,
    expiryDate: asset.expiryDate ? formatDate(asset.expiryDate) : null,
    description: asset.description,
  }));

  await excel.export({ stream, sheetName: "Assets", columns, rows });
};

async function transformAssetsSummaryByGroup(assetsSummary, primaryGroup, secondaryGroup) {
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
    groupHelpers.getGroupListItemsMap(primaryGroup, primaryFilters),
    groupHelpers.getGroupListItemsMap(secondaryGroup, secondaryFilters),
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
}

const lodash = require("lodash");

// Services
const attachmentService = require("../attachment/attachment.service");

// Repositories
const assetRepository = require("./asset.repository");

// Publishers
const notificationPublisher = require("../notification/notification.publisher");

// Validations
const joi = require("../../config");
const joiSchema = require("./asset.schema");
const assetValidation = require("./asset.validation");
const picklistValidation = require("../picklist/picklist.validation");

// Helpers
const assetHelpers = require("./asset.helper");

// Utilities
const excel = require("../../utils/excel");
const formatAmount = require("../../utils/formatAmount");
const formatDate = require("../../utils/formatDate");
const isSameDay = require("../../utils/isSameDay");
const isValidDateRange = require("../../utils/isValidDateRange");
const removeUploadedFiles = require("../../utils/removeUploadedFiles");

// Constants
const MODELS = require("../../constants/MODELS");
const NOTIFICATION = require("../../constants/NOTIFICATION");

exports.getAllAssets = async (filters) => {
  return assetRepository.getAllAssets(filters);
};

exports.getAssetsWithPagination = async (payload) => {
  const { filters, page, pageSize, sort } = payload;
  const offset = (page - 1) * pageSize;

  const [assets, totalCount] = await Promise.all([assetRepository.getAssetsWithPagination(filters, offset, pageSize, sort), assetRepository.getAssetsCount(filters)]);

  const meta = { totalCount, totalPages: Math.ceil(totalCount / pageSize), page, pageSize };

  // await notificationPublisher.publish(NOTIFICATION.EVENTS.ASSET_ASSIGNED, {
  //   documentId: "6acd00dc487b554ee03d342c",
  //   documentReference: "Asset",
  //   recipients: [
  //     {
  //       recipient: "6acd00dc487b554ee03d342d",
  //       readAt: null,
  //       deletedAt: null,
  //     },
  //     {
  //       recipient: "6acd00dc487b554ee03d3423",
  //       readAt: null,
  //       deletedAt: null,
  //     },
  //   ],
  //   title: "Asset Assigned",
  //   body: "A new asset has been assigned to you.",
  //   type: NOTIFICATION.TYPES.IN_APP,
  //   event: NOTIFICATION.EVENTS.ASSET_ASSIGNED,
  //   actionLink: "/assets/6acd00dc487b554ee03d342c",
  //   metadata: {
  //     assetName: "MacBook Pro",
  //     serialNumber: "MBP-2026-001",
  //     assignedBy: "John Doe",
  //   },
  // });

  return { data: assets, meta };
};

exports.getAssetsSummaryByGroup = async (payload) => {
  const { filters, primaryGroup, secondaryGroup } = joi.validate(payload, joiSchema.getAssetsSummaryByGroup);

  const assetsSummary = await assetRepository.getAssetsSummaryByGroup(filters, primaryGroup, secondaryGroup);

  return assetHelpers.transformAssetsSummaryByGroup(assetsSummary, primaryGroup, secondaryGroup);
};

exports.getAssetById = async (assetId) => {
  joi.validate(assetId, joiSchema.getAssetById);

  return assetValidation.throwErrorIfAssetDoesNotExist(assetId);
};

exports.createAsset = async (payload, attachmentPayload) => {
  try {
    const validatedPayload = joi.validate(payload, joiSchema.createAsset);

    await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.category);
    const subCategory = await picklistValidation.throwErrorIfPicklistDoesNotExistInParentPicklist(validatedPayload.subCategory, validatedPayload.category);

    if (subCategory.meta?.requiresEmployee) {
      await employeeValidation.throwErrorIfEmployeeDoesNotExist(validatedPayload.employee);
    } else if (validatedPayload.employee) {
      delete validatedPayload.employee;
    }

    if (validatedPayload.condition) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.condition);
    } else {
      const defaultStatus = await picklistValidation.throwErrorIfDefaultPicklistDoesNotExistInContext(MODELS.ASSET, "condition");

      validatedPayload.condition = defaultStatus._id;
    }

    if (validatedPayload.location) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.location);
    }

    if (!validatedPayload.warranty.hasWarranty) {
      delete validatedPayload.warranty;
    }

    if (validatedPayload.warranty.provider) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.warranty.provider);
    }

    if (!validatedPayload.expiry.hasExpiry) {
      delete validatedPayload.expiryDate;
    }

    const asset = await assetRepository.createAsset(validatedPayload);

    const updatePayload = {};
    if (attachmentPayload?.images?.length) {
      await attachmentService.addAttachments({
        resource: MODELS.ASSET,
        resourceId: asset._id,
        files: attachmentPayload.images,
        uploadedBy: attachmentPayload.uploadedBy,
      });

      updatePayload.$set = { images: attachmentPayload.images.map((image) => image.path) };
    }

    if (!Object.keys(updatePayload).length) return asset;

    return assetRepository.updateAssetById(asset._id, updatePayload);
  } catch (error) {
    await removeUploadedFiles({ files: attachmentPayload });
    throw error;
  }
};

exports.updateAsset = async (payload, attachmentPayload) => {
  try {
    const validatedPayload = joi.validate(payload, joiSchema.updateAsset);

    const existingAsset = await assetValidation.throwErrorIfAssetDoesNotExist(validatedPayload.id);
    const updatePayload = {};

    const updatedCategory = validatedPayload.category || String(existingAsset?.category?._id);
    const updatedSubCategory = validatedPayload.subCategory || String(existingAsset?.subCategory?._id);

    if (validatedPayload.serialNumber && validatedPayload.serialNumber !== existingAsset?.serialNumber) {
      updatePayload.serialNumber = validatedPayload.serialNumber;
    }

    if (validatedPayload.company && validatedPayload.company !== String(existingAsset?.company)) {
      updatePayload.company = validatedPayload.company;
    }

    if (validatedPayload.location && validatedPayload.location !== String(existingAsset?.location?._id)) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.location);
      updatePayload.location = validatedPayload.location;
    }

    if (validatedPayload.employee && validatedPayload.employee !== String(existingAsset?.employee)) {
      updatePayload.employee = validatedPayload.employee;
    }

    if (validatedPayload.category && validatedPayload.category !== String(existingAsset?.category?._id)) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.category);
      updatePayload.category = validatedPayload.category;
    }

    if (validatedPayload.subCategory && validatedPayload.subCategory !== String(existingAsset?.subCategory?._id)) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.subCategory);
      updatePayload.subCategory = validatedPayload.subCategory;
    }

    if (updatePayload.category || updatePayload.subCategory) {
      const subCategory = await picklistValidation.throwErrorIfPicklistDoesNotExistInParentPicklist(updatedSubCategory, updatedCategory);

      const requiresEmployee = subCategory.meta?.requiresEmployee;

      if (requiresEmployee && updatePayload.employee) {
        await employeeValidation.throwErrorIfEmployeeDoesNotExist(validatedPayload.employee);
      }

      if (!requiresEmployee && existingAsset.employee) {
        updatePayload.$unset = { ...(updatePayload.$unset || {}), employee: "" };
      }
    }

    if (validatedPayload.status && validatedPayload.status !== String(existingAsset?.status)) {
      updatePayload.status = validatedPayload.status;
    }

    if (validatedPayload.condition && validatedPayload.condition !== String(existingAsset?.condition?._id)) {
      await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.condition);
      updatePayload.condition = validatedPayload.condition;
    }

    if (validatedPayload.hasOwnProperty("purchaseAmount") && validatedPayload.purchaseAmount !== existingAsset?.purchaseAmount) {
      updatePayload.purchaseAmount = validatedPayload.purchaseAmount;
    }

    if (validatedPayload.purchaseDate && !isSameDay(validatedPayload.purchaseDate, existingAsset?.purchaseDate)) {
      updatePayload.purchaseDate = normalizeDate(validatedPayload.purchaseDate);
    }

    if (validatedPayload.notes && validatedPayload.notes !== existingAsset?.notes) {
      updatePayload.notes = validatedPayload.notes;
    }

    if (validatedPayload.expiry && !lodash.isEqual(validatedPayload.expiry, existingAsset?.expiry)) {
      if (validatedPayload.expiry?.hasExpiry === false) {
        updatePayload.$unset = { ...(updatePayload.$unset || {}), expiry: "" };
      } else {
        updatePayload.expiry = validatedPayload.expiry;
      }
    }

    if (validatedPayload.warranty && !lodash.isEqual(validatedPayload.warranty, existingAsset?.warranty)) {
      if (validatedPayload.warranty?.hasWarranty === false) {
        updatePayload.$unset = { ...(updatePayload.$unset || {}), warranty: "" };
      } else {
        if (validatedPayload.warranty?.provider && validatedPayload.warranty.provider !== String(existingAsset?.warranty?.provider?._id)) {
          await picklistValidation.throwErrorIfPicklistDoesNotExist(validatedPayload.warranty.provider);
        }

        const updatedStartDate = validatedPayload.warranty.startDate || existingAsset?.warranty?.startDate;
        const updatedEndDate = validatedPayload.warranty.endDate || existingAsset?.warranty?.endDate;
        isValidDateRange(updatedStartDate, updatedEndDate);

        updatePayload.warranty = validatedPayload.warranty;
      }
    }

    if (attachmentPayload?.images) {
      await attachmentService.deleteAttachmentsByResource(MODELS.ASSET, existingAsset._id);

      await attachmentService.addAttachments({
        resource: MODELS.ASSET,
        resourceId: existingAsset._id,
        files: attachmentPayload.images,
        uploadedBy: attachmentPayload.uploadedBy,
      });

      updatePayload.$set = { images: attachmentPayload.images.map((image) => image.path) };
    }

    if (!Object.keys(updatePayload).length) return existingAsset;

    return assetRepository.updateAssetById(validatedPayload.id, updatePayload);
  } catch (error) {
    await removeUploadedFiles({ files: attachmentPayload });
    throw error;
  }
};

exports.deleteAsset = async (assetId) => {
  joi.validate(assetId, joiSchema.getAssetById);

  await assetValidation.throwErrorIfAssetDoesNotExist(assetId);
  await attachmentService.deleteAttachmentsByResource(MODELS.ASSET, assetId);
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

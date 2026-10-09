const Joi = require("joi");
const { objectId, dateOnly } = require("../../config");

// Constants
const ENUMS = require("../../constants/ENUMS");

exports.getAssetById = objectId.required();

exports.baseSchema = Joi.object({
  serialNumber: Joi.string().trim(),
  company: objectId,
  location: objectId,
  employee: objectId,
  category: objectId,
  subCategory: objectId,
  status: Joi.string().valid(...Object.values(ENUMS.ASSET.STATUSES)),
  condition: objectId,
  purchaseAmount: Joi.number().positive().min(0),
  purchaseDate: dateOnly().max("now"),
  notes: Joi.string().lowercase().trim(),
  expiry: Joi.object({
    hasExpiry: Joi.boolean().default(false),
    expiryDate: dateOnly().when("hasExpiry", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
  warranty: Joi.object({
    hasWarranty: Joi.boolean().default(false),
    startDate: dateOnly().when("hasWarranty", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    endDate: dateOnly().when("hasWarranty", {
      is: true,
      then: dateOnly().greater(Joi.ref("startDate")).required(),
      otherwise: Joi.optional(),
    }),
    provider: objectId,
  }),
});

exports.createAsset = exports.baseSchema.fork(["category", "subCategory", "status", "purchaseDate"], (schema) => schema.required());

exports.updateAsset = exports.baseSchema.append({ id: objectId.required() });

exports.getAssetsSummaryByGroup = Joi.object({
  filters: Joi.object().default({}).optional(),
  primaryGroup: Joi.string().trim().valid("company", "location", "category", "subCategory", "status").default("category").optional(),
  secondaryGroup: Joi.string().trim().valid("company", "location", "category", "subCategory", "status").default("subCategory").optional(),
});

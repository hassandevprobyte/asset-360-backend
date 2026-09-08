const Joi = require("joi");
const { objectId } = require("../../config");

exports.getAssetById = objectId.required();

exports.getAssetsSummaryByGroup = Joi.object({
  filters: Joi.object().default({}).optional(),
  primaryGroup: Joi.string().trim().valid("company", "location", "category", "subCategory", "status").default("company").optional(),
  secondaryGroup: Joi.string().trim().valid("company", "location", "category", "subCategory", "status").default("category").optional(),
});

exports.baseSchema = Joi.object({
  company: objectId,
  location: objectId,
  employee: objectId,
  category: objectId,
  subCategory: objectId,
  status: objectId,
  purchaseAmount: Joi.number().min(0),
  purchaseDate: Joi.date().max("now"),
  hasExpiry: Joi.boolean(),
  expiryDate: Joi.date().greater(Joi.ref("purchaseDate")).when("hasExpiry", { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  description: Joi.string().lowercase().trim().empty(""),
  createdBy: objectId,
});

exports.createAsset = exports.baseSchema
  .fork(["company", "category", "subCategory", "purchaseDate", "createdBy"], (schema) => schema.required())
  .fork("hasExpiry", (schema) => schema.default(false));

exports.updateAsset = exports.baseSchema.append({ id: objectId.required() }).fork("createdBy", (schema) => schema.strip());

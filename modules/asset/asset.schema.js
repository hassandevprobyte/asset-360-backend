const Joi = require("joi");
const { objectId } = require("../../config");

exports.getAssetById = objectId.required();

exports.baseSchema = Joi.object({
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
  serialNumber: Joi.string().trim().empty(""),
  condition: objectId,
  warranty: Joi.object({
    hasWarranty: Joi.boolean().default(false),
    startDate: Joi.date().when("hasWarranty", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    endDate: Joi.date().when("hasWarranty", {
      is: true,
      then: Joi.date().greater(Joi.ref("startDate")).required(),
      otherwise: Joi.optional(),
    }),
    provider: objectId,
  }),
});

exports.createAsset = exports.baseSchema.fork(["category", "subCategory", "purchaseDate"], (schema) => schema.required()).fork("hasExpiry", (schema) => schema.default(false));

exports.updateAsset = exports.baseSchema.append({ id: objectId.required() });

exports.getAssetsSummaryByGroup = Joi.object({
  filters: Joi.object().default({}).optional(),
  primaryGroup: Joi.string().trim().valid("company", "location", "category", "subCategory", "status").default("category").optional(),
  secondaryGroup: Joi.string().trim().valid("company", "location", "category", "subCategory", "status").default("subCategory").optional(),
});

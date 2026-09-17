const Joi = require("joi");
const { objectId } = require("../../config");

const warrantySchema = Joi.object({
  isWarrantied: Joi.boolean().default(false),
  startDate: Joi.date().when("isWarrantied", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  endDate: Joi.date().when("isWarrantied", {
    is: true,
    then: Joi.date().greater(Joi.ref("startDate")).required(),
    otherwise: Joi.optional(),
  }),
  provider: objectId,
});

const lifecycleSchema = Joi.object({
  acquiredAt: Joi.date().required(),
  activatedAt: Joi.date().greater(Joi.ref("acquiredAt")),
  retiredAt: Joi.date().greater(Joi.ref("activatedAt")),
  disposedAt: Joi.date().greater(Joi.ref("retiredAt")),
  disposalReason: Joi.when("disposedAt", {
    is: Joi.exist(),
    then: objectId.required(),
    otherwise: objectId.optional(),
  }),
  disposalAmount: Joi.number().min(0),
});

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
  serialNumber: Joi.string().trim().empty(""),
  condition: objectId,
  warranty: warrantySchema,
  lifecycle: lifecycleSchema,
  createdBy: objectId,
});

exports.createAsset = exports.baseSchema
  .fork(["company", "category", "subCategory", "purchaseDate", "createdBy"], (schema) => schema.required())
  .fork("hasExpiry", (schema) => schema.default(false));

exports.updateAsset = exports.baseSchema.append({ id: objectId.required() }).fork("createdBy", (schema) => schema.strip());

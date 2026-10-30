const Joi = require("joi");
const { objectId, dateOnly } = require("../../config");

// Constants
const ENUMS = require("../../constants/ENUMS");

exports.getMaintenanceById = objectId.required();

exports.baseSchema = Joi.object({
  company: objectId,
  asset: objectId,
  type: objectId,
  priority: objectId,
  vendor: objectId,
  status: Joi.string()
    .valid(...Object.values(ENUMS.MAINTENANCE.STATUSES))
    .default(ENUMS.MAINTENANCE.STATUSES.INITIATED),
  startDate: dateOnly(),
  endDate: dateOnly().greater(Joi.ref("startDate")),
  cost: Joi.number().min(0),
  checklist: Joi.array().items(
    Joi.object({
      item: objectId.required(),
      condition: objectId,
    }),
  ),
  notes: Joi.string().trim().lowercase(),
  createdBy: objectId,
});

exports.createMaintenance = exports.baseSchema.fork(["asset", "type"], (schema) => schema.required());

exports.updateMaintenance = exports.baseSchema
  .append({
    id: objectId.required(),
    removedBeforeImages: Joi.array().items(objectId).unique(),
    removedAfterImages: Joi.array().items(objectId).unique(),
  })
  .fork("createdBy", (schema) => schema.strip());

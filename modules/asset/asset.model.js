const mongoose = require("mongoose");

// Constants
const MODELS = require("../../constants/MODELS");
const ENUMS = require("../../constants/ENUMS");

const warrantySchema = {
  hasWarranty: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    required: [
      function () {
        return this.hasWarranty;
      },
      "Start date is required",
    ],
  },
  endDate: {
    type: Date,
    required: [
      function () {
        return this.hasWarranty;
      },
      "End date is required",
    ],
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PICKLIST,
  },
  _id: false,
};

const expirySchema = {
  hasExpiry: {
    type: Boolean,
    default: false,
  },
  expiryDate: {
    type: Date,
    required: [
      function () {
        return this.hasExpiry;
      },
      "Expiry date is required",
    ],
  },
  _id: false,
};

const schema = new mongoose.Schema(
  {
    tag: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PICKLIST,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PICKLIST,
      required: [true, "category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PICKLIST,
      required: [true, "sub category is required"],
    },
    status: {
      type: String,
      enum: Object.values(ENUMS.ASSET.STATUSES),
      required: [true, "status is required"],
    },
    condition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PICKLIST,
    },
    purchaseAmount: {
      type: Number,
    },
    purchaseDate: {
      type: Date,
      required: [true, "purchasing date is required"],
    },
    notes: {
      type: String,
      trim: true,
      lowercase: true,
    },
    expiry: expirySchema,
    warranty: warrantySchema,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    images: [
      {
        _id: false,
        type: mongoose.Schema.Types.ObjectId,
        ref: MODELS.ATTACHMENT,
      },
    ],
  },
  { timestamps: true },
);

schema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    const [category, subCategory] = await Promise.all([
      mongoose.model(MODELS.PICKLIST).findById(this.category, "acronym"),
      mongoose.model(MODELS.PICKLIST).findById(this.subCategory, "acronym"),
    ]);

    const baseTag = `${category.acronym}-${subCategory.acronym}`.toUpperCase();

    const lastAsset = await mongoose
      .model(MODELS.ASSET)
      .findOne({ tag: { $regex: new RegExp(`^${baseTag}-\\d+$`) } })
      .sort({ tag: -1 });

    let nextSerialNumber = 1;

    if (lastAsset?.tag) {
      const lastSerialNumber = parseInt(lastAsset.tag.split("-").pop(), 10);

      if (!isNaN(lastSerialNumber)) {
        nextSerialNumber = lastSerialNumber + 1;
      }
    }

    const paddedSerialNumber = String(nextSerialNumber).padStart(4, "0");

    this.tag = `${baseTag}-${paddedSerialNumber}`;
  } catch (error) {
    throw error;
  }
});

module.exports = mongoose.model(MODELS.ASSET, schema);

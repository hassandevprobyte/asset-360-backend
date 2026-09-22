const mongoose = require("mongoose");

// Constants
const MODELS = require("../../constants/MODELS");

const warrantySchema = {
  isWarrantied: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
    required: [
      function () {
        return this.isWarrantied;
      },
      "Start date is required",
    ],
  },
  endDate: {
    type: Date,
    required: [
      function () {
        return this.isWarrantied;
      },
      "End date is required",
    ],
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PICKLIST,
  },
};

const schema = new mongoose.Schema(
  {
    tag: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
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
    hasExpiry: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
    },
    description: {
      type: String,
      lowercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // TODO: New Fields
    serialNumber: {
      type: String,
      trim: true,
      index: true,
    },
    condition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PICKLIST,
    },
    warranty: warrantySchema,
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

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

const lifecycleSchema = {
  acquiredAt: {
    type: Date,
    required: [true, "Acquired date is required"],
  },
  activatedAt: {
    type: Date,
    validate: {
      validator: function (v) {
        return !v || v >= this.acquiredAt;
      },
      message: "Activated date must be after acquired date",
    },
  },
  retiredAt: {
    type: Date,
    validate: {
      validator: function (v) {
        return !v || v >= this.activatedAt;
      },
      message: "Retired date must be after activated date",
    },
  },
  disposedAt: {
    type: Date,
    validate: {
      validator: function (v) {
        return !v || v >= this.retiredAt;
      },
      message: "Disposed date must be after retired date",
    },
  },
  disposalReason: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PICKLIST,
    required: [
      function () {
        return !!this.disposedAt;
      },
      "Disposal reason is required",
    ],
  },
  disposalAmount: {
    type: Number,
    min: 0,
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
      ref: MODELS.COMPANY,
      required: [true, "company is required"],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PICKLIST,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
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
      ref: MODELS.USER,
      required: [true, "created by is required"],
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
    lifecycle: lifecycleSchema,
  },
  { timestamps: true },
);

schema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    const [company, category, subCategory] = await Promise.all([
      mongoose.model("Company").findById(this.company, "acronym"),
      mongoose.model(MODELS.PICKLIST).findById(this.category, "acronym"),
      mongoose.model(MODELS.PICKLIST).findById(this.subCategory, "acronym"),
    ]);

    const baseTag = `${company.acronym}-${category.acronym}-${subCategory.acronym}`.toUpperCase();

    const lastAsset = await mongoose
      .model("Asset")
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

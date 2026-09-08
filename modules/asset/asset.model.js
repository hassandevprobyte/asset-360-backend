const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "company is required"],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picklist",
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picklist",
      required: [true, "category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picklist",
      required: [true, "sub category is required"],
    },
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Picklist",
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
      ref: "User",
      required: [true, "createdBy is required"],
    },
  },
  { timestamps: true },
);

AssetSchema.pre("save", async function () {
  if (!this.isNew) return;

  try {
    const [company, category, subCategory] = await Promise.all([
      mongoose.model("Company").findById(this.company, "acronym"),
      mongoose.model("Picklist").findById(this.category, "acronym"),
      mongoose.model("Picklist").findById(this.subCategory, "acronym"),
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

module.exports = mongoose.model("Asset", AssetSchema);

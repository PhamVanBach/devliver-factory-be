import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Food",
        "Groceries",
        "Pharmacy",
        "Electronics",
        "Clothing",
        "Other",
      ],
    },
    image: {
      type: String,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
      },
    ],
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

// Add text index for search functionality
productSchema.index({ name: "text", description: "text", tags: "text" });

// Virtual method to calculate discounted price
productSchema.virtual("discountedPrice").get(function () {
  return this.price * (1 - this.discountPercentage / 100);
});

// Method to safely expose product data
productSchema.methods.toJSON = function () {
  const productObject = this.toObject();
  productObject.id = productObject._id;
  delete productObject._id;
  delete productObject.__v;
  productObject.discountedPrice = this.discountedPrice;
  return productObject;
};

export default mongoose.model("Product", productSchema);

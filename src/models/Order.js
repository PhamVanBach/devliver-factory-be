import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
  },
});

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  apartment: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: "United States",
  },
  phone: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    status: {
      type: String,
      enum: ["Processing", "In Transit", "Delivered", "Cancelled"],
      default: "Processing",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Credit Card", "PayPal", "Cash On Delivery"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Virtual method to get order by ID
orderSchema.statics.findByOrderId = function (id) {
  return this.findById(id);
};

// Virtual method to get user orders
orderSchema.statics.findByUserId = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Method to safely expose order data
orderSchema.methods.toJSON = function () {
  const orderObject = this.toObject();
  orderObject.id = orderObject._id;
  delete orderObject._id;
  delete orderObject.__v;
  return orderObject;
};

export default mongoose.model("Order", orderSchema);

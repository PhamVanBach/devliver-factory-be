import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Calculate cart totals
cartSchema.methods.calculateTotals = async function () {
  const TAX_RATE = 0.08; // 8% tax rate
  const SHIPPING_THRESHOLD = 50; // Free shipping for orders over $50
  const BASE_SHIPPING = 5.99; // Base shipping cost

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + item.discountedPrice * item.quantity;
  }, 0);

  // Round to 2 decimal places
  this.subtotal = parseFloat(this.subtotal.toFixed(2));

  // Calculate shipping (free if subtotal is over threshold)
  this.shippingCost = this.subtotal > SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING;

  // Calculate tax
  this.tax = parseFloat((this.subtotal * TAX_RATE).toFixed(2));

  // Calculate total
  this.total = parseFloat(
    (
      this.subtotal +
      this.tax +
      this.shippingCost -
      this.couponDiscount
    ).toFixed(2)
  );

  return this;
};

// Add an item to cart
cartSchema.methods.addItem = async function (productData, quantity = 1) {
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    (item) => item.product.toString() === productData._id.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productData._id,
      name: productData.name,
      price: productData.price,
      discountedPrice: productData.discountedPrice || productData.price,
      quantity: quantity,
      image: productData.image,
    });
  }

  // Recalculate totals
  return this.calculateTotals();
};

// Update item quantity
cartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  const itemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    // Remove item if quantity is zero or negative
    this.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    this.items[itemIndex].quantity = quantity;
  }

  // Recalculate totals
  return this.calculateTotals();
};

// Remove an item from cart
cartSchema.methods.removeItem = async function (productId) {
  const itemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new Error("Item not found in cart");
  }

  // Remove item
  this.items.splice(itemIndex, 1);

  // Recalculate totals
  return this.calculateTotals();
};

// Clear cart
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.subtotal = 0;
  this.tax = 0;
  this.shippingCost = 0;
  this.total = 0;
  this.couponCode = null;
  this.couponDiscount = 0;

  return this;
};

// Find or create a cart for a user
cartSchema.statics.findOrCreateByUser = async function (userId) {
  let cart = await this.findOne({ user: userId });

  if (!cart) {
    cart = new this({
      user: userId,
      items: [],
    });
    await cart.save();
  }

  return cart;
};

export default mongoose.model("Cart", cartSchema);

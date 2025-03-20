import { Router } from "express";
import { body, validationResult } from "express-validator";
import auth from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = Router();

// Get user's cart
router.get("/", auth, async (req, res) => {
  try {
    const cart = await Cart.findOrCreateByUser(req.user.id);

    res.json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add item to cart
router.post(
  "/items",
  auth,
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId, quantity } = req.body;

      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if product is in stock
      if (
        !product.inStock ||
        (product.stockQuantity && product.stockQuantity < quantity)
      ) {
        return res
          .status(400)
          .json({
            message: "Product is out of stock or has insufficient quantity",
          });
      }

      // Get cart for the user
      const cart = await Cart.findOrCreateByUser(req.user.id);

      // Add item to cart
      await cart.addItem(product, quantity);
      await cart.save();

      res.json(cart);
    } catch (err) {
      console.error("Error adding item to cart:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update cart item quantity
router.patch(
  "/items/:productId",
  auth,
  [
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be 0 or greater"),
  ],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      // Get cart for the user
      const cart = await Cart.findOrCreateByUser(req.user.id);

      // Update item quantity (will remove if quantity is 0)
      await cart.updateItemQuantity(productId, quantity);
      await cart.save();

      res.json(cart);
    } catch (err) {
      console.error("Error updating cart item:", err);

      if (err.message === "Item not found in cart") {
        return res.status(404).json({ message: err.message });
      }

      res.status(500).json({ message: "Server error" });
    }
  }
);

// Remove item from cart
router.delete("/items/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Get cart for the user
    const cart = await Cart.findOrCreateByUser(req.user.id);

    // Remove item from cart
    await cart.removeItem(productId);
    await cart.save();

    res.json(cart);
  } catch (err) {
    console.error("Error removing item from cart:", err);

    if (err.message === "Item not found in cart") {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Apply coupon
router.post(
  "/apply-coupon",
  auth,
  [body("couponCode").notEmpty().withMessage("Coupon code is required")],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { couponCode } = req.body;

      // Get cart for the user
      const cart = await Cart.findOrCreateByUser(req.user.id);

      // In a real application, you would validate the coupon code against a database
      // Here we'll use a simple mock coupon for demonstration
      if (couponCode === "WELCOME10") {
        cart.couponCode = couponCode;
        cart.couponDiscount = parseFloat((cart.subtotal * 0.1).toFixed(2)); // 10% discount
        await cart.calculateTotals();
        await cart.save();
        return res.json(cart);
      } else if (couponCode === "FREESHIP") {
        cart.couponCode = couponCode;
        cart.couponDiscount = cart.shippingCost; // Free shipping
        await cart.calculateTotals();
        await cart.save();
        return res.json(cart);
      }

      return res.status(400).json({ message: "Invalid coupon code" });
    } catch (err) {
      console.error("Error applying coupon:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Remove coupon
router.delete("/coupon", auth, async (req, res) => {
  try {
    // Get cart for the user
    const cart = await Cart.findOrCreateByUser(req.user.id);

    // Remove coupon
    cart.couponCode = null;
    cart.couponDiscount = 0;
    await cart.calculateTotals();
    await cart.save();

    res.json(cart);
  } catch (err) {
    console.error("Error removing coupon:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear cart
router.delete("/", auth, async (req, res) => {
  try {
    // Get cart for the user
    const cart = await Cart.findOrCreateByUser(req.user.id);

    // Clear cart
    await cart.clearCart();
    await cart.save();

    res.json(cart);
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Checkout cart
router.post("/checkout", auth, async (req, res) => {
  try {
    // Get cart for the user
    const cart = await Cart.findOrCreateByUser(req.user.id);

    // Check if cart has items
    if (cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // In a real application, you would create an order from the cart
    // and handle payment processing here

    // For demonstration, we'll just return a success message
    const orderData = {
      cartId: cart._id,
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shippingCost: cart.shippingCost,
      couponDiscount: cart.couponDiscount,
      total: cart.total,
      timestamp: new Date(),
    };

    // Clear cart after successful checkout
    await cart.clearCart();
    await cart.save();

    res.status(200).json({
      message: "Checkout successful",
      order: orderData,
    });
  } catch (err) {
    console.error("Error during checkout:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

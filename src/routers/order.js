import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";

const router = Router();

// Validation middleware for creating an order
const createOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.productId").notEmpty().withMessage("Product ID is required"),
  body("items.*.name").notEmpty().withMessage("Product name is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("shippingAddress.fullName")
    .notEmpty()
    .withMessage("Full name is required"),
  body("shippingAddress.streetAddress")
    .notEmpty()
    .withMessage("Street address is required"),
  body("shippingAddress.city").notEmpty().withMessage("City is required"),
  body("shippingAddress.state").notEmpty().withMessage("State is required"),
  body("shippingAddress.zipCode")
    .notEmpty()
    .withMessage("Zip code is required"),
  body("paymentMethod")
    .isIn(["Credit Card", "PayPal", "Cash On Delivery"])
    .withMessage("Invalid payment method"),
  body("subtotal")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),
  body("shippingCost")
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
  body("tax").isFloat({ min: 0 }).withMessage("Tax must be a positive number"),
  body("total")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),
];

// Create a new order
router.post("/", auth, createOrderValidation, async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create new order
    const order = new Order({
      userId: req.user.id,
      ...req.body,
    });

    await order.save();

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all orders for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.findByUserId(req.user.id);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findByOrderId(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the order belongs to the authenticated user
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status
router.patch(
  "/:id/status",
  auth,
  [
    param("id").notEmpty().withMessage("Order ID is required"),
    body("status")
      .isIn(["Processing", "In Transit", "Delivered", "Cancelled"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only allow the user who created the order to update it
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Update status
      order.status = req.body.status;
      await order.save();

      res.json(order);
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Cancel an order
router.post(
  "/:id/cancel",
  auth,
  [param("id").notEmpty().withMessage("Order ID is required")],
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only allow the user who created the order to cancel it
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Check if order can be cancelled
      if (order.status === "Delivered") {
        return res
          .status(400)
          .json({ message: "Cannot cancel a delivered order" });
      }

      // Update status
      order.status = "Cancelled";
      await order.save();

      res.json(order);
    } catch (err) {
      console.error("Error cancelling order:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Add tracking information
router.patch(
  "/:id/tracking",
  auth,
  [
    param("id").notEmpty().withMessage("Order ID is required"),
    body("trackingNumber")
      .notEmpty()
      .withMessage("Tracking number is required"),
    body("estimatedDeliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
  ],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only allow the user who created the order to update it
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Update tracking info
      order.trackingNumber = req.body.trackingNumber;
      if (req.body.estimatedDeliveryDate) {
        order.estimatedDeliveryDate = new Date(req.body.estimatedDeliveryDate);
      }
      await order.save();

      res.json(order);
    } catch (err) {
      console.error("Error updating tracking information:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;

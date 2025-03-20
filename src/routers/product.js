import { Router } from "express";
import { body, validationResult } from "express-validator";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";

const router = Router();

// Validation middleware for creating/updating a product
const productValidation = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .isIn(["Food", "Groceries", "Pharmacy", "Electronics", "Clothing", "Other"])
    .withMessage("Invalid category"),
  body("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a positive number"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("discountPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),
];

// Get all products with optional filtering
router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      featured,
      search,
      sort,
      limit = 10,
      page = 1,
    } = req.query;

    const filter = {};

    // Apply filters if provided
    if (category) filter.category = category;
    if (inStock) filter.inStock = inStock === "true";
    if (featured) filter.featured = featured === "true";
    if (minPrice && maxPrice) {
      filter.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
    } else if (minPrice) {
      filter.price = { $gte: parseFloat(minPrice) };
    } else if (maxPrice) {
      filter.price = { $lte: parseFloat(maxPrice) };
    }

    // Apply text search if provided
    if (search) {
      filter.$text = { $search: search };
    }

    // Set up sorting
    let sortOption = { createdAt: -1 }; // Default sort by newest
    if (sort) {
      if (sort === "price-asc") sortOption = { price: 1 };
      if (sort === "price-desc") sortOption = { price: -1 };
      if (sort === "rating-desc") sortOption = { rating: -1 };
      if (sort === "newest") sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new product (requires authentication as a vendor)
router.post("/", auth, productValidation, async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create new product
    const product = new Product({
      ...req.body,
      vendor: req.user.id, // Set the authenticated user as the vendor
    });

    await product.save();

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a product (only by the vendor who created it)
router.put("/:id", auth, productValidation, async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the current user is the vendor
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized: You can only update your own products",
      });
    }

    // Update product fields
    Object.keys(req.body).forEach((key) => {
      product[key] = req.body[key];
    });

    await product.save();

    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a product (only by the vendor who created it)
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the current user is the vendor
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own products",
      });
    }

    await product.remove();

    res.json({ message: "Product removed" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get featured products
router.get("/featured/list", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(products);
  } catch (err) {
    console.error("Error fetching featured products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get products by vendor
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.params.vendorId });
    res.json(products);
  } catch (err) {
    console.error("Error fetching vendor products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

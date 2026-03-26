const Product = require("../models/Product");

const success = (res, message, data = {}, status = 200) =>
  res.status(status).json({ status: "success", message, data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ status: "error", message });

const ALLOWED_UPDATE_FIELDS = ["title", "description", "price", "stock"];
const PRODUCT_SAFE_PROJECTION = "title description price stock createdBy createdAt updatedAt";

const sortMap = {
  createdAt_desc: { createdAt: -1 },
  createdAt_asc: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id
    });

    return success(res, "Product created", { product }, 201);
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$text = { $search: search };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(PRODUCT_SAFE_PROJECTION)
        .populate("createdBy", "name email role")
        .sort(sortMap[sort] || sortMap.createdAt_desc)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments({ ...filter, isDeleted: { $ne: true } })
    ]);

    return success(res, "", {
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .select(PRODUCT_SAFE_PROJECTION)
      .populate("createdBy", "name email role")
      .lean();

    if (!product) return fail(res, "Product not found", 404);
    return success(res, "", { product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return fail(res, "Product not found", 404);

    const isOwner = product.createdBy.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") return fail(res, "Forbidden", 403);

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => ALLOWED_UPDATE_FIELDS.includes(key))
    );

    Object.assign(product, updates);
    await product.save();

    return success(res, "Product updated", { product });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return fail(res, "Product not found", 404);

    const isOwner = product.createdBy.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") return fail(res, "Forbidden", 403);

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    return success(res, "Product deleted");
  } catch (err) {
    next(err);
  }
};

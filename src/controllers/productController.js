const Product = require("../models/Product");

const success = (res, message, data = {}, status = 200) =>
  res.status(status).json({ status: "success", message, data });

const fail = (res, message, status = 400) =>
  res.status(status).json({ status: "error", message });

const ALLOWED_UPDATE_FIELDS = ["title", "description", "price", "stock"];

exports.createProduct = async (req, res, next) => {
  try {
    const { title, price, description, stock } = req.body;
    if (!title || price == null) return fail(res, "Title and price are required.", 422);

    const product = await Product.create({
      title,
      description,
      price,
      stock,
      createdBy: req.user.id,
    });

    return success(res, "Product created", { product }, 201);
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = { isDeleted: { $ne: true } };
    if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };

    const sort =
      req.query.sort === "price_asc"
        ? { price: 1 }
        : req.query.sort === "price_desc"
        ? { price: -1 }
        : { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return success(res, "", {
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    }).populate("createdBy", "name email");

    if (!product) return fail(res, "Product not found", 404);
    return success(res, "", { product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

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
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

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

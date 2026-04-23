const { db } = require("../model/firebaseAdmin");
const { generateProdId } = require("../utils/generateRandomDigits");
const { format } = require("date-fns");

const todayDate = format(new Date(), "dd/MM/yyyy HH:mm:ss a");

const addMultipleProducts = async (req, res) => {
  const { products, workerDomain, api_key } = req.body;

  if (!workerDomain) {
    return res.status(400).json({
      message:
        "Product upload failed. REASON: You are not authorized to upload product",
    });
  }
  if (!workerDomain || !Array.isArray(products)) {
    return res.status(400).json({
      message:
        "Product upload failed. REASON: empty product list. Make sure you have selected products to upload.",
    });
  }

  const gabcel_api_key = process.env.GABCEL_API_KEY;
  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  try {
    const createdProducts = [];
    const failedProducts = [];
    const validProducts = [];

    for (const prod of products) {
      const { productName, price, productImage } = prod;

      if (!productName || !price || !productImage) {
        failedProducts.push({
          sale,
          reason: "missing important product details",
        });
        continue;
      }
      validProducts.push({ ...prod });
    }

    for (const prod of validProducts) {
      const { productName, price, productImage } = prod;

      const prodId = generateProdId();
      const productRef = db.ref(`products/${prodId}`);

      await productRef
        .set({
          prodId,
          productName,
          productDesc: "",
          productImage,
          price: Number(price),
          workerDomain,
          uploadedBy: workerDomain,
          createdAt: todayDate,
        })
        .catch((err) => {
          console.log(err);
        });

      createdProducts.push({
        prodId,
        productName,
      });
    }
    return res.status(201).json({
      success: `${createdProducts.length} sales transactions completed successfully ✔️`,
      createdProducts,
      ...(failedProducts.length > 0 && { failedProducts }),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const deleteProduct = async (req, res) => {
  const { prodId, workerDomain, api_key } = req.body;

  if (!workerDomain) {
    return res.status(400).json({
      message:
        "Product upload failed. REASON: You are not authorized to upload product",
    });
  }

  const gabcel_api_key = process.env.GABCEL_API_KEY;
  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  try {
    const productRef = db.ref(`products/${prodId}`);
    const productSnap = await productRef.once("value");
    if (!productSnap.exists()) {
      return res.status(404).json({
        message: "Failed to delete product. REASON: cannot find product.",
      });
    }
    await productRef.remove();

    return res.status(201).json({
      success: `product deleted successfully ✔️`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const editProduct = async (req, res) => {
  const { prodId, productName, price, productImage, workerDomain, api_key } =
    req.body;

  if (!workerDomain) {
    return res.status(400).json({
      message:
        "Product upload failed. REASON: You are not authorized to upload product",
    });
  }

  const gabcel_api_key = process.env.GABCEL_API_KEY;
  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  try {
    const productRef = db.ref(`products/${prodId}`);
    const productSnap = await productRef.once("value");
    if (!productSnap.exists()) {
      return res.status(404).json({
        message: "Failed to edit product. REASON: cannot find product.",
      });
    }

    const productDetails = {};
    if (productName) productDetails.productName = productName;
    if (price) productDetails.price = Number(price);
    if (productImage) productDetails.productImage = productImage;
    productDetails.updatedOn = todayDate;
    productDetails.updatedBy = workerDomain;

    await productRef.update(productDetails).catch((err) => {
      console.error(err);
      return res.status(402).json({
        message: "Failed to edit product. REASON: database internal error",
      });
    });

    return res.status(201).json({
      success: `product details updated successfully ✔️`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { addMultipleProducts, deleteProduct, editProduct };

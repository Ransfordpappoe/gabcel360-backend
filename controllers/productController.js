const { db } = require("../model/firebaseAdmin");
const { generateProdId } = require("../utils/generateRandomDigits");
const { format } = require("date-fns");

const todayDate = format(new Date(), "dd/MM/yyyy HH:mm:ss");

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
module.exports = { addMultipleProducts };

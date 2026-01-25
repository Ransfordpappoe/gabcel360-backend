const { db } = require("../model/firebaseAdmin");
const { sanitizeEmail } = require("../utils/sanitizeText");
const { generateSalesId } = require("../utils/generateRandomDigits");
const { format } = require("date-fns");

const todayDate = format(new Date(), "dd/MM/yyyy HH:mm:ss");

const addNewSingleSales = async (req, res) => {
  const {
    customerId,
    productName,
    productDesc,
    productImage,
    workerDomain,
    workerName,
    adminDomain,
    price,
    qty,
    api_key,
  } = req.body;

  if (
    !customerId ||
    !productName ||
    !price ||
    !qty ||
    !productImage ||
    !workerName
  ) {
    return res.status(400).json({
      message:
        "Product Purchase registration failed. REASON: missing important product details.",
    });
  }

  const gabcel_api_key = process.env.GABCEL_API_KEY;

  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  try {
    const purifyWorkerDomain = sanitizeEmail(workerDomain).toLocaleLowerCase();
    const purifyAdminDomain = sanitizeEmail(adminDomain).toLocaleLowerCase();
    const worker_ref = db.ref(
      `worker/${purifyAdminDomain}/${purifyWorkerDomain}`,
    );
    const customersRef = db.ref(
      `customers/${purifyWorkerDomain}/${customerId}`,
    );
    const workersnapshot = await worker_ref.once("value");
    if (!workersnapshot.exists()) {
      return res.status(404).json({
        message:
          "You are not permitted to sell. REASON: user not found. cross check your login credential or contact your manager.",
      });
    }

    const customerSnapshot = await customersRef.once("value");
    if (!customerSnapshot.exists()) {
      return res.status(404).json({
        message:
          "Sales registration failed. REASON: Customer details not found",
      });
    }

    const amountOwing = price * qty;

    //update customers debt figure with new sales amount
    let newDebt = 0;
    const prevDebt = customerSnapshot.child("amountOwing").val();
    if (prevDebt && prevDebt !== "") {
      newDebt = prevDebt + amountOwing;
    } else {
      newDebt = amountOwing;
    }
    customersRef.update({ amountOwing: newDebt });

    //update worker total sales with new sales amount
    let newSales = 0;
    const prevSales = workersnapshot.child("totalSales").val();
    console.log("prevSales", prevSales);

    if (prevSales && prevSales !== "") {
      newSales = prevSales + amountOwing;
    } else {
      newSales = amountOwing;
    }
    console.log(`newSales = ${newSales}, newDebt = ${newDebt}`);
    worker_ref.update({ totalSales: newSales });

    const salesId = generateSalesId();
    const salesRef = db.ref(`sales/${customerId}/${salesId}`);

    salesRef
      .set({
        customerId,
        salesId,
        amountOwing,
        productName,
        productImage,
        productDesc,
        price,
        qty,
        workerDomain,
        createdBy: workerName,
        createdAt: todayDate,
      })
      .catch((err) => {
        customersRef.update({ amountOwing: 0 });
        worker_ref.update({ totalSales: 0 });
        console.log(err);
      });

    return res.status(201).json({
      success: `sales registration completed successfully ✔️`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const addMultipleSales = async (req, res) => {
  const { sales, workerName, workerDomain, adminDomain, customerId, api_key } =
    req.body;

  if (!sales || !customerId || !Array.isArray(sales) || sales.length === 0) {
    return res.status(400).json({
      message:
        "Product Purchase registration failed. REASON: sales array is missing or empty.",
    });
  }

  if (!workerDomain || !adminDomain || !workerName) {
    return res.status(400).json({
      message: "missing worker or admin domain credentials",
    });
  }

  const gabcel_api_key = process.env.GABCEL_API_KEY;
  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  try {
    const purifyWorkerDomain = sanitizeEmail(workerDomain).toLocaleLowerCase();
    const purifyAdminDomain = sanitizeEmail(adminDomain).toLocaleLowerCase();
    const worker_ref = db.ref(
      `worker/${purifyAdminDomain}/${purifyWorkerDomain}`,
    );

    const customersRef = db.ref(
      `customers/${purifyWorkerDomain}/${customerId}`,
    );

    const workersnapshot = await worker_ref.once("value");
    if (!workersnapshot.exists()) {
      return res.status(404).json({
        message:
          "You are not permitted to sell. REASON: user not found. cross check your login credential or contact your manager.",
      });
    }

    const customerSnapshot = await customersRef.once("value");
    if (!customerSnapshot.exists()) {
      return res.status(404).json({
        message:
          "Sales registration failed. REASON: Customer details not found",
      });
    }

    const createdSales = [];
    const failedSales = [];

    // Calculate total amounts to add before updating database
    let totalDebtToAdd = 0;
    const validSales = [];

    for (const sale of sales) {
      const { productName, productDesc, price, qty, productImage } = sale;

      if (!productName || !price || !qty || !productImage) {
        failedSales.push({
          sale,
          reason: "missing important product details",
        });
        continue;
      }

      const amountOwing = price * qty;
      totalDebtToAdd += amountOwing;
      validSales.push({ ...sale, amountOwing });
    }

    // Update customer debt and worker sales only once with accumulated totals
    const prevDebt = customerSnapshot.child("amountOwing").val() || 0;
    const newDebt = prevDebt + totalDebtToAdd;
    customersRef.update({ amountOwing: newDebt });

    const prevSales = workersnapshot.child("totalSales").val() || 0;
    const newTotalSales = prevSales + totalDebtToAdd;
    worker_ref.update({ totalSales: newTotalSales });

    // Now create individual sales records
    for (const sale of validSales) {
      const {
        productName,
        productDesc,
        price,
        qty,
        productImage,
        amountOwing,
      } = sale;

      const salesId = generateSalesId();
      const salesRef = db.ref(`sales/${customerId}/${salesId}`);

      await salesRef
        .set({
          customerId,
          salesId,
          amountOwing,
          productName,
          productDesc,
          productImage,
          price,
          qty,
          workerDomain,
          createdBy: workerName,
          createdAt: todayDate,
        })
        .catch((err) => {
          customersRef.update({ amountOwing: prevDebt });
          worker_ref.update({ totalSales: prevSales });
          console.log(err);
        });

      createdSales.push({
        customerId,
        salesId,
        productName,
      });
    }

    return res.status(201).json({
      success: `${createdSales.length} sales registered successfully ✔️`,
      createdSales,
      ...(failedSales.length > 0 && { failedSales }),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = { addNewSingleSales, addMultipleSales };

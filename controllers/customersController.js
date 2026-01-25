const { db } = require("../model/firebaseAdmin");
const { sanitizeEmail } = require("../utils/sanitizeText");
const { generateCustomerId } = require("../utils/generateRandomDigits");

const addNewCustomer = async (req, res) => {
  const {
    customerName,
    contact,
    whatsapp,
    email,
    location,
    gender,
    workerDomain,
    adminDomain,
    api_key,
  } = req.body;

  if (!customerName || !contact || !location || !gender) {
    return res
      .status(400)
      .json({ message: "All required field must be filled." });
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
    const snapshot = await worker_ref.once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({
        message:
          "You are not permitted to add new customers. REASON: user not found. cross check your login credential or contact your manager.",
      });
    }

    const customerId = generateCustomerId();
    const customersRef = db.ref(
      `customers/${purifyWorkerDomain}/${customerId}`,
    );

    const workerCustomersRef = db.ref(`customers/${purifyWorkerDomain}`);
    const workerCustomersSnapshot = await workerCustomersRef.once("value");
    if (workerCustomersSnapshot.exists()) {
      workerCustomersSnapshot.forEach((customerSnapshot) => {
        const nameSnaphot = customerSnapshot.child("customerName");
        if (
          nameSnaphot.val().trim().toLocaleLowerCase() ===
          customerName.trim().toLocaleLowerCase()
        ) {
          return res
            .status(409)
            .json({ message: "Customer details already exist" });
        }
      });
    }

    customersRef.set({
      customerName: customerName.trim(),
      customerId,
      contact,
      whatsapp,
      email,
      gender,
      location,
      amountOwing: 0,
      workerDomain,
    });
    return res.status(201).json({
      success: `customer ${customerName.trim()} is successfully registered.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = { addNewCustomer };

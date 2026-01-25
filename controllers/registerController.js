const { db } = require("../model/firebaseAdmin");
const bcrypt = require("bcrypt");
const { sanitizeEmail, sanitizeText } = require("../utils/sanitizeText");
const { generateMangerRef } = require("../utils/generateRandomDigits");

const handleCreateAdminAccount = async (req, res) => {
  const { adminName, adminEmail, adminSecret, password, api_key } = req.body;
  if (!adminName || !adminEmail || !password) {
    return res
      .status(400)
      .json({ message: "admin Name, email and password are required" });
  }
  const gabcel_api_key = process.env.GABCEL_API_KEY;

  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  if (adminSecret !== process.env.ADMIN_CODE) {
    return res
      .status(401)
      .json({ message: "not authorized to create an admin account" });
  }

  const adminDomain =
    `${sanitizeText(adminName)}@gabcel.com`.toLocaleLowerCase();
  const managerRef = generateMangerRef();

  try {
    const purifyAdminDomain = sanitizeEmail(adminDomain);
    const user_ref = db.ref(`admin/${purifyAdminDomain}`);
    const snapshot = await user_ref.once("value");
    if (snapshot.exists()) {
      return res.status(409).json({ message: "admin details already exist" }); // user exist;
    }
    const encryptedPwd = await bcrypt.hash(password, 10);

    await user_ref.set({
      adminName,
      adminEmail,
      adminDomain,
      managerRef,
      password: encryptedPwd,
    });
    addAdminToWorkerList(
      purifyAdminDomain,
      purifyAdminDomain,
      adminName,
      adminDomain,
      adminDomain,
      managerRef,
      password,
      res,
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addAdminToWorkerList = async (
  purifyAdminDomain,
  purifyWorkerDomain,
  workerName,
  workerDomain,
  adminDomain,
  managerRef,
  password,
  res,
) => {
  const user_ref = db.ref(`worker/${purifyAdminDomain}/${purifyWorkerDomain}`);
  const snapshot = await user_ref.once("value");
  if (snapshot.exists()) {
    return res.status(409).json({ message: "worker details already exist" }); // user exist;
  }
  const encryptedPwd = await bcrypt.hash(password, 10);

  await user_ref.set({
    workerName,
    workerDomain,
    adminDomain,
    branch: "manager",
    isAdmin: true,
    managerRef,
    password: encryptedPwd,
  });
  return res.status(201).json({
    success: `Account for ${workerName} is created`,
    workerDomain,
    managerRef,
  });
};

const handleCreateWorkerAccount = async (req, res) => {
  const { workerName, password, adminDomain, branch, api_key } = req.body;
  if (!workerName || !adminDomain || !password) {
    return res
      .status(400)
      .json({ message: "worker Name and password are required" });
  }
  const gabcel_api_key = process.env.GABCEL_API_KEY;

  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized domain" });
  }

  const workerDomain =
    `${sanitizeText(workerName)}@gabcel.com`.toLocaleLowerCase();
  const adminDomainLowerCase = adminDomain.toLocaleLowerCase();

  try {
    const purifyAdminDomain = sanitizeEmail(adminDomainLowerCase);
    const purifyWorkerDomain = sanitizeEmail(workerDomain);
    const adminRef = db.ref(`admin/${purifyAdminDomain}`);
    const adminSnapshot = await adminRef.once("value");
    if (adminSnapshot.exists()) {
      const { managerRef } = adminSnapshot.val();
      if (managerRef && managerRef !== "") {
        const worker_ref = db.ref(
          `worker/${purifyAdminDomain}/${purifyWorkerDomain}`,
        );
        const snapshot = await worker_ref.once("value");
        if (snapshot.exists()) {
          return res
            .status(409)
            .json({ message: "worker details already exist" }); // user exist;
        }
        const encryptedPwd = await bcrypt.hash(password, 10);

        await worker_ref.set({
          workerName,
          workerDomain,
          totalSales: 0,
          adminDomain: adminDomainLowerCase,
          branch,
          isAdmin: false,
          managerRef,
          password: encryptedPwd,
        });
        return res.status(201).json({
          success: `Account for ${workerName} is created`,
          workerDomain,
        });
      }
      return res.status(502).json({
        message: `You are not authorized to create a worker account. REASON: Invalid manager reference.`,
      });
    }
    return res.status(503).json({
      message: `You are not authorized to create a worker account. REASON: Cannot find admin details.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { handleCreateAdminAccount, handleCreateWorkerAccount };

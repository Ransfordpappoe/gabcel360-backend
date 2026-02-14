const { db } = require("../model/firebaseAdmin");
const bcrypt = require("bcrypt");
const { sanitizeEmail, sanitizeText } = require("../utils/sanitizeText");
const { generateMangerRef } = require("../utils/generateRandomDigits");

const handleCreateAdminAccount = async (req, res) => {
  const { adminName, adminEmail, adminSecret, password, contact, api_key } =
    req.body;
  if (!adminName || !adminEmail || !password || !contact) {
    return res.status(400).json({ message: "all fields are required" });
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
      contact,
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
      contact,
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
  contact,
  adminEmail,
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
    contact,
    adminEmail,
    password: encryptedPwd,
  });
  return res.status(201).json({
    success: `Admin Account for ${workerName} is created.\n\nworker domain: ${workerDomain} \nadmin domain: ${adminDomain} \nname: ${workerName} \ncontact: ${contact} \nbranches: all \nmanager reference: ${managerRef} \nencrypted password: ${encryptedPwd} \n\nAs an admin your worker domain is the same as your admin domain. Your password is encrypted and no one can retrieve it not even the creators of the gabcel platform. Make sure you write it down in a safe place for future memory. If you ever forget your password, you can use your manager ref to sign in.`,
    contact,
  });
};

const handleCreateWorkerAccount = async (req, res) => {
  const {
    workerName,
    password,
    adminDomain,
    adminEmail,
    managerRef,
    branch,
    contact,
    api_key,
  } = req.body;
  if (!workerName || !password || !contact) {
    return res
      .status(400)
      .json({ message: "worker Name, password, and contact are required" });
  }
  if (!adminDomain || !managerRef || !adminEmail) {
    return res.status(400).json({
      message:
        "Failed to create worker account. REASON: Insufficient admin credentials",
    });
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
          contact,
          workerDomain,
          totalSales: 0,
          adminDomain: adminDomainLowerCase,
          branch,
          isAdmin: false,
          adminEmail,
          blocked: false,
          password: encryptedPwd,
        });
        return res.status(201).json({
          success: `worker Account for ${workerName} is created.\n\nworker domain: ${workerDomain} \nadmin domain: ${adminDomain} \nname: ${workerName} \ncontact: ${contact} \nbranch: ${branch} \nencrypted password: ${encryptedPwd} \npublic password: ${password} \n\nYour worker password is public to you and the worker you share the info with. No one else can retrieve it not even the creators of the gabcel platform. Make sure you share your worker pasword with your worker.`,
          contact,
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

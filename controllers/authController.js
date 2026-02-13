const { db } = require("../model/firebaseAdmin");
const bcrypt = require("bcrypt");
const { sanitizeEmail } = require("../utils/sanitizeText");

const handleAdminLogin = async (req, res) => {
  const { adminDomain, password } = req.body;
  if (!adminDomain || !password) {
    return res.status(400).json({ message: "missing login credentials" });
  }

  try {
    const purifyDomain = sanitizeEmail(adminDomain).toLocaleLowerCase();
    const user_ref = db.ref(`admin/${purifyDomain}`);
    const snapshot = await user_ref.once("value");
    if (!snapshot.exists()) {
      return res
        .status(404)
        .json({ message: "user not found. cross check your login credential" });
    }

    const userData = snapshot.val();
    const verifiedPwd = await bcrypt.compare(password, userData?.password);
    if (verifiedPwd) {
      return res.status(201).json({
        success: "Login successful ✔️ !!",
        adminName: userData.adminName,
        adminEmail: userData.adminEmail,
        adminDomain: userData.adminDomain,
      });
    }
    return res.status(401).json({ message: "invalid login credential" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const handleWorkerLogin = async (req, res) => {
  const { workerDomain, adminDomain, password } = req.body;
  if (!workerDomain || !adminDomain || !password) {
    return res.status(400).json({ message: "missing login credentials" });
  }

  try {
    const purifyWorkerDomain = sanitizeEmail(workerDomain).toLocaleLowerCase();
    const purifyAdminDomain = sanitizeEmail(adminDomain).toLocaleLowerCase();
    const user_ref = db.ref(
      `worker/${purifyAdminDomain}/${purifyWorkerDomain}`,
    );
    const snapshot = await user_ref.once("value");
    if (!snapshot.exists()) {
      return res
        .status(404)
        .json({ message: "user not found. cross check your login credential" });
    }

    const userData = snapshot.val();
    const verifiedPwd = await bcrypt.compare(password, userData?.password);
    if (verifiedPwd) {
      return res.status(201).json({
        success: "Login successful ✔️ !!",
        workerName: userData.workerName,
        branch: userData.branch,
        isAdmin: userData.isAdmin,
        adminDomain: userData.adminDomain,
        workerDomain: userData.workerDomain,
        contact: userData.contact || 0,
      });
    }
    return res.status(401).json({ message: "invalid login credential" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = { handleAdminLogin, handleWorkerLogin };

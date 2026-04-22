const { db } = require("../model/firebaseAdmin");
const bcrypt = require("bcrypt");
const { sanitizeEmail } = require("../utils/sanitizeText");
const nodemailer = require("nodemailer");

const generateOtpCode = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

const handleAdminLogin = async (req, res) => {
  const { email, adminDomain, managerRef } = req.body;
  if (!adminDomain || !managerRef) {
    return res.status(400).json({ message: "missing login credentials" });
  }

  try {
    const purifyDomain = sanitizeEmail(adminDomain).toLocaleLowerCase();
    const purifyWorkerDomain = purifyDomain; //worker domain is the same as adminDomain for managers
    const user_ref = db.ref(`worker/${purifyDomain}/${purifyWorkerDomain}`);
    const snapshot = await user_ref.once("value");
    if (!snapshot.exists()) {
      return res
        .status(404)
        .json({ message: "user not found. cross check your login credential" });
    }

    const userData = snapshot.val();
    const verifiedPwd = managerRef === userData?.managerRef;
    if (verifiedPwd) {
      try {
        if (!email) {
          return res.status(409).json({ message: "invalid mail address" });
        }

        const otp = generateOtpCode();

        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.DELIVERY_EMAIL,
            pass: process.env.APPPWD,
          },
          ssl: {
            rejectUnauthorized: false,
          },
        });

        const htmlTemplate = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>OTP REQUEST</title>
                      <style>
                          .email-container {
                              max-width: 600px;
                              margin: 0 auto;
                              font-family: Arial, sans-serif;
                              line-height: 1.6;
                              color: #333333;
                          }
                          .header {
                              background-color: #f8f9fa;
                              padding: 20px;
                              text-align: center;
                          }
                          .content {
                              padding: 20px;
                          }
                          .message-docs {
                              max-width: 100%;
                              height: auto;
                              margin: 20px 0;
                          }
                          .footer {
                              background-color: #f8f9fa;
                              padding: 20px;
                              text-align: center;
                              font-size: 12px;
                          }
                          .cta-button {
                              display: inline-block;
                              padding: 10px 20px;
                              background-color: #808080;
                              color: #ffffff;
                              text-decoration: none;
                              border-radius: 999px;
                              margin: 20px 0;
                              text-decoration: none;
                          }
                      </style>
                  </head>
                  <body>
                      <div class="email-container">
                          <div class="header">
                          <h1>Verification code</h1>
                          </div>
                          <div class="content">
                              <p>To authenticate your access to the Gabcel App, enter the OTP code below.</p> <br/>
                              <p>One-Time-Password - (${otp})</p> <br/>
                              <p>Ignore this message if you have not issued any request to Login or reset your password. Report any suspicious activity to the admin of Gabcel enterprise.</p>
                          </div>
                          <div class="footer">
                              <p>© ${new Date().getFullYear()} Gabcel. All rights reserved.</p>
                          </div>
                      </div>
                  </body>
                  </html>  
              `;

        try {
          transporter.sendMail({
            from: {
              name: "Gabcel",
              address: process.env.DELIVERY_EMAIL,
            },
            to: email,
            subject: `Verification code`,
            html: htmlTemplate,
          });
        } catch (error) {
          return res
            .status(500)
            .json({ error: `Email notification failed: ${error}` });
        }

        return res.status(201).json({
          success: "Login successful ✔️ !!",
          adminEmail: userData.adminEmail,
          workerName: userData.workerName,
          branch: userData.branch,
          isAdmin: userData.isAdmin,
          adminDomain: userData.adminDomain,
          workerDomain: userData.workerDomain,
          contact: userData.contact || "0",
          otp_code: otp,
        });
      } catch (error) {
        return res
          .status(500)
          .json({ error: `Message delivery failed: ${error.message}` });
      }
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
        adminEmail: userData.adminEmail,
        workerName: userData.workerName,
        branch: userData.branch,
        isAdmin: userData.isAdmin,
        adminDomain: userData.adminDomain,
        workerDomain: userData.workerDomain,
        contact: userData.contact || "0",
      });
    }
    return res.status(401).json({ message: "invalid login credential" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOTPnotification = async (req, res) => {
  const { email, api_key } = req.body;

  const gabcel_api_key = process.env.GABCEL_API_KEY;

  if (api_key !== gabcel_api_key) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const otp = generateOtpCode();

  try {
    if (!email) {
      return res.status(409).json({ message: "invalid mail details" });
    }

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.DELIVERY_EMAIL,
        pass: process.env.APPPWD,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OTP REQUEST</title>
                <style>
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }
                    .header {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                    }
                    .content {
                        padding: 20px;
                    }
                    .message-docs {
                        max-width: 100%;
                        height: auto;
                        margin: 20px 0;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                    }
                    .cta-button {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #808080;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 999px;
                        margin: 20px 0;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                    <h1>Verification code</h1>
                    </div>
                    <div class="content">
                        <p>To authenticate your access to the Gabcel App, enter the OTP code below.</p> <br/>
                        <p>One-Time-Password - (${otp})</p> <br/>
                        <p>Ignore this message if you have not issued any request to Login or reset your password. Report any suspicious activity to the admin of Gabcel enterprise.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Gabcel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>  
        `;

    try {
      transporter.sendMail({
        from: {
          name: "Gabcel",
          address: process.env.DELIVERY_EMAIL,
        },
        to: email,
        subject: `Verification code`,
        html: htmlTemplate,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: `Email notification failed: ${error}` });
    }

    return res.status(201).json({ otp_code: otp });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Message delivery failed: ${error.message}` });
  }
};
module.exports = { handleAdminLogin, handleWorkerLogin, getOTPnotification };

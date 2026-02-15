const { db } = require("../model/firebaseAdmin");
const { generateSalesId } = require("../utils/generateRandomDigits");
const { sanitizeEmail } = require("../utils/sanitizeText");
const { format } = require("date-fns");

const todayDate = format(new Date(), "dd/MM/yyyy HH:mm:ss");

const addPayment = async (req, res) => {
  const {
    customerId,
    salesId,
    amountOwing,
    amountPaid,
    workerName,
    workerDomain,
    adminDomain,
    api_key,
  } = req.body;

  if (
    !customerId ||
    !salesId ||
    !workerDomain ||
    !adminDomain ||
    !amountOwing ||
    !amountPaid ||
    !workerName
  ) {
    return res
      .status(400)
      .json({ message: "important payment information is missing" });
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
          "You are not permitted to record customer payments for this product. REASON: user not found. cross check your login credential or contact your manager.",
      });
    }

    const customerSnapshot = await customersRef.once("value");
    if (!customerSnapshot.exists()) {
      return res.status(404).json({
        message:
          "You are not permitted to record customer payments for this product. REASON: Customer details not found. Contact your manager to verify the customer details",
      });
    }
    const pmtHistoryId = `pmt${generateSalesId()}`;
    const paymentRef = db.ref(`payment/${customerId}/${salesId}`);
    const paymentHistoryRef = db.ref(
      `paymentHistory/${customerId}/${pmtHistoryId}`,
    );
    const pmtSnapshot = await paymentRef.once("value");

    let successMessage = "";
    let newAccTotal = 0;

    const prevAmountPaid = pmtSnapshot.child("accTotal").val() || 0;
    newAccTotal = prevAmountPaid + amountPaid;

    if (pmtSnapshot.exists()) {
      if (amountOwing < newAccTotal) {
        return res.status(409).json({
          message:
            "Failed to update payment. REASON: Customer has already made full Payment",
        });
      }
      paymentRef.update({
        accTotal: newAccTotal,
        lastPmtDate: todayDate,
        amountPaid,
      });

      successMessage =
        "successfully updated customer's payment. check payment history";
    } else {
      paymentRef.set({
        paymentId: salesId,
        accTotal: amountPaid,
        amountPaid,
        lastPmtDate: todayDate,
      });
      successMessage = "customer payment is successful.";
    }

    paymentHistoryRef.set({
      pmtHistoryId,
      amountPaid,
      paymentDate: todayDate,
      receivedBy: workerName,
    });

    //TODO: REDUCE THE SALES FIGURE EITHER ON THE BACKEND OR THE FRONTEND

    const salesRef = db.ref(`sales/${customerId}/${salesId}`);
    const salesSnapshot = await salesRef.once("value");
    if (salesSnapshot.exists()) {
      if (amountOwing >= newAccTotal) {
        salesRef.update({ totalPaid: newAccTotal });
      }
    }

    //update customers debt figure with accumulated payment
    let newDebt = 0;
    const prevDebt = customerSnapshot.child("amountOwing").val() || 0;
    if (prevDebt > newAccTotal) {
      newDebt = prevDebt - newAccTotal;
    }
    customersRef.update({ amountOwing: newDebt });

    //update worker total cash inflows with new amount
    let newCashInflow = 0;
    const prevCash = workersnapshot.child("cashinflow").val() || 0;
    const totalSales = workersnapshot.child("totalSales").val() || 0;

    if (prevCash < totalSales) {
      newCashInflow = prevCash + newAccTotal;
    }
    console.log(`Cash inflow = ${newCashInflow}, newDebt = ${newDebt}`);
    worker_ref.update({ cashinflow: newCashInflow });

    return res.status(201).json({
      success: successMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
module.exports = { addPayment };

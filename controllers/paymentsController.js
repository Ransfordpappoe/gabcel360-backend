const { db } = require("../model/firebaseAdmin");
const { generateSalesId } = require("../utils/generateRandomDigits");
const { sanitizeEmail } = require("../utils/sanitizeText");
const { format } = require("date-fns");

const todayDate = format(new Date(), "dd/MM/yyyy HH:mm a");

const addPayment = async (req, res) => {
  const {
    customerId,
    salesId,
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

    const salesRef = db.ref(`sales/${customerId}/${salesId}`);
    const salesSnapshot = await salesRef.once("value");

    if (!salesSnapshot.exists()) {
      return res.status(404).json({
        message:
          "You are not permitted to record customer payments for this product. REASON: Item Not Found",
      });
    }
    const itemAmount = salesSnapshot.child("amountOwing").val();
    const prevTotalPaid = salesSnapshot.child("totalPaid").val() || 0;
    const itemName = salesSnapshot.child("productName").val() || "";

    if (itemAmount <= prevTotalPaid) {
      return res.status(401).json({
        message: `Customer payment rejected. REASON: payment is fully done for the ${itemName} purchased and the account is closed`,
      });
    }

    const remainingAmount = itemAmount - prevTotalPaid;

    if (remainingAmount < amountPaid) {
      const surplus = amountPaid - remainingAmount;
      return res.status(401).json({
        message: `Customer payment rejected. REASON: The customer is about to do over payment for the ${itemName} purchased.\n\n---Variance Analysis---\n--------------\nRemaining amount: ${remainingAmount}\nAmount paying now: ${amountPaid}\nOver Payment: ${surplus}`,
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
      salesId,
      paymentDate: todayDate,
      receivedBy: workerName,
    });

    //Update THE SALES item total paid FIGURE EITHER ON THE BACKEND OR THE FRONTEND

    const newTotalPaid = prevTotalPaid + amountPaid;

    salesRef.update({ totalPaid: newTotalPaid }); //Done on the backend for quick reference

    //update customers debt figure with accumulated payment
    let newDebt = 0;
    const prevDebt = customerSnapshot.child("amountOwing").val() || 0;
    if (prevDebt > amountPaid) {
      newDebt = prevDebt - amountPaid;
    }
    customersRef.update({ amountOwing: newDebt });

    //update worker total cash inflows with new amount
    let newCashInflow = 0;
    const prevCash = workersnapshot.child("cashinflow").val() || 0;
    const totalSales = workersnapshot.child("totalSales").val() || 0;

    if (prevCash < totalSales) {
      newCashInflow = prevCash + amountPaid;
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

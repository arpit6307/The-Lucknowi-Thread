const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

// Hardcoded keys for final testing
const KEY_ID = "rzp_live_RSrIGHxZNIsPrl";
const KEY_SECRET = "mktXBujlWGmm3pwdi8FASz9M";

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  
  // --- FINAL FIX: YAHAN GALTI THEEK KI GAYI HAI ---
  // Data ek extra 'data' object ke andar aa raha hai, isliye hum data.data.amount ka istemal karenge
  const amount = data.data ? data.data.amount : data.amount;

  console.log("Final extracted amount:", amount);
  
  if (!amount) {
    console.error("Error: 'amount' is still missing. Full received data:", JSON.stringify(data));
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid "amount" argument.');
  }

  const options = {
    amount: amount,
    currency: "INR",
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const response = await razorpay.orders.create(options);
    console.log("Razorpay order created successfully:", response.id);
    return { id: response.id, currency: response.currency, amount: response.amount };
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new functions.https.HttpsError('internal', 'Failed to create Razorpay order.');
  }
});

exports.verifyRazorpaySignature = functions.https.onCall(async (data, context) => {
  const crypto = require("crypto");
  
  // Data 'data' object ke andar aa sakta hai
  const payload = data.data ? data.data : data;
  const { order_id, payment_id, signature } = payload;
  
  const text = `${order_id}|${payment_id}`;
  
  const hmac = crypto.createHmac('sha256', KEY_SECRET); // Using hardcoded secret
  hmac.update(text);
  const calculatedSignature = hmac.digest('hex');

  if (calculatedSignature === signature) {
    return { status: 'success', message: 'Payment signature verified.' };
  } else {
    throw new functions.https.HttpsError('unauthenticated', 'Payment verification failed.');
  }
});
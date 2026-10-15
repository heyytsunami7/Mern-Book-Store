const CATEGORIES = Object.freeze([
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Fantasy",
  "Horror",
  "Humor",
  "Biography",
  "Psychology",
  "History",
  "Business",
]);

const ORDER_STATUSES = Object.freeze([
  "pending_payment",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]);

const MAX_QTY_PER_LINE = 10;
const SHIPPING_FLAT_PAISE = 4900; // ₹49
const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999
const ORDER_EXPIRY_MINUTES = 15;

module.exports = {
  CATEGORIES,
  ORDER_STATUSES,
  MAX_QTY_PER_LINE,
  SHIPPING_FLAT_PAISE,
  FREE_SHIPPING_THRESHOLD_PAISE,
  ORDER_EXPIRY_MINUTES,
};
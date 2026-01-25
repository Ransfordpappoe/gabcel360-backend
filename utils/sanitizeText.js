const sanitizeEmail = (emailText = "") => {
  return emailText.replace(/[^a-zA-Z0-9]/g, "");
};
const sanitizeText = (word = "") => {
  return word.replace(/[^a-zA-Z0-9]/g, "");
};
module.exports = { sanitizeEmail, sanitizeText };

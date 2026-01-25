const { format } = require("date-fns");

const generateMangerRef = (alphaRounds = 5) => {
  //   const timeConstraint = format(new Date(), "ss");
  const randNumber = Math.floor(Math.random() * 100000);
  const alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let appendRandLetters = "";
  for (let i = 0; i < alphaRounds; i++) {
    const randLetter = alphabets.charAt(Math.random() * alphabets.length);
    appendRandLetters += randLetter;
  }
  const randId = `${randNumber}${appendRandLetters}`;
  return randId;
};

const generateCustomerId = () => {
  const timeConstraint = format(new Date(), "ddMMyyss");
  const randNumber = Math.floor(Math.random() * 100000);
  return `${randNumber}${timeConstraint}`;
};

const generateSalesId = () => {
  const timeConstraint = format(new Date(), "dMMyyss");
  const randNumber = Math.floor(Math.random() * 100000);
  const alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let appendRandLetters = "";
  for (let i = 0; i < 5; i++) {
    const randLetter = alphabets.charAt(Math.random() * alphabets.length);
    appendRandLetters += randLetter;
  }
  return `${timeConstraint}${appendRandLetters}${randNumber}`;
};
module.exports = { generateMangerRef, generateCustomerId, generateSalesId };

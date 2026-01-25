const whitelist = [
  process.env.SITE_URI,
  "http://localhost:5173",
  "https://gabcel.web.app",
  "https://gabcel.com",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Access blocked by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};
module.exports = corsOptions;

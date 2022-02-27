import dotenv from "dotenv";
dotenv.config();

// Environment variables in one object
const env = {
  googleAuth: process.env.GOOGLE_AUTH!,
  sheetsID: process.env.SHEETS_ID!,
  mlServer: process.env.ML_SERVER!,
};
export default env;

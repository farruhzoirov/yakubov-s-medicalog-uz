import { registerAs } from "@nestjs/config";

export default registerAs('SHEET', () => ({
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
}));
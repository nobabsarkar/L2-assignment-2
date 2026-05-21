import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
};

export default config;

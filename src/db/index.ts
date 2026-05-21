import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connection_string,
});

export const intoDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(20) UNIQUE NOT NULL,
        password Text NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);

    await pool.query(`

          CREATE TABLE IF NOT EXISTS issues(
          id SERIAL PRIMARY KEY,
          title VARCHAR(150),
          description VARCHAR(20),
          type VARCHAR(20) CHECK(type IN('bug', 'feature_request')),
          status VARCHAR(20) DEFAULT 'open' CHECK(status IN('open', 'in_progress','resolved')),
          reporter_id INT NOT NULL,

          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
          )
          `);

    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

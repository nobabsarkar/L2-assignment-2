import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type, reporter_id)
             VALUES($1, $2, $3, $4)
             RETURNING *
            `,
    [title, description, type, reporter_id],
  );

  return result;
};

const getAllIssueFromDB = async () => {
  const result = await pool.query(`
    
    SELECT * FROM issues
    `);

  return result;
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  return result;
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
  DELETE FROM issues WHERE id=$1
  `,
    [id],
  );
  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssueFromDB,
  getSingleIssueFromDB,
  deleteIssueFromDB,
};

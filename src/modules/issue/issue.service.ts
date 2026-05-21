import { pool } from "../../db";
import type { IUser } from "../../types";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type } = payload;

  //   const user = await pool.query(
  //     `
  //         SELECT * FROM users WHERE id=$1
  //         `,
  //     [reporter_id],
  //   );

  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type)
             VALUES($1, $2, $3)
             RETURNING *
            `,
    [title, description, type],
  );

  return result;
};

export const issueService = {
  createIssueIntoDB,
};

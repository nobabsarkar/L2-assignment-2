import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {
  const { title, description, type, status = "open" } = payload;

  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type,status, reporter_id)
             VALUES($1, $2, $3, $4, $5)
             RETURNING *
            `,
    [title, description, type, status, reporter_id],
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
    SELECT 
    issues.id,
    issues.title,
    issues.description,
    issues.type,
    issues.status,
    issues.created_at,
    issues.updated_at,

    users.id AS reporter_id,
    users.name AS reporter_name,
    users.role AS reporter_role
    
    FROM issues
    JOIN users
    ON issues.reporter_id = users.id
    WHERE issues.id = $1
    `,
    [id],
  );

  return result;
};

const updateIssueFromDB = async (payload: IIssue, id: string) => {
  const { title, description, type, status } = payload;

  const result = await pool.query(
    `
    UPDATE
    issues
    SET
    title=COALESCE($1, title),
    description=COALESCE($2, description),
    type=COALESCE($3, type),
    status=COALESCE($4, status)

    WHERE id=$5
    RETURNING *
    `,
    [title, description, type, status, id],
  );

  return result;
};

// const updateIssueFromDB = async (id: string, payload: IIssue, user: any) => {
//   // first get existing issue
//   const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
//     id,
//   ]);

//   const issue = issueResult.rows[0];

//   if (!issue) {
//     throw new Error("Issue not found");
//   }

//   // Maintainer can update any issue
//   if (user.role === "maintainer") {
//     const result = await pool.query(
//       `
//       UPDATE issues
//       SET
//       title = $1,
//       description = $2,
//       type = $3,
//       status = $4,
//       updated_at = NOW()
//       WHERE id = $5
//       RETURNING *
//       `,
//       [payload.title, payload.description, payload.type, payload.status, id],
//     );

//     return result.rows[0];
//   }

//   // Contributor can update only own issue
//   // and only when status is open
//   if (
//     user.role === "contributor" &&
//     issue.reporter_id === user.id &&
//     issue.status === "open"
//   ) {
//     const result = await pool.query(
//       `
//       UPDATE issues
//       SET
//       title = $1,
//       description = $2,
//       type = $3,
//       status = $4,
//       updated_at = NOW()
//       WHERE id = $5
//       RETURNING *
//       `,
//       [payload.title, payload.description, payload.type, payload.status, id],
//     );

//     return result.rows[0];
//   }

//   throw new Error("You are not authorized to update this issue");
// };

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
  updateIssueFromDB,
};

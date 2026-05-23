
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url); 
   

// src/app.ts
import express from "express";

// src/modules/user/user.route.ts
import { Router } from "express";

// src/modules/user/user.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var intoDB = async () => {
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

// src/modules/user/user.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
        INSERT INTO users(name, email, password, role)
         VALUES($1, $2, $3, COALESCE($4,'contributor')) 
         RETURNING *
        `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var userService = {
  createUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/user/user.controller.ts
import { StatusCodes } from "http-status-codes";
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User Created successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser
};

// src/modules/user/user.route.ts
var router = Router();
router.post("/signup", userController.createUser);
var userRoute = router;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("User not found!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user?.password);
  if (!matchPassword) {
    throw new Error("Password not match!");
  }
  delete user.password;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_access_secret, {
    expiresIn: "1d"
  });
  return { token, user };
};
var authService = {
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Login successfully!",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  loginUser
};

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.loginUser);
var authRoute = router2;

// src/modules/issue/issue.route.ts
import { Router as Router3 } from "express";

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload, reporter_id) => {
  const { title, description, type, status = "open" } = payload;
  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type,status, reporter_id)
             VALUES($1, $2, $3, $4, $5)
             RETURNING *
            `,
    [title, description, type, status, reporter_id]
  );
  return result;
};
var getAllIssueFromDB = async () => {
  const result = await pool.query(`
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
    `);
  return result;
};
var getSingleIssueFromDB = async (id) => {
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
    [id]
  );
  return result;
};
var updateIssueFromDB = async (payload, id, user) => {
  const { title, description, type, status } = payload;
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found!");
  }
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
    [title, description, type, status, id]
  );
  return result;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
  DELETE FROM issues WHERE id=$1
  `,
    [id]
  );
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssueFromDB,
  getSingleIssueFromDB,
  deleteIssueFromDB,
  updateIssueFromDB
};

// src/modules/issue/issue.controller.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var createIssue = async (req, res) => {
  try {
    const reporter_id = req.user?.id;
    const result = await issueService.createIssueIntoDB(req.body, reporter_id);
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue Created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes3.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssueFromDB();
    const issueData = result.rows.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: issue.reporter_id,
        name: issue.reporter_name,
        role: issue.reporter_role
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    }));
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue retrived successfully",
      data: issueData
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes3.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id);
    const issue = result.rows[0];
    const issueData = {
      i: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: {
        id: issue.reporter_id,
        name: issue.reporter_name,
        role: issue.reporter_role
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue retrived successfully",
      data: issueData
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes3.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.updateIssueFromDB(
      req.body,
      id,
      req.user
    );
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue updated successfully",
      data: result?.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes3.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.deleteIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes3.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  deleteIssue,
  updateIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.jwt_access_secret
      );
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email=$1
        `,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.route.ts
var router3 = Router3();
router3.post(
  "/issues",
  auth_default(ROLE.contributor, ROLE.maintainer),
  issueController.createIssue
);
router3.get("/issues", issueController.getAllIssues);
router3.get("/issues/:id", issueController.getSingleIssue);
router3.put(
  "/issues/:id",
  auth_default(ROLE.maintainer, ROLE.contributor),
  issueController.updateIssue
);
router3.delete(
  "/issues/:id",
  auth_default(ROLE.maintainer),
  issueController.deleteIssue
);
var issueRoute = router3;

// src/app.ts
import cors from "cors";
var app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000/"
  })
);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/auth", userRoute);
app.use("/api/auth", authRoute);
app.use("/api", issueRoute);
var app_default = app;

// src/server.ts
var main = () => {
  intoDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map
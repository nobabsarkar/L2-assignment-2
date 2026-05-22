import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { userRoute } from "./modules/user/user.route";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issue/issue.route";
import cors from "cors";

const app: Application = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000/",
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/auth", userRoute);
app.use("/api/auth", authRoute);
app.use("/api", issueRoute);

export default app;

import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post(
  "/issues",
  auth("contributor", "maintainer"),
  issueController.createIssue,
);

export const issueRoute = router;

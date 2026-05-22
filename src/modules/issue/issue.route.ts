import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post(
  "/issues",
  auth("contributor", "maintainer"),
  issueController.createIssue,
);

router.get("/issues", issueController.getAllIssues);

router.get("/issues/:id", issueController.getSingleIssue);

router.delete("/issues/:id", issueController.deleteIssue);

export const issueRoute = router;

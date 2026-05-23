import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { ROLE } from "../../types";

const router = Router();

router.post(
  "/issues",
  auth(ROLE.contributor, ROLE.maintainer),
  issueController.createIssue,
);

router.get("/issues", issueController.getAllIssues);

router.get("/issues/:id", issueController.getSingleIssue);

router.put(
  "/issues/:id",
  auth(ROLE.maintainer, ROLE.contributor),
  issueController.updateIssue,
);

router.delete(
  "/issues/:id",
  auth(ROLE.maintainer),
  issueController.deleteIssue,
);

export const issueRoute = router;

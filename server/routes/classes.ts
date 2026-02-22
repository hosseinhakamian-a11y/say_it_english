
import { Router } from "express";
import { storage } from "../storage";
import { api } from "../../shared/routes";

export const classesRouter = Router();

classesRouter.get(api.classes.list.path, async (req, res) => {
  const classes = await storage.getClasses();
  res.json(classes);
});

import { signupSchema, loginSchema } from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

export async function signup(req, res, next) {
  try {
    const data = signupSchema.parse(req.body);
    const result = await authService.signup(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

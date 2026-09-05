import { signupSchema, loginSchema, createTeamMemberSchema } from "../validators/auth.validator.js";
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

export async function listTeamMembers(req, res, next) {
  try {
    const result = await authService.listTeamMembers(req.auth.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createTeamMember(req, res, next) {
  try {
    const data = createTeamMemberSchema.parse(req.body);
    const result = await authService.createTeamMember(req.auth.companyId, data);
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

export async function otpLogin(req, res, next) {
  try {
    const { email, otp, companySlug } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }
    const result = await authService.otpLogin({ email: email.trim().toLowerCase(), otp: otp.trim(), companySlug: companySlug?.trim() });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

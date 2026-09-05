import { reportQuerySchema } from "../validators/report.validator.js";
import {
  generateJsonReport,
  streamPdfReport,
  streamXlsxReport,
} from "../services/report.service.js";

export async function getQuotationReport(req, res, next) {
  try {
    const parsed = reportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.issues });
    }

    const { format, ...filters } = parsed.data;
    const { companyId, role, sub: userId } = req.auth;

    if (format === "pdf") {
      return await streamPdfReport(companyId, role, userId, filters, res);
    }

    if (format === "xlsx") {
      return await streamXlsxReport(companyId, role, userId, filters, res);
    }

    // Default to json
    const data = await generateJsonReport(companyId, role, userId, filters);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
}

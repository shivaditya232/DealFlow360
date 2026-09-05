import {
  createQuotationSchema,
  addLineSchema,
  updateLineSchema,
  listQuotationsQuerySchema,
} from "../validators/quotation.validator.js";
import * as quotationService from "../services/quotation.service.js";

export async function create(req, res, next) {
  try {
    const data = createQuotationSchema.parse(req.body);
    const quotation = await quotationService.createQuotation({
      companyId: req.auth.companyId,
      repId: req.auth.sub,
      customerId: data.customerId,
    });
    res.status(201).json(quotation);
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { status } = listQuotationsQuerySchema.parse(req.query);
    const quotations = await quotationService.listQuotations({ companyId: req.auth.companyId, status });
    res.json(quotations);
  } catch (err) {
    next(err);
  }
}

export async function detail(req, res, next) {
  try {
    const quotation = await quotationService.getQuotationDetail({
      companyId: req.auth.companyId,
      quotationId: req.params.id,
    });
    res.json(quotation);
  } catch (err) {
    next(err);
  }
}

export async function addLine(req, res, next) {
  try {
    const data = addLineSchema.parse(req.body);
    const line = await quotationService.addLine({
      companyId: req.auth.companyId,
      quotationId: req.params.id,
      ...data,
    });
    res.status(201).json(line);
  } catch (err) {
    next(err);
  }
}

export async function updateLine(req, res, next) {
  try {
    const data = updateLineSchema.parse(req.body);
    const line = await quotationService.updateLine({
      companyId: req.auth.companyId,
      quotationId: req.params.id,
      lineId: req.params.lineId,
      ...data,
    });
    res.json(line);
  } catch (err) {
    next(err);
  }
}

export async function deleteLine(req, res, next) {
  try {
    await quotationService.deleteLine({
      companyId: req.auth.companyId,
      quotationId: req.params.id,
      lineId: req.params.lineId,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function upsellSuggestions(req, res, next) {
  try {
    const suggestions = await quotationService.getUpsellSuggestions({
      companyId: req.auth.companyId,
      quotationId: req.params.id,
    });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
}

export async function submit(req, res, next) {
  try {
    const result = await quotationService.submitQuotation({
      companyId: req.auth.companyId,
      quotationId: req.params.id,
      actingUserId: req.auth.sub,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

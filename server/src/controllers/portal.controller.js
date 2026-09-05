import { proposalSchema, repResponseSchema } from "../validators/portal.validator.js";
import * as portalService from "../services/portal.service.js";

export async function listQuotations(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    // Forward optional ?status= filter — service validates it against the allowed set
    const result = await portalService.listPortalQuotations(
      customerId,
      companyId,
      req.query.status
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getQuotation(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.getPortalQuotation(customerId, companyId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function acceptQuotation(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.acceptQuotation(customerId, companyId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createProposal(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const data = proposalSchema.parse(req.body);
    const result = await portalService.createProposal(
      customerId,
      companyId,
      req.params.id,
      data
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// Customer confirming via the dashboard Confirm button
// Identical to acceptQuotation but exposed under a /confirm path
export async function confirmQuotation(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.acceptQuotation(customerId, companyId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.getProfile(customerId, companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
export async function customerAcceptProposal(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.customerAcceptProposal(
      customerId,
      companyId,
      req.params.proposalId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Rep responding to a customer proposal (ACCEPT / REJECT / COUNTER)
export async function repRespondToProposal(req, res, next) {
  try {
    const { sub: repId, companyId } = req.auth;
    const data = repResponseSchema.parse(req.body);
    const result = await portalService.respondToProposal(
      repId,
      companyId,
      req.params.proposalId,
      data
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.getCustomerOrders(customerId, companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBilling(req, res, next) {
  try {
    const { sub: customerId, companyId } = req.auth;
    const result = await portalService.getCustomerBilling(customerId, companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

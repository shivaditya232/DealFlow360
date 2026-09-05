import {
    PrismaClient,
    UserRole,
    CustomerTier,
    QuotationStatus,
    LineType,
    ApprovalStatus,
    ReservationStatus,
    BillingCycle,
    ProrationRule,
    CancellationRefundRule,
    SubscriptionStatus,
    BillingEventType,
    PaymentMethod,
    ProposedByType,
    ProposalStatus,
    Prisma
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing existing data...');
    // Wipe dependent tables in reverse dependency order to prevent foreign key errors
    await prisma.auditLog.deleteMany();
    await prisma.negotiationProposal.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.scoreEvent.deleteMany();
    await prisma.scoreReason.deleteMany();
    await prisma.billingEvent.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    await prisma.fulfillmentSplit.deleteMany();
    await prisma.stockReservation.deleteMany();
    await prisma.stockLevel.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.upsellRule.deleteMany();
    await prisma.approvalStep.deleteMany();
    await prisma.quotationLine.deleteMany();
    await prisma.quotation.deleteMany();
    await prisma.priceListEntry.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.approvalChainRule.deleteMany();
    await prisma.categoryDiscountLimit.deleteMany();
    await prisma.discountTier.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    console.log('Seeding baseline data...');

    // 1. Company
    const company = await prisma.company.create({
        data: {
            name: 'Acme Enterprise Solutions',
            slug: 'acme-corp',
        },
    });

    // 2. Users (Sales Rep, Manager, Finance, Admin)
    const repUser = await prisma.user.create({
        data: {
            companyId: company.id,
            email: 'john.rep@acme.com',
            passwordHash: '$2b$10$samplehashedpasswordstringvalue12345',
            name: 'John Sales',
            role: UserRole.SALES_REP,
        },
    });

    const managerUser = await prisma.user.create({
        data: {
            companyId: company.id,
            email: 'sarah.mgr@acme.com',
            passwordHash: '$2b$10$samplehashedpasswordstringvalue12345',
            name: 'Sarah Manager',
            role: UserRole.MANAGER,
        },
    });

    // 3. Customers
    const customer = await prisma.customer.create({
        data: {
            companyId: company.id,
            name: 'Globex Logistics Corp',
            email: 'procurement@globex.com',
            tier: CustomerTier.SILVER,
            reliabilityScore: 92,
            consecutiveOnTimeCount: 4,
        },
    });

    // 4. Governance & Rules
    await prisma.discountTier.createMany({
        data: [
            { companyId: company.id, tier: CustomerTier.BRONZE, maxDiscountPercent: new Prisma.Decimal(5.0) },
            { companyId: company.id, tier: CustomerTier.SILVER, maxDiscountPercent: new Prisma.Decimal(12.0) },
            { companyId: company.id, tier: CustomerTier.GOLD, maxDiscountPercent: new Prisma.Decimal(20.0) },
        ],
    });

    await prisma.categoryDiscountLimit.createMany({
        data: [
            { companyId: company.id, category: 'Hardware', maxDiscountPercent: new Prisma.Decimal(15.0) },
            { companyId: company.id, category: 'Software', maxDiscountPercent: new Prisma.Decimal(25.0) },
        ],
    });

    await prisma.approvalChainRule.create({
        data: {
            companyId: company.id,
            minDiscountPercent: new Prisma.Decimal(10.0),
            maxDiscountPercent: new Prisma.Decimal(30.0),
            requiresManager: true,
            requiresFinance: false,
            priority: 1,
        },
    });

    const latePenaltyReason = await prisma.scoreReason.create({
        data: {
            companyId: company.id,
            code: 'LATE_PAYMENT_10D',
            label: 'Payment overdue by more than 10 days',
            defaultDelta: -10,
            isPenalty: true,
            isActive: true,
        },
    });

    // 5. Warehouse & Products
    const warehouse = await prisma.warehouse.create({
        data: {
            companyId: company.id,
            name: 'North America Distribution Hub',
            shippingCostWeight: new Prisma.Decimal(1.25),
        },
    });

    const hwProduct = await prisma.product.create({
        data: {
            companyId: company.id,
            name: 'Enterprise IoT Gateway v2',
            category: 'Hardware',
            basePrice: new Prisma.Decimal(450.0),
            unit: 'piece',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(35.0),
            description: 'Industrial grade wireless telemetry device',
        },
    });

    const swProduct = await prisma.product.create({
        data: {
            companyId: company.id,
            name: 'Cloud Telemetry Cloud Suite',
            category: 'Software',
            basePrice: new Prisma.Decimal(99.0),
            unit: 'seat/month',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(80.0),
            description: 'Central management license',
        },
    });

    const hwVariant = await prisma.productVariant.create({
        data: {
            productId: hwProduct.id,
            attributeName: 'Chassis',
            attributeValue: 'IP67 Ruggedized',
            extraPrice: new Prisma.Decimal(50.0),
        },
    });

    await prisma.priceListEntry.create({
        data: {
            productId: hwProduct.id,
            tier: CustomerTier.SILVER,
            currency: 'USD',
            price: new Prisma.Decimal(425.0),
        },
    });

    await prisma.upsellRule.create({
        data: {
            companyId: company.id,
            baseProductId: hwProduct.id,
            suggestedProductId: swProduct.id,
            isPromoted: true,
            minMarginPercent: new Prisma.Decimal(25.0),
        },
    });

    const stockHw = await prisma.stockLevel.create({
        data: {
            warehouseId: warehouse.id,
            productId: hwProduct.id,
            companyId: company.id,
            quantityAvailable: 250,
            quantityReserved: 10,
            replenishmentThreshold: 30,
        },
    });

    // 6. Subscriptions Plans
    const subPlan = await prisma.subscriptionPlan.create({
        data: {
            companyId: company.id,
            productId: swProduct.id,
            name: 'Pro Cloud Telemetry Monthly',
            billingCycle: BillingCycle.MONTHLY,
            prorationRule: ProrationRule.DAILY_RATE,
            cancellationRefundRule: CancellationRefundRule.PRORATED,
        },
    });

    // 7. Quotation Pipeline
    const quotation = await prisma.quotation.create({
        data: {
            companyId: company.id,
            customerId: customer.id,
            repId: repUser.id,
            status: QuotationStatus.PENDING_APPROVAL,
            blendedRiskScore: new Prisma.Decimal(18.5),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
            promisedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
        },
    });

    const quoteLine1 = await prisma.quotationLine.create({
        data: {
            quotationId: quotation.id,
            productId: hwProduct.id,
            variantId: hwVariant.id,
            quantity: 10,
            unitPrice: new Prisma.Decimal(475.0),
            discountPercent: new Prisma.Decimal(11.5),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(12.0),
            lineType: LineType.ONE_TIME,
        },
    });

    const quoteLine2 = await prisma.quotationLine.create({
        data: {
            quotationId: quotation.id,
            productId: swProduct.id,
            quantity: 10,
            unitPrice: new Prisma.Decimal(99.0),
            discountPercent: new Prisma.Decimal(5.0),
            categoryLimitAtTime: new Prisma.Decimal(25.0),
            tierLimitAtTime: new Prisma.Decimal(12.0),
            lineType: LineType.RECURRING,
        },
    });

    // 8. Stock Reservations and Splits
    await prisma.stockReservation.create({
        data: {
            quotationLineId: quoteLine1.id,
            warehouseId: warehouse.id,
            stockLevelId: stockHw.id,
            quantityReserved: 10,
            status: ReservationStatus.HELD,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h TTL
        },
    });

    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: quoteLine1.id,
            warehouseId: warehouse.id,
            stockLevelId: stockHw.id,
            quantityFulfilled: 0,
            isBackorder: false,
        },
    });

    // 9. Approvals & Negotiations
    await prisma.approvalStep.create({
        data: {
            quotationId: quotation.id,
            approverRole: UserRole.MANAGER,
            approverId: managerUser.id,
            status: ApprovalStatus.PENDING,
            stepOrder: 1,
        },
    });

    await prisma.negotiationProposal.create({
        data: {
            quotationId: quotation.id,
            lineId: quoteLine1.id,
            proposedByType: ProposedByType.CUSTOMER,
            proposedByCustomerId: customer.id,
            proposedChanges: { discountPercent: 12.0, quantity: 10 },
            message: 'Could you offer a 12% discount to match our budget for this cycle?',
            snapshotLimits: { categoryLimit: 15.0, tierLimit: 12.0 },
            status: ProposalStatus.PENDING,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
    });

    // 10. Subscriptions & Billing Engine
    const activeSub = await prisma.subscription.create({
        data: {
            quotationLineId: quoteLine2.id,
            planId: subPlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    const billingEvent = await prisma.billingEvent.create({
        data: {
            subscriptionId: activeSub.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(940.5),
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            paidAt: new Date(),
        },
    });

    await prisma.payment.create({
        data: {
            billingEventId: billingEvent.id,
            customerId: customer.id,
            amount: new Prisma.Decimal(940.5),
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(),
            daysLate: 5,
        },
    });

    // 11. Score Audit Events & General Audit Logs
    await prisma.scoreEvent.create({
        data: {
            customerId: customer.id,
            companyId: company.id,
            scoreReasonId: latePenaltyReason.id,
            delta: -10,
            scoreBefore: 102,
            scoreAfter: 92,
            note: 'Payment invoice cleared 5 days late.',
            triggeredBy: 'SYSTEM:PAYMENT_CRON',
            relatedBillingEventId: billingEvent.id,
            relatedQuotationId: quotation.id,
        },
    });

    await prisma.auditLog.create({
        data: {
            companyId: company.id,
            userId: repUser.id,
            entityType: 'Quotation',
            entityId: quotation.id,
            action: 'CREATED',
            metadata: { initialLines: 2, totalValue: 5690.5 },
        },
    });

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('Seeding error: ', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
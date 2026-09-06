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
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const SLUG_ACME = 'acme-corp';
const SLUG_NEXUS = 'nexus-tech';

async function main() {
    console.log('Clearing existing data in reverse dependency order across all companies...');

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

    console.log('All tables wiped cleanly. Generating password hashes...');
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // =========================================================================
    // COMPANY 1: ACME ENTERPRISE SOLUTIONS (acme-corp)
    // Sells: IoT Edge Gateways, Vibration Sensors, Telemetry Software, Support SLAs
    // Cross-trade buyer: Nexus Cloud Technologies
    // =========================================================================
    console.log('\n[Company 1] Seeding Acme Enterprise Solutions (acme-corp)...');
    const compAcme = await prisma.company.create({
        data: {
            name: 'Acme Enterprise Solutions',
            slug: SLUG_ACME,
        },
    });

    // 1.1 Acme Internal Users (2 Reps, 1 Manager, 1 Finance, 1 Admin)
    const acmeRepJohn = await prisma.user.create({
        data: {
            companyId: compAcme.id,
            email: 'john.rep@acme.com',
            passwordHash,
            name: 'John Sales',
            role: UserRole.SALES_REP,
        },
    });

    const acmeRepElena = await prisma.user.create({
        data: {
            companyId: compAcme.id,
            email: 'elena.rep@acme.com',
            passwordHash,
            name: 'Elena Vance',
            role: UserRole.SALES_REP,
        },
    });

    const acmeMgrSarah = await prisma.user.create({
        data: {
            companyId: compAcme.id,
            email: 'sarah.mgr@acme.com',
            passwordHash,
            name: 'Sarah Miller',
            role: UserRole.MANAGER,
        },
    });

    const acmeFinMarcus = await prisma.user.create({
        data: {
            companyId: compAcme.id,
            email: 'marcus.fin@acme.com',
            passwordHash,
            name: 'Marcus Sterling',
            role: UserRole.FINANCE,
        },
    });

    const acmeAdminDavid = await prisma.user.create({
        data: {
            companyId: compAcme.id,
            email: 'admin@acme.com',
            passwordHash,
            name: 'David Admin',
            role: UserRole.ADMIN,
        },
    });

    // 1.2 Acme Customers (Covering all 3 tiers, scores 28 to 100, streak 5+, brand new 0-events)
    const acmeCustNexus = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Nexus Cloud Technologies',
            email: 'procurement@nexustech.com', // Cross-company buyer: Nexus buying from Acme!
            tier: CustomerTier.GOLD,
            reliabilityScore: 98,
            consecutiveOnTimeCount: 6,
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustGlobex = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Globex Logistics Corp',
            email: 'procurement@globex.com',
            tier: CustomerTier.GOLD,
            reliabilityScore: 96,
            consecutiveOnTimeCount: 4,
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustZenith = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Zenith Dynamics',
            email: 'orders@zenithdyn.com',
            tier: CustomerTier.GOLD,
            reliabilityScore: 95,
            consecutiveOnTimeCount: 5, // High streak (5+) for bonus demo
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustVortex = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Vortex Media Labs',
            email: 'finance@vortexmedia.io',
            tier: CustomerTier.SILVER,
            reliabilityScore: 68, // Mid score (60-70 range)
            consecutiveOnTimeCount: 2,
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustBioTech = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'BioTech Synthetics Ltd',
            email: 'purchasing@biotech-syn.com',
            tier: CustomerTier.SILVER,
            reliabilityScore: 74,
            consecutiveOnTimeCount: 1,
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustApex = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Apex Industrial Systems',
            email: 'ops@apexindustrial.com',
            tier: CustomerTier.BRONZE,
            reliabilityScore: 28, // Low score (~20-30, multiple late penalties)
            consecutiveOnTimeCount: 0,
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustCascade = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Cascade Cloud Networks',
            email: 'billing@cascadecloud.net',
            tier: CustomerTier.BRONZE,
            reliabilityScore: 38,
            consecutiveOnTimeCount: 0,
            portalPasswordHash: passwordHash,
        },
    });

    const acmeCustNova = await prisma.customer.create({
        data: {
            companyId: compAcme.id,
            name: 'Nova Horizon AI',
            email: 'admin@novahorizon.ai',
            tier: CustomerTier.BRONZE,
            reliabilityScore: 100, // Brand-new customer with zero ScoreEvents (null-safe test)
            consecutiveOnTimeCount: 0,
            portalPasswordHash: passwordHash,
        },
    });

    // 1.3 Acme Governance & Discount Rules (3 tiers, 3 categories, 3 approval bands)
    await prisma.discountTier.createMany({
        data: [
            { companyId: compAcme.id, tier: CustomerTier.BRONZE, maxDiscountPercent: new Prisma.Decimal(5.0) },
            { companyId: compAcme.id, tier: CustomerTier.SILVER, maxDiscountPercent: new Prisma.Decimal(12.0) },
            { companyId: compAcme.id, tier: CustomerTier.GOLD, maxDiscountPercent: new Prisma.Decimal(20.0) },
        ],
    });

    await prisma.categoryDiscountLimit.createMany({
        data: [
            { companyId: compAcme.id, category: 'Hardware', maxDiscountPercent: new Prisma.Decimal(15.0) },
            { companyId: compAcme.id, category: 'Software', maxDiscountPercent: new Prisma.Decimal(25.0) },
            { companyId: compAcme.id, category: 'Services', maxDiscountPercent: new Prisma.Decimal(20.0) },
        ],
    });

    // 3 Approval Chain Rules (Band 0: 0-10% auto-approved, Band 1: 10.01-25% manager, Band 2: 25.01-999.99% manager+finance)
    await prisma.approvalChainRule.createMany({
        data: [
            {
                companyId: compAcme.id,
                minDiscountPercent: new Prisma.Decimal(0.0),
                maxDiscountPercent: new Prisma.Decimal(10.0),
                requiresManager: false,
                requiresFinance: false,
                priority: 0,
            },
            {
                companyId: compAcme.id,
                minDiscountPercent: new Prisma.Decimal(10.01),
                maxDiscountPercent: new Prisma.Decimal(25.0),
                requiresManager: true,
                requiresFinance: false,
                priority: 1,
            },
            {
                companyId: compAcme.id,
                minDiscountPercent: new Prisma.Decimal(25.01),
                maxDiscountPercent: new Prisma.Decimal(999.99),
                requiresManager: true,
                requiresFinance: true,
                priority: 2,
            },
        ],
    });

    // 1.4 Acme Score Reasons (6 rows: penalties, bonuses, streaks, custom company-specific)
    const acmeReasonVeryLate = await prisma.scoreReason.create({
        data: {
            companyId: compAcme.id,
            code: 'VERY_LATE_PAYMENT',
            label: 'Payment overdue by more than 10 days',
            defaultDelta: -15,
            isPenalty: true,
            isActive: true,
        },
    });

    const acmeReasonLateShort = await prisma.scoreReason.create({
        data: {
            companyId: compAcme.id,
            code: 'LATE_PAYMENT_SHORT',
            label: 'Payment overdue by 1 to 10 days',
            defaultDelta: -5,
            isPenalty: true,
            isActive: true,
        },
    });

    const acmeReasonLateCancel = await prisma.scoreReason.create({
        data: {
            companyId: compAcme.id,
            code: 'LATE_CANCELLATION',
            label: 'Quotation cancelled or lapsed post-approval',
            defaultDelta: -10,
            isPenalty: true,
            isActive: true,
        },
    });

    const acmeReasonEarlyPay = await prisma.scoreReason.create({
        data: {
            companyId: compAcme.id,
            code: 'EARLY_PAYMENT',
            label: 'Invoice settled before due date',
            defaultDelta: 3,
            isPenalty: false,
            isActive: true,
        },
    });

    const acmeReasonStreak = await prisma.scoreReason.create({
        data: {
            companyId: compAcme.id,
            code: 'CONSECUTIVE_ON_TIME_STREAK',
            label: 'Achieved 5+ consecutive on-time payments',
            defaultDelta: 5,
            isPenalty: false,
            isActive: true,
        },
    });

    const acmeReasonVolumePartner = await prisma.scoreReason.create({
        data: {
            companyId: compAcme.id,
            code: 'VOLUME_PARTNER_CREDIT',
            label: 'Quarterly enterprise volume commitment honored',
            defaultDelta: 4,
            isPenalty: false,
            isActive: true,
        },
    });

    // 1.5 Acme Warehouses (3 Warehouses with varying weights for tiebreaker logic)
    const acmeWhCentral = await prisma.warehouse.create({
        data: {
            companyId: compAcme.id,
            name: 'North America Central Hub (Chicago)',
            shippingCostWeight: new Prisma.Decimal(1.10),
        },
    });

    const acmeWhEast = await prisma.warehouse.create({
        data: {
            companyId: compAcme.id,
            name: 'East Coast Logistics Center (New Jersey)',
            shippingCostWeight: new Prisma.Decimal(1.45),
        },
    });

    const acmeWhWest = await prisma.warehouse.create({
        data: {
            companyId: compAcme.id,
            name: 'West Coast Distribution Depot (California)',
            shippingCostWeight: new Prisma.Decimal(1.80),
        },
    });

    // 1.6 Acme Products (Hardware, Software, Services with variants, price lists, margin mix)
    // Product 1: Hardware with variants & tiered price lists
    const acmeProdGateway = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: 'IoT Edge Gateway Pro v3',
            category: 'Hardware',
            basePrice: new Prisma.Decimal(480.0),
            unit: 'unit',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(38.0),
            description: 'Ruggedized industrial IoT telemetry controller',
        },
    });

    const varGatewayRugged = await prisma.productVariant.create({
        data: {
            productId: acmeProdGateway.id,
            attributeName: 'Chassis',
            attributeValue: 'IP67 Ruggedized Heavy Duty',
            extraPrice: new Prisma.Decimal(65.0),
        },
    });

    const varGatewayStandard = await prisma.productVariant.create({
        data: {
            productId: acmeProdGateway.id,
            attributeName: 'Chassis',
            attributeValue: 'Standard 1U Rack Mount',
            extraPrice: new Prisma.Decimal(0.0),
        },
    });

    await prisma.priceListEntry.createMany({
        data: [
            { productId: acmeProdGateway.id, tier: CustomerTier.BRONZE, currency: 'USD', price: new Prisma.Decimal(480.0) },
            { productId: acmeProdGateway.id, tier: CustomerTier.SILVER, currency: 'USD', price: new Prisma.Decimal(450.0) },
            { productId: acmeProdGateway.id, tier: CustomerTier.GOLD, currency: 'USD', price: new Prisma.Decimal(420.0) },
        ],
    });

    // Product 2: Hardware without variants (used for thin stock multi-warehouse split)
    const acmeProdSensor = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: 'Industrial Vibration & Heat Sensor Pack',
            category: 'Hardware',
            basePrice: new Prisma.Decimal(140.0),
            unit: 'pack',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(42.0),
            description: 'Wireless sensor bundle for predictive maintenance',
        },
    });

    // Product 3: Hardware with LOW MARGIN (16%) -> excluded from upsell minMarginPercent=25%
    const acmeProdChassis = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: 'High-Density Compute Chassis HD-800',
            category: 'Hardware',
            basePrice: new Prisma.Decimal(2400.0),
            unit: 'chassis',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(16.0), // Low margin
            description: 'Multi-blade carrier unit for mission critical compute nodes',
        },
    });

    // Product 4: Software with HIGH MARGIN (85%) & tiered price lists
    const acmeProdTelemetry = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: 'Cloud Telemetry Suite Enterprise',
            category: 'Software',
            basePrice: new Prisma.Decimal(95.0),
            unit: 'license/month',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(85.0), // High margin
            description: 'Real-time telemetry stream processing SaaS',
        },
    });

    await prisma.priceListEntry.createMany({
        data: [
            { productId: acmeProdTelemetry.id, tier: CustomerTier.BRONZE, currency: 'USD', price: new Prisma.Decimal(95.0) },
            { productId: acmeProdTelemetry.id, tier: CustomerTier.SILVER, currency: 'USD', price: new Prisma.Decimal(85.0) },
            { productId: acmeProdTelemetry.id, tier: CustomerTier.GOLD, currency: 'USD', price: new Prisma.Decimal(75.0) },
        ],
    });

    // Product 5: Software with variants
    const acmeProdSecurity = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: 'CyberDefend Zero-Trust Security Suite',
            category: 'Software',
            basePrice: new Prisma.Decimal(320.0),
            unit: 'workstation/month',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(82.0),
            description: 'Endpoint protection, micro-segmentation and automated quarantine',
        },
    });

    const varSecurityStandard = await prisma.productVariant.create({
        data: {
            productId: acmeProdSecurity.id,
            attributeName: 'Security Tier',
            attributeValue: 'Standard Endpoint Protection',
            extraPrice: new Prisma.Decimal(0.0),
        },
    });

    const varSecurityZeroTrust = await prisma.productVariant.create({
        data: {
            productId: acmeProdSecurity.id,
            attributeName: 'Security Tier',
            attributeValue: 'Zero-Trust Enterprise Compliance',
            extraPrice: new Prisma.Decimal(130.0),
        },
    });

    // Product 6: Services
    const acmeProdSupport = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: '24/7 Dedicated Technical Support SLA',
            category: 'Services',
            basePrice: new Prisma.Decimal(1250.0),
            unit: 'month',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(65.0),
            description: '15-minute response SLA with dedicated architect',
        },
    });

    // Product 7: Services
    const acmeProdTraining = await prisma.product.create({
        data: {
            companyId: compAcme.id,
            name: 'On-Site Architecture & Deployment Bootcamp',
            category: 'Services',
            basePrice: new Prisma.Decimal(3800.0),
            unit: 'engagement',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(55.0),
            description: '3-day hands-on engineering architecture workshop and setup',
        },
    });

    // Upsell Rules (Testing margin exclusions)
    await prisma.upsellRule.createMany({
        data: [
            {
                companyId: compAcme.id,
                baseProductId: acmeProdGateway.id,
                suggestedProductId: acmeProdTelemetry.id,
                isPromoted: true,
                minMarginPercent: new Prisma.Decimal(25.0),
            },
            {
                companyId: compAcme.id,
                baseProductId: acmeProdGateway.id,
                suggestedProductId: acmeProdSupport.id,
                isPromoted: false,
                minMarginPercent: new Prisma.Decimal(25.0),
            },
            {
                companyId: compAcme.id,
                baseProductId: acmeProdSecurity.id,
                suggestedProductId: acmeProdTraining.id,
                isPromoted: true,
                minMarginPercent: new Prisma.Decimal(30.0),
            },
        ],
    });

    // 1.7 Acme Stock Levels (Explicitly covering 3 Fulfillment Scenarios)
    // Scenario A: Single warehouse covers full order easily (whCentral has 350 available)
    const stockGatewayCentral = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhCentral.id,
            productId: acmeProdGateway.id,
            companyId: compAcme.id,
            quantityAvailable: 350,
            quantityReserved: 15,
            replenishmentThreshold: 40,
        },
    });

    const stockGatewayEast = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhEast.id,
            productId: acmeProdGateway.id,
            companyId: compAcme.id,
            quantityAvailable: 90,
            quantityReserved: 0,
            replenishmentThreshold: 20,
        },
    });

    // Scenario B: Stock spread thin across warehouses (Central: 14, East: 12, West: 10)
    // Order of 25 cannot be fulfilled by any single WH, forcing a multi-warehouse split!
    const stockSensorCentral = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhCentral.id,
            productId: acmeProdSensor.id,
            companyId: compAcme.id,
            quantityAvailable: 14,
            quantityReserved: 0,
            replenishmentThreshold: 15,
        },
    });

    const stockSensorEast = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhEast.id,
            productId: acmeProdSensor.id,
            companyId: compAcme.id,
            quantityAvailable: 12,
            quantityReserved: 0,
            replenishmentThreshold: 15,
        },
    });

    const stockSensorWest = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhWest.id,
            productId: acmeProdSensor.id,
            companyId: compAcme.id,
            quantityAvailable: 10,
            quantityReserved: 0,
            replenishmentThreshold: 15,
        },
    });

    // Scenario C: Severely understocked everywhere (Central: 2, East: 1, West: 0 -> total 3)
    // Order of 6 guarantees an unresolved backorder!
    const stockChassisCentral = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhCentral.id,
            productId: acmeProdChassis.id,
            companyId: compAcme.id,
            quantityAvailable: 2,
            quantityReserved: 0,
            replenishmentThreshold: 5,
        },
    });

    const stockChassisEast = await prisma.stockLevel.create({
        data: {
            warehouseId: acmeWhEast.id,
            productId: acmeProdChassis.id,
            companyId: compAcme.id,
            quantityAvailable: 1,
            quantityReserved: 0,
            replenishmentThreshold: 5,
        },
    });

    // 1.8 Acme Subscription Plans (Multiple billing cycles: Monthly, Yearly, Quarterly)
    const acmePlanTelemetryMonthly = await prisma.subscriptionPlan.create({
        data: {
            companyId: compAcme.id,
            productId: acmeProdTelemetry.id,
            name: 'Cloud Telemetry Standard Monthly',
            billingCycle: BillingCycle.MONTHLY,
            prorationRule: ProrationRule.DAILY_RATE,
            cancellationRefundRule: CancellationRefundRule.PRORATED,
        },
    });

    const acmePlanSecurityAnnual = await prisma.subscriptionPlan.create({
        data: {
            companyId: compAcme.id,
            productId: acmeProdSecurity.id,
            name: 'Zero-Trust Enterprise Annual',
            billingCycle: BillingCycle.YEARLY,
            prorationRule: ProrationRule.FULL_PERIOD,
            cancellationRefundRule: CancellationRefundRule.PRORATED,
        },
    });

    const acmePlanSupportQuarterly = await prisma.subscriptionPlan.create({
        data: {
            companyId: compAcme.id,
            productId: acmeProdSupport.id,
            name: 'Mission Critical 24/7 SLA Quarterly',
            billingCycle: BillingCycle.QUARTERLY,
            prorationRule: ProrationRule.NO_PRORATION,
            cancellationRefundRule: CancellationRefundRule.NO_REFUND,
        },
    });

    // 1.9 Acme Quotations (Covering all 8 statuses, edge cases & cross-trade)
    // [Cross-trade 1]: Acme sells to Nexus Cloud Technologies (CONFIRMED)
    console.log('  -> Creating cross-company trade: Acme sells to Nexus Cloud Technologies...');
    const qAcmeToNexus = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustNexus.id, // Nexus is the buying customer!
            repId: acmeRepJohn.id,
            status: QuotationStatus.CONFIRMED,
            blendedRiskScore: new Prisma.Decimal(0.0),
            createdAt: new Date(Date.now() - 25 * 86400000),
            updatedAt: new Date(Date.now() - 24 * 86400000),
            lastActivityAt: new Date(Date.now() - 24 * 86400000),
        },
    });

    const lineAcmeToNexus1 = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeToNexus.id,
            productId: acmeProdGateway.id,
            variantId: varGatewayStandard.id,
            quantity: 20,
            unitPrice: new Prisma.Decimal(480.0),
            discountPercent: new Prisma.Decimal(8.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(20.0),
            lineType: LineType.ONE_TIME,
        },
    });

    const lineAcmeToNexus2 = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeToNexus.id,
            productId: acmeProdTelemetry.id,
            quantity: 50,
            unitPrice: new Prisma.Decimal(95.0),
            discountPercent: new Prisma.Decimal(10.0),
            categoryLimitAtTime: new Prisma.Decimal(25.0),
            tierLimitAtTime: new Prisma.Decimal(20.0),
            lineType: LineType.RECURRING,
        },
    });

    // Reservation consumed
    await prisma.stockReservation.create({
        data: {
            quotationLineId: lineAcmeToNexus1.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockGatewayCentral.id,
            quantityReserved: 20,
            status: ReservationStatus.CONSUMED,
            createdAt: new Date(Date.now() - 25 * 86400000),
        },
    });

    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: lineAcmeToNexus1.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockGatewayCentral.id,
            quantityFulfilled: 20,
            isBackorder: false,
            fulfilledAt: new Date(Date.now() - 23 * 86400000),
        },
    });

    const subNexusTelemetry = await prisma.subscription.create({
        data: {
            quotationLineId: lineAcmeToNexus2.id,
            planId: acmePlanTelemetryMonthly.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
            nextBillingDate: new Date(Date.now() + 30 * 86400000),
        },
    });

    const invNexus1 = await prisma.billingEvent.create({
        data: {
            subscriptionId: subNexusTelemetry.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(4275.0),
            dueDate: new Date(Date.now() - 15 * 86400000),
            paidAt: new Date(Date.now() - 18 * 86400000),
        },
    });

    await prisma.payment.create({
        data: {
            billingEventId: invNexus1.id,
            customerId: acmeCustNexus.id,
            amount: new Prisma.Decimal(4275.0),
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(Date.now() - 18 * 86400000),
            daysLate: -3, // Early payment demo
            createdAt: new Date(Date.now() - 18 * 86400000),
        },
    });

    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustNexus.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonEarlyPay.id,
            delta: 3,
            scoreBefore: 95,
            scoreAfter: 98,
            note: 'Settled invoice 3 days before due date.',
            triggeredBy: 'SYSTEM:PAYMENT_CRON',
            relatedBillingEventId: invNexus1.id,
            createdAt: new Date(Date.now() - 18 * 86400000),
        },
    });

    // Additional Historical Baseline Quotations for Rep John Sales (average ~5.8% discount)
    for (let i = 1; i <= 4; i++) {
        const qHist = await prisma.quotation.create({
            data: {
                companyId: compAcme.id,
                customerId: acmeCustGlobex.id,
                repId: acmeRepJohn.id,
                status: i % 2 === 0 ? QuotationStatus.CONFIRMED : QuotationStatus.FULFILLED,
                blendedRiskScore: new Prisma.Decimal(0.0),
                createdAt: new Date(Date.now() - (40 - i * 5) * 86400000),
                updatedAt: new Date(Date.now() - (38 - i * 5) * 86400000),
                lastActivityAt: new Date(Date.now() - (38 - i * 5) * 86400000),
            },
        });
        await prisma.quotationLine.create({
            data: {
                quotationId: qHist.id,
                productId: acmeProdGateway.id,
                quantity: 8,
                unitPrice: new Prisma.Decimal(480.0),
                discountPercent: new Prisma.Decimal(5.0 + i * 0.5),
                categoryLimitAtTime: new Prisma.Decimal(15.0),
                tierLimitAtTime: new Prisma.Decimal(20.0),
                lineType: LineType.ONE_TIME,
            },
        });
    }

    // Edge Case: Delivery Slippage (promisedDeliveryDate 14 days ago, fulfilled audit log 6 days ago -> 8 days late)
    // Also includes an ALREADY RESOLVED historical backorder (isBackorder: true, fulfilledAt populated!)
    const qAcmeSlippage = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustVortex.id,
            repId: acmeRepJohn.id,
            status: QuotationStatus.FULFILLED,
            blendedRiskScore: new Prisma.Decimal(1.0),
            promisedDeliveryDate: new Date(Date.now() - 14 * 86400000),
            createdAt: new Date(Date.now() - 35 * 86400000),
            updatedAt: new Date(Date.now() - 6 * 86400000),
            lastActivityAt: new Date(Date.now() - 6 * 86400000),
        },
    });

    const lineAcmeSlippage = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeSlippage.id,
            productId: acmeProdGateway.id,
            variantId: varGatewayRugged.id,
            quantity: 8,
            unitPrice: new Prisma.Decimal(545.0),
            discountPercent: new Prisma.Decimal(6.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(12.0),
            lineType: LineType.ONE_TIME,
        },
    });

    // Resolved historical backorder demo!
    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: lineAcmeSlippage.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockGatewayCentral.id,
            quantityFulfilled: 8,
            isBackorder: true, // was a backorder, now resolved
            fulfilledAt: new Date(Date.now() - 6 * 86400000),
        },
    });

    await prisma.auditLog.create({
        data: {
            companyId: compAcme.id,
            userId: acmeRepJohn.id,
            entityType: 'Quotation',
            entityId: qAcmeSlippage.id,
            action: 'FULFILLED',
            metadata: { note: 'Dispatched via freight after manufacturing delay' },
            createdAt: new Date(Date.now() - 6 * 86400000), // 8 days late
        },
    });

    // Edge Case: Discount Anomaly (John Sales baseline ~5.8%, this draft gives 18.0% discount -> 12.2pp excess!)
    const qAcmeAnomaly = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustApex.id,
            repId: acmeRepJohn.id,
            status: QuotationStatus.DRAFT,
            blendedRiskScore: new Prisma.Decimal(22.0),
            createdAt: new Date(Date.now() - 2 * 86400000),
            updatedAt: new Date(Date.now() - 1 * 86400000),
            lastActivityAt: new Date(Date.now() - 1 * 86400000),
        },
    });

    await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeAnomaly.id,
            productId: acmeProdGateway.id,
            variantId: varGatewayStandard.id,
            quantity: 15,
            unitPrice: new Prisma.Decimal(480.0),
            discountPercent: new Prisma.Decimal(18.0), // 18% vs Rep avg 5.8% -> ANOMALY!
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(5.0),
            lineType: LineType.ONE_TIME,
        },
    });

    // Edge Case: Stalled Deal (lastActivityAt 11 days ago in PENDING_APPROVAL status)
    // Also includes a HELD stock reservation!
    const qAcmeStalled = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustBioTech.id,
            repId: acmeRepJohn.id,
            status: QuotationStatus.PENDING_APPROVAL,
            blendedRiskScore: new Prisma.Decimal(14.0),
            createdAt: new Date(Date.now() - 20 * 86400000),
            updatedAt: new Date(Date.now() - 11 * 86400000),
            lastActivityAt: new Date(Date.now() - 11 * 86400000), // > 7 days ago -> STALLED DEAL!
        },
    });

    const lineAcmeStalled = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeStalled.id,
            productId: acmeProdSensor.id,
            quantity: 20,
            unitPrice: new Prisma.Decimal(140.0),
            discountPercent: new Prisma.Decimal(14.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(12.0),
            lineType: LineType.ONE_TIME,
        },
    });

    await prisma.stockReservation.create({
        data: {
            quotationLineId: lineAcmeStalled.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockSensorCentral.id,
            quantityReserved: 14,
            status: ReservationStatus.HELD, // HELD status demo
            expiresAt: new Date(Date.now() + 36 * 3600000),
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: qAcmeStalled.id,
            approverRole: UserRole.MANAGER,
            approverId: acmeMgrSarah.id,
            status: ApprovalStatus.PENDING,
            stepOrder: 1,
            createdAt: new Date(Date.now() - 11 * 86400000),
        },
    });

    // Edge Case: Guaranteed Unresolved Backorder (Severely understocked HD-800 chassis)
    const qAcmeBackorder = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustApex.id,
            repId: acmeRepElena.id,
            status: QuotationStatus.CONFIRMED,
            blendedRiskScore: new Prisma.Decimal(4.0),
            createdAt: new Date(Date.now() - 10 * 86400000),
            updatedAt: new Date(Date.now() - 9 * 86400000),
            lastActivityAt: new Date(Date.now() - 9 * 86400000),
        },
    });

    const lineAcmeBackorder = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeBackorder.id,
            productId: acmeProdChassis.id,
            quantity: 6,
            unitPrice: new Prisma.Decimal(2400.0),
            discountPercent: new Prisma.Decimal(5.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(5.0),
            lineType: LineType.ONE_TIME,
        },
    });

    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: lineAcmeBackorder.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockChassisCentral.id,
            quantityFulfilled: 2,
            isBackorder: false,
            fulfilledAt: new Date(Date.now() - 9 * 86400000),
        },
    });

    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: lineAcmeBackorder.id,
            warehouseId: acmeWhEast.id,
            stockLevelId: stockChassisEast.id,
            quantityFulfilled: 1,
            isBackorder: false,
            fulfilledAt: new Date(Date.now() - 9 * 86400000),
        },
    });

    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: lineAcmeBackorder.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockChassisCentral.id,
            quantityFulfilled: 0,
            isBackorder: true, // UNRESOLVED BACKORDER: ready for Add Stock demo!
            fulfilledAt: null,
        },
    });

    // Edge Case: Blended Risk Score = 0.00 (Fully compliant, auto-approved with no approval steps)
    const qAcmeCompliant = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustNova.id, // Brand-new customer
            repId: acmeRepElena.id,
            status: QuotationStatus.DRAFT,
            blendedRiskScore: new Prisma.Decimal(0.0), // EXACTLY ZERO
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivityAt: new Date(),
        },
    });

    await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeCompliant.id,
            productId: acmeProdTelemetry.id,
            quantity: 5,
            unitPrice: new Prisma.Decimal(95.0),
            discountPercent: new Prisma.Decimal(2.0),
            categoryLimitAtTime: new Prisma.Decimal(25.0),
            tierLimitAtTime: new Prisma.Decimal(5.0),
            lineType: LineType.RECURRING,
        },
    });

    // Edge Case: Divergent Limits Testing & Active Negotiation Proposals
    const qAcmeNeg = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustVortex.id,
            repId: acmeRepElena.id,
            status: QuotationStatus.NEGOTIATING,
            blendedRiskScore: new Prisma.Decimal(12.0),
            confirmationDeadline: new Date(Date.now() + 4 * 86400000),
            createdAt: new Date(Date.now() - 4 * 86400000),
            updatedAt: new Date(Date.now() - 1 * 86400000),
            lastActivityAt: new Date(Date.now() - 1 * 86400000),
        },
    });

    // Line 1: discount 16% on Software (Category limit 25%, Customer Silver tier limit 12%)
    // Exceeds tier limit but within category limit -> proves min() logic!
    const lineAcmeNeg1 = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeNeg.id,
            productId: acmeProdTelemetry.id,
            quantity: 15,
            unitPrice: new Prisma.Decimal(85.0),
            discountPercent: new Prisma.Decimal(16.0),
            categoryLimitAtTime: new Prisma.Decimal(25.0),
            tierLimitAtTime: new Prisma.Decimal(12.0),
            lineType: LineType.RECURRING,
        },
    });

    const lineAcmeNeg2 = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeNeg.id,
            productId: acmeProdGateway.id,
            variantId: varGatewayStandard.id,
            quantity: 10,
            unitPrice: new Prisma.Decimal(450.0),
            discountPercent: new Prisma.Decimal(14.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(12.0),
            lineType: LineType.ONE_TIME,
        },
    });

    // Proposal 1: PENDING (Customer-initiated)
    await prisma.negotiationProposal.create({
        data: {
            quotationId: qAcmeNeg.id,
            lineId: lineAcmeNeg1.id,
            proposedByType: ProposedByType.CUSTOMER,
            proposedByCustomerId: acmeCustVortex.id,
            proposedChanges: { discountPercent: 18.0, quantity: 20 },
            message: 'If we scale our deployment to 20 seats, can you meet us at 18% discount?',
            snapshotLimits: { categoryLimit: 25.0, tierLimit: 12.0 },
            status: ProposalStatus.PENDING,
            expiresAt: new Date(Date.now() + 48 * 3600000),
            createdAt: new Date(Date.now() - 1 * 86400000),
        },
    });

    // Proposal 2: PENDING (Rep-countered, proving proposedByType switching)
    await prisma.negotiationProposal.create({
        data: {
            quotationId: qAcmeNeg.id,
            lineId: lineAcmeNeg2.id,
            proposedByType: ProposedByType.REP,
            proposedByUserId: acmeRepElena.id,
            proposedChanges: { discountPercent: 12.0 },
            message: '14% exceeds our hardware tier limit for this volume, but I can honor 12% with expedited freight included.',
            snapshotLimits: { categoryLimit: 15.0, tierLimit: 12.0 },
            status: ProposalStatus.PENDING,
            expiresAt: new Date(Date.now() + 48 * 3600000),
            createdAt: new Date(Date.now() - 12 * 3600000),
        },
    });

    // Proposal 3: Message-only (no term changes, pure comment)
    await prisma.negotiationProposal.create({
        data: {
            quotationId: qAcmeNeg.id,
            lineId: null,
            proposedByType: ProposedByType.CUSTOMER,
            proposedByCustomerId: acmeCustVortex.id,
            proposedChanges: {},
            message: 'Can your team confirm delivery will include European power adapters and certifications?',
            snapshotLimits: { categoryLimit: 25.0, tierLimit: 12.0 },
            status: ProposalStatus.PENDING,
            expiresAt: new Date(Date.now() + 48 * 3600000),
            createdAt: new Date(Date.now() - 6 * 3600000),
        },
    });

    // Edge Case: Multi-Tier Escalation APPROVED (Discount > 25%, requires Manager + Finance)
    const qAcmeApproved = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustGlobex.id,
            repId: acmeRepElena.id,
            status: QuotationStatus.APPROVED,
            blendedRiskScore: new Prisma.Decimal(30.0), // Exceeds 25% threshold
            createdAt: new Date(Date.now() - 7 * 86400000),
            updatedAt: new Date(Date.now() - 2 * 86400000),
            lastActivityAt: new Date(Date.now() - 2 * 86400000),
        },
    });

    const lineAcmeApproved = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeApproved.id,
            productId: acmeProdSecurity.id,
            variantId: varSecurityZeroTrust.id,
            quantity: 35,
            unitPrice: new Prisma.Decimal(450.0),
            discountPercent: new Prisma.Decimal(28.0),
            categoryLimitAtTime: new Prisma.Decimal(25.0),
            tierLimitAtTime: new Prisma.Decimal(20.0),
            lineType: LineType.RECURRING,
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: qAcmeApproved.id,
            approverRole: UserRole.MANAGER,
            approverId: acmeMgrSarah.id,
            status: ApprovalStatus.APPROVED,
            stepOrder: 1,
            actedAt: new Date(Date.now() - 4 * 86400000),
            reason: 'Strategic enterprise scale deal approved by Sales Director.',
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: qAcmeApproved.id,
            approverRole: UserRole.FINANCE,
            approverId: acmeFinMarcus.id,
            status: ApprovalStatus.APPROVED,
            stepOrder: 2,
            actedAt: new Date(Date.now() - 2 * 86400000),
            reason: 'Volume unit margin verified at 68% after enterprise discount. Approved.',
        },
    });

    // Edge Case: REJECTED Quotation with RELEASED stock reservation
    const qAcmeRejected = await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustApex.id,
            repId: acmeRepElena.id,
            status: QuotationStatus.REJECTED,
            blendedRiskScore: new Prisma.Decimal(36.0),
            createdAt: new Date(Date.now() - 14 * 86400000),
            updatedAt: new Date(Date.now() - 10 * 86400000),
            lastActivityAt: new Date(Date.now() - 10 * 86400000),
        },
    });

    const lineAcmeRejected = await prisma.quotationLine.create({
        data: {
            quotationId: qAcmeRejected.id,
            productId: acmeProdSensor.id,
            quantity: 30,
            unitPrice: new Prisma.Decimal(140.0),
            discountPercent: new Prisma.Decimal(35.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(5.0),
            lineType: LineType.ONE_TIME,
        },
    });

    // RELEASED stock reservation demo
    await prisma.stockReservation.create({
        data: {
            quotationLineId: lineAcmeRejected.id,
            warehouseId: acmeWhCentral.id,
            stockLevelId: stockSensorCentral.id,
            quantityReserved: 14,
            status: ReservationStatus.RELEASED,
            releasedAt: new Date(Date.now() - 10 * 86400000),
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: qAcmeRejected.id,
            approverRole: UserRole.MANAGER,
            approverId: acmeMgrSarah.id,
            status: ApprovalStatus.REJECTED,
            stepOrder: 1,
            actedAt: new Date(Date.now() - 10 * 86400000),
            reason: 'Discount request of 35% exceeds commercial margin parameters for Bronze tier accounts.',
        },
    });

    // Edge Case: CANCELLED Quotation
    await prisma.quotation.create({
        data: {
            companyId: compAcme.id,
            customerId: acmeCustCascade.id,
            repId: acmeRepElena.id,
            status: QuotationStatus.CANCELLED,
            blendedRiskScore: new Prisma.Decimal(8.0),
            cancelledAt: new Date(Date.now() - 3 * 86400000),
            createdAt: new Date(Date.now() - 20 * 86400000),
            updatedAt: new Date(Date.now() - 3 * 86400000),
            lastActivityAt: new Date(Date.now() - 3 * 86400000),
        },
    });

    // 1.10 Invoices, Overdue Billing Events & Payment Streaks in Acme
    // Zenith Dynamics: 3+ consecutive on-time payments & Streak Bonus demo
    const subZenith = await prisma.subscription.create({
        data: {
            quotationLineId: lineAcmeSlippage.id,
            planId: acmePlanTelemetryMonthly.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: new Date(Date.now() + 25 * 86400000),
            nextBillingDate: new Date(Date.now() + 25 * 86400000),
        },
    });

    const invZenith1 = await prisma.billingEvent.create({
        data: {
            subscriptionId: subZenith.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(1786.0),
            dueDate: new Date(Date.now() - 20 * 86400000),
            paidAt: new Date(Date.now() - 24 * 86400000),
        },
    });

    await prisma.payment.create({
        data: {
            billingEventId: invZenith1.id,
            customerId: acmeCustZenith.id,
            amount: new Prisma.Decimal(1786.0),
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(Date.now() - 24 * 86400000),
            daysLate: -4, // Early payment demo
            createdAt: new Date(Date.now() - 24 * 86400000),
        },
    });

    const invZenith2 = await prisma.billingEvent.create({
        data: {
            subscriptionId: subZenith.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(1786.0),
            dueDate: new Date(Date.now() - 50 * 86400000),
            paidAt: new Date(Date.now() - 50 * 86400000),
        },
    });

    await prisma.payment.create({
        data: {
            billingEventId: invZenith2.id,
            customerId: acmeCustZenith.id,
            amount: new Prisma.Decimal(1786.0),
            method: PaymentMethod.CARD,
            paidAt: new Date(Date.now() - 50 * 86400000),
            daysLate: 0,
            createdAt: new Date(Date.now() - 50 * 86400000),
        },
    });

    const invZenith3 = await prisma.billingEvent.create({
        data: {
            subscriptionId: subZenith.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(1786.0),
            dueDate: new Date(Date.now() - 80 * 86400000),
            paidAt: new Date(Date.now() - 81 * 86400000),
        },
    });

    await prisma.payment.create({
        data: {
            billingEventId: invZenith3.id,
            customerId: acmeCustZenith.id,
            amount: new Prisma.Decimal(1786.0),
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(Date.now() - 81 * 86400000),
            daysLate: -1,
            createdAt: new Date(Date.now() - 81 * 86400000),
        },
    });

    // OVERDUE BillingEvent demo (dueDate was 12 days ago, paidAt is null)
    const subGlobex = await prisma.subscription.create({
        data: {
            quotationLineId: lineAcmeApproved.id,
            planId: acmePlanSupportQuarterly.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: new Date(Date.now() + 60 * 86400000),
            nextBillingDate: new Date(Date.now() + 60 * 86400000),
        },
    });

    await prisma.billingEvent.create({
        data: {
            subscriptionId: subGlobex.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(3750.0),
            dueDate: new Date(Date.now() - 12 * 86400000),
            paidAt: null, // Unpaid and overdue!
        },
    });

    // 1.11 ScoreEvents in Acme (Multiple customers, penalties & bonuses, system and human actors)
    // 1. Zenith streak bonus
    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustZenith.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonStreak.id,
            delta: 5,
            scoreBefore: 90,
            scoreAfter: 95,
            note: 'Achieved consecutive on-time payment streak milestone.',
            triggeredBy: 'SYSTEM:STREAK_ENGINE',
            createdAt: new Date(Date.now() - 20 * 86400000),
        },
    });

    // 2. Globex volume partner credit (human triggered by manager!)
    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustGlobex.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonVolumePartner.id,
            delta: 4,
            scoreBefore: 92,
            scoreAfter: 96,
            note: 'Annual commitment review approved by Sarah Miller.',
            triggeredBy: acmeMgrSarah.id, // Real userId actor demo!
            createdAt: new Date(Date.now() - 15 * 86400000),
        },
    });

    // 3. Apex Very late payment penalty (-15)
    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustApex.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonVeryLate.id,
            delta: -15,
            scoreBefore: 53,
            scoreAfter: 38,
            note: 'Invoice settled 14 days after contractual due date.',
            triggeredBy: 'SYSTEM:PAYMENT_CRON',
            createdAt: new Date(Date.now() - 31 * 86400000),
        },
    });

    // 4. Apex Late cancellation penalty (-10)
    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustApex.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonLateCancel.id,
            delta: -10,
            scoreBefore: 38,
            scoreAfter: 28,
            note: 'Quotation terms lapsed post-approval without execution.',
            triggeredBy: 'SYSTEM:EXPIRY_JOB',
            relatedQuotationId: qAcmeRejected.id,
            createdAt: new Date(Date.now() - 10 * 86400000),
        },
    });

    // 5. Cascade Short late payment penalty (-5)
    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustCascade.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonLateShort.id,
            delta: -5,
            scoreBefore: 43,
            scoreAfter: 38,
            note: 'Invoice paid 4 days late.',
            triggeredBy: 'SYSTEM:PAYMENT_CRON',
            createdAt: new Date(Date.now() - 8 * 86400000),
        },
    });

    // 6. Vortex Early payment bonus (+3)
    await prisma.scoreEvent.create({
        data: {
            customerId: acmeCustVortex.id,
            companyId: compAcme.id,
            scoreReasonId: acmeReasonEarlyPay.id,
            delta: 3,
            scoreBefore: 65,
            scoreAfter: 68,
            note: 'Invoice settled early via corporate card.',
            triggeredBy: 'SYSTEM:PAYMENT_CRON',
            createdAt: new Date(Date.now() - 12 * 86400000),
        },
    });

    // Nova Horizon AI deliberately has 0 ScoreEvents to test the null-safe empty history path.


    // =========================================================================
    // COMPANY 2: NEXUS CLOUD TECHNOLOGIES (nexus-tech)
    // Sells: Neural Acceleration Hardware, Vector DB & AI Training SaaS
    // Cross-trade buyer: Acme Enterprise Solutions
    // =========================================================================
    console.log('\n[Company 2] Seeding Nexus Cloud Technologies (nexus-tech)...');
    const compNexus = await prisma.company.create({
        data: {
            name: 'Nexus Cloud Technologies',
            slug: SLUG_NEXUS,
        },
    });

    // 2.1 Nexus Internal Users
    const nexusRepMaya = await prisma.user.create({
        data: {
            companyId: compNexus.id,
            email: 'maya.rep@nexustech.com',
            passwordHash,
            name: 'Maya Lin',
            role: UserRole.SALES_REP,
        },
    });

    const nexusMgrLiam = await prisma.user.create({
        data: {
            companyId: compNexus.id,
            email: 'liam.mgr@nexustech.com',
            passwordHash,
            name: 'Liam Chen',
            role: UserRole.MANAGER,
        },
    });

    const nexusFinSophia = await prisma.user.create({
        data: {
            companyId: compNexus.id,
            email: 'sophia.fin@nexustech.com',
            passwordHash,
            name: 'Sophia Patel',
            role: UserRole.FINANCE,
        },
    });

    const nexusAdminEric = await prisma.user.create({
        data: {
            companyId: compNexus.id,
            email: 'admin@nexustech.com',
            passwordHash,
            name: 'Eric Admin',
            role: UserRole.ADMIN,
        },
    });

    // 2.2 Nexus Buying Customers (INCLUDING Acme Enterprise Solutions!)
    const nexusCustAcme = await prisma.customer.create({
        data: {
            companyId: compNexus.id,
            name: 'Acme Enterprise Solutions',
            email: 'procurement@acme.com', // Cross-company buyer: Acme buying from Nexus!
            tier: CustomerTier.GOLD,
            reliabilityScore: 97,
            consecutiveOnTimeCount: 4,
            portalPasswordHash: passwordHash,
        },
    });

    const nexusCustStarlight = await prisma.customer.create({
        data: {
            companyId: compNexus.id,
            name: 'Starlight Aerospace Dynamics',
            email: 'contracts@starlight-aero.com',
            tier: CustomerTier.GOLD,
            reliabilityScore: 95,
            consecutiveOnTimeCount: 5,
            portalPasswordHash: passwordHash,
        },
    });

    const nexusCustFinTech = await prisma.customer.create({
        data: {
            companyId: compNexus.id,
            name: 'FinTech Global Capital',
            email: 'trading-ops@fintechglobal.com',
            tier: CustomerTier.SILVER,
            reliabilityScore: 82,
            consecutiveOnTimeCount: 2,
            portalPasswordHash: passwordHash,
        },
    });

    const nexusCustQuantum = await prisma.customer.create({
        data: {
            companyId: compNexus.id,
            name: 'Quantum Robotics Corp',
            email: 'supply@quantumrobotics.io',
            tier: CustomerTier.BRONZE,
            reliabilityScore: 42,
            consecutiveOnTimeCount: 0,
            portalPasswordHash: passwordHash,
        },
    });

    // 2.3 Nexus Governance Rules
    await prisma.discountTier.createMany({
        data: [
            { companyId: compNexus.id, tier: CustomerTier.BRONZE, maxDiscountPercent: new Prisma.Decimal(6.0) },
            { companyId: compNexus.id, tier: CustomerTier.SILVER, maxDiscountPercent: new Prisma.Decimal(15.0) },
            { companyId: compNexus.id, tier: CustomerTier.GOLD, maxDiscountPercent: new Prisma.Decimal(25.0) },
        ],
    });

    await prisma.categoryDiscountLimit.createMany({
        data: [
            { companyId: compNexus.id, category: 'AI Hardware', maxDiscountPercent: new Prisma.Decimal(15.0) },
            { companyId: compNexus.id, category: 'AI SaaS', maxDiscountPercent: new Prisma.Decimal(30.0) },
            { companyId: compNexus.id, category: 'Cloud Consulting', maxDiscountPercent: new Prisma.Decimal(20.0) },
        ],
    });

    await prisma.approvalChainRule.createMany({
        data: [
            {
                companyId: compNexus.id,
                minDiscountPercent: new Prisma.Decimal(0.0),
                maxDiscountPercent: new Prisma.Decimal(10.0),
                requiresManager: false,
                requiresFinance: false,
                priority: 0,
            },
            {
                companyId: compNexus.id,
                minDiscountPercent: new Prisma.Decimal(10.01),
                maxDiscountPercent: new Prisma.Decimal(25.0),
                requiresManager: true,
                requiresFinance: false,
                priority: 1,
            },
            {
                companyId: compNexus.id,
                minDiscountPercent: new Prisma.Decimal(25.01),
                maxDiscountPercent: new Prisma.Decimal(999.99),
                requiresManager: true,
                requiresFinance: true,
                priority: 2,
            },
        ],
    });

    // 2.4 Nexus Warehouses
    const nexusWhSV = await prisma.warehouse.create({
        data: {
            companyId: compNexus.id,
            name: 'Nexus Silicon Valley Depot (San Jose)',
            shippingCostWeight: new Prisma.Decimal(1.15),
        },
    });

    const nexusWhFrankfurt = await prisma.warehouse.create({
        data: {
            companyId: compNexus.id,
            name: 'Nexus European Logistics Hub (Frankfurt)',
            shippingCostWeight: new Prisma.Decimal(1.55),
        },
    });

    // 2.5 Nexus Products & Stock
    const nexusProdNeural = await prisma.product.create({
        data: {
            companyId: compNexus.id,
            name: 'Nexus Quantum Neural Accelerator NX-1',
            category: 'AI Hardware',
            basePrice: new Prisma.Decimal(4200.0),
            unit: 'rack unit',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(45.0),
            description: 'Liquid-cooled dense tensor engine for LLM inference clusters',
        },
    });

    const nexusProdVectorDB = await prisma.product.create({
        data: {
            companyId: compNexus.id,
            name: 'HyperScale Vector Database Enterprise',
            category: 'AI SaaS',
            basePrice: new Prisma.Decimal(450.0),
            unit: 'cluster/month',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(88.0),
            description: 'Sub-millisecond billion-vector similarity search cloud database',
        },
    });

    const nexusProdConsulting = await prisma.product.create({
        data: {
            companyId: compNexus.id,
            name: 'DevSecOps & FinOps Architecture Retainer',
            category: 'Cloud Consulting',
            basePrice: new Prisma.Decimal(2800.0),
            unit: 'month',
            taxRate: new Prisma.Decimal(18.0),
            marginPercent: new Prisma.Decimal(70.0),
            description: 'Senior Principal Cloud Solutions Architect monthly advisory retainer',
        },
    });

    const nexusStockNeuralSV = await prisma.stockLevel.create({
        data: {
            warehouseId: nexusWhSV.id,
            productId: nexusProdNeural.id,
            companyId: compNexus.id,
            quantityAvailable: 45,
            quantityReserved: 5,
            replenishmentThreshold: 10,
        },
    });

    const nexusPlanVector = await prisma.subscriptionPlan.create({
        data: {
            companyId: compNexus.id,
            productId: nexusProdVectorDB.id,
            name: 'HyperScale Vector Cluster Dedicated Plan',
            billingCycle: BillingCycle.MONTHLY,
            prorationRule: ProrationRule.DAILY_RATE,
            cancellationRefundRule: CancellationRefundRule.PRORATED,
        },
    });

    // 2.6 Nexus Quotations:
    // [Cross-trade 2]: Nexus sells to Acme Enterprise Solutions (CONFIRMED)
    console.log('  -> Creating cross-company trade: Nexus sells to Acme Enterprise Solutions...');
    const quoteNexusToAcme = await prisma.quotation.create({
        data: {
            companyId: compNexus.id,
            customerId: nexusCustAcme.id, // Acme is the buying customer!
            repId: nexusRepMaya.id,
            status: QuotationStatus.CONFIRMED,
            blendedRiskScore: new Prisma.Decimal(0.0),
            createdAt: new Date(Date.now() - 20 * 86400000),
            updatedAt: new Date(Date.now() - 19 * 86400000),
            lastActivityAt: new Date(Date.now() - 19 * 86400000),
        },
    });

    const lineNexusToAcme1 = await prisma.quotationLine.create({
        data: {
            quotationId: quoteNexusToAcme.id,
            productId: nexusProdNeural.id,
            quantity: 4,
            unitPrice: new Prisma.Decimal(4200.0),
            discountPercent: new Prisma.Decimal(10.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(25.0),
            lineType: LineType.ONE_TIME,
        },
    });

    const lineNexusToAcme2 = await prisma.quotationLine.create({
        data: {
            quotationId: quoteNexusToAcme.id,
            productId: nexusProdVectorDB.id,
            quantity: 2,
            unitPrice: new Prisma.Decimal(450.0),
            discountPercent: new Prisma.Decimal(12.0),
            categoryLimitAtTime: new Prisma.Decimal(30.0),
            tierLimitAtTime: new Prisma.Decimal(25.0),
            lineType: LineType.RECURRING,
        },
    });

    await prisma.fulfillmentSplit.create({
        data: {
            quotationLineId: lineNexusToAcme1.id,
            warehouseId: nexusWhSV.id,
            stockLevelId: nexusStockNeuralSV.id,
            quantityFulfilled: 4,
            isBackorder: false,
            fulfilledAt: new Date(Date.now() - 18 * 86400000),
        },
    });

    const subAcmeVector = await prisma.subscription.create({
        data: {
            quotationLineId: lineNexusToAcme2.id,
            planId: nexusPlanVector.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: new Date(Date.now() + 35 * 86400000),
            nextBillingDate: new Date(Date.now() + 35 * 86400000),
        },
    });

    const invAcme1 = await prisma.billingEvent.create({
        data: {
            subscriptionId: subAcmeVector.id,
            type: BillingEventType.INVOICE,
            amount: new Prisma.Decimal(792.0),
            dueDate: new Date(Date.now() - 10 * 86400000),
            paidAt: new Date(Date.now() - 12 * 86400000),
        },
    });

    await prisma.payment.create({
        data: {
            billingEventId: invAcme1.id,
            customerId: nexusCustAcme.id,
            amount: new Prisma.Decimal(792.0),
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(Date.now() - 12 * 86400000),
            daysLate: -2,
        },
    });

    // Quotation 2 in Nexus: NEGOTIATING with Starlight Aerospace
    const quoteNexusStarlightNeg = await prisma.quotation.create({
        data: {
            companyId: compNexus.id,
            customerId: nexusCustStarlight.id,
            repId: nexusRepMaya.id,
            status: QuotationStatus.NEGOTIATING,
            blendedRiskScore: new Prisma.Decimal(15.0),
            createdAt: new Date(Date.now() - 3 * 86400000),
            updatedAt: new Date(Date.now() - 1 * 86400000),
            lastActivityAt: new Date(Date.now() - 1 * 86400000),
        },
    });

    const lineNexusStarlight = await prisma.quotationLine.create({
        data: {
            quotationId: quoteNexusStarlightNeg.id,
            productId: nexusProdNeural.id,
            quantity: 8,
            unitPrice: new Prisma.Decimal(4200.0),
            discountPercent: new Prisma.Decimal(18.0),
            categoryLimitAtTime: new Prisma.Decimal(15.0),
            tierLimitAtTime: new Prisma.Decimal(25.0),
            lineType: LineType.ONE_TIME,
        },
    });

    await prisma.negotiationProposal.create({
        data: {
            quotationId: quoteNexusStarlightNeg.id,
            lineId: lineNexusStarlight.id,
            proposedByType: ProposedByType.CUSTOMER,
            proposedByCustomerId: nexusCustStarlight.id,
            proposedChanges: { discountPercent: 20.0, quantity: 10 },
            message: 'Starlight can scale our GPU cluster order to 10 nodes if discount is set to 20%.',
            snapshotLimits: { categoryLimit: 15.0, tierLimit: 25.0 },
            status: ProposalStatus.PENDING,
            expiresAt: new Date(Date.now() + 48 * 3600000),
            createdAt: new Date(Date.now() - 1 * 86400000),
        },
    });

    // Quotation 3 in Nexus: PENDING_APPROVAL and STALLED (>7 days inactive)
    const quoteNexusQuantumStalled = await prisma.quotation.create({
        data: {
            companyId: compNexus.id,
            customerId: nexusCustQuantum.id,
            repId: nexusRepMaya.id,
            status: QuotationStatus.PENDING_APPROVAL,
            blendedRiskScore: new Prisma.Decimal(18.5),
            createdAt: new Date(Date.now() - 16 * 86400000),
            updatedAt: new Date(Date.now() - 10 * 86400000),
            lastActivityAt: new Date(Date.now() - 10 * 86400000),
        },
    });

    await prisma.quotationLine.create({
        data: {
            quotationId: quoteNexusQuantumStalled.id,
            productId: nexusProdConsulting.id,
            quantity: 6,
            unitPrice: new Prisma.Decimal(2800.0),
            discountPercent: new Prisma.Decimal(18.0),
            categoryLimitAtTime: new Prisma.Decimal(20.0),
            tierLimitAtTime: new Prisma.Decimal(6.0),
            lineType: LineType.RECURRING,
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: quoteNexusQuantumStalled.id,
            approverRole: UserRole.MANAGER,
            approverId: nexusMgrLiam.id,
            status: ApprovalStatus.PENDING,
            stepOrder: 1,
            createdAt: new Date(Date.now() - 10 * 86400000),
        },
    });

    // Quotation 4 in Nexus: Multi-tier APPROVED
    const quoteNexusFinTechApproved = await prisma.quotation.create({
        data: {
            companyId: compNexus.id,
            customerId: nexusCustFinTech.id,
            repId: nexusRepMaya.id,
            status: QuotationStatus.APPROVED,
            blendedRiskScore: new Prisma.Decimal(28.0),
            createdAt: new Date(Date.now() - 6 * 86400000),
            updatedAt: new Date(Date.now() - 2 * 86400000),
            lastActivityAt: new Date(Date.now() - 2 * 86400000),
        },
    });

    await prisma.quotationLine.create({
        data: {
            quotationId: quoteNexusFinTechApproved.id,
            productId: nexusProdVectorDB.id,
            quantity: 10,
            unitPrice: new Prisma.Decimal(450.0),
            discountPercent: new Prisma.Decimal(28.0),
            categoryLimitAtTime: new Prisma.Decimal(30.0),
            tierLimitAtTime: new Prisma.Decimal(15.0),
            lineType: LineType.RECURRING,
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: quoteNexusFinTechApproved.id,
            approverRole: UserRole.MANAGER,
            approverId: nexusMgrLiam.id,
            status: ApprovalStatus.APPROVED,
            stepOrder: 1,
            actedAt: new Date(Date.now() - 3 * 86400000),
            reason: 'FinTech high-frequency trading pilot approved.',
        },
    });

    await prisma.approvalStep.create({
        data: {
            quotationId: quoteNexusFinTechApproved.id,
            approverRole: UserRole.FINANCE,
            approverId: nexusFinSophia.id,
            status: ApprovalStatus.APPROVED,
            stepOrder: 2,
            actedAt: new Date(Date.now() - 2 * 86400000),
            reason: 'Software SaaS margin verified at 79% after 28% discount.',
        },
    });

    // Audit logs for both companies
    const auditLogs = [
        {
            companyId: compAcme.id,
            userId: acmeRepJohn.id,
            entityType: 'Quotation',
            entityId: qAcmeToNexus.id,
            action: 'CREATED',
            metadata: { totalValue: 13875.0 },
            createdAt: new Date(Date.now() - 25 * 86400000),
        },
        {
            companyId: compAcme.id,
            userId: null,
            entityType: 'Quotation',
            entityId: qAcmeToNexus.id,
            action: 'CONFIRMED',
            metadata: { confirmedBy: acmeCustNexus.id, confirmedByType: 'CUSTOMER' },
            createdAt: new Date(Date.now() - 24 * 86400000),
        },
        {
            companyId: compAcme.id,
            userId: acmeRepElena.id,
            entityType: 'Quotation',
            entityId: qAcmeBackorder.id,
            action: 'BACKORDER_CREATED',
            metadata: { reason: 'Insufficient stock at time of confirmation', backorderQty: 3 },
            createdAt: new Date(Date.now() - 9 * 86400000),
        },
        {
            companyId: compAcme.id,
            userId: acmeAdminDavid.id,
            entityType: 'Quotation',
            entityId: qAcmeStalled.id,
            action: 'ESCALATED',
            metadata: { reason: 'Deal stalled over 7 days in review queue' },
            createdAt: new Date(Date.now() - 2 * 86400000),
        },
        {
            companyId: compNexus.id,
            userId: nexusRepMaya.id,
            entityType: 'Quotation',
            entityId: quoteNexusToAcme.id,
            action: 'CREATED',
            metadata: { totalValue: 15912.0 },
            createdAt: new Date(Date.now() - 20 * 86400000),
        },
        {
            companyId: compNexus.id,
            userId: null,
            entityType: 'Quotation',
            entityId: quoteNexusToAcme.id,
            action: 'CONFIRMED',
            metadata: { confirmedBy: nexusCustAcme.id, confirmedByType: 'CUSTOMER' },
            createdAt: new Date(Date.now() - 19 * 86400000),
        },
    ];

    for (const log of auditLogs) {
        await prisma.auditLog.create({ data: log });
    }

    // =========================================================================
    // SUMMARY CREDENTIALS & DEMO FLOW TABLE
    // =========================================================================
    console.log('\n========================================================================================================');
    console.log('                 DEALFLOW360 MULTI-TENANT & ALL EDGE CASES SEED COMPLETED!                              ');
    console.log('========================================================================================================\n');

    console.log('--- 1. COMPANY 1: [ acme-corp ] Acme Enterprise Solutions ---');
    console.log('• Internal Team (Seller View: Quotes, Products, Warehouses, Approvals):');
    console.table([
        { Name: acmeRepJohn.name, Email: acmeRepJohn.email, Role: acmeRepJohn.role, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Name: acmeRepElena.name, Email: acmeRepElena.email, Role: acmeRepElena.role, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Name: acmeMgrSarah.name, Email: acmeMgrSarah.email, Role: acmeMgrSarah.role, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Name: acmeFinMarcus.name, Email: acmeFinMarcus.email, Role: acmeFinMarcus.role, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Name: acmeAdminDavid.name, Email: acmeAdminDavid.email, Role: acmeAdminDavid.role, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
    ]);

    console.log('• Customers Buying from Acme (Customer Portal Login using Slug: acme-corp):');
    console.table([
        { Customer: acmeCustNexus.name + ' (CROSS-COMPANY BUYER!)', Email: acmeCustNexus.email, Tier: acmeCustNexus.tier, Score: acmeCustNexus.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustGlobex.name, Email: acmeCustGlobex.email, Tier: acmeCustGlobex.tier, Score: acmeCustGlobex.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustZenith.name, Email: acmeCustZenith.email, Tier: acmeCustZenith.tier, Score: acmeCustZenith.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustVortex.name, Email: acmeCustVortex.email, Tier: acmeCustVortex.tier, Score: acmeCustVortex.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustBioTech.name, Email: acmeCustBioTech.email, Tier: acmeCustBioTech.tier, Score: acmeCustBioTech.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustApex.name, Email: acmeCustApex.email, Tier: acmeCustApex.tier, Score: acmeCustApex.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustCascade.name, Email: acmeCustCascade.email, Tier: acmeCustCascade.tier, Score: acmeCustCascade.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
        { Customer: acmeCustNova.name, Email: acmeCustNova.email, Tier: acmeCustNova.tier, Score: acmeCustNova.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_ACME },
    ]);

    console.log('\n--- 2. COMPANY 2: [ nexus-tech ] Nexus Cloud Technologies ---');
    console.log('• Internal Team (Seller View: AI Hardware, Vector DB, High-Tier Governance):');
    console.table([
        { Name: nexusRepMaya.name, Email: nexusRepMaya.email, Role: nexusRepMaya.role, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
        { Name: nexusMgrLiam.name, Email: nexusMgrLiam.email, Role: nexusMgrLiam.role, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
        { Name: nexusFinSophia.name, Email: nexusFinSophia.email, Role: nexusFinSophia.role, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
        { Name: nexusAdminEric.name, Email: nexusAdminEric.email, Role: nexusAdminEric.role, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
    ]);

    console.log('• Customers Buying from Nexus (Customer Portal Login using Slug: nexus-tech):');
    console.table([
        { Customer: nexusCustAcme.name + ' (CROSS-COMPANY BUYER!)', Email: nexusCustAcme.email, Tier: nexusCustAcme.tier, Score: nexusCustAcme.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
        { Customer: nexusCustStarlight.name, Email: nexusCustStarlight.email, Tier: nexusCustStarlight.tier, Score: nexusCustStarlight.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
        { Customer: nexusCustFinTech.name, Email: nexusCustFinTech.email, Tier: nexusCustFinTech.tier, Score: nexusCustFinTech.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
        { Customer: nexusCustQuantum.name, Email: nexusCustQuantum.email, Tier: nexusCustQuantum.tier, Score: nexusCustQuantum.reliabilityScore, Password: DEFAULT_PASSWORD, Slug: SLUG_NEXUS },
    ]);

    console.log('\n--- 3. CROSS-COMPANY SELLING & BUYING DEMO MATRIX ---');
    console.table([
        {
            Scenario: 'Acme sells IoT & Telemetry to Nexus',
            SellerSlug: SLUG_ACME,
            SellerLogin: 'john.rep@acme.com',
            BuyerCompany: 'Nexus Cloud Technologies',
            BuyerPortalSlug: SLUG_ACME,
            BuyerPortalLogin: 'procurement@nexustech.com',
            Status: 'CONFIRMED & Shipped',
        },
        {
            Scenario: 'Nexus sells AI Neural Engine & Vector DB to Acme',
            SellerSlug: SLUG_NEXUS,
            SellerLogin: 'maya.rep@nexustech.com',
            BuyerCompany: 'Acme Enterprise Solutions',
            BuyerPortalSlug: SLUG_NEXUS,
            BuyerPortalLogin: 'procurement@acme.com',
            Status: 'CONFIRMED & Shipped',
        },
    ]);
    console.log('========================================================================================================\n');
}

main()
    .catch((e) => {
        console.error('Seeding error: ', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
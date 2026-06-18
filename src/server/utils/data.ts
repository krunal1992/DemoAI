import { LogEntry, Product, DistributionCenterInfo, AnomalyReport } from "../types/index.js";

// Sample products catalog with initial baselines
export const PRODUCTS: Product[] = [
  { id: "PROD-MILK", name: "SuperFresh Milk Organic (1 Gal)", category: "Dairy", price: 5.99, minStock: 120, maxStock: 600, leadTimeDays: 2, unit: "Gallons" },
  { id: "PROD-BREAD", name: "Whole Wheat Loaf (24 oz)", category: "Bakery", price: 3.49, minStock: 150, maxStock: 750, leadTimeDays: 1, unit: "Loaves" },
  { id: "PROD-JUICE", name: "Premium Citrus Orange Juice (59 oz)", category: "Beverage", price: 4.89, minStock: 100, maxStock: 500, leadTimeDays: 3, unit: "Bottles" },
  { id: "PROD-TOMATO", name: "Golden Harvest Canned Tomatoes (14 oz)", category: "Pantry", price: 1.79, minStock: 200, maxStock: 1000, leadTimeDays: 5, unit: "Cans" },
  { id: "PROD-CHIPS", name: "Sea Salt Kettle Chips (8 oz)", category: "Snacks", price: 3.99, minStock: 180, maxStock: 900, leadTimeDays: 4, unit: "Bags" },
  { id: "PROD-SUGAR", name: "Pure Cane Sugar (4 lbs)", category: "Baking", price: 2.99, minStock: 100, maxStock: 600, leadTimeDays: 6, unit: "Bags" },
  { id: "PROD-PEANUT", name: "Premium Creamy Peanut Butter (16 oz)", category: "Spreads", price: 4.49, minStock: 80, maxStock: 450, leadTimeDays: 5, unit: "Jars" },
  { id: "PROD-COOKI", name: "Double Chocolate Cookies (12 oz)", category: "Confectionery", price: 3.89, minStock: 120, maxStock: 600, leadTimeDays: 3, unit: "Boxes" },
  { id: "PROD-PASTA", name: "Gluten-Free Penne Pasta (12 oz)", category: "Pantry", price: 2.29, minStock: 150, maxStock: 800, leadTimeDays: 4, unit: "Boxes" },
  { id: "PROD-OLIVE", name: "Extra Virgin Olive Oil (16.9 oz)", category: "Pantry", price: 9.99, minStock: 80, maxStock: 400, leadTimeDays: 7, unit: "Bottles" }
];

export const DISTRIBUTION_CENTERS = ["DC-East", "DC-West", "DC-Central", "DC-South"];

// Predefined operational alerts and normal activities to construct a realistic 500+ log dataset
const NORMAL_LOG_TEMPLATES = [
  { service: "InventoryService", severity: "INFO" as const, message: "Cyclic stock count completed. Physical levels match electronic registers." },
  { service: "OrderProcessor", severity: "INFO" as const, message: "Inbound sales order batched and successfully transmitted to dispatch queue." },
  { service: "LogisticsCarrier", severity: "INFO" as const, message: "Standard transit dispatch milestone reached on interstate route." },
  { service: "WarehouseMgmt", severity: "INFO" as const, message: "Dynamic cross-dock operation scheduled and completed for pantry storage aisle." },
  { service: "SupplierERP", severity: "INFO" as const, message: "Supplier confirmed receipt of restocking invoice and marked as pending shipment." }
];

// Generates 500 synthetic logs, integrating both normal baseline patterns and the 10 distinct anomaly situations
export function generateSyntheticLogs(): LogEntry[] {
  const logs: LogEntry[] = [];
  const baseDate = new Date("2026-06-10T00:00:00Z");

  // Trace ID counter
  let traceNum = 10000;
  const getTraceId = () => `trace-cpg-${traceNum++}`;

  // Helper to generate precise scenario logs
  const injectScenario = (
    scenarioId: string,
    dc: string,
    product: Product,
    hourOffset: number,
    severity: "WARNING" | "ERROR",
    service: string,
    message: string,
    metadata?: any
  ) => {
    const timestamp = new Date(baseDate.getTime() + (hourOffset * 3600 * 1000));
    logs.push({
      id: `L-${scenarioId}-${logs.length}`,
      timestamp: timestamp.toISOString(),
      dc,
      service,
      traceId: getTraceId(),
      severity,
      message,
      metadata: {
        scenarioId,
        productId: product.id,
        category: product.category,
        productName: product.name,
        ...metadata
      }
    });
  };

  // Build normal background transactions (Interleaved standard logistics and inventory checks)
  for (let hour = 0; hour < 192; hour++) { // 8 days total
    const currentTimestamp = new Date(baseDate.getTime() + (hour * 3600 * 1000));
    
    // Day/Night activity adjustments
    const logProbability = (currentTimestamp.getUTCHours() > 6 && currentTimestamp.getUTCHours() < 18) ? 0.8 : 0.3;
    
    if (Math.random() < logProbability) {
      // Create a standard transactional log
      const dc = DISTRIBUTION_CENTERS[hour % DISTRIBUTION_CENTERS.length];
      const prod = PRODUCTS[hour % PRODUCTS.length];
      const tpl = NORMAL_LOG_TEMPLATES[Math.floor(Math.random() * NORMAL_LOG_TEMPLATES.length)];
      
      logs.push({
        id: `L-NORM-${logs.length}`,
        timestamp: currentTimestamp.toISOString(),
        dc,
        service: tpl.service,
        traceId: getTraceId(),
        severity: tpl.severity,
        message: `${prod.name} at ${dc}: ${tpl.message}`,
        metadata: {
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          stockLevel: Math.floor(Math.random() * (prod.maxStock - prod.minStock)) + prod.minStock,
          burnRate: (3 + Math.random() * 5).toFixed(1)
        }
      });
    }
  }

  // Interleave the 10 core supply chain anomalies perfectly distributed across the 10 products
  
  // 1. Demand Surge Anomaly -> Milk Organic at DC-East (Triggered by extreme weather/heatwave)
  const p1 = PRODUCTS[0]; // Milk
  for (let i = 24; i < 30; i++) {
    const surgeLevel = Math.floor(80 + (i - 24) * 35);
    injectScenario(
      "ANOMALY-01", "DC-East", p1, i, "WARNING", "OrderProcessor",
      `Unusually high transaction volume for ${p1.name}. Speed index elevated.`,
      { orderRate: surgeLevel, normalRate: 20 }
    );
    injectScenario(
      "ANOMALY-01", "DC-East", p1, i + 1, "ERROR", "InventoryService",
      `${p1.name} organic stock depleted below minimum threshhold. Stock out event imminent at current burn-rate.`,
      { stockLevel: 15, triggerThreshold: p1.minStock, currentBurnRate: 15.2 }
    );
  }

  // 2. Inventory Shrinkage Leak -> Bread Whole Wheat at DC-West (Theft or stock count failure)
  const p2 = PRODUCTS[1]; // Bread
  for (let i = 40; i < 48; i += 2) {
    const virtualStock = 300 - (i - 40) * 10;
    const actualAuditCount = virtualStock - ((i - 40) * 12 + 15);
    injectScenario(
      "ANOMALY-02", "DC-West", p2, i, "WARNING", "InventoryService",
      `Discrepancy registered between ERP ledger and active load sensors for '${p2.name}'. Audit scheduled.`,
      { virtualStock, actualAuditCount }
    );
    injectScenario(
      "ANOMALY-02", "DC-West", p2, i + 1, "ERROR", "InventoryService",
      `Spatula/Cycle count audit matches: persistent inventory leak detected at ${p2.name} aisle.`,
      { deltaLossUnits: 75, auditStatus: "confirmed_leak" }
    );
  }

  // 3. Warehouse Dispatch Bottleneck -> Orange Juice at DC-Central (Forklift congestion)
  const p3 = PRODUCTS[2]; // Juice
  for (let i = 56; i < 62; i++) {
    injectScenario(
      "ANOMALY-03", "DC-Central", p3, i, "WARNING", "WarehouseMgmt",
      `Dispatch queue at Loading Bay 4 for ${p3.name} is stalled. Forklift activity saturated.`,
      { loadingBay: 4, waitingTrucks: 8, avgLoadingDelayMinutes: 45 }
    );
    injectScenario(
      "ANOMALY-03", "DC-Central", p3, i + 1, "ERROR", "WarehouseMgmt",
      `Shipment dispatch SLA violated. Multi-hour queue buildup blocking incoming cross-dock lanes.`,
      { totalDelayHours: 4.2, status: "blocked" }
    );
  }

  // 4. Transport Logistics Delay -> Canned Tomatoes at DC-South (Interstate Blizzard/Delays)
  const p4 = PRODUCTS[3]; // Tomatoes
  for (let i = 70; i < 76; i += 2) {
    injectScenario(
      "ANOMALY-04", "DC-South", p4, i, "WARNING", "LogisticsCarrier",
      `Route alert: Carrier reports heavy blizzard conditions on Interstate-80. Transport speed slowed by 70%.`,
      { route: "I-80-Eastbound", currentSpeedMph: 15 }
    );
    injectScenario(
      "ANOMALY-04", "DC-South", p4, i + 1, "ERROR", "LogisticsCarrier",
      `Estimated Arrival Time (ETA) for ${p4.name} delivery raw inputs has slipped by 18 hours. Stoppage recorded.`,
      { originalEta: "2026-06-13T10:00:00Z", adjustedEta: "2026-06-14T04:00:00Z" }
    );
  }

  // 5. ERP Supplier Sync Fault -> Kettle Chips at DC-East (REST request fails)
  const p5 = PRODUCTS[4]; // Chips
  for (let i = 88; i < 92; i++) {
    injectScenario(
      "ANOMALY-05", "DC-East", p5, i, "WARNING", "SupplierERP",
      `Failed to transmit automated EDI purchase request for ${p5.name} replenishment. Internal service timeout.`,
      { endpoint: "/v2/restock/orders", responseCode: 504 }
    );
    injectScenario(
      "ANOMALY-05", "DC-East", p5, i + 2, "ERROR", "SupplierERP",
      `Sync with supplier database fractured. Automated reordering system is suspended for Chips category.`,
      { syncAttempts: 5, errorPattern: "API_TIMEOUT" }
    );
  }

  // 6. Supplier Allocation Cap -> Pure Sugar at DC-West (Competitor peak ordering)
  const p6 = PRODUCTS[5]; // Sugar
  for (let i = 104; i < 110; i += 2) {
    injectScenario(
      "ANOMALY-06", "DC-West", p6, i, "WARNING", "SupplierERP",
      `Supplier notifies priority tier allocation active. Bulk sugar availability rationed.`,
      { requestedStock: 500, allocatedStock: 150 }
    );
    injectScenario(
      "ANOMALY-06", "DC-West", p6, i + 1, "ERROR", "SupplierERP",
      `Replenishment call partially declined. High supplier queue saturation blocking baking stockouts fixes.`,
      { deficitAmount: 350, rejectionCode: "CAPACITY_EXHAUSTED" }
    );
  }

  // 7. Cascading Delivery Delays -> Peanut Butter at DC-Central (Package glass jar supply chain blockage)
  const p7 = PRODUCTS[6]; // Peanut Butter
  for (let i = 120; i < 126; i++) {
    injectScenario(
      "ANOMALY-07", "DC-Central", p7, i, "WARNING", "SupplierERP",
      `Glass jar manufacturer reports silica shortage. Delivery of packaging jars delayed indefinitely.`,
      { primaryContainerType: "Glass 16oz Jar", industryShortageIndex: "High" }
    );
    injectScenario(
      "ANOMALY-07", "DC-Central", p7, i + 1, "ERROR", "InventoryService",
      `Cascading stockouts reported across all DC distribution lines due to missing outer packaging items.`,
      { outOfStockCount: 3, affectedDistributionCenters: ["DC-Central", "DC-West", "DC-East"] }
    );
  }

  // 8. Warehouse Operational Deadlock -> Chocolate Cookies at DC-South (Gate and paperwork lock)
  const p8 = PRODUCTS[7]; // Cookies
  for (let i = 136; i < 140; i++) {
    injectScenario(
      "ANOMALY-08", "DC-South", p8, i, "WARNING", "WarehouseMgmt",
      `Truck loading deadlock at DC South Gate 2. Invoice mismatch locks carrier transit manifest.`,
      { invoiceRef: "INV-9283-A", discrepancyPercent: 12.5 }
    );
    injectScenario(
      "ANOMALY-08", "DC-South", p8, i + 1, "ERROR", "WarehouseMgmt",
      `Incoming delivery vehicle line-up blocking local arterial streets. Police escort requested. Gridlock active.`,
      { waitingVehiclesCount: 14, backlogDurationMinutes: 180 }
    );
  }

  // 9. Cold-Chain Reefers Degradation -> Organic Penne Pasta / Dairy refrigerated mix-ups
  // Wait, organic milk or refrigerated orange juice is perishable, but let's say the Cookie/Dairy logistics reefer truck carrying refrigerated cookie dough spoils:
  const p9 = PRODUCTS[7]; // Cookies / Cookie Dough
  for (let i = 152; i < 156; i++) {
    const tempCelsius = 8.5 + (i - 152) * 1.5;
    injectScenario(
      "ANOMALY-09", "DC-East", p9, i, "WARNING", "ColdChainSensors",
      `Reefer shipping container #RC-808 temperature alert. Sensor registers levels outside safety baseline.`,
      { reeferId: "RC-808", currentTemperature: tempCelsius, status: "degraded" }
    );
    injectScenario(
      "ANOMALY-09", "DC-East", p9, i + 1, "ERROR", "ColdChainSensors",
      `Refrigerated cargo spoiled and declared hazardous. Delivery cargo load rejected at DC-East primary dock.`,
      { spoilageCode: "TEMP_EXCEEDED", disposalWeightLbs: 2400 }
    );
  }

  // 10. Peak Holiday Staffing Shortage -> Gluten-Free Pasta at DC-West (Autoscaling labor failure)
  const p10 = PRODUCTS[8]; // Pasta
  for (let i = 170; i < 176; i++) {
    injectScenario(
      "ANOMALY-10", "DC-West", p10, i, "WARNING", "WarehouseMgmt",
      `Staff attendance audit signals missing shift targets. Seasonal volume scaling failed.`,
      { targetStaff: 45, currentStaff: 18, pendingOrdersQueue: 280 }
    );
    injectScenario(
      "ANOMALY-10", "DC-West", p10, i + 1, "ERROR", "WarehouseMgmt",
      `Labor shortage creates packing delay spikes. Order turnaround speeds exceed standard SLAs.`,
      { ordersDelayed: 185, cycleTimeHours: 14.5 }
    );
  }

  // Sort logs by ISO timestamp
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Generate distribution centers inventory summary
export function generateInventoryStatus(logs: LogEntry[]): DistributionCenterInfo[] {
  const statusMap = new Map<string, Map<string, number>>();

  // Set initial baselines for all DCs and products page elements
  DISTRIBUTION_CENTERS.forEach(dc => {
    const dcProds = new Map<string, number>();
    PRODUCTS.forEach(p => {
      // Start with a healthy robust random baseline
      dcProds.set(p.id, Math.floor(p.minStock * 1.5 + Math.random() * (p.maxStock - p.minStock * 1.5)));
    });
    statusMap.set(dc, dcProds);
  });

  // Replay logs to reflect accurate stock levels based on scenarios
  logs.forEach(log => {
    const dcInfo = statusMap.get(log.dc);
    if (!dcInfo) return;

    const prodId = log.metadata?.productId;
    if (!prodId) return;

    let current = dcInfo.get(prodId) || 200;

    // Apply stock delta based on logs/alerts
    if (log.metadata.scenarioId === "ANOMALY-01") { // Milk Depleted surge
      dcInfo.set(prodId, 12); // depletion to critical low
    } else if (log.metadata.scenarioId === "ANOMALY-02") { // Leak/Shrinkage
      dcInfo.set(prodId, Math.max(25, current - 45));
    } else if (log.metadata.scenarioId === "ANOMALY-06") { // Sugar allocation ration
      dcInfo.set(prodId, 45); // low level due to deficit
    } else if (log.metadata.scenarioId === "ANOMALY-07") { // PB glass jar delay
      dcInfo.set(prodId, 18); // highly stalled
    } else if (log.severity === "ERROR") {
      // General slight decreasement
      dcInfo.set(prodId, Math.max(30, current - Math.floor(Math.random() * 20)));
    }
  });

  const list: DistributionCenterInfo[] = [];
  statusMap.forEach((pMap, dcName) => {
    const items: any[] = [];
    pMap.forEach((stock, prodId) => {
      const prod = PRODUCTS.find(p => p.id === prodId)!;
      let status: "OK" | "WARNING" | "CRITICAL" = "OK";
      if (stock <= prod.minStock * 0.4) {
        status = "CRITICAL";
      } else if (stock <= prod.minStock) {
        status = "WARNING";
      }

      // Estimate burn rates
      let burnRate = 4.5 + Math.random() * 8;
      if (prodId === "PROD-MILK" && dcName === "DC-East") burnRate = 18.4;
      if (prodId === "PROD-CHIPS" && dcName === "DC-West") burnRate = 14.8;

      const daysToEmpty = Math.max(0, parseFloat((stock / burnRate).toFixed(1)));

      items.push({
        productId: prodId,
        productName: prod.name,
        category: prod.category,
        stockLevel: stock,
        minStock: prod.minStock,
        maxStock: prod.maxStock,
        burnRate: parseFloat(burnRate.toFixed(1)),
        daysToEmpty,
        status,
        unit: prod.unit
      });
    });

    list.push({
      dc_id: dcName,
      name: `Core Warehouse: ${dcName}`,
      location: dcName === "DC-East" ? "Boston, MA" : dcName === "DC-West" ? "Oakland, CA" : dcName === "DC-Central" ? "Chicago, IL" : "Atlanta, GA",
      items
    });
  });

  return list;
}

// Generate Expert Annotations and expected anomaly definitions
export const ANOMALIES_DEF: Record<string, Omit<AnomalyReport, "id" | "timestamp">> = {
  "ANOMALY-01": {
    scenarioId: "ANOMALY-01",
    dc: "DC-East",
    productId: "PROD-MILK",
    anomalyClass: "Demand Surge Anomaly",
    title: "Extreme Weather Demand Surge on Perishables",
    severity: "CRITICAL",
    description: "An unexpected demand surge triggered by extreme regional forecasts has depleted SuperFresh Organic Milk stocks down to critical low. Daily sales burn rate escalated from a typical 4.5 units/hr base up to 15.2 units/hr, resulting in stockouts.",
    rootCause: "A simultaneous heatwave alert combined with weekend retail sales promotions triggered irrational household stocking. Logistics were not scaled locally in advance, causing automated dispatch schedules to dry up.",
    confidenceScore: 0.94,
    remediation: "Trigger immediate local dairy carrier transfer from DC-Central, adjust the Dynamic safety stock factor from 1.5x to 2.5x during high-temperature months, and enable regional predictive trigger schedules.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-01"
  },
  "ANOMALY-02": {
    scenarioId: "ANOMALY-02",
    dc: "DC-West",
    productId: "PROD-BREAD",
    anomalyClass: "Inventory Leak / Shrinkage",
    title: "Persistent Physical Inventory Loss",
    severity: "WARNING",
    description: "A continuous discrepancy between virtual system balances and automated laser shelf scanning has triggered a verified inventory shrinkage threshold exception for Bread Loaves.",
    rootCause: "Internal stock location misalignment at Aisle-D combined with shelf-theft or cold-room humidity degradation destroying package barcode labels pre-read.",
    confidenceScore: 0.81,
    remediation: "Deploy manual audit teams to rekey product physical coordinates, audit the package scan logic of barcode scales, and inspect perimeter surveillance records on whole wheat aisles.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-02"
  },
  "ANOMALY-03": {
    scenarioId: "ANOMALY-03",
    dc: "DC-Central",
    productId: "PROD-JUICE",
    anomalyClass: "Warehouse Dispatch Bottleneck",
    title: "Forklift Driver Capacity Congestion",
    severity: "CRITICAL",
    description: "Orange Juice dispatches are severely backlogged. Delivery SLA violations detected at Loading Bay 4, cascading delay buffers down to standard grocery deliveries.",
    rootCause: "Overlapping shipments of warehouse racking elements created driver availability deadlocks. Total loading delay rose to 4.2 hours.",
    confidenceScore: 0.89,
    remediation: "Immediately assign additional dynamic cross-dock forklift drivers from pantry items, schedule off-peak shipping slots for heavy packing shipments, and establish automated real-time alerts.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-03"
  },
  "ANOMALY-04": {
    scenarioId: "ANOMALY-04",
    dc: "DC-South",
    productId: "PROD-TOMATO",
    anomalyClass: "Transport Logistics Delay",
    title: "Severe Road Interstate Blizzard Delay",
    severity: "WARNING",
    description: "Canned Tomatoes logistics carriers report heavy transport disruptions on Interstate-80. General shipping speeds have dropped by 70%.",
    rootCause: "An unseasonal winter storm near the Rocky Mountains caused severe traffic pile-ups, slipping delivery ETA by almost 18 hours.",
    confidenceScore: 0.98,
    remediation: "Reroute incoming bulk carrier trucks via the Southern corridor route, double the standard routing dispatch buffer during severe weather warnings, and pre-order shelf-stable backup items.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-04"
  },
  "ANOMALY-05": {
    scenarioId: "ANOMALY-05",
    dc: "DC-East",
    productId: "PROD-CHIPS",
    anomalyClass: "ERP Supplier Sync Fault",
    title: "System Purchase Order Transmission Failure",
    severity: "CRITICAL",
    description: "The EDI interface failed to transmit automated restocking purchase orders for Chips to the supplier. Service logged internal status 504 Gateway Timeout.",
    rootCause: "An active certificate mismatch on the partner B2B gateway rejected JSON signatures, suspending automated reorder triggers.",
    confidenceScore: 0.95,
    remediation: "Perform immediate manual EDI resubmission of pending Chip batches, renew SSL certificate authorities across API gateways, and add backup email-based order backup scripts.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-05"
  },
  "ANOMALY-06": {
    scenarioId: "ANOMALY-06",
    dc: "DC-West",
    productId: "PROD-SUGAR",
    anomalyClass: "Supplier Allocation Cap",
    title: "Supplier Manufacturing Resource Rationing",
    severity: "WARNING",
    description: "Replenishment for Pure Cane Sugar was cut. The supplier has capped total orders, providing only 150 bags instead of the requested 500 bags.",
    rootCause: "A nationwide shortage of raw sugarcane logistics coupled with heavy holiday pre-buying from competing retail brands created an allocation deadlock on priority tiers.",
    confidenceScore: 0.88,
    remediation: "Diversify procurement pool to include Secondary Supplier (SugarCo Ltd), negotiate multi-quarter minimum purchase contracts to lock priority allocation, and implement adaptive demand thresholds.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-06"
  },
  "ANOMALY-07": {
    scenarioId: "ANOMALY-07",
    dc: "DC-Central",
    productId: "PROD-PEANUT",
    anomalyClass: "Cascading Delivery Delays",
    title: "Glass Container Supply Chain Blockage",
    severity: "CRITICAL",
    description: "Restocking of Peanut Butter is halted globally. Out of stock situations are escalating down to grocery store shelves across DC-Central and DC-West.",
    rootCause: "A manufacturing shutdown at the primary domestic silica supplier delayed glass jar shipments to the food packer, halting product assembly lines.",
    confidenceScore: 0.92,
    remediation: "Fast-track validation of alternative high-density plastic (PET) jar packaging formats, establish warehouse buffers of critical packaging components, and activate short-term regional private label pack suppliers.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-07"
  },
  "ANOMALY-08": {
    scenarioId: "ANOMALY-08",
    dc: "DC-South",
    productId: "PROD-COOKI",
    anomalyClass: "Warehouse Operational Deadlock",
    title: "Transit Gate Manifest Clerical Hold",
    severity: "WARNING",
    description: "Incoming delivery vehicles for cookies are gridlocked at Gate 2. Standard turnaround schedules have exceeded 3 hours.",
    rootCause: "A clerical discrepancy in invoice pricing matching blocked digital bill-of-lading processing, causing physical trucks to wait on Gate lanes and block arterial corridors.",
    confidenceScore: 0.86,
    remediation: "Institute immediate digital escrow clearance rules allowing trucks to unload disputed invoice loads before final audit, train warehouse clerks on fast-track override keys, and activate multi-channel gate lanes.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-08"
  },
  "ANOMALY-09": {
    scenarioId: "ANOMALY-09",
    dc: "DC-East",
    productId: "PROD-COOKI", // Perishable raw baking mix
    anomalyClass: "Cold Chain Reefer Degradation",
    title: "Carrier Refrigeration Compressor Spoiled",
    severity: "CRITICAL",
    description: "Transport reefer RC-808 temperature rose above of 4C safety requirement up to 14.5C. Fresh loads spoiled.",
    rootCause: "An active compressor cooling belt failure occurred midway in cross-state transit. Low telemetry alerts failed to trigger due to battery drain.",
    confidenceScore: 0.97,
    remediation: "Reject entire spoiled transit batch to insurance claims, initiate quick backup logistics shipments from regional third-party logistics warehouses, and update IoT sensor models to require battery-backed alarm telemetry.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-09"
  },
  "ANOMALY-10": {
    scenarioId: "ANOMALY-10",
    dc: "DC-West",
    productId: "PROD-PASTA",
    anomalyClass: "Peak Holiday Staffing Shortage",
    title: "Seasonal Fulfillment Center Labor Shortage",
    severity: "WARNING",
    description: "Pasta order turnaround lags at DC-West. Delayed packing and sorting queues have breached standard SLA.",
    rootCause: "Dynamic volume scaling failed to onboard sufficient certified pickers during a surprise weekend pasta discount promotion.",
    confidenceScore: 0.83,
    remediation: "Deploy cross-dock automation conveyor assets immediately, partner with secondary local gig-economy staffing providers to scale worker rosters quickly, and adjust promotional calendars to integrate physical warehouse capacity indices.",
    traceUrl: "/api/logs?scenarioId=ANOMALY-10"
  }
};

import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, Product, AnomalyReport, ReorderSchedule, DemandForecast } from "../types/index.js";
import { PRODUCTS, ANOMALIES_DEF } from "../utils/data.js";

// Helper for system model initialization
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
    return null;
  }
}

// 1. Log Parsing & Normalization Agent: Filters, normalizes timestamps and formats records
export class LogParsingAgent {
  static async parseLogs(logs: LogEntry[]): Promise<LogEntry[]> {
    return logs.map(l => ({
      ...l,
      timestamp: new Date(l.timestamp).toISOString()
    }));
  }
}

// Helper to provide premium rule-based fallback responses when GEMINI_API_KEY is not defined
function getFallbackAnalysis(scenarioId: string, dcName: string, prodId: string): AnomalyReport {
  const baseDef = ANOMALIES_DEF[scenarioId] || ANOMALIES_DEF["ANOMALY-01"];
  return {
    id: `ANOM-${scenarioId}-${Date.now()}`,
    scenarioId,
    dc: dcName,
    productId: prodId,
    timestamp: new Date().toISOString(),
    anomalyClass: baseDef.anomalyClass,
    title: baseDef.title,
    severity: baseDef.severity,
    description: baseDef.description,
    rootCause: baseDef.rootCause,
    confidenceScore: baseDef.confidenceScore,
    remediation: baseDef.remediation,
    traceUrl: `/api/logs?scenarioId=${scenarioId}`
  };
}

// 2. Anomaly & Bottleneck Detection Agent
export class AnomalyDetectionAgent {
  private ai: GoogleGenAI | null;

  constructor(ai: GoogleGenAI | null) {
    this.ai = ai;
  }

  async detect(logs: LogEntry[], activeScenarioId: string, dcName: string, prodId: string): Promise<AnomalyReport> {
    if (!this.ai) {
      return getFallbackAnalysis(activeScenarioId, dcName, prodId);
    }

    const filteredLogs = logs
      .filter(l => l.metadata?.scenarioId === activeScenarioId || l.dc === dcName)
      .slice(-30);

    const prompt = `
      You are the Anomaly & Bottleneck Detection Agent in a consumer packaged goods (CPG) supply chain.
      Analyze the following operation logs and telemetry events to identify structural bottlenecks or critical stockouts.
      
      Target DC: ${dcName}
      Target Product ID: ${prodId}
      Active Scenario ID: ${activeScenarioId}
      
      LOG ENTRIES:
      ${JSON.stringify(filteredLogs, null, 2)}
      
      Output your analysis in raw JSON format matching this schema:
      {
        "anomalyClass": "A high level string of the anomaly type",
        "title": "A direct descriptive title of what is happening",
        "severity": "CRITICAL", "WARNING", or "INFO",
        "description": "Provide a thorough summary of the stock status and pipeline speed degradation.",
        "rootCause": "In-depth mechanical, logistical, or transactional cause of this event",
        "confidenceScore": 0.95,
        "remediation": "Immediate instructions to resolve the stock shortage"
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              anomalyClass: { type: Type.STRING },
              title: { type: Type.STRING },
              severity: { type: Type.STRING },
              description: { type: Type.STRING },
              rootCause: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              remediation: { type: Type.STRING }
            },
            required: ["anomalyClass", "title", "severity", "description", "rootCause", "confidenceScore", "remediation"]
          },
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        id: `ANOM-${activeScenarioId}-${Date.now()}`,
        scenarioId: activeScenarioId,
        dc: dcName,
        productId: prodId,
        timestamp: new Date().toISOString(),
        anomalyClass: parsed.anomalyClass || "Supply Chain Bottleneck",
        title: parsed.title || "Restocking Irregularity",
        severity: parsed.severity || "WARNING",
        description: parsed.description || "Unusual stock level depletion detected.",
        rootCause: parsed.rootCause || "Logistics or system timeout delay.",
        confidenceScore: parsed.confidenceScore || 0.85,
        remediation: parsed.remediation || "Execute emergency logistics restocking call.",
        traceUrl: `/api/logs?scenarioId=${activeScenarioId}`
      };
    } catch (err) {
      console.warn("AnomalyDetectionAgent failed, applying fallback", err);
      return getFallbackAnalysis(activeScenarioId, dcName, prodId);
    }
  }
}

// 3. Root Cause Analysis Agent: performs DeepStep step-by-step reasoning
export class RootCauseAnalysisAgent {
  private ai: GoogleGenAI | null;

  constructor(ai: GoogleGenAI | null) {
    this.ai = ai;
  }

  async runStepByStepReasoning(logs: LogEntry[], anomaly: AnomalyReport): Promise<{ steps: string[]; finalExplanation: string }> {
    if (!this.ai) {
      return {
        steps: [
          "[Step 1] Parsing historic telemetry and verifying order triggers...",
          "[Step 2] Correlating transport alerts against known regional bottlenecks...",
          "[Step 3] Isolating clerical Gate holds or packing staff deficits...",
          "[Step 4] Formulating supply-chain dependency resolution graph..."
        ],
        finalExplanation: anomaly.rootCause
      };
    }

    const prompt = `
      You are the Root Cause Analysis Agent. Perform a step-by-step deep diagnostic reasoning (similar to DeepSeek-R1 CoT) on this supply chain anomaly.
      
      ANOMALY SUMMARY:
      Title: ${anomaly.title}
      Class: ${anomaly.anomalyClass}
      DC: ${anomaly.dc}
      Description: ${anomaly.description}
      Pre-identified Root Cause: ${anomaly.rootCause}
      
      Based on this, break down the cascading failures into exactly 4 sequential steps explaining the chain of events.
      Provide a comprehensive, high-integrity final explanation.
      
      JSON Scheme to return:
      {
        "steps": [
          "Step 1: Description of initial trigger",
          "Step 2: Description of intermediate bottleneck or transmission error",
          "Step 3: Description of localized warehouse or truck impact",
          "Step 4: Summary of cascading stock level depletion"
        ],
        "finalExplanation": "Fully elaborated root cause and dependency breakdown."
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              finalExplanation: { type: Type.STRING }
            },
            required: ["steps", "finalExplanation"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        steps: parsed.steps || [],
        finalExplanation: parsed.finalExplanation || anomaly.rootCause
      };
    } catch (err) {
      console.warn("RootCauseAnalysisAgent failed, using step fallback", err);
      return {
        steps: [
          `[Step 1] Inbound trigger detected for ${anomaly.productId} depletion sequence.`,
          `[Step 2] Escalating lead-time identified at ${anomaly.dc} local channels.`,
          `[Step 3] Verification of capacity or paperwork deadlock limits standard stock recovery.`,
          `[Step 4] Confirmation of ${anomaly.anomalyClass} cascade.`
        ],
        finalExplanation: anomaly.rootCause
      };
    }
  }
}

// 4. Demand Forecasting Agent: Predicts short-term buying curves and trends
export class DemandForecastingAgent {
  private ai: GoogleGenAI | null;

  constructor(ai: GoogleGenAI | null) {
    this.ai = ai;
  }

  async forecast(product: Product, dc: string, currentStock: number): Promise<DemandForecast> {
    const historicalDailyAvg = parseFloat((product.minStock * 0.15 + Math.random() * 8).toFixed(1));
    const growthOptions = [-0.05, 0.08, 0.15, 0.25, 0.40];
    const forecastedDailyGrowth = growthOptions[Math.floor(Math.random() * growthOptions.length)];

    if (!this.ai) {
      // Local robust simulation calculations
      const next7DaysForecast: number[] = [];
      let currentVal = historicalDailyAvg;
      for (let i = 0; i < 7; i++) {
        currentVal = Math.max(1, currentVal * (1 + forecastedDailyGrowth + (Math.random() * 0.04 - 0.02)));
        next7DaysForecast.push(Math.round(currentVal));
      }

      return {
        productId: product.id,
        productName: product.name,
        dc_id: dc,
        historicalDailyAvg,
        forecastedDailyGrowth: parseFloat((forecastedDailyGrowth * 100).toFixed(1)),
        next7DaysForecast,
        forecastConfidence: 0.88,
        insights: `Short-term forecast signals ${forecastedDailyGrowth > 0.10 ? 'escalated' : 'stable'} regional velocity. Support replenishment buffers to protect min Stock levels.`
      };
    }

    const prompt = `
      You are the CPG Demand Forecasting Agent.
      Generate a 7-day volume demand forecast for product "${product.name}" (ID: ${product.id}) at Distribution Center "${dc}".
      Current Stock: ${currentStock} units
      Historical baseline daily consumption rate: ${historicalDailyAvg} units
      
      Calculate a realistic forecasting array based on seasonal shifts, weekend spikes, and weather anomalies.
      Output in JSON format:
      {
        "forecastedDailyGrowthPercent": 15.4,
        "next7DaysForecast": [22, 25, 27, 21, 28, 32, 35],
        "insights": "Describe visual trends and why stocking points should adjust."
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              forecastedDailyGrowthPercent: { type: Type.NUMBER },
              next7DaysForecast: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              },
              insights: { type: Type.STRING }
            },
            required: ["forecastedDailyGrowthPercent", "next7DaysForecast", "insights"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        productId: product.id,
        productName: product.name,
        dc_id: dc,
        historicalDailyAvg,
        forecastedDailyGrowth: parsed.forecastedDailyGrowthPercent || parseFloat((forecastedDailyGrowth * 100).toFixed(1)),
        next7DaysForecast: parsed.next7DaysForecast || [20, 21, 24, 25, 22, 20, 24],
        forecastConfidence: 0.92,
        insights: parsed.insights || "Demand is aligned to historical seasonal parameters."
      };
    } catch (err) {
      console.warn("DemandForecastingAgent failed, using calculation fallback", err);
      const next7DaysForecast: number[] = [];
      let tempVal = historicalDailyAvg;
      for (let i = 0; i < 7; i++) {
        tempVal = Math.max(1, tempVal * (1 + forecastedDailyGrowth));
        next7DaysForecast.push(Math.round(tempVal));
      }
      return {
        productId: product.id,
        productName: product.name,
        dc_id: dc,
        historicalDailyAvg,
        forecastedDailyGrowth: parseFloat((forecastedDailyGrowth * 100).toFixed(1)),
        next7DaysForecast,
        forecastConfidence: 0.85,
        insights: "Forecast baseline calculated using historical local moving averages."
      };
    }
  }
}

// 5. Reorder & Restocking Schedule Recommendation Agent
export class ReorderRecommendationAgent {
  private ai: GoogleGenAI | null;

  constructor(ai: GoogleGenAI | null) {
    this.ai = ai;
  }

  async recommend(
    product: Product,
    dc: string,
    currentStock: number,
    anomaly: AnomalyReport,
    forecast: DemandForecast
  ): Promise<ReorderSchedule> {
    const suppliers = [
      "CPG Logistics Partners Inc.",
      "Apex Quality Foods Ltd.",
      "Agro-Industrial Distributors LLC",
      "Prime Cold-Chain Wholesale"
    ];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    
    // Core calculation formula
    const projectedShortfall = Math.max(0, product.maxStock - currentStock);
    const calculatedQty = projectedShortfall > 0 ? projectedShortfall : product.minStock * 2;
    const restockingCost = parseFloat((calculatedQty * product.price * 0.85).toFixed(2));
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + product.leadTimeDays);

    if (!this.ai) {
      return {
        id: `REORD-${product.id}-${Date.now().toString().slice(-4)}`,
        dc_id: dc,
        productId: product.id,
        productName: product.name,
        currentStock,
        recommendedQty: calculatedQty,
        reorderTriggerReason: `Emergency replenishment triggered to bypass active ${anomaly.anomalyClass}: ${anomaly.title}`,
        urgency: anomaly.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        leadTimeDays: product.leadTimeDays,
        supplier,
        estimatedDeliveryDate: deliveryDate.toISOString().split("T")[0],
        restockingCost
      };
    }

    const prompt = `
      You are the Reorder Recommendation Agent.
      Based on details below, define a restructuring order to resolve stock level risks.
      
      Product: ${product.name}
      DC: ${dc}
      Current Stock: ${currentStock} (Min: ${product.minStock}, Max: ${product.maxStock})
      Forecast 7 days sum: ${forecast.next7DaysForecast.reduce((a,b)=>a+b, 0)}
      Active Anomaly: ${anomaly.title} (${anomaly.remediation})
      
      Formulate a restructuring replenishment JSON block:
      {
        "recommendedQty": 450,
        "triggerReason": "Direct explanation of volumes backed by active logistics delays or surge alerts.",
        "urgency": "HIGH", "MEDIUM", or "STANDARD"
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedQty: { type: Type.INTEGER },
              triggerReason: { type: Type.STRING },
              urgency: { type: Type.STRING }
            },
            required: ["recommendedQty", "triggerReason", "urgency"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        id: `REORD-${product.id}-${Date.now().toString().slice(-4)}`,
        dc_id: dc,
        productId: product.id,
        productName: product.name,
        currentStock,
        recommendedQty: parsed.recommendedQty || calculatedQty,
        reorderTriggerReason: parsed.triggerReason || `Automated restock due to active anomaly ${anomaly.title}.`,
        urgency: parsed.urgency || (anomaly.severity === "CRITICAL" ? "HIGH" : "MEDIUM"),
        leadTimeDays: product.leadTimeDays,
        supplier,
        estimatedDeliveryDate: deliveryDate.toISOString().split("T")[0],
        restockingCost
      };
    } catch (err) {
      console.warn("ReorderRecommendationAgent failed, employing standard calculation", err);
      return {
        id: `REORD-${product.id}-${Date.now().toString().slice(-4)}`,
        dc_id: dc,
        productId: product.id,
        productName: product.name,
        currentStock,
        recommendedQty: calculatedQty,
        reorderTriggerReason: `Baseline safety stock buffer replenishment for ${product.name}.`,
        urgency: anomaly.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
        leadTimeDays: product.leadTimeDays,
        supplier,
        estimatedDeliveryDate: deliveryDate.toISOString().split("T")[0],
        restockingCost
      };
    }
  }
}

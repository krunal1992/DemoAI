export interface LogEntry {
  id: string;
  timestamp: string;
  dc: string;
  service: string;
  traceId: string;
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  metadata: {
    scenarioId?: string;
    productId?: string;
    productName?: string;
    category?: string;
    [key: string]: any;
  };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  minStock: number;
  maxStock: number;
  leadTimeDays: number;
  unit: string;
}

export interface DistributionCenterItem {
  productId: string;
  productName: string;
  category: string;
  stockLevel: number;
  minStock: number;
  maxStock: number;
  burnRate: number; // units consumed per day
  daysToEmpty: number;
  status: "OK" | "WARNING" | "CRITICAL";
  unit: string;
}

export interface DistributionCenterInfo {
  dc_id: string;
  name: string;
  location: string;
  items: DistributionCenterItem[];
}

export interface AnomalyReport {
  id: string;
  scenarioId: string;
  dc: string;
  productId: string;
  timestamp: string;
  anomalyClass: string;
  title: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  rootCause: string;
  confidenceScore: number;
  remediation: string;
  traceUrl: string;
}

export interface ReorderSchedule {
  id: string;
  dc_id: string;
  productId: string;
  productName: string;
  currentStock: number;
  recommendedQty: number;
  reorderTriggerReason: string;
  urgency: "HIGH" | "MEDIUM" | "STANDARD";
  leadTimeDays: number;
  supplier: string;
  estimatedDeliveryDate: string;
  restockingCost: number;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  dc_id: string;
  historicalDailyAvg: number;
  forecastedDailyGrowth: number; // percentage
  next7DaysForecast: number[];
  forecastConfidence: number; // score 0-1
  insights: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  thoughts?: string; // DeepSeek-R1 style CoT thoughts
}

export interface FeedbackRecord {
  id: string;
  anomalyId?: string;
  reorderId?: string;
  rating: "up" | "down";
  comments?: string;
  timestamp: string;
}

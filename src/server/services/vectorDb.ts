import { GoogleGenAI } from "@google/genai";

export interface DocumentItem {
  id: string;
  text: string;
  embedding: number[];
  metadata: any;
}

export class VectorDatabase {
  private documents: DocumentItem[] = [];
  private ai: GoogleGenAI | null = null;
  private isSimulated = true;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key !== "") {
      try {
        this.ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
        this.isSimulated = false;
        console.log("VectorDatabase: Successfully initialized GoogleGenAI for embeddings RAG.");
      } catch (err) {
        console.error("VectorDatabase: Error initializing GoogleGenAI, falling back to keyword similarity", err);
      }
    } else {
      console.log("VectorDatabase: No valid GEMINI_API_KEY. Active in Keyword-Matching mode.");
    }
  }

  // Generate vector embeddings using gemini-embedding-2-preview, with instant keyword fallback
  private async getEmbedding(text: string): Promise<number[]> {
    if (this.isSimulated || !this.ai) {
      // Return a simulated deterministic vector based on character hash for fallback calculation
      const vector: number[] = new Array(128).fill(0);
      for (let i = 0; i < text.length; i++) {
        vector[i % 128] += text.charCodeAt(i) / 1000;
      }
      // Normalize
      const magnitude = Math.sqrt(vector.reduce((a, b) => a + b * b, 0)) || 1;
      return vector.map(v => v / magnitude);
    }

    try {
      const response = await this.ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: text
      });
      const r = response as any;
      if (r && r.embedding?.values) {
        return r.embedding.values;
      }
      if (r && r.embeddings?.[0]?.values) {
        return r.embeddings[0].values;
      }
      throw new Error("No embedding values found in response");
    } catch (err) {
      console.warn("VectorDatabase: GoogleGenAI embedding call failed, fallback used", err);
      this.isSimulated = true; // Fall back
      return this.getEmbedding(text);
    }
  }

  // Insert a document with automatic embedding generation
  async addDocument(id: string, text: string, metadata: any = {}) {
    const embedding = await this.getEmbedding(text);
    this.documents.push({ id, text, embedding, metadata });
  }

  // Clear existing documents
  clear() {
    this.documents = [];
  }

  // Retrieve top K most similar records using cosine similarity or keyword ranking
  async query(queryText: string, topK: number = 5): Promise<{ doc: DocumentItem; score: number }[]> {
    if (this.documents.length === 0) return [];

    const queryVec = await this.getEmbedding(queryText);

    const scores = this.documents.map(doc => {
      let score = 0;
      if (this.isSimulated) {
        // Fallback: Cosine similarity on char-hash vectors + strong text keyword matching index
        const queryTerms = queryText.toLowerCase().split(/\s+/);
        const docTerms = doc.text.toLowerCase().split(/\s+/);
        let matchCount = 0;
        queryTerms.forEach(term => {
          if (doc.text.toLowerCase().includes(term)) matchCount++;
        });
        const keywordScore = matchCount / Math.max(1, queryTerms.length);

        // Vector sim part
        let dotProduct = 0;
        let qSum = 0;
        let dSum = 0;
        for (let i = 0; i < 128; i++) {
          dotProduct += queryVec[i] * doc.embedding[i];
          qSum += queryVec[i] * queryVec[i];
          dSum += doc.embedding[i] * doc.embedding[i];
        }
        const cosSim = dotProduct / (Math.sqrt(qSum) * Math.sqrt(dSum) || 1);
        score = 0.3 * cosSim + 0.7 * keywordScore;
      } else {
        // Precise math cosine similarity
        let dotProduct = 0;
        let qSum = 0;
        let dSum = 0;
        const len = Math.min(queryVec.length, doc.embedding.length);
        for (let i = 0; i < len; i++) {
          dotProduct += queryVec[i] * doc.embedding[i];
          qSum += queryVec[i] * queryVec[i];
          dSum += doc.embedding[i] * doc.embedding[i];
        }
        score = dotProduct / (Math.sqrt(qSum) * Math.sqrt(dSum) || 1);
      }
      return { doc, score };
    });

    // Sort descending and return top K
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

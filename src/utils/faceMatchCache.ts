interface CachedMatch {
  personId: string;
  personName: string;
  confidence: number;
  timestamp: number;
}

export class FaceMatchCache {
  private cache: Map<string, CachedMatch> = new Map();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 50, ttlMs = 5000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  private hashDescriptor(descriptor: Float32Array | number[]): string {
    const arr = Array.isArray(descriptor) ? descriptor : Array.from(descriptor);
    return arr.slice(0, 10).map(v => v.toFixed(2)).join(',');
  }

  get(descriptor: Float32Array | number[]): CachedMatch | null {
    const key = this.hashDescriptor(descriptor);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return cached;
  }

  set(descriptor: Float32Array | number[], match: Omit<CachedMatch, 'timestamp'>): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    const key = this.hashDescriptor(descriptor);
    this.cache.set(key, { ...match, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const faceMatchCache = new FaceMatchCache();

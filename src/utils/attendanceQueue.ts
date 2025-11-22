interface QueuedRecord {
  id: string;
  studentId: string;
  sessionId: string;
  timestamp: string;
  confidence: number;
  method: string;
  token?: string;
  retries: number;
  createdAt: number;
}

const DB_NAME = 'AttendanceQueueDB';
const STORE_NAME = 'pendingRecords';
const DB_VERSION = 1;

export class AttendanceQueue {
  private db: IDBDatabase | null = null;
  private isProcessing = false;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async enqueue(record: Omit<QueuedRecord, 'id' | 'retries' | 'createdAt'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `${record.sessionId}-${record.studentId}-${Date.now()}`;
    const queuedRecord: QueuedRecord = {
      ...record,
      id,
      retries: 0,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queuedRecord);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async processQueue(onSuccess?: (record: QueuedRecord) => void): Promise<number> {
    if (this.isProcessing) return 0;
    if (!this.db) await this.init();
    
    this.isProcessing = true;
    let successCount = 0;

    try {
      const records = await this.getAllPending();
      
      for (const record of records) {
        if (!navigator.onLine) break;

        try {
          const response = await fetch('/api/attendance/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: record.studentId,
              sessionId: record.sessionId,
              timestamp: record.timestamp,
              confidence: record.confidence,
              method: record.method,
              token: record.token,
            }),
          });

          if (response.ok) {
            await this.remove(record.id);
            successCount++;
            onSuccess?.(record);
          } else if (response.status >= 400 && response.status < 500) {
            await this.remove(record.id);
          } else if (record.retries >= 3) {
            await this.remove(record.id);
          } else {
            await this.updateRetries(record.id, record.retries + 1);
          }
        } catch {
          if (record.retries < 3) {
            await this.updateRetries(record.id, record.retries + 1);
          } else {
            await this.remove(record.id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return successCount;
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async getAllPending(): Promise<QueuedRecord[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const request = index.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async remove(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async updateRetries(id: string, retries: number): Promise<void> {
    const record = await this.get(id);
    if (record) {
      record.retries = retries;
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  private async get(id: string): Promise<QueuedRecord | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
}

export const attendanceQueue = new AttendanceQueue();

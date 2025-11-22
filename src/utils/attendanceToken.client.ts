interface TokenPayload {
  studentId: string;
  sessionId: string;
  timestamp: number;
  confidence: number;
  descriptorHash: string;
}

export async function generateClientToken(payload: TokenPayload): Promise<string> {
  const encoder = new TextEncoder();
  const data = JSON.stringify(payload);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa(JSON.stringify({ ...payload, signature }));
}

export function hashDescriptorClient(descriptor: number[]): string {
  const subset = descriptor.slice(0, 32);
  let hash = 0;
  const str = subset.join(',');
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
}

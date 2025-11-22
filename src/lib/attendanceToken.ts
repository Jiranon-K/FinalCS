import crypto from 'crypto';

const SECRET = process.env.ATTENDANCE_SECRET || 'default-secret-change-in-production';

interface TokenPayload {
  studentId: string;
  sessionId: string;
  timestamp: number;
  confidence: number;
  descriptorHash: string;
}

export function generateAttendanceToken(payload: TokenPayload): string {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64');
}

export function verifyAttendanceToken(token: string): TokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const { signature, ...payload } = decoded;
    
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Invalid token signature');
      return null;
    }
    
    const TOKEN_MAX_AGE_MS = 60000;
    if (Date.now() - payload.timestamp > TOKEN_MAX_AGE_MS) {
      console.warn('Token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function hashDescriptor(descriptor: number[]): string {
  return crypto
    .createHash('sha256')
    .update(descriptor.slice(0, 32).join(','))
    .digest('hex')
    .substring(0, 16);
}

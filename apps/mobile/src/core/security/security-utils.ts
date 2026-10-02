/**
 * Security & Cryptography Utilities for Family Cashflow Mobile App
 * Includes salted SHA-256 password hashing, PIN verification,
 * input sanitization, numeric safety, and brute-force protection.
 */

// Simple, reliable pure TypeScript SHA-256 implementation (works cross-platform: Node, React Native, Web)
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // non-ascii
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = i >= 16 ? rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3) : 0;
      const s1 = i >= 16 ? rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10) : 0;
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 =
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
      const temp2 =
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        maj;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

const GLOBAL_SALT = 'family_cashflow_secure_salt_v2';

/**
 * Tạo chuỗi băm mật khẩu có muối bảo mật
 */
export function hashPassword(password: string, userSalt: string = GLOBAL_SALT): string {
  return sha256(`${userSalt}:${password.trim()}:${GLOBAL_SALT}`);
}

/**
 * Kiểm tra mật khẩu khớp với chuỗi băm
 */
export function verifyPassword(password: string, storedHash: string, userSalt: string = GLOBAL_SALT): boolean {
  if (!password || !storedHash) return false;
  // Hỗ trợ cả trường hợp migrate từ mật khẩu plain text cũ
  if (storedHash === password) return true;
  return hashPassword(password, userSalt) === storedHash;
}

/**
 * Băm mã PIN 4-6 số
 */
export function hashPin(pin: string): string {
  return sha256(`pin_secure_${pin.trim()}_${GLOBAL_SALT}`);
}

/**
 * Xác thực mã PIN
 */
export function verifyPin(pin: string, storedPinHash: string): boolean {
  if (!pin || !storedPinHash) return false;
  return hashPin(pin) === storedPinHash;
}

/**
 * Làm sạch và loại bỏ các ký tự nguy hiểm / script injection
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML/XML tags
    .replace(/[<>'"&]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return match;
      }
    })
    .trim();
}

/**
 * Xác thực và làm sạch số tiền giao dịch
 * Ngăn chặn số âm, NaN, số quá lớn gây tràn bộ nhớ (> 1,000 tỷ)
 */
export function sanitizeMoneyAmount(amount: number): { valid: boolean; value: number; message?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, value: 0, message: 'Số tiền phải là số hợp lệ.' };
  }
  if (!isFinite(amount)) {
    return { valid: false, value: 0, message: 'Số tiền không hợp lệ.' };
  }
  if (amount <= 0) {
    return { valid: false, value: 0, message: 'Số tiền phải lớn hơn 0.' };
  }
  if (amount > 1_000_000_000_000) {
    return { valid: false, value: 0, message: 'Số tiền vượt quá giới hạn tối đa (1.000 tỷ ₫).' };
  }
  return { valid: true, value: Math.round(amount) };
}

/**
 * Kiểm tra độ mạnh của mật khẩu
 */
export function validatePasswordStrength(password: string): { valid: boolean; score: number; message: string } {
  if (!password || password.length < 6) {
    return { valid: false, score: 0, message: 'Mật khẩu phải có tối thiểu 6 ký tự.' };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 2) {
    return { valid: false, score, message: 'Mật khẩu nên chứa cả chữ cái và số để bảo mật.' };
  }

  return { valid: true, score, message: 'Mật khẩu đủ tiêu chuẩn bảo mật.' };
}

/**
 * Trình chống tấn công Brute-Force (khóa tạm thời khi nhập sai quá nhiều lần)
 */
class RateLimiter {
  private attempts: Record<string, { count: number; lockedUntil: number }> = {};

  public checkAttempt(key: string, maxAttempts = 5, lockDurationMs = 30000): { allowed: boolean; remainingWaitSec?: number } {
    const now = Date.now();
    const record = this.attempts[key];

    if (record && record.lockedUntil > now) {
      const remainingWaitSec = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingWaitSec };
    }

    return { allowed: true };
  }

  public recordFailure(key: string, maxAttempts = 5, lockDurationMs = 30000): { isLocked: boolean; remainingWaitSec?: number } {
    const now = Date.now();
    const record = this.attempts[key] ?? { count: 0, lockedUntil: 0 };
    record.count += 1;

    if (record.count >= maxAttempts) {
      record.lockedUntil = now + lockDurationMs;
      record.count = 0; // Reset counter for next cycle
      this.attempts[key] = record;
      return { isLocked: true, remainingWaitSec: Math.ceil(lockDurationMs / 1000) };
    }

    this.attempts[key] = record;
    return { isLocked: false };
  }

  public recordSuccess(key: string): void {
    delete this.attempts[key];
  }
}

export const securityRateLimiter = new RateLimiter();

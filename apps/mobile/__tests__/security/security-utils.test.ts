import {
  hashPassword,
  hashPin,
  sanitizeInput,
  sanitizeMoneyAmount,
  securityRateLimiter,
  validatePasswordStrength,
  verifyPassword,
  verifyPin,
} from '@/core/security/security-utils';

describe('Security Utilities', () => {
  describe('Password Hashing & Verification', () => {
    it('hashes passwords and verifies them correctly with salt', () => {
      const password = 'SecretPassword123';
      const userSalt = 'user_001';
      const hash = hashPassword(password, userSalt);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hex is 64 chars

      expect(verifyPassword(password, hash, userSalt)).toBe(true);
      expect(verifyPassword('WrongPassword', hash, userSalt)).toBe(false);
      expect(verifyPassword(password, hash, 'different_salt')).toBe(false);
    });

    it('supports legacy plain text backward compatibility', () => {
      expect(verifyPassword('123456', '123456')).toBe(true);
    });
  });

  describe('PIN Hashing & Verification', () => {
    it('hashes 4-digit PINs and verifies them', () => {
      const pin = '4321';
      const hashedPin = hashPin(pin);

      expect(verifyPin(pin, hashedPin)).toBe(true);
      expect(verifyPin('0000', hashedPin)).toBe(false);
    });
  });

  describe('Input Sanitization & Injection Prevention', () => {
    it('strips HTML and script tags from user inputs', () => {
      const malicious = '<script>alert("hack")</script> Ăn tối nhà hàng';
      const clean = sanitizeInput(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Ăn tối nhà hàng');
    });

    it('escapes special characters', () => {
      const raw = 'Mua sắm & đồ chơi <con>';
      const clean = sanitizeInput(raw);
      expect(clean).not.toContain('<con>');
    });
  });

  describe('Numeric Money Amount Sanitization', () => {
    it('validates positive integers within reasonable financial bounds', () => {
      const valid = sanitizeMoneyAmount(500000);
      expect(valid.valid).toBe(true);
      expect(valid.value).toBe(500000);
    });

    it('rejects negative, zero, NaN and infinite amounts', () => {
      expect(sanitizeMoneyAmount(-1000).valid).toBe(false);
      expect(sanitizeMoneyAmount(0).valid).toBe(false);
      expect(sanitizeMoneyAmount(NaN).valid).toBe(false);
      expect(sanitizeMoneyAmount(Infinity).valid).toBe(false);
    });

    it('rejects numbers exceeding 1,000 billion VND', () => {
      expect(sanitizeMoneyAmount(2_000_000_000_000).valid).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    it('enforces min 6 chars and letter + number combination', () => {
      expect(validatePasswordStrength('123').valid).toBe(false);
      expect(validatePasswordStrength('123456').valid).toBe(false); // only numbers
      expect(validatePasswordStrength('abcdef').valid).toBe(false); // only letters
      expect(validatePasswordStrength('Abc12345').valid).toBe(true); // letters + numbers
    });
  });

  describe('Rate Limiter for Brute-Force Protection', () => {
    it('locks out after 5 consecutive failed attempts', () => {
      const key = 'test_login_user';
      securityRateLimiter.recordSuccess(key); // clear

      for (let i = 0; i < 4; i++) {
        const result = securityRateLimiter.recordFailure(key, 5, 5000);
        expect(result.isLocked).toBe(false);
      }

      // 5th failure should trigger lockout
      const fifth = securityRateLimiter.recordFailure(key, 5, 5000);
      expect(fifth.isLocked).toBe(true);
      expect(fifth.remainingWaitSec).toBeGreaterThan(0);

      // checkAttempt should now deny access
      const check = securityRateLimiter.checkAttempt(key, 5, 5000);
      expect(check.allowed).toBe(false);

      // success clears lockout
      securityRateLimiter.recordSuccess(key);
      expect(securityRateLimiter.checkAttempt(key).allowed).toBe(true);
    });
  });
});

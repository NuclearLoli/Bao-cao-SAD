import { parseVietnameseBankNotification } from '@/features/finance/domain/bank-sms-parser';

describe('parseVietnameseBankNotification', () => {
  it('parses Vietcombank expense SMS correctly', () => {
    const raw = 'VCB: SD TK 001100... -1,250,000 VND vao 12/05/2026. ND: Tien dien luc EVN thang 5';
    const result = parseVietnameseBankNotification(raw);

    expect(result).not.toBeNull();
    expect(result?.bankName).toBe('Vietcombank');
    expect(result?.amount).toBe(1250000);
    expect(result?.type).toBe('expense');
    expect(result?.suggestedFundId).toBe('fixed');
    expect(result?.description).toContain('Tien dien luc EVN thang 5');
  });

  it('parses Techcombank expense notification for groceries', () => {
    const raw = 'Techcombank: GD -850.000 VND tai WinMart Thao Dien. ND: Mua thuc pham cuoi tuan';
    const result = parseVietnameseBankNotification(raw);

    expect(result).not.toBeNull();
    expect(result?.bankName).toBe('Techcombank');
    expect(result?.amount).toBe(850000);
    expect(result?.type).toBe('expense');
    expect(result?.suggestedFundId).toBe('family');
  });

  it('parses MBBank income / savings transaction', () => {
    const raw = 'MB: TK 088... +5,000,000 VND luc 10:15. ND: Gui tiet kiem tich luy du phong';
    const result = parseVietnameseBankNotification(raw);

    expect(result).not.toBeNull();
    expect(result?.bankName).toBe('MBBank');
    expect(result?.amount).toBe(5000000);
    expect(result?.type).toBe('income');
    expect(result?.suggestedFundId).toBe('emergency');
  });

  it('parses MoMo transaction', () => {
    const raw = 'MoMo: Giao dịch thành công -65.000đ tại Highlands Coffee. ND: Highlands Coffee';
    const result = parseVietnameseBankNotification(raw);

    expect(result).not.toBeNull();
    expect(result?.bankName).toBe('Ví MoMo');
    expect(result?.amount).toBe(65000);
    expect(result?.type).toBe('expense');
    expect(result?.suggestedFundId).toBe('family');
  });

  it('returns null for blank or irrelevant text', () => {
    expect(parseVietnameseBankNotification('')).toBeNull();
    expect(parseVietnameseBankNotification('Xin chao ban, hom nay troi dep lam')).toBeNull();
  });
});

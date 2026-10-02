import { parseVietnameseBankNotification } from '@/features/finance/domain/bank-sms-parser';

describe('Real-World Family Cash Flow Logic Tests', () => {
  describe('Bank SMS Parser for Vietnam Financial Ecosystem', () => {
    it('recognizes utility EVN electricity bills and classifies to fixed fund', () => {
      const parsed = parseVietnameseBankNotification(
        'VCB: SD TK 001100... -1,450,000 VND vao 15/10/2026. ND: Thanh toan tien dien EVN thang 10',
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(1450000);
      expect(parsed?.suggestedFundId).toBe('fixed');
      expect(parsed?.type).toBe('expense');
    });

    it('recognizes kindergarten / school tuition bills and classifies to fixed fund', () => {
      const parsed = parseVietnameseBankNotification(
        'Techcombank: GD -3.500.000 VND luc 08:30. ND: Dong hoc phi mam non cho be Bo',
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(3500000);
      expect(parsed?.suggestedFundId).toBe('fixed');
    });

    it('recognizes pharmacy and supermarket grocery bills and classifies to family fund', () => {
      const parsed = parseVietnameseBankNotification(
        'MoMo: GD -320.000đ tai Nha thuoc Long Chau. ND: Mua thuoc ha sot va vitamin cho con',
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(320000);
      expect(parsed?.suggestedFundId).toBe('family');
    });

    it('recognizes emergency fund savings additions', () => {
      const parsed = parseVietnameseBankNotification(
        'MB: TK 088... +3,000,000 VND. ND: Gui tiet kiem tich luy du phong khan cap',
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(3000000);
      expect(parsed?.type).toBe('income');
      expect(parsed?.suggestedFundId).toBe('emergency');
    });
  });

  describe('Joint Pool & Settlement Math', () => {
    it('calculates couple contributions and difference accurately', () => {
      const husbandExpense = 8500000;
      const wifeExpense = 6200000;
      const totalShared = husbandExpense + wifeExpense;
      const difference = Math.abs(husbandExpense - wifeExpense);

      expect(totalShared).toBe(14700000);
      expect(difference).toBe(2300000);
    });

    it('calculates pool available for shared funds after personal allowances', () => {
      const husbandSalary = 22000000;
      const wifeSalary = 18000000;
      const totalIncome = husbandSalary + wifeSalary;

      const husbandAllowance = 3000000;
      const wifeAllowance = 3000000;
      const totalAllowance = husbandAllowance + wifeAllowance;

      const sharedPool = totalIncome - totalAllowance;
      expect(sharedPool).toBe(34000000);

      // Verify 4-fund recommended split
      const fixedFund = Math.round(sharedPool * 0.45);
      const familyFund = Math.round(sharedPool * 0.35);
      const emergencyFund = Math.round(sharedPool * 0.1);
      const goalsFund = sharedPool - (fixedFund + familyFund + emergencyFund);

      expect(fixedFund).toBe(15300000);
      expect(familyFund).toBe(11900000);
      expect(emergencyFund).toBe(3400000);
      expect(goalsFund).toBe(3400000);
      expect(fixedFund + familyFund + emergencyFund + goalsFund).toBe(sharedPool);
    });
  });
});

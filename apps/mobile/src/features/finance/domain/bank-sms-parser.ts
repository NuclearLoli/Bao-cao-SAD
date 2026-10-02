export type ParsedBankTransaction = {
  rawText: string;
  bankName: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  suggestedFundId: 'fixed' | 'family' | 'emergency' | 'savings' | 'goals';
  suggestedCategory: string;
  detectedAt?: string;
};

// Từ khóa phát hiện quỹ tự động theo thói quen chi tiêu gia đình Việt Nam
const FUND_KEYWORD_MAP: Array<{
  keywords: string[];
  fundId: 'fixed' | 'family' | 'emergency' | 'savings' | 'goals';
  category: string;
}> = [
  {
    keywords: [
      'dien luc',
      'evn',
      'nuoc',
      'cap nuoc',
      'internet',
      'vnpt',
      'viettel',
      'fpt',
      'tien nha',
      'thue nha',
      'chung cu',
      'hoc phi',
      'truong hoc',
      'mam non',
      'tieu hoc',
      'bao hiem',
      'prudential',
      'manulife',
      'daichi',
      'chubb',
      'tra gop',
      'fe credit',
      'home credit',
      'shinhan',
    ],
    fundId: 'fixed',
    category: 'Hóa đơn & Cố định',
  },
  {
    keywords: [
      'tiet kiem',
      'gui tiet kiem',
      'tich luy',
      'du phong',
      'khan cap',
      'dau tu',
      'chung chi quy',
      'vang',
      'sjc',
    ],
    fundId: 'emergency',
    category: 'Dự phòng & Tiết kiệm',
  },
  {
    keywords: [
      'du lich',
      've may bay',
      'vietnam airlines',
      'vietjet',
      'bamboo',
      'khach san',
      'hotel',
      'resort',
      'agoda',
      'booking',
      'mua xe',
      'laptop',
      'dien thoai',
      'iphone',
      'apple store',
      'sua nha',
      'noi that',
    ],
    fundId: 'goals',
    category: 'Mục tiêu & Mua sắm lớn',
  },
  {
    keywords: [
      'sieu thi',
      'winmart',
      'coopmart',
      'big c',
      'tops market',
      'bach hoa xanh',
      'circle k',
      '7 eleven',
      'gs25',
      'cho',
      'rau',
      'thit',
      'ca',
      'an uong',
      'com',
      'pho',
      'bun',
      'lau',
      'coffee',
      'cafe',
      'highlands',
      'phuc long',
      'starbucks',
      'tra sua',
      'nha thuoc',
      'pharmacity',
      'long chau',
      'an khang',
      'ta sua',
      'be',
      'con',
      'do choi',
      'grab',
      'be group',
      'shopee',
      'lazada',
      'tiktok shop',
      'tiki',
      'xang',
      'petrolimex',
    ],
    fundId: 'family',
    category: 'Gia đình & Sinh hoạt',
  },
];

export function parseVietnameseBankNotification(rawText: string): ParsedBankTransaction | null {
  const text = rawText.trim();
  if (!text) {
    return null;
  }

  const lower = text.toLowerCase();

  // 1. Nhận diện ngân hàng / ví điện tử
  let bankName = 'Ngân hàng';
  if (lower.includes('vcb') || lower.includes('vietcombank')) {
    bankName = 'Vietcombank';
  } else if (lower.includes('tcb') || lower.includes('techcombank')) {
    bankName = 'Techcombank';
  } else if (lower.includes('mb') || lower.includes('mbbank') || lower.includes('mb bank')) {
    bankName = 'MBBank';
  } else if (lower.includes('acb')) {
    bankName = 'ACB';
  } else if (lower.includes('vpbank') || lower.includes('vpb')) {
    bankName = 'VPBank';
  } else if (lower.includes('bidv')) {
    bankName = 'BIDV';
  } else if (lower.includes('tpbank') || lower.includes('tpb')) {
    bankName = 'TPBank';
  } else if (lower.includes('momo')) {
    bankName = 'Ví MoMo';
  } else if (lower.includes('apple pay') || lower.includes('applepay')) {
    bankName = 'Apple Pay';
  } else if (lower.includes('zalopay')) {
    bankName = 'ZaloPay';
  }

  // 2. Xác định loại giao dịch: Chi tiêu (expense) hay Nhận tiền (income)
  let type: 'expense' | 'income' = 'expense';
  if (
    lower.includes('+') ||
    lower.includes('tang') ||
    lower.includes('nhan duoc') ||
    lower.includes('cong tien') ||
    lower.includes('chuyen den')
  ) {
    type = 'income';
  } else if (
    lower.includes('-') ||
    lower.includes('giam') ||
    lower.includes('thanh toan') ||
    lower.includes('chi tieu') ||
    lower.includes('rut tien') ||
    lower.includes('chuyen di')
  ) {
    type = 'expense';
  }

  // 3. Bóc tách số tiền (Amount)
  // Các mẫu: -150,000VND, -150.000 VND, +2,500,000 VND, 50.000d, 150000 VND
  const amountPattern = /(?:[+-]?\s*)(\d{1,3}(?:[.,]\d{3})*|\d+)(?:\s*(?:vnd|vnđ|đ|d\b))/i;
  const genericAmountPattern = /(?:so tien|amount|gd|giao dich|sd|bien dong)[:\s]*([+-]?\s*\d{1,3}(?:[.,]\d{3})*|\d+)/i;

  let rawAmountStr = '';
  const matchWithUnit = text.match(amountPattern);
  if (matchWithUnit?.[1]) {
    rawAmountStr = matchWithUnit[1];
  } else {
    const genericMatch = text.match(genericAmountPattern);
    if (genericMatch?.[1]) {
      rawAmountStr = genericMatch[1];
    }
  }

  if (!rawAmountStr) {
    // Thử tìm bất kỳ chuỗi số lớn có dấu phân cách
    const fallbackNumbers = text.match(/\b\d{1,3}(?:[.,]\d{3})+\b/);
    if (fallbackNumbers?.[0]) {
      rawAmountStr = fallbackNumbers[0];
    }
  }

  if (!rawAmountStr) {
    return null;
  }

  // Chuẩn hóa số tiền về số nguyên
  const numericAmount = Math.abs(Number(rawAmountStr.replace(/[.,\s]/g, '')));
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  // 4. Trích xuất mô tả / nội dung giao dịch
  let description = '';
  const ndMatch = text.match(/\b(?:nd|noi dung|content|ref|tai)[:\s]+([^.\n\r]+)/i);
  if (ndMatch?.[1]) {
    description = ndMatch[1].trim();
  } else {
    // Cắt ngắn chuỗi gốc làm mô tả
    description = text.length > 50 ? `${text.slice(0, 50)}…` : text;
  }

  // 5. Gợi ý quỹ và danh mục dựa trên từ khóa trong mô tả và toàn bộ text
  let suggestedFundId: 'fixed' | 'family' | 'emergency' | 'savings' | 'goals' =
    type === 'income' ? 'emergency' : 'family';
  let suggestedCategory = type === 'income' ? 'Thu nhập / Bù quỹ' : 'Gia đình & Con';

  for (const entry of FUND_KEYWORD_MAP) {
    const hasKeyword = entry.keywords.some((kw) => lower.includes(kw));
    if (hasKeyword) {
      suggestedFundId = entry.fundId;
      suggestedCategory = entry.category;
      break;
    }
  }

  return {
    rawText: text,
    bankName,
    amount: numericAmount,
    type,
    description,
    suggestedFundId,
    suggestedCategory,
    detectedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
}

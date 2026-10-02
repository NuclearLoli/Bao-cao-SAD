# Bao-cao-SAD: Quan Ly Dong Tien Gia Dinh (SAD - K23A)

He thong Quan ly dong tien gia dinh (Family Cash Flow Management) - Mo hinh Mobile-first voi khung 4 quy, tien tieu vat ca nhan (Pocket Money), bot bóc tách SMS bien dong so du ngan hang Viet Nam, nhịp check-in 15 phut tuan va tro ly AI.

---

## 1. Thong tin Du an
- **Ten du an:** Quan ly dong tien gia dinh (Family Cash Flow Management)
- **Mon hoc:** Phan tich va Thiet ke He thong Thong tin (SAD - K23A)
- **Mo hinh van hanh:**
  - Nhan luong -> Trich truoc 4 quy + Tien tieu vat rieng 2 vo chong -> Phan con lai la chi tieu linh hoat.
  - Nhap lieu sieu toc (<5s): Quick-add, Boc tach SMS/Thong bao bien dong so du ngan hang (VCB, TCB, MB, Momo...), Chup anh hoa don.
  - Money Date: Check-in 15 phut Chu nhat hang tuan + Du bao toc do can quy (EOM Burn Rate) + AI goi y dieu chinh.
  - Quan ly hoa don dinh ky (Recurring bills) & Tien do Quy muc tieu (Savings goals).
  - Bao cao 1 trang chot thang & Doi soat dong gop vo chong cong bang.

---

## 2. Cau truc Thu muc
```text
E:\SAD-Bao cao/
├── apps/
│   └── mobile/                  # Ung dung Expo React Native
│       ├── src/
│       │   ├── app/             # Man hinh Expo Router
│       │   │   ├── dashboard.tsx        # Dashboard trung tam
│       │   │   ├── budget/setup.tsx     # Payday Wizard phan bo luong
│       │   │   ├── transactions/new.tsx # Ghi nhanh + Boc tach SMS + Hoa don
│       │   │   ├── transactions/index.tsx # Danh sach + Loc nguoi chi
│       │   │   ├── weekly-checkin.tsx   # Check-in tuan 15' + AI
│       │   │   ├── bills-and-goals.tsx  # Hoa don dinh ky & Muc tieu
│       │   │   └── monthly-close.tsx    # Chot thang & Doi soat
│       │   ├── components/      # UI components
│       │   ├── core/            # Identity & Telemetry
│       │   └── features/
│       │       ├── auth/        # Xac thuc & Multi-account
│       │       ├── finance/     # 4 Quy, Pocket Money, Bank SMS Parser
│       │       └── household/   # Quan ly Ho gia dinh
│       └── __tests__/           # 8 Test suites (45 unit/component tests)
├── DOC_BASE.md                  # Doc base goc
├── PRD-QuanLyDongTienGiaDinh.md # Product Requirements Document
├── EPICS_AND_USER_STORIES.md    # 5 Epics, 15 User Stories (84 SP)
├── QA_TEST_CASES.md             # Bo kiem thu QA test cases
├── DEVELOPMENT_AND_TEST.md      # Quy chuan DoR/DoD, Data Model 12 bang
├── PROJECT_ALL_IN_ONE.md        # Tai lieu All-in-one
├── bao_cao_BA.html              # Giao dien bao cao BA truc quan
└── index.html                   # Giao dien web trinh bay de tai
```

---

## 3. Huong dan Chay Ung dung

Di chuyen vao thu muc `apps/mobile`:
```bash
cd apps/mobile
```

Chay kiem thu toan bo:
```bash
npm test
```

Kiem tra TypeScript Typecheck:
```bash
npm run typecheck
```

Chay ung dung tren trinh duyet Web:
```bash
npm run web
```

Chay ung dung tren dien thoai (Expo Go):
```bash
npm start
```
Quet ma QR tren man hinh bang ung dung **Expo Go** (Android/iOS).
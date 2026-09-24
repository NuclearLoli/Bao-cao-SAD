# Development & Test (D&T) — Quản lý dòng tiền gia đình (Web)

Nguồn: `PRD-QuanLyDongTienGiaDinh.md`, `EPICS_AND_USER_STORIES.md`, `QA_TEST_CASES.md`.

## 1) Mục tiêu D&T (để chạy “mượt”)

- Dev có thể lấy 1 user story bất kỳ và implement mà không phải hỏi lại “cụ thể làm gì”.
- QA có test case map 1-1 theo US, có dữ liệu mẫu để chạy nhanh.
- Khi AI down/timeout hoặc mạng chập chờn, luồng cốt lõi vẫn dùng được (manual-first).

## 2) Definition of Ready (DoR) cho 1 User Story

Một US được kéo vào sprint khi đủ các mục sau (đã chuẩn hoá ngay trong `EPICS_AND_USER_STORIES.md`):
- Scope (In/Out)
- Preconditions
- UX/Flow
- AC Given/When/Then (testable)
- Test cases (QA-ready)
- Telemetry events
- DoD

## 3) Definition of Done (DoD) chuẩn Sprint

**Dev Done**
- Code hoàn chỉnh theo AC + edge cases
- Migration/seed data (nếu có)
- Unit tests/Component tests cho logic tính toán quan trọng (budget/spent/room, week boundary, soft delete)
- Không làm hỏng các P0 US (regression tự động pass)

**QA Done**
- Chạy `QA_TEST_CASES.md` cho các US trong sprint
- Pass toàn bộ P0 liên quan
- Chụp bằng chứng (screenshot/video ngắn) cho các màn chính: dashboard tháng, weekly check-in, close month

## 4) Đề xuất kiến trúc triển khai (đủ cho MVP)

> Tài liệu này không ép stack. Nếu team đã chọn stack khác, giữ nguyên, miễn các contract & test strategy dưới đây vẫn đúng.

### 4.1 Kiến trúc tổng thể (mobile-first)

- **Mobile app** (iOS/Android) là client chính: quick-add, receipts, dashboard, weekly check-in.
- **Backend API**: household, budgeting, transactions, insights, forecasting, ai-assist, telemetry.
- **Storage**: DB cho dữ liệu nghiệp vụ + object storage cho ảnh bill.
- **AI services**: classify/suggestions chạy server-side; client không bị chặn khi AI lỗi.

### 4.2 Modules (gợi ý tách theo domain)
- `auth` (login/session)
- `household` (members, invites)
- `budgeting` (BudgetPeriod, Funds, room calc)
- `transactions` (CRUD, soft delete, receipts)
- `insights` (weekly summary, top spend, anomaly)
- `forecasting` (EOM forecast v1 deterministic)
- `ai-assist` (classify suggestion, adjustment suggestions, retries/timeout)
- `telemetry` (event tracking)

### 4.3 Data model tối thiểu (MVP)
- `Household(id, name, currency, createdAt)`
- `Member(id, householdId, userId, role, joinedAt)`
- `Invite(id, householdId, tokenHash, expiresAt, revokedAt, createdBy)`
- `BudgetPeriod(id, householdId, month, year, status=open|closed, paydayDay?)`
- `Fund(id, householdId, code=fixed|family|reserve|goals, displayName, description?)`
- `FundBudget(id, budgetPeriodId, fundId, mode=amount|percent, amount?, percent?)`
- `Transaction(id, householdId, budgetPeriodId, fundId, amount, occurredAt, note?, createdBy, createdAt, updatedBy?, updatedAt?, deletedAt?)`
- `Receipt(id, transactionId, url, mimeType, sizeBytes, createdAt)`
- `CheckIn(id, householdId, weekStart, confirmedBy, confirmedAt)`
- `Alert(id, householdId, budgetPeriodId, fundId, type, payloadJson, createdAt, dismissedAt?)`
- `AdjustmentDecision(id, householdId, budgetPeriodId, fundId?, suggestionId, note?, decidedBy, decidedAt)`
- `BudgetChangeHistory(id, householdId, fromBudgetPeriodId, toBudgetPeriodId, diffJson, changedBy, changedAt)`

## 5) Quy tắc tính toán (để dev/test thống nhất)

### 5.1 Spent / Room theo quỹ
- `spent(fund, month) = sum(amount) của Transaction không bị soft-delete trong kỳ đó`
- `room = budget - spent` (nếu chưa có budget → room = N/A)

### 5.2 Week boundary (v1)
- Mặc định: tuần tính **Mon–Sun** theo timezone của household (v1: dùng timezone server hoặc cấu hình cố định Asia/Saigon nếu pilot ở VN).
- `weekStart` là 00:00 của Thứ 2.

### 5.3 Forecast EOM (v1 deterministic)
- Không dùng model phức tạp ở v1.
- Công thức gợi ý:
  - `avgDaily = totalSpentSoFar / daysElapsed`
  - `forecastEOM = avgDaily * daysInMonth`
- Nếu `daysElapsed < 3` hoặc `totalTx < 3` → hiển thị “chưa đủ tin cậy” (không hard-fail).

## 6) Test Strategy (đề xuất)

### 6.1 Test pyramid
- Unit tests: calc `spent/room`, week grouping, forecast v1, soft delete adjustments.
- Component/UI tests: quick-add, edit/delete, upload states, empty-states (ưu tiên mobile UI).
- E2E smoke (P0 path): create household → set budget → add tx → see dashboard update → weekly summary → close month.

### 6.2 Mapping theo mức ưu tiên
- P0 stories: yêu cầu có **E2E smoke** tối thiểu + unit tests cho logic.
- P1 stories: unit + component là đủ, E2E optional.

### 6.3 AI failure-mode tests (bắt buộc)
- Timeout/retry: AI classify/suggestions không được chặn luồng tạo giao dịch.
- Offline: hệ thống vẫn cho manual add + dashboard (trừ phần AI).
- Degraded UI: hiển thị “AI tạm unavailable” + hướng dẫn thao tác thủ công.

### 6.4 Plan-gating tests (khi có Free/Plus/Pro)
- Free: thấy lock badge ở các tính năng Pro; khi hết quota AI thì vẫn tạo giao dịch được (manual).
- Plus: quota cao hơn; weekly check-in insights hiển thị đầy đủ.
- Pro: agent endpoints/UI chỉ mở khi plan=Pro; nếu agent fail → fallback về behavior của Plus/Free.

## 7) Test Data (seed) chuẩn để QA chạy nhanh

Tạo 1 bộ seed tối thiểu (dùng cho staging/local):
- 1 household “Nhà A” với 2 member.
- 1 BudgetPeriod cho tháng hiện tại:
  - Cố định: 18,000,000
  - Gia đình & Con: 14,000,000
  - Dự phòng: 4,000,000
  - Mục tiêu: 4,000,000
- 15 transactions rải trong 2 tuần để test top-5, anomaly, forecast.

Khi test gói dịch vụ:
- 3 household seed: `Free`, `Plus`, `Pro` (cùng data nhưng plan khác) để QA so sánh gating/quota.

## 8) CI/CD (đề xuất tối thiểu)

On PR:
- lint + typecheck
- unit tests
- build
- e2e smoke (chỉ P0 path) nếu runtime cho phép

On main:
- deploy staging + chạy smoke

## 9) QA Execution Flow (thực dụng)

1) Chọn sprint stories (ưu tiên P0)
2) Dev implement + tự check theo “Test Cases (QA-ready)” trong từng US
3) QA chạy `QA_TEST_CASES.md` cho các US trong sprint
4) Tổng hợp defect theo US-id (US-4.2, US-5.1…)

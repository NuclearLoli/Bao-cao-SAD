---
title: "All-in-one — Quản lý dòng tiền gia đình (Web)"
status: working
created: 2026-09-25
updated: 2026-09-25
note: "Gom PRD + Epics/User Stories + QA Test Cases + Development & Test."
---

# All-in-one — Quản lý dòng tiền gia đình (Web)

Nguồn/Artifacts trong workspace:
- `PRD-QuanLyDongTienGiaDinh.md`
- `EPICS_AND_USER_STORIES.md`
- `QA_TEST_CASES.md`
- `DEVELOPMENT_AND_TEST.md`

---

# 1) PRD — Quản lý dòng tiền gia đình (Web)

## 0) Tóm tắt 1 trang
Sản phẩm là một web app giúp gia đình (2 vợ chồng + 1 con) quản lý dòng tiền **theo tuần** bằng khung **4 quỹ** và thói quen **check-in 15 phút/tuần**. AI hỗ trợ phần “mệt”: phân loại, tóm tắt, cảnh báo sớm, dự đoán cuối tháng, và gợi ý điều chỉnh “ít đau nhất” để vẫn đạt mục tiêu.

## 1) Vision
Giúp gia đình “đỡ cày” cuối tháng bằng cách:
- Nhìn thấy “room” còn lại theo quỹ/nhóm chi tiêu một cách trực quan.
- Biến việc quản lý tiền thành một nhịp đều theo tuần, không phải “chốt sổ” cuối tháng.
- Giảm tranh luận bằng ngân sách chung minh bạch: cả hai cùng thấy, cùng thống nhất giới hạn.

Nguyên tắc sản phẩm: **tối giản thao tác** (ghi/chụp bill siêu nhanh) + **ra quyết định trong giới hạn** (AI gợi ý, gia đình chốt).

## 2) Target User
Primary user: gia đình (2 vợ chồng + 1 con) có thu nhập ổn định theo tháng, chi tiêu đa kênh, thường “hẫy” cuối tháng vì khó tổng hợp và không có nhịp check-in theo tuần.

Constraints:
- Web-first: thao tác nhanh trên điện thoại/laptop.
- Ngân sách chung: **cả hai đều thấy mọi giao dịch**.
- Thói quen: check-in tuần tối đa 15 phút; trong tuần ghi chi dưới 30 giây/lần.

## 3) Problem Statement
- Chi tiêu phân mảnh → khó tổng hợp đúng và đủ.
- Chi cho con phát sinh liên tục, không đều theo kế hoạch.
- Hai người cùng tiêu, khác ưu tiên; thiếu ngân sách chung → dễ tranh luận.

Kết luận: không phải “kiếm ít”, mà là thiếu hệ thống nhìn dòng tiền theo tuần.

## 4) Solution Overview
### 4.1 Khung 4 quỹ
1) Cố định
2) Gia đình & Con
3) Dự phòng (3–6 tháng chi phí thiết yếu)
4) Mục tiêu

Nguyên tắc: nhận lương → trích quỹ trước → phần còn lại là chi linh hoạt.

### 4.2 Nhịp vận hành
- Ngày nhận lương (5’): trích Cố định + Dự phòng + Mục tiêu.
- Trong tuần (30s/lần): ghi nhanh hoặc chụp bill.
- Check-in cuối tuần (15’): xem khoản lớn, khoản bất thường, nhóm sắp vượt.
- Chốt cuối tháng (10’): 1 trang tổng kết + điều chỉnh tỷ lệ quỹ tháng sau.

### 4.3 AI hỗ trợ (mức “C” cho MVP)
- Gợi ý phân loại từ ảnh bill / mô tả giao dịch.
- Tóm tắt tuần: điểm tăng mạnh + top 5 khoản chi.
- Cảnh báo sớm & dự đoán cuối tháng: nhóm nào sắp vượt, còn bao nhiêu “room”.
- Gợi ý điều chỉnh: 2–3 phương án cắt giảm “ít đau nhất” để vẫn đạt mục tiêu.

## 5) MVP Scope
In-scope:
- Household + mời thành viên (2 vợ chồng).
- 4 quỹ + cấu hình ngân sách theo tháng (số tiền hoặc tỷ lệ).
- Nhập giao dịch chi (manual) + ảnh bill.
- AI gợi ý phân loại + sửa tay.
- Dashboard tuần/tháng: room theo quỹ, top chi, bất thường.
- Cảnh báo + dự đoán vượt.
- Gợi ý điều chỉnh (2–3 phương án) + lưu quyết định/ghi chú.
- Chốt tháng 1 trang + lưu lịch sử điều chỉnh.

Out-of-scope v1:
- Đồng bộ ngân hàng tự động 100%.
- Đầu tư/portfolio, tài chính chuyên sâu.
- Kế toán doanh nghiệp/thuế.

## 6) Functional Requirements (FR)
- FR-01: household + mời thành viên; cả hai xem toàn bộ.
- FR-02: payday + kỳ ngân sách.
- FR-03: 4 quỹ mặc định.
- FR-04: ngân sách theo tháng + room.
- FR-05: tạo giao dịch <30s + ảnh bill.
- FR-06: sửa/xóa + audit đơn giản.
- FR-07: AI gợi ý phân loại + confidence + học dần.
- FR-08: weekly summary.
- FR-09: cảnh báo sớm theo forecast.
- FR-10: room tối thiểu theo 4 quỹ.
- FR-11: gợi ý điều chỉnh.
- FR-12: lưu quyết định (không auto-apply).
- FR-13: trang chốt tháng + điều chỉnh tháng sau.

## 7) Non-Functional Requirements (NFR)
- NFR-01: dashboard tuần <2s.
- NFR-02: privacy + phân quyền theo household.
- NFR-03: AI down/offline → manual vẫn chạy.
- NFR-04: explainable alerts/suggestions (“vì sao”).

## 8) Metrics
- Tỷ lệ check-in tuần.
- % giao dịch ghi trong 24h.
- Số lần vượt theo quỹ.
- Survey “giảm tranh luận”.

## 9) Risks & Failure Modes
- Nhập liệu rườm rà → bỏ dùng.
- AI sai → mất tin (cần confidence + sửa nhanh + học dần).
- Xung đột thói quen chi tiêu → UI trung tính.
- Dữ liệu nhạy cảm → privacy-by-default.

## 10) Open Questions
1) Room: theo 4 quỹ hay thêm nhóm con ngay MVP?
2) Bất thường: ngưỡng tuyệt đối hay baseline 4 tuần?
3) Ảnh bill: OCR/parsing ngay v1 hay sau?
4) Luật household (keyword→quỹ) hiển thị UI hay học ngầm?

## 11) Assumptions Index
- Web-first.
- Không private mode trong MVP.
- AI là trợ lý, gia đình chốt.

## 12) Gói dịch vụ (Free / Plus / Pro) & mở khóa AI agents
### 12.1 Nguyên tắc đóng gói
- Free hoàn chỉnh core loop.
- Trả phí mở khóa chiều sâu/tốc độ/agent.
- Không khóa dữ liệu lịch sử; khác nhau ở “trí tuệ” và tự động hóa.

### 12.2 Free
- Household 2 người.
- 4 quỹ + budget tháng.
- Ghi giao dịch + ảnh bill.
- Dashboard tháng + weekly check-in cơ bản.
- AI gợi ý phân loại mức nhẹ (có thể quota); manual luôn chạy.

### 12.3 Plus
- AI phân loại tốt hơn + quota cao hơn.
- Weekly check-in thông minh hơn (drivers + cảnh báo rõ hơn).
- Forecast + alerts ổn định hơn.
- UI quản lý rule household (keyword → quỹ).

### 12.4 Pro
- Agent “Budget Coach”: phương án điều chỉnh + trade-off.
- Agent “Anomaly Detective”: phát hiện bất thường theo thói quen.
- Agent “Goal Planner”: kế hoạch mục tiêu + phân bổ theo timeline.
- What-if simulation.

### 12.5 Open Questions pricing
- Giới hạn Free theo quota AI kiểu nào?
- Pro agents on-demand hay có lịch nhắc chủ động (v2)?
- Có SKU privacy/local-first trong roadmap không?

---

# 2) Epics & User Stories (Dev-ready)

Tài liệu chi tiết: `EPICS_AND_USER_STORIES.md`.

## Epic 1 — Household & Kỳ ngân sách
- US-1.1 (P0): Tạo household
- US-1.2 (P0): Mời thành viên
- US-1.3 (P1): Thiết lập payday/kỳ

## Epic 2 — 4 quỹ & Room
- US-2.1 (P0): Cấu hình budget tháng
- US-2.2 (P1): Wizard “trích quỹ”

## Epic 3 — Giao dịch + Bill + AI phân loại
- US-3.1 (P0): Quick add giao dịch
- US-3.2 (P1): Upload receipt
- US-3.3 (P1): Edit/delete + audit
- US-3.4 (P1): AI classify suggestion

## Epic 4 — Weekly/Monthly + Alerts + Adjustments
- US-4.1 (P0): Monthly dashboard
- US-4.2 (P0): Weekly check-in summary
- US-4.3 (P1): Forecast + alerts
- US-4.4 (P1): Adjustment suggestions

## Epic 5 — Close month
- US-5.1 (P0): Close month page
- US-5.2 (P0): Update next month budgets + history

## (Tuỳ chọn) Epic 6 — Gói dịch vụ & AI agents
- US-6.1 (P2): Subscription state + UI gating
- US-6.2 (P2): AI quota theo gói
- US-6.3 (P2): Pro agent “Budget Coach”

---

# 3) QA Test Cases

Tài liệu chi tiết: `QA_TEST_CASES.md` (map 1-1 theo US).

Nguyên tắc:
- P0: phải pass để ship MVP.
- P1: nên pass để trải nghiệm mượt + ổn định AI.

---

# 4) Development & Test (D&T)

Tài liệu chi tiết: `DEVELOPMENT_AND_TEST.md`.

Nội dung chính:
- DoR/DoD chuẩn sprint.
- Data model tối thiểu.
- Quy tắc tính `spent/room`, week boundary Mon–Sun, forecast EOM v1 deterministic.
- Test strategy: unit/component/e2e smoke (P0 path).
- AI failure-mode tests + plan-gating tests (khi có Free/Plus/Pro).
- Seed test data cho QA chạy nhanh.


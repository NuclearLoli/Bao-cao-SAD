---
title: "Product Requirements Document — Quản lý dòng tiền gia đình (Web)"
status: draft
created: 2026-09-24
updated: 2026-09-24
note: "PRD dựa trên DOC_BASE.md (slide Quản lý dòng tiền gia đình)."
---

# PRD — Quản lý dòng tiền gia đình (Web)

## 0) Tóm tắt 1 trang

Sản phẩm là một web app giúp gia đình (2 vợ chồng + 1 con) quản lý dòng tiền **theo tuần** bằng khung **4 quỹ** và thói quen **check-in 15 phút/tuần**. AI hỗ trợ phần “mệt”: phân loại, tóm tắt, cảnh báo sớm, dự đoán cuối tháng, và gợi ý điều chỉnh “ít đau nhất” để vẫn đạt mục tiêu.

## 1) Vision

Giúp gia đình “đỡ cày” cuối tháng bằng cách:
- Nhìn thấy “room” còn lại theo quỹ/nhóm chi tiêu một cách trực quan.
- Biến việc quản lý tiền thành một nhịp đều theo tuần, không phải “chốt sổ” cuối tháng.
- Giảm tranh luận bằng ngân sách chung minh bạch: cả hai cùng thấy, cùng thống nhất giới hạn.

Nguyên tắc sản phẩm: **tối giản thao tác** (ghi/chụp bill siêu nhanh) + **ra quyết định trong giới hạn** (AI gợi ý, gia đình chốt).

## 2) Target User

### 2.1 Primary user
Gia đình (2 vợ chồng + 1 con) có thu nhập ổn định theo tháng, chi tiêu đa kênh (quẹt/ship/tiền mặt), thường “hẫy” cuối tháng vì khó tổng hợp và không có nhịp check-in theo tuần.

### 2.2 Jobs To Be Done (JTBD)
- “Tôi muốn biết tuần này đang vượt nhóm nào để điều chỉnh sớm.”
- “Tôi muốn cả hai vợ chồng thống nhất chi trong giới hạn, đỡ hiểu lầm.”
- “Tôi muốn vẫn có quỹ mục tiêu (du lịch/quỹ học…), không phải thắt chặt cực đoan.”
- “Tôi muốn việc ghi chép nhẹ nhàng, không biến thành ‘kế toán’.”

### 2.3 Constraints
- Web-first: thao tác nhanh trên điện thoại/laptop.
- Ngân sách chung: **cả hai đều thấy mọi giao dịch**.
- Thói quen: check-in tuần tối đa 15 phút; trong tuần ghi chi dưới 30 giây/lần.

## 3) Problem Statement

Gia đình “cày” cuối tháng chủ yếu vì:
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

### 5.1 In-scope (MVP)
- Tạo household + mời thành viên (2 vợ chồng).
- Tạo 4 quỹ + cấu hình ngân sách theo tháng (số tiền hoặc tỷ lệ).
- Nhập giao dịch chi (manual) + đính kèm ảnh bill.
- AI gợi ý phân loại + cho phép sửa tay.
- Dashboard tuần/tháng: room theo quỹ, top chi, bất thường.
- Cảnh báo sớm + dự đoán vượt ngân sách.
- Gợi ý điều chỉnh (2–3 phương án) + cho phép người dùng chấp nhận/ghi chú.
- 1 trang chốt tháng + lưu lịch sử điều chỉnh.

### 5.2 Out-of-scope (v1)
- Đồng bộ ngân hàng tự động 100% (tùy đối tác).
- Đầu tư/portfolio, tối ưu tài chính chuyên sâu.
- Chia sẻ dữ liệu cho bên thứ ba / cộng đồng.
- Kế toán doanh nghiệp / thuế.

## 6) Functional Requirements (FR)

### 6.1 Tài khoản & household
- **FR-01**: Tạo household và mời thành viên qua link/email; cả hai có quyền xem toàn bộ dữ liệu household.
- **FR-02**: Thiết lập “ngày nhận lương” và kỳ ngân sách theo tháng.

### 6.2 Ngân sách & 4 quỹ
- **FR-03**: Tạo/sửa 4 quỹ mặc định (khóa tên quỹ mặc định ở MVP; cho phép chỉnh mô tả).
- **FR-04**: Cấu hình ngân sách tháng cho từng quỹ (số tiền/tỷ lệ) + hiển thị “room” còn lại.

### 6.3 Ghi nhận giao dịch
- **FR-05**: Tạo giao dịch chi trong <30s: số tiền, ngày, mô tả, quỹ/nhóm, đính kèm ảnh.
- **FR-06**: Sửa/xóa giao dịch, lưu audit đơn giản (ai sửa, khi nào).

### 6.4 AI phân loại & tóm tắt
- **FR-07**: AI gợi ý quỹ/nhóm chi từ mô tả/ảnh; hiển thị mức tin cậy; cho phép sửa và “học” dần theo household.
- **FR-08**: Tóm tắt tuần: top 5 khoản chi, biến động so với tuần trước, 1–3 điểm bất thường.

### 6.5 Cảnh báo & dự đoán
- **FR-09**: Cảnh báo sớm khi nhịp chi hiện tại dự đoán vượt ngân sách quỹ X cuối tháng.
- **FR-10**: Hiển thị “room” cho các nhóm chi chính (ít nhất theo 4 quỹ; nhóm con là v2).

### 6.6 Gợi ý điều chỉnh
- **FR-11**: Đưa 2–3 phương án điều chỉnh (ít ảnh hưởng nhất) để đưa dự báo về trong giới hạn.
- **FR-12**: Cho phép người dùng chọn một phương án và ghi chú quyết định; không auto-apply.

### 6.7 Chốt tháng
- **FR-13**: 1 trang chốt tháng: tổng thu/chi theo quỹ, phần vượt/thiếu, điều chỉnh tỷ lệ/số tiền quỹ cho tháng sau.

## 7) Non-Functional Requirements (NFR)
- **NFR-01 (Performance)**: mở dashboard tuần trong <2s trên mạng bình thường.
- **NFR-02 (Privacy)**: dữ liệu household mã hóa khi truyền; phân quyền rõ ràng theo household.
- **NFR-03 (Reliability)**: nếu AI lỗi/không có mạng → vẫn nhập và xem số liệu thủ công.
- **NFR-04 (Explainability)**: cảnh báo và gợi ý phải có “vì sao” ngắn gọn (dựa trên số liệu nào).

## 8) Metrics / Success Criteria
- Tỷ lệ household check-in tuần (có mở “weekly summary” + xác nhận) theo tháng.
- % giao dịch được ghi trong 24h.
- Số lần vượt ngân sách theo quỹ (giảm dần sau 2–3 tháng).
- “Giảm tranh luận” (survey 1 câu/tháng).

## 9) Risks & Failure Modes
- Người dùng bỏ cuộc nếu nhập liệu rườm rà.
- AI phân loại sai → mất tin; cần “confidence + sửa nhanh + học dần”.
- Xung đột thói quen chi tiêu giữa hai người; cần giao diện trung tính, tránh “phán xét”.
- Dữ liệu nhạy cảm; cần tối giản thu thập, minh bạch quyền truy cập.

## 10) Open Questions (cần chốt sớm)
1) “Room” hiển thị: chỉ theo 4 quỹ (v1) hay thêm nhóm con (ăn uống/mua sắm…) ngay từ MVP?
2) Định nghĩa “bất thường”: theo ngưỡng tuyệt đối hay theo baseline 4 tuần gần nhất?
3) AI nhập ảnh bill: có OCR + parsing ngay v1 hay chỉ gợi ý từ text/keyword?
4) Có cần “luật” riêng theo household (ví dụ mapping từ khóa → nhóm chi) ở UI hay để AI tự học ẩn?

## 11) Assumptions Index
- MVP là web-first; mobile app có thể là v2.
- Cả hai vợ chồng xem toàn bộ dữ liệu household (không có chế độ riêng tư trong MVP).
- AI chỉ là trợ lý: gợi ý/giải thích/cảnh báo; người dùng quyết định.

## Appendix A — Nguồn & bối cảnh
- `DOC_BASE.md`: tài liệu nền từ slide “Quản lý dòng tiền gia đình”.


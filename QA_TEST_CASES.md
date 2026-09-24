# QA Test Cases — Quản lý dòng tiền gia đình (Web)

Nguồn: `EPICS_AND_USER_STORIES.md` (map 1-1 theo user story).

> Quy ước:
> - P0: phải pass để ship MVP
> - P1: nên pass để trải nghiệm đủ “mượt”

---

## EPIC 1 — Household & Kỳ ngân sách

### US-1.1 — Tạo household (P0)
1. Tạo household với tên hợp lệ → tạo thành công, vào dashboard rỗng.
2. Tên rỗng/toàn khoảng trắng → validation fail.
3. Refresh sau khi tạo → household vẫn tồn tại và vào đúng household.

### US-1.2 — Mời thành viên (P0)
1. Admin generate invite link → link hợp lệ có expiry.
2. Mở link ở ẩn danh/thiết bị khác → Join thành công, xem được toàn bộ dữ liệu.
3. Link invalid/hết hạn/revoke → join fail với thông báo đúng.
4. User không phải admin → không tạo invite được (UI disable/403).

### US-1.3 — Thiết lập payday (P1)
1. Set payday trong [1..28] → save ok, reload vẫn đúng.
2. Set payday = 0/31 → validation fail.
3. Dashboard hiển thị rõ tháng/năm + trạng thái open/closed.

---

## EPIC 2 — 4 quỹ & Room

### US-2.1 — Cấu hình budget tháng (P0)
1. Amount mode: set 4 quỹ → save ok → dashboard hiển thị budget/spent/room.
2. Percent mode: tổng 90% → không save; tổng 100% → save ok.
3. Input số âm/ký tự → validation fail.

### US-2.2 — Trích quỹ (wizard) (P1)
1. Nhập tổng thu + % → budgets ra số tiền đúng.
2. Bỏ qua tổng thu → nhập amount trực tiếp → save ok.
3. Lỗi giữa chừng (network) → không ghi nửa chừng (không partial save).

---

## EPIC 3 — Giao dịch + Bill + AI

### US-3.1 — Quick add transaction (P0)
1. Tạo transaction 120k vào Gia đình & Con → spent tăng đúng.
2. Tạo transaction date tháng trước → phản ánh đúng tháng.
3. Double submit save → không tạo duplicate.
4. Amount rỗng/0/âm → validation fail.

### US-3.2 — Upload receipt (P1)
1. Upload PNG/JPG hợp lệ → success + preview.
2. Upload file không phải ảnh → reject.
3. Mất mạng khi upload → fail có retry; transaction không bị ảnh hưởng.

### US-3.3 — Edit/Delete + audit (P1)
1. Edit quỹ (Gia đình & Con → Cố định) → spent chuyển quỹ đúng.
2. Soft delete → spent/room cập nhật đúng; item ẩn (hoặc filter được).
3. User ngoài household → truy cập/edit bị chặn (403).

### US-3.4 — AI classify suggestion (P1)
1. Nhập mô tả “điện nước” → gợi ý Cố định (hoặc confidence thấp nếu không chắc).
2. Override gợi ý → lần sau keyword tương tự gợi ý đúng hơn (learning/rule).
3. AI down/timeout → UI không treo; cho chọn quỹ thủ công.

---

## EPIC 4 — Weekly/Monthly + Alerts + Adjustments

### US-4.1 — Monthly dashboard (P0)
1. Tháng có data → totals đúng theo quỹ.
2. Tháng có giao dịch nhưng chưa set budget → room = N/A + CTA set budget.
3. Tháng không data → empty-state.

### US-4.2 — Weekly check-in summary (P0)
1. Tuần có 10 giao dịch → top 5 đúng theo amount.
2. Tuần đầu tiên (không có tuần trước) → compare state hợp lý.
3. Confirm check-in 2 lần → không duplicate.
4. Verify boundary Mon–Sun theo timezone.

### US-4.3 — Forecast + Alerts (P1)
1. Nhịp chi đều → forecast theo công thức v1 đúng (avg daily * days in month).
2. EOM > budget → alert active + giải thích ngắn.
3. Không đủ data → hiển thị “forecast chưa đủ tin cậy”.

### US-4.4 — Adjustment suggestions (P1)
1. Có alert vượt → hiển thị 2–3 gợi ý + impact estimate.
2. Chọn 1 gợi ý → lưu decision; refresh vẫn còn.
3. AI down → fallback rule-based hoặc thông báo hợp lý; không crash.

---

## EPIC 5 — Close month

### US-5.1 — Close month page (P0)
1. Tháng có data → summary đúng (tổng theo quỹ, top khoản chi).
2. Close 2 lần → lần 2 bị chặn/no-op; không duplicate.
3. Close xong → hạn chế chỉnh budgets tháng đã close (hoặc có cảnh báo rõ).

### US-5.2 — Update next month budgets + history (P0)
1. Edit budgets tháng sau → save → dashboard tháng sau đúng.
2. View history → thấy user + timestamp + diff.


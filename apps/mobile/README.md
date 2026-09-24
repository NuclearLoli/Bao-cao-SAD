# Quản lý dòng tiền — Mobile

Expo/React Native client cho sản phẩm quản lý dòng tiền gia đình. Vertical slice đầu tiên cho phép tạo một hộ gia đình, gán người tạo làm quản trị viên và lưu dữ liệu cục bộ có phiên bản.

## Get started

1. Dùng Node.js 24 (xem `.nvmrc`) và cài dependency:

   ```bash
   npm install
   ```

2. Chạy ứng dụng:

   ```bash
   npx expo start
   ```

Ứng dụng dùng Expo Router; route nằm trong `src/app`, còn domain/application/data/UI logic nằm ngoài route.

## Kiểm tra chất lượng

```bash
npm test
npm run lint
npm run typecheck
npx expo-doctor
```

AsyncStorage là nơi lưu cục bộ, không mã hóa. Không lưu bí mật hoặc thông tin xác thực trong adapter hiện tại.

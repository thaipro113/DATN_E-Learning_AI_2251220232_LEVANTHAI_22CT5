# Quy tắc làm việc với Git của Dự án

1. **KHÔNG tự ý push Git**: Sau khi sửa xong code, chạy test hoặc hoàn thành bất kỳ tính năng/sửa lỗi nào, KHÔNG được tự ý chạy `git push`.
2. **Luôn cung cấp câu lệnh Git để người dùng tự chạy**:
   Cuối mỗi phản hồi hoàn thành task, luôn viết sẵn khối lệnh hoàn chỉnh để người dùng copy và tự chạy trên terminal:
   - Commit & Push lên nhánh `develop`
   - Merge & Push đồng bộ sang nhánh `develop-mssql`
   - Chuyển lại về nhánh `develop`

Mẫu câu lệnh chuẩn:
```bash
git add .
git commit -m "<thông điệp commit mô tả thay đổi>"
git push origin develop

git checkout develop-mssql
git merge develop --ff-only
git push origin develop-mssql
git checkout develop
```

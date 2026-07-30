# Làng Rim Nam AI Guard

Next.js 14 App Router demo cho dự án **Kỹ năng chống lừa đảo trên Internet - Làng Rim Nam**.

## Tính năng

- Dark cyber neon UI, responsive tốt cho mobile/QR.
- Phân tích Link/URL và Tin nhắn.
- Gemini JSON response, prompt tập trung vào tâm lý học lừa đảo.
- Kết quả có risk badge, confidence, red flags, manipulation techniques, ví dụ, checklist, recommendation.
- Demo fallback đẹp khi chưa có API key hoặc API tạm lỗi.
- QR code động, lịch sử local, copy/share kết quả, trang About nhóm.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Cấu hình Gemini

Tạo `.env.local`:

```bash
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-3.6-flash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

API route dùng Interactions API:

```txt
POST https://generativelanguage.googleapis.com/v1beta/interactions
Header: x-goog-api-key: GEMINI_API_KEY
```

Body dùng:

- `model`
- `system_instruction`
- `input`
- `generation_config.temperature = 0.76`
- `response_format.mime_type = "application/json"`
- `response_format.schema`

Server sẽ thử lần lượt các model mới hơn (`gemini-3.6-flash`, `gemini-flash-latest`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`) rồi mới tới legacy fallback, để tránh lỗi model cũ bị 404.

## Deploy Vercel

Thêm Environment Variables:

```bash
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-3.6-flash
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

Build command: `npm run build`.

Không lưu database. Lịch sử phân tích chỉ nằm trong `localStorage` của trình duyệt.

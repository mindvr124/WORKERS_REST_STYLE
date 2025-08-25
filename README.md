# 휴식 스타일 진단 (Vite + React)

## 로컬 실행
```bash
npm install
npm run dev
```

## 프로덕션 빌드
```bash
npm run build
npm run preview
```

## Vercel 배포
- GitHub에 푸시 후 Vercel에서 Import → Framework: Vite
- 또는 CLI: `npm i -g vercel && vercel`

## Docker
```bash
docker build -t rest-style .
docker run -d -p 8080:80 rest-style
```

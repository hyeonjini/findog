# Chrome Extension

Manifest V3 기반 상품 클리핑 익스텐션.

## 현재 상태 (Skeleton)

MV3 skeleton. 실제 기능 없음.

- **background**: `onInstalled` 이벤트 로그만 있음
- **content**: 최소한의 message listener만 있음
- **popup**: 정적 HTML (React 없음)
- **manifest.json**: 기본 MV3 권한 포함 (존재함)

TypeScript 없음. CRXJS 없음. 빌드 툴링 없음 (Vite stub만 있음).

## 실제 구조

```text
src/
  background/   # onInstalled log only
  content/      # minimal message listener
  popup/        # static HTML
manifest.json
```

## 커맨드

```bash
pnpm --filter chrome-extension dev
pnpm --filter chrome-extension build
```

## 다음 단계

TypeScript + CRXJS 도입 시 `docs/architecture/chrome-extension.md` 참고.

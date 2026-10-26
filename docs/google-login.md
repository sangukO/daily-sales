# Google 로그인 설정 및 설치 전 확인

앱은 Google 로그인만 제공합니다. 기존 전화번호 계정의 데이터 이전은 하지 않습니다.

## 전환 상태 (2026-10-26)

- Google 웹 OAuth 클라이언트 생성 및 Supabase Google 공급자 연결 완료.
- Supabase Site URL과 배포 콜백 허용 목록 설정 완료.
- Supabase Phone 공급자 비활성화 및 테스트 전화번호·고정 OTP 제거 완료.
- Vercel 개발용 테스트 전화번호 환경변수는 등록되어 있지 않음을 확인.
- Google 앱은 테스트 상태. 실제 사용할 계정의 허용 목록 등록 및 실제 폰 로그인 확인 필요.
- 무료 Vercel 요금제에서 매시간 Cron이 배포를 막아 사용자 동의로 예약과 알림 설정 화면을 잠시 비활성화함. 푸시 코드·설정 데이터는 보존하며 재개는 별도 작업.

## 연결 대상

- 배포 주소: https://daily-sales-delta.vercel.app
- Supabase 프로젝트: `daily-sales` (`bbzuwxqfgbbbtzrkocwi`)
- Google Cloud 프로젝트: `Daily Sales` (`moonlit-order-512806-j9`)
- Google에서 등록할 승인된 JavaScript 원본: `https://daily-sales-delta.vercel.app`
- Google에서 등록할 승인된 리디렉션 URI: `https://bbzuwxqfgbbbtzrkocwi.supabase.co/auth/v1/callback`
- Supabase Site URL: `https://daily-sales-delta.vercel.app`
- Supabase Redirect URLs: `https://daily-sales-delta.vercel.app/auth/callback`

Google의 콜백은 Supabase 주소이고, Supabase의 복귀 주소는 앱 주소입니다. 둘을 바꾸어 등록하지 않습니다. 임의의 미리보기 주소를 와일드카드로 허용하지 않습니다.

## 외부 설정

1. Google Auth Platform에서 앱 이름과 지원 연락처를 등록합니다. 일반 Google 계정은 외부 사용자를 선택합니다.
2. 웹 애플리케이션 OAuth 클라이언트를 만들고 위 원본과 Google 리디렉션 URI를 등록합니다.
3. 기본 로그인에 필요한 `openid`, 이메일, 프로필 권한만 사용합니다. Drive나 Gmail 접근 권한은 추가하지 않습니다.
4. Supabase Authentication의 Google 공급자에 Client ID와 Client Secret을 저장하고 활성화합니다. 비밀 키는 저장소나 `NEXT_PUBLIC_` 환경변수에 넣지 않습니다.
5. Supabase URL Configuration에 위 Site URL 및 Redirect URL을 저장합니다.
6. Google 로그인이 성공한 뒤 Phone 공급자를 비활성화하고 테스트 전화번호·고정 OTP를 제거합니다. Vercel의 `NEXT_PUBLIC_DEV_TEST_PHONE`, `NEXT_PUBLIC_DEV_TEST_OTP`도 제거합니다.
7. Google 앱이 테스트 상태라면 실제 사용할 계정을 허용하고, 실사용 전 Audience/게시 상태를 점검합니다.

## 로컬 확인

브라우저용 Supabase URL 및 공개 키만 `.env.local`에 설정합니다. 로컬 OAuth 검증을 할 때만 `http://localhost:3000/auth/callback`을 Supabase 허용 목록에 추가합니다.

```sh
npm ci
npm run lint
npx tsc --noEmit
node --test tests/auth.test.mjs
npm run build
```

현재 푸시 API도 빌드하므로 기존 VAPID 및 서비스 역할 환경변수가 필요합니다. 빌드 검증에 임시 키를 사용한 경우 실제 로그인·푸시 성공으로 해석하면 안 됩니다.

## 아버지 폰에서 확인

- HTTPS 배포를 열고 Google 계정을 선택한 뒤 달력으로 돌아오는지 확인합니다.
- 계정 선택 취소 후 안내가 나오고 다시 로그인할 수 있는지 확인합니다.
- 설치된 PWA에서도 같은 과정을 확인합니다. 브라우저와 PWA 사이 전환은 실제 기기에서 확인합니다.
- 앱 종료·재실행 및 폰 재부팅 후 세션이 유지되는지 확인합니다.
- 인터넷이 없을 때 로그인 버튼을 누르면 연결 안내가 나오는지 확인합니다.
- 로그아웃 또는 세션 만료 뒤 보호된 화면이 로그인으로 이동하는지 확인합니다.

인증 경로 테스트는 SDK와 응답을 대체한 회귀 테스트입니다. Google/Supabase 외부 설정 및 실제 기기 검증을 대신하지 않습니다. 기존 저장·백업·오프라인 관련 검토 사항은 별도로 해결해야 합니다.

## 공식 문서

- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/redirect-urls

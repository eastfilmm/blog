> 📌 이 글은 [블로그 원문](https://eastfilmm.github.io/blog/i18n-guide/)을 velog에 동시 게재한 버전입니다.
>
> 🤖 **AI에 글 전체를 복사해서 요약·질문하고 싶다면** → **[📋 AI용 raw 텍스트 열기](https://eastfilmm.github.io/blog/i18n-guide/raw.txt)** (새 탭에서 열고 `Cmd+A` → `Cmd+C` → AI에 붙여넣기)
>
> 또는 [원문 블로그](https://eastfilmm.github.io/blog/i18n-guide/)에서 "전체 내용 복사" 버튼을 누르시면 동일한 내용이 한 번에 복사됩니다. (ChatGPT · Claude · Perplexity · Gemini 등 어디에 붙여넣어도 OK)

---

> **한 줄 요약:** 웹사이트 i18n은 문자열 번역이 아니라, 로케일 결정 · 리소스 분할 · 로딩 타이밍 · 렌더링 연결을 설계하는 일이다.

---

## 📌 문서 메타 정보

| 항목 | 내용 |
|---|---|
| **저자** | 조동필 (Frontend Engineer @ Miridih) |
| **대상 독자** | Next.js / React 기반 서비스에 i18n 도입을 검토 중인 개발자 |
| **예상 읽기 시간** | 약 12분 |
| **관련 스택** | `next-intl` `i18next` `react-intl` `React` `Next.js` |
| **시리즈** | ① 구조 설계 가이드 *(현재 글)* → ② 캐싱 전략과 버저닝 *(예정)* → ③ SSR/SSG/CSR 환경별 적용 *(예정)* |

---

## 📖 이 글은 어떻게 읽으면 좋은가

이 글은 i18n 번역 시스템을 설명하는 기술 문서다. 다음 순서로 읽는 것이 가장 정확하다.

1. 전체 결론 (TL;DR)
2. 웹사이트 번역 시스템을 넣을 때 무엇부터 설계해야 하는가
3. i18n 라이브러리의 역할
4. namespace의 역할
5. 전체 동작 순서
6. 성능 병목과 최적화 포인트

요약 깊이는 5단계로 조절할 수 있다.

- **깊이 1** — 핵심만 짧게
- **깊이 2** — 핵심 개념과 관계 포함
- **깊이 3** — 동작 흐름 포함
- **깊이 4** — 예시와 최적화 포함
- **깊이 5** — 세부 메커니즘까지 상세히

### 🤖 AI에게 이 글을 요약시키고 싶다면

아래 프롬프트를 본문과 함께 복사해 사용하면 된다.
**원클릭 복사는 [원문 블로그](https://eastfilmm.github.io/blog/i18n-guide/)의 "전체 내용 복사" 버튼**에서 제공한다. velog에서 읽는 중이라면 아래 코드블록 우측의 📋 아이콘으로 프롬프트만 복사 후, 이 글 본문은 `Cmd+A`로 전체 선택해 함께 붙여넣으면 된다.

```text
아래 문서는 웹사이트 번역 시스템과 i18n 구조를 설명하는 글이다.
이 문서를 다음 규칙에 따라 요약해줘.

1. 먼저 전체 결론을 설명할 것
2. 그 다음 번역 시스템을 넣을 때 무엇부터 설계해야 하는지 설명할 것
3. 그 다음 i18n 라이브러리의 역할을 설명할 것
4. 그 다음 namespace의 역할을 설명할 것
5. 그 다음 전체 동작 순서를 설명할 것
6. 마지막으로 성능 병목과 최적화 포인트를 설명할 것

요약은 깊이 1~5로 나눠서 제공해줘.
- 1: 아주 짧은 요약
- 2: 핵심 개념 포함
- 3: 동작 흐름 포함
- 4: 예시와 상세 설명 포함
- 5: 원문 재구성 수준으로 매우 자세히

먼저 사용자에게 "원하는 요약 깊이를 선택해주세요 (1~5 또는 all)"라고 물어봐.
선택이 없으면 1~5 모두 제공해줘.
```

---

## 📚 용어 정의 (먼저 짚고 가기)

| 용어 | 정의 |
|---|---|
| **로케일 (locale)** | 언어(`ko`) 또는 언어+지역(`ko-KR`) 조합으로 사용자의 문화권을 식별하는 코드 |
| **i18n** | Internationalization. 여러 언어·지역을 지원할 수 있도록 앱을 **구조화**하는 작업 |
| **l10n** | Localization. 실제로 특정 언어·문화권에 맞게 **번역·조정**하는 작업 |
| **namespace** | 번역 리소스를 논리 단위(페이지/기능)로 나누는 스코프 = 로딩 단위 |
| **fallback** | 요청한 로케일에 번역이 없을 때 대체될 기본 언어 |
| **ICU MessageFormat** | 복수형·성별·변수·날짜/숫자 포맷을 표준화한 [Unicode CLDR](https://cldr.unicode.org/) 기반 메시지 문법 |

---

## ❓ 이 글이 답하는 질문

- 웹사이트에 번역 시스템을 넣으려면 무엇부터 해야 할까?
- i18n은 문자열만 번역하면 끝나는 문제일까?
- 로케일은 어떻게 결정해야 할까?
- i18n 라이브러리는 실제로 어떤 역할을 할까?
- 번역 파일은 왜 나눠야 할까?
- namespace는 왜 필요한가?
- 번역 시스템의 병목은 어디서 발생할까?
- 번역 시스템은 어떤 순서로 구축해야 할까?
- [next-intl](https://next-intl.dev), [i18next](https://www.i18next.com), [react-intl](https://formatjs.io/docs/react-intl/) 중 무엇을 선택해야 할까?

---

## 🚀 TL;DR

- 웹사이트에 번역 시스템을 넣을 때 **문자열 치환부터 시작하면 안 된다.**
- **로케일 결정 → 메시지 구조 설계 → 라우팅/상태 → 번역 호출 방식 → 성능 최적화** 순서가 정답이다.
- i18n 라이브러리는 현재 로케일과 번역 메시지를 받아 UI에 문자열을 제공하는 **런타임**이다.
- namespace는 번역 리소스를 페이지·기능 단위로 나누는 **로딩 단위**다 (= 번역판 코드 스플리팅).
- 번역 시스템의 병목은 `t(key)` 조회가 아니라 **번역 파일 로딩 단계**에서 발생한다.

---

## 1. 웹사이트에 번역 시스템을 넣으려면 무엇부터 해야 할까?

> **핵심:** 구조 설계가 먼저다. 문자열 치환은 그다음이다.

웹사이트에 i18n을 넣는다는 건 **"한국어 문장을 영어 문장으로 바꾸는 일"이 아니라** 다음 다섯 가지를 모두 설계하는 일이다.

- 현재 사용자의 언어를 결정하는 방식
- 어떤 번역 파일을 로딩할지 정하는 방식
- 화면 단위로 번역을 분리하는 방식
- 번역 문자열을 UI에 주입하는 방식
- 초기 로딩 속도와 운영 방식

실무적으로는 다음 순서를 따르는 것이 가장 안전하다.

1. 지원 언어와 기본 로케일을 정한다
2. 번역 메시지 파일 구조를 설계한다
3. 라우팅 또는 로케일 상태 관리 방식을 정한다
4. i18n 라이브러리를 선택하고 번역 호출 방식을 통일한다
5. namespace 기준으로 번역을 분리한다
6. 초기 로딩과 lazy loading 전략을 설계한다
7. 운영과 확장 방식을 정리한다

---

## 2. 어떤 i18n 라이브러리를 선택해야 할까?

> **핵심:** 스택을 먼저 보고, 프레임워크 흐름과 가장 자연스럽게 붙는 라이브러리를 골라라.

### 2-1. 한눈에 비교

| 라이브러리 | 최적 환경 | 강점 | 약점 | 번들 (gzip) | 공식 문서 |
|---|---|---|---|---|---|
| **next-intl** | Next.js App Router | SSR/RSC 네이티브, 로케일 라우팅 내장 | Next.js 종속 | ~12KB | [next-intl.dev](https://next-intl.dev) |
| **i18next + react-i18next** | React SPA / Vite | 생태계 최대, 언어 감지·HTTP 로딩 플러그인 풍부 | 설정 러닝커브 | ~15KB | [i18next.com](https://www.i18next.com) |
| **react-intl (FormatJS)** | 포맷팅 중심 앱 | ICU MessageFormat, plural/select 표현력 최강 | 번들 가장 큼 | ~40KB | [formatjs.io](https://formatjs.io/docs/react-intl/) |

### 2-2. Next.js App Router라면 → `next-intl`

- 로케일 라우팅(`/ko/...`, `/en/...`)과 자연스럽게 결합
- 서버 컴포넌트 흐름과 그대로 연결 가능
- 공식: <https://next-intl.dev>

### 2-3. React SPA / Vite라면 → `i18next + react-i18next`

- 생태계가 넓고, 언어 감지·HTTP 로딩·namespace 분리 플러그인이 이미 있다
- 프레임워크 종속성이 낮고 자유도가 높을수록 유리
- 공식: <https://www.i18next.com>, <https://react.i18next.com>

### 2-4. 포맷팅 표현력이 가장 중요하면 → `react-intl`

- [Unicode ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) 기반
- 복수형/성별/통화/날짜 포맷팅을 세밀하게 다룰 수 있다
- 공식: <https://formatjs.io/docs/react-intl/>

---

## 3. 지원 언어와 기본 로케일은 어떻게 정해야 할까?

> **핵심:** 처음엔 핵심 언어 2개로 시작. 구조가 안정된 뒤 확장.

- **지원 언어:** `ko`, `en`
- **기본 로케일:** `ko`
- **fallback 로케일:** `en`
- **지역 코드 사용 여부:** 초기엔 `ko-KR` 대신 `ko`만 (단순화)

처음부터 너무 많은 언어를 지원하면 **번역 품질 관리 · 메시지 파일 관리 · QA 비용**이 급격히 커진다. 이 결정 위에 모든 라우팅과 로딩 구조가 올라가므로 신중하게.

---

## 4. 로케일은 어떻게 결정해야 할까?

> **핵심:** 로케일 결정은 번역 시스템의 **입구**다. 우선순위 체계를 정해둬라.

일반적인 판단 순서는 다음과 같다.

1. **URL 경로** — `/ko/editor`, `/en/editor`
2. **사용자 명시 설정** — 쿠키, 로컬스토리지
3. **브라우저의 [`Accept-Language`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language) 헤더**
4. **fallback 로케일** — `en`

예시 코드 (`i18next` 초기화):

```ts
// i18n.ts — 앱 진입 시점에 1회 실행
i18next.init({
  lng: detectedLocale,           // 1~4 단계로 결정된 로케일
  fallbackLng: 'en',
  ns: ['common', 'editor'],      // 초기 로딩할 namespace
  defaultNS: 'common',
});
```

- `lng`는 언어, `ns`는 번역 묶음(namespace)
- 이 둘의 조합이 **어떤 JSON 파일을 요청할지**를 결정
- 예: `lng = 'ko'` + `ns = 'editor'` → `locales/ko/editor.json`

---

## 5. i18n 라이브러리는 실제로 어떤 역할을 할까?

> **핵심:** i18n 라이브러리는 단순 치환기가 아니라, 리소스를 선택·적재·조회하는 **번역 런타임**이다.

겉보기에는 `t('key')` 호출 도구지만, 내부적으로는 다음을 담당한다.

1. 현재 로케일을 확인
2. 필요한 번역 리소스를 찾는다
3. 번역 JSON을 로딩
4. 번역 데이터를 메모리에 적재
5. `t(key)` 호출 시 메모리에서 값을 찾아 반환

### 5-1. 키 → 문자열 치환은 어떻게 일어나는가

```tsx
// Toolbar.tsx
const { t } = useTranslation('editor');
return <button>{t('toolbar.bold')}</button>;
```

메모리에 이런 테이블이 이미 올라와 있다면,

```json
{ "toolbar": { "bold": "굵게" } }
```

렌더링 결과는:

```html
<button>굵게</button>
```

**즉, `t(key)`는 이미 적재된 객체에서 값을 찾는 동기 조회이며, 자체 비용은 거의 없다.**

### 5-2. 라이브러리 수준에서 최적화 포인트

```ts
i18next.init({
  partialBundledLanguages: true,  // 일부 namespace만 초기 번들, 나머지는 비동기
  load: 'languageOnly',           // ko-KR 대신 ko만 로딩
  preload: ['ko', 'en'],          // 주요 언어 미리 로딩
  react: { useSuspense: true },   // 로딩 중 Suspense fallback 활용
});
```

요점: **"번역 자체"보다 "언제 무엇을 얼마만큼 로딩할 것인가"를 제어하는 설정이 훨씬 중요하다.**

---

## 6. 번역 파일은 왜 한 파일로 만들면 안 될까?

> **핵심:** 모든 번역을 한 JSON에 몰아넣는 순간, 안 쓰는 번역까지 전부 다운로드된다.

실제 사례 (단일 파일 구조):

- `ko/translation.json`
- 키 수: **12,000개**
- 파일 크기: **2.1MB**

이 구조에서는 사용자가 에디터 페이지 하나를 열어도 대시보드 · 결제 · 설정 · 에러 · 쓰지도 않는 기능의 번역까지 **전부 함께 내려온다.**

이어지는 비용:

- 초기 다운로드 증가 → 네트워크 대역폭 소진
- 파싱 시간 증가 → 메인 스레드 블로킹
- 메모리 점유 증가 → 모바일에서 치명적
- 첫 렌더 지연 (LCP 악화)
- 캐시 비효율 (한 글자만 바꿔도 2.1MB 전체 무효화)

---

## 7. namespace는 왜 필요한가?

> **핵심:** namespace = 번역 리소스의 **로딩 단위**. 번역판 코드 스플리팅이다.

namespace는 번역 키를 논리 단위로 분리하는 스코프다. 실무적으로는 **JSON 파일 1개 = namespace 1개**로 본다.

```
locales/
 ├─ ko/
 │   ├─ common.json
 │   ├─ editor.json
 │   ├─ dashboard.json
 │   └─ payment.json
 └─ en/
     ├─ common.json
     ├─ editor.json
     ├─ dashboard.json
     └─ payment.json
```

사용자가 에디터에 들어왔을 때는 `common.json` + `editor.json`만 로딩하면 된다.

### 7-1. namespace 분리 기준

| 기준 | 예시 | 언제 쓰나 |
|---|---|---|
| 페이지 / 라우트 | `editor`, `dashboard` | 페이지 진입 시점에 로딩 |
| 기능 | `payment`, `share` | 기능 실행 순간에 로딩 |
| 공통 | `common`, `error` | 여러 화면에서 반복 사용 |

핵심은 **사용 시점이 비슷한 문자열끼리 묶는 것.**

### 7-2. 정적 로딩 vs 동적 로딩

**정적 로딩** — 컴포넌트 마운트 시 반드시 필요한 번역

```tsx
const { t } = useTranslation('editor');
```

**동적 로딩** — 특정 사용자 액션이 있을 때만 필요한 번역

```ts
const handleOpenPayment = async () => {
  await i18next.loadNamespaces('payment');
  openPaymentModal();
};
```

효과:

- 결제 모달을 열지 않은 사용자는 `payment.json`을 **아예 받지 않는다**
- 초기 화면에 필요 없는 번역은 번들에서 배제
- 진짜 사용 시점까지 로딩을 미룸

---

## 8. 번역 시스템의 병목은 왜 `t(key)`가 아닌가?

> **핵심:** 느린 건 조회가 아니라 **그 전에 일어나는 파일 로딩**이다.

`t(key)`는 보통 이미 메모리에 올라온 객체에서 값을 찾는 **동기 조회** — 비용이 거의 없다.

반면 번역 JSON을 실제로 쓰려면 **그 전에** 다음 비용이 먼저 발생한다.

```text
[네트워크 요청] → [다운로드] → [JSON 파싱] → [메모리 적재] → [렌더링 타이밍 조정] → t(key) 조회(싸다)
        ↑                                                          ↑
     진짜 비용                                                  거의 공짜
```

**결론:** 번역 시스템의 성능 문제는 **"언제, 어떤 번역 파일을, 얼마나 가져오느냐"** 를 먼저 봐야 한다.

---

## 9. 웹사이트 번역 시스템은 어떤 순서로 구축하면 될까?

> **핵심:** 언어 결정 → 라우팅 → 메시지 구조 → 라이브러리 → 호출 방식 → lazy loading → 운영 규칙.

| 단계 | 할 일 | 결과물 |
|:-:|---|---|
| 1 | 지원 언어·기본 로케일 결정 | `['ko', 'en']`, fallback = `en` |
| 2 | 라우팅/로케일 상태 방식 결정 | URL prefix / 쿠키 / 감지 |
| 3 | 번역 메시지 구조 설계 | `common`, `editor`, `payment`, `dashboard` |
| 4 | 라이브러리 선택 | next-intl / i18next / react-intl |
| 5 | 화면 내 번역 호출 방식 통일 | `t('key')`, 변수/plural 규칙 |
| 6 | lazy loading 전략 설계 | 공통 선로딩 + 기능 지연 로딩 |
| 7 | 운영 규칙 정리 | 키 네이밍, fallback, QA 기준 |

---

## 10. 전체 파이프라인은 어떻게 이해하면 좋은가

> **핵심:** 로케일 결정 → 필요한 namespace → JSON 로딩 → 메모리 적재 → 문자열 조회.

```text
[사용자 진입]  /ko/editor
        │
        ▼
[로케일 결정]  ko
        │
        ▼
[namespace 결정]  common, editor
        │
        ▼
[JSON 로딩]  ko/common.json + ko/editor.json
        │
        ▼
[파싱·메모리 적재]
        │
        ▼
[t('toolbar.bold') 호출]  → "굵게"
        │
        ▼
[렌더링 완료]
        │
        ▼
[결제 모달 오픈 시]  payment.json 추가 로딩
```

> **한 문장 요약:** 번역 시스템은 현재 로케일을 결정하고, 필요한 번역만 로딩한 뒤, 런타임에서 문자열을 조회해 화면에 반영하는 구조다.

---

## 11. 결론

웹사이트에 번역 시스템을 넣는 일의 핵심은 세 가지다.

1. **어떤 언어를 현재 사용자에게 보여줄지 결정**
2. **필요한 번역 리소스만 필요한 시점에 로딩**
3. **그 구조를 확장 가능하게 유지**

이 구조의 두 축:

- **i18n 라이브러리** — 번역을 실행하는 런타임
- **namespace** — 번역 리소스를 나누는 로딩 단위

**번역 시스템의 본질은 문자열 치환이 아니라 로케일 결정 · 리소스 분할 · 로딩 타이밍 · 렌더링 연결이다.**

---

## 🔑 검색용 핵심 요약

- 웹사이트에 번역 시스템을 넣으려면 문자열 번역부터 시작하지 말고 구조부터 설계해야 한다.
- i18n 시스템의 핵심은 **로케일 결정 · 번역 파일 구조 · 번역 호출 방식 · 성능 최적화**다.
- i18n 라이브러리는 현재 로케일과 번역 메시지를 받아 문자열을 반환하는 **런타임**이다.
- namespace는 번역 JSON을 페이지별·기능별로 분리하는 **로딩 단위**다.
- namespace는 **번역 시스템의 code splitting** 방식이다.
- 번역 시스템의 병목은 `t(key)` 조회보다 **번역 파일 로딩 단계**에서 발생한다.
- 웹사이트 번역 시스템은 **필요한 번역만 필요한 시점에** 로딩하도록 설계해야 한다.

---

## 🔎 관련 검색어 (People Also Ask)

- **i18next vs next-intl 차이는?** → SSR 통합이 중요하면 next-intl, 생태계·플러그인이 중요하면 i18next.
- **번역 파일 lazy loading 구현법은?** → namespace 단위로 `loadNamespaces()` 동적 호출.
- **Next.js App Router 다국어 라우팅 방법?** → `[locale]` 동적 세그먼트 + `next-intl` 미들웨어.
- **Accept-Language 헤더로 로케일 감지하는 법?** → 서버 미들웨어에서 파싱 후 URL prefix로 리다이렉트.
- **번역 키 네이밍 컨벤션은?** → `page.section.element` 형태의 점 구분 계층 구조.

---

## 📎 참고 자료 (공식 문서·권위 출처)

- [next-intl 공식 문서](https://next-intl.dev)
- [i18next 공식 문서](https://www.i18next.com)
- [react-i18next 공식 문서](https://react.i18next.com)
- [FormatJS / react-intl](https://formatjs.io/docs/react-intl/)
- [MDN — `Intl` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Unicode CLDR](https://cldr.unicode.org/)
- [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [MDN — `Accept-Language` 헤더](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)

---

## 📬 다음 글 (시리즈)

1. **캐싱 전략과 버저닝** *(예정)* — 번역 파일 변경 시 캐시를 어떻게 다뤄야 하는가
2. **SSR / SSG / CSR 환경별 적용** *(예정)* — 렌더링 방식에 따라 번역 로딩 시점이 어떻게 달라지는가

---

> **저자 소개** — 조동필. Miridih에서 프론트엔드를 만든다. i18n · 렌더링 최적화 · 디자인 시스템을 중심으로 글을 쓴다. 피드백은 [dpjo@miridih.com](mailto:dpjo@miridih.com) 으로.
>
> 📎 **원문:** <https://eastfilmm.github.io/blog/i18n-guide/>

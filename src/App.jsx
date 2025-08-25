import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share2, RotateCcw, PlayCircle, Coffee, Link as LinkIcon, Copy as CopyIcon, X as XIcon } from "lucide-react";

/**
 * 휴식 스타일 진단 – 싱글 파일 React 웹앱
 * (요청 반영: ① 결과 화면 이미지 제거 ② 개발자 테스트 UI 제거 ③ 공유 버튼 신뢰성 개선)
 * ----------------------------------------------------------------------
 * • 공유하기(텍스트/링크): Web Share API 시도 → 실패/미지원 시 **내장 공유 패널(복사)**로 폴백
 * • Clipboard API 미지원/거부 상황에서도 execCommand 복사 폴백 제공
 * • 카카오/네이버 공유는 기존 로직 유지(카카오는 공개 이미지 필요)
 */

// ===== 브랜드/구성 옵션 =====
const BRAND = {
  name: "MindVR",
  primary: "#6C5CE7", // 주요색
  accent: "#10B981", // 보조색
  gradientFrom: "#F5F3FF",
  gradientTo: "#ECFDF5",
  logoUrl: null, // 예: "/logo.png" (있으면 헤더에 표시)
  fontFamily:
    '"Noto Sans KR", Pretendard, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
};

const CONFIG = {
  autoFinish: true, // 마지막 문항 선택 시 자동 결과 화면 전환
  loadingMs: 1000, // 로딩 시간(ms)
  // --- 공유 관련 ---
  siteUrl: typeof window !== "undefined" ? window.location.origin : "",
  ogImageDefault: "/og-default.png", // 정적 공개 이미지 URL(권장: CDN)
  kakaoAppKey: null, // 카카오 JavaScript 키(예: "abcd1234...")
  // 유형별 OG 이미지가 서버에 호스팅되어 있다면 base URL을 설정하세요. 예) "https://cdn.site.com/rest-types/"
  // 이 경우 Kakao/OG 메타에 해당 퍼블릭 URL이 우선 사용됩니다.
  typeOgBaseUrl: null,
};

// ===== 설문 문항 =====
const QUESTIONS = [
  { q: "Q1. 쉬는 시간이 생기면 나는", a: "동료와 수다를 턴다", b: "혼자 휴대폰을 본다" },
  { q: "Q2. 점심시간 직후 나는", a: "산책하러 나간다", b: "자리에 앉아서 유튜브를 본다" },
  { q: "Q3. 스트레스를 받을 때 더 회복되는 건", a: "누군가와 얘기하는 것", b: "조용히 생각 정리하는 것" },
  { q: "Q4. 커피타임은", a: "여럿이 함께", b: "혼자만의 시간" },
  { q: "Q5. 휴식 중 가장 즐기는 건", a: "몸을 움직이는 것", b: "앉아서 즐기는 활동" },
  { q: "Q6. 잠깐 쉴 때 주로 하는 건", a: "잡담", b: "간단한 운동" },
  { q: "Q7. 남는 5분, 나는", a: "취미 앱을 켠다", b: "메신저를 켠다" },
  { q: "Q8. 퇴근 후 더 회복되는 건", a: "운동·산책", b: "넷플릭스·독서" },
  { q: "Q9. 휴게실에서 나는", a: "동료와 웃고 떠든다", b: "간식 먹으며 혼자 쉰다" },
  { q: "Q10. 짧은 휴식에도 꼭 하는 건", a: "스트레칭", b: "음악 듣기" },
  { q: "Q11. 일이 너무 많을 때 휴식은", a: "잠깐의 잡담", b: "자기만의 루틴" },
  { q: "Q12. 휴식 후 가장 기분 좋은 건", a: "사람과의 유대감", b: "재정비된 머릿속" },
];

// ===== 유형 정의 (0~7) =====
const TYPES = [
  {
    key: 0,
    name: "고요한 리커버리 개미",
    tagline: "혼자만의 잔잔한 휴식이 최고의 충전",
    desc: [
      "업무로부터 심리적 거리두기(Detachment)와 조용한 휴식을 선호합니다.",
      "소음이 적고 개인화된 공간에서의 미니 브레이크가 효과적입니다.",
      "루틴을 무너뜨리지 않는 짧고 규칙적인 휴식이 잘 맞습니다.",
    ],
    tips: [
      "노이즈 캔슬링·차분한 음악으로 3~5분 멍타임",
      "눈·목 스트레칭, 20-20-20 규칙(20분마다 먼 곳 20초 보기)",
      "자리 근처 ‘마음챙김 카드’ 1장 읽기",
    ],
    hashtags: ["#디탯치먼트", "#릴렉세이션", "#조용한충전"],
  },
  { key: 1, name: "집중 리셋 개미", tagline: "조용히 정리하고 다시 몰입", desc: ["업무 컨트롤 감각(Control)을 회복하며, 산만함을 줄이는 리셋형.", "짧은 정리·계획·정돈 루틴으로 에너지를 저장합니다."], tips: ["3분 책상 정돈·To‑Do 리스캔", "숨 고르기(4‑4‑6 호흡) 3회", "타이머 10분 집중(포모도로 미니)"], hashtags: ["#컨트롤", "#정돈", "#리셋"] },
  { key: 2, name: "몰입 마스터리 개미", tagline: "작은 성취가 큰 회복", desc: ["새 기술·취미 등을 살짝 맛보는 ‘마스터리’에 회복 포인트가 있습니다.", "지식·퍼즐·미니 학습앱같이 가벼운 성장 자극을 선호합니다."], tips: ["5분 튜토리얼·퀴즈 1세트", "메모장에 ‘오늘 배운 1문장’ 기록", "작은 난이도의 업무 하나 미리 처리"], hashtags: ["#마스터리", "#미니학습", "#작은성취"] },
  { key: 3, name: "밸런스 워커 개미", tagline: "움직임과 쉼의 황금비", desc: ["가벼운 신체활동과 정적 휴식의 균형을 즐깁니다.", "마음과 몸을 동시에 정비하는 하이브리드 타입입니다."], tips: ["2~3분 스탠딩·목·어깨 스트레칭", "느린 호흡 + 짧은 산책 5분", "물 한 컵 리추얼"], hashtags: ["#마이크로브레이크", "#스트레칭", "#워킹"] },
  { key: 4, name: "리프레시 러너 개미", tagline: "짧게라도 몸이 움직여야 산다", desc: ["활동성 높은 회복을 선호, 산책·계단 오르기 같은 미니 운동이 잘 맞습니다.", "움직임으로 긴장을 빼면 집중력이 빠르게 회복됩니다."], tips: ["건물 한 바퀴 워킹, 1층↔3층 계단 왕복", "손목·허리 가동범위 스트레칭", "‘물 + 햇빛 + 멀리보기’ 3콤보"], hashtags: ["#액티브휴식", "#산책", "#집중력부스트"] },
  { key: 5, name: "에너지 네트워커 개미", tagline: "함께 웃으면 회복 속도가 빨라진다", desc: ["짧은 스몰토크·팀 잡담에서 정서적 활력을 얻습니다.", "사람과의 교류가 스트레스 완충 장치로 작용합니다."], tips: ["동료에게 1문장 칭찬·감사 건네기", "커피 타임 5분, 소셜 캘린더 가볍게 예약", "사내 소모임·관심사 채널 구독"], hashtags: ["#소셜리커버리", "#스몰토크", "#팀에너지"] },
  { key: 6, name: "커피챗 리더 개미", tagline: "대화를 이끄는 사람이 분위기를 바꾼다", desc: ["정보 교환·네트워킹에 적극적이며, 팀 사기 진작에 기여합니다.", "짧은 회고·잡담에서도 생산적인 의미를 찾습니다."], tips: ["‘요즘 어때요?’ 아이스브레이크 1개 준비", "간식 나눔 데이·버디 커피 운영", "잡담 5분 + 정리 1분(인사이트 메모)"], hashtags: ["#네트워킹", "#리더십", "#밝은분위기"] },
  { key: 7, name: "탕비실 사교왕 개미", tagline: "“커피타임은 사교타임이죠!”", desc: ["사람과의 대화·교류에서 가장 큰 회복 에너지를 얻는 타입입니다.", "사내 이벤트·생일파티·간식 타임 등 소셜 활동에 적극적입니다."], tips: ["스몰토크 3종 세트(근황·관심사·주말계획)", "사내 동호회·취미 모임 주 1회 참여", "‘함께 웃는 시간’ 캘린더에 고정"], hashtags: ["#수다", "#네트워킹", "#밝은에너지"] },
];

// ===== (과거) 유형별 이미지 유틸 – 결과 화면 이미지 제거로 현재 미사용 =====
const TYPE_EMOJI = ["🧘", "🧹", "🎯", "⚖️", "🏃", "🤝", "☕", "🎉"];
const TYPE_COLORS = [
  ["#EEF2FF", "#C7D2FE"],
  ["#F0FDFA", "#99F6E4"],
  ["#FFF7ED", "#FED7AA"],
  ["#ECFEFF", "#A5F3FC"],
  ["#F0F9FF", "#93C5FD"],
  ["#FDF2F8", "#FBCFE8"],
  ["#F5F5F4", "#E7E5E4"],
  ["#FEFCE8", "#FDE68A"],
];
function svgToDataUrl(svg) {
  try {
    const base64 = (typeof window !== 'undefined')
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg, 'utf-8').toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    const ascii = svg.replace(/[^\\x00-\\x7F]/g, '');
    const base64 = (typeof window !== 'undefined') ? window.btoa(ascii) : Buffer.from(ascii, 'ascii').toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}
function makeTypeSvg(index, title, tagline) {
  const [from, to] = TYPE_COLORS[index % TYPE_COLORS.length];
  const emoji = TYPE_EMOJI[index % TYPE_EMOJI.length];
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
      <style>
        .title { font: 900 64px -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',Segoe UI,Roboto,Helvetica,Arial,sans-serif; fill: #111827 }
        .tag { font: 700 34px -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',Segoe UI,Roboto,Helvetica,Arial,sans-serif; fill: #374151 }
        .badge { font: 900 84px -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',Segoe UI,Roboto,Helvetica,Arial,sans-serif; fill: #111827; opacity: 0.08 }
      </style>
    </defs>
    <rect fill="url(#g)" x="0" y="0" width="1200" height="630" rx="24"/>
    <g transform="translate(72,96)">
      <text class="badge">${emoji.repeat(8)}</text>
      <text x="0" y="160" class="title">${escapeXml(title)}</text>
      <text x="0" y="230" class="tag">${escapeXml(tagline)}</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}
function escapeXml(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function getTypeDisplayImageUrl(index, title, tagline) { return makeTypeSvg(index, title, tagline); }
function getTypeOgImageUrl(index) { if (CONFIG.typeOgBaseUrl) return `${CONFIG.typeOgBaseUrl}type-${index}.png`; return CONFIG.ogImageDefault; }

// ===== 유틸 =====
function scoreToTypeIndex(score) { return Math.min(7, Math.floor((score * 8) / 13)); }
function classNames(...xs) { return xs.filter(Boolean).join(" "); }

// OG 메타 유틸
function setOrCreateMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (selector.includes('property="')) el.setAttribute("property", attrs.property);
    if (selector.includes('name="')) el.setAttribute("name", attrs.name);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}
function updateOgMeta({ title, description, image, url }) {
  if (typeof document === "undefined") return;
  setOrCreateMeta('meta[property="og:title"]', { property: "og:title", content: title });
  setOrCreateMeta('meta[property="og:description"]', { property: "og:description", content: description });
  setOrCreateMeta('meta[property="og:image"]', { property: "og:image", content: image });
  setOrCreateMeta('meta[property="og:url"]', { property: "og:url", content: url });
  setOrCreateMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  setOrCreateMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  setOrCreateMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  setOrCreateMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
}

// Kakao SDK 로더
let kakaoLoading = null;
function loadKakaoIfNeeded(appKey) {
  if (!appKey) return Promise.resolve(false);
  if (window.Kakao && window.Kakao.init && window.Kakao.isInitialized()) return Promise.resolve(true);
  if (kakaoLoading) return kakaoLoading;
  kakaoLoading = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.onload = () => { try { window.Kakao.init(appKey); resolve(true); } catch { resolve(false); } };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return kakaoLoading;
}
function isKakaoReady() { return !!(window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()); }
function buildNaverShareUrl(url, title) { return `https://share.naver.com/web/shareView.nhn?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`; }

// ===== 메인 앱 =====
export default function App() {
  const [step, setStep] = useState(0); // 0: 시작, 1: 설문, 2: 로딩, 3: 결과
  const [answers, setAnswers] = useState([]);
  const [sharePanel, setSharePanel] = useState({ open: false, content: "" });
  const [toast, setToast] = useState("");

  // 로컬 스토리지 복원
  useEffect(() => {
    const saved = localStorage.getItem("restStyleState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStep(parsed.step ?? 0);
        setAnswers(parsed.answers ?? []);
      } catch {}
    }
  }, []);

  // 상태 저장
  useEffect(() => { localStorage.setItem("restStyleState", JSON.stringify({ step, answers })); }, [step, answers]);

  // 설문 완료 상태에서 자동 전환 가드
  useEffect(() => {
    if (step === 1 && answers.length >= QUESTIONS.length) {
      setStep(2);
      const t = setTimeout(() => setStep(3), CONFIG.loadingMs);
      return () => clearTimeout(t);
    }
  }, [step, answers]);

  // 토스트 자동 숨김
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const progress = (answers.length / QUESTIONS.length) * 100;
  const score = useMemo(() => answers.reduce((acc, v) => acc + (v === "A" ? 1 : 0), 0), [answers]);
  const typeIndex = scoreToTypeIndex(score);
  const myType = TYPES[typeIndex];

  // 결과 메타 업데이트 (유형별 OG 이미지 우선)
  useEffect(() => {
    if (step !== 3) return;
    const shareUrl = window.location.href;
    const title = `내 휴식 스타일: ${myType.name}`;
    const description = `${myType.tagline} · 점수 ${score}/12`;
    const ogImg = getTypeOgImageUrl(typeIndex) || CONFIG.ogImageDefault;
    updateOgMeta({ title, description, image: ogImg, url: shareUrl });
  }, [step, myType, score, typeIndex]);

  // 카카오 SDK 준비
  useEffect(() => { loadKakaoIfNeeded(CONFIG.kakaoAppKey); }, []);

  function start() { setAnswers([]); setStep(1); }
  function choose(choice) {
    const i = answers.length;
    if (i >= QUESTIONS.length) return;
    const next = [...answers, choice];
    setAnswers(next);
    if (CONFIG.autoFinish && i + 1 === QUESTIONS.length) {
      setStep(2);
      setTimeout(() => setStep(3), CONFIG.loadingMs);
    }
  }
  function goLoadingThenResult() { setStep(2); setTimeout(() => setStep(3), CONFIG.loadingMs); }
  function resetAll() { setAnswers([]); setStep(0); }

  function buildShareText() {
    const title = `내 휴식 스타일: ${myType.name}`;
    const text = `${myType.tagline} (점수 ${score}/12)`;
    const url = window.location.href;
    return { title, text: `${title}\\n${text}\\n${url}`, url };
  }

  async function shareResult() {
    const { title, text, url } = buildShareText();

    // 1) 네이티브 공유 시도
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return; // 성공 시 종료
      }
    } catch (e) {
      // 일부 브라우저는 존재하지만 보안/컨텍스트 이슈로 실패 → 폴백으로 진행
    }

    // 2) Clipboard API 시도
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setToast("링크가 클립보드에 복사되었습니다!");
        return;
      }
    } catch (e) {
      // 권한 거부/미지원 → 다음 단계로
    }

    // 3) execCommand 폴백 + 패널 오픈
    try {
      legacyCopy(text);
      setToast("링크가 클립보드에 복사되었습니다!");
    } catch {
      setSharePanel({ open: true, content: text });
    }
  }

  async function shareKakao() {
    const ok = await loadKakaoIfNeeded(CONFIG.kakaoAppKey);
    if (!ok || !isKakaoReady()) { alert("카카오 공유를 사용하려면 Kakao JavaScript 키와 퍼블릭 OG 이미지가 필요합니다. CONFIG.kakaoAppKey / typeOgBaseUrl을 설정하세요."); return; }
    const shareUrl = window.location.href;
    const title = `내 휴식 스타일: ${myType.name}`;
    const description = `${myType.tagline} · 점수 ${score}/12`;
    const imageUrl = getTypeOgImageUrl(typeIndex);
    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: { title, description, imageUrl, link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
        buttons: [{ title: "결과 보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
    } catch { alert("카카오 공유 중 오류가 발생했습니다. 링크 복사로 진행해 주세요."); }
  }

  function shareNaver() { const shareUrl = window.location.href; const title = `내 휴식 스타일: ${myType.name}`; window.open(buildNaverShareUrl(shareUrl, title), "_blank", "noopener,noreferrer,width=600,height=800"); }

  return (
    <div
      className="min-h-screen w-full text-slate-800"
      style={{
        background: `linear-gradient(135deg, ${BRAND.gradientFrom}, ${BRAND.gradientTo})`,
        fontFamily: BRAND.fontFamily,
        "--brand": BRAND.primary,
        "--accent": BRAND.accent,
      }}
    >
      <BrandStyles />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <BrandHeader onStart={start} />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8">
          {step === 0 && <StartPage onStart={start} />}
          {step === 1 && (<QuizPage answers={answers} onChoose={choose} onFinish={goLoadingThenResult} />)}
          {step === 2 && <LoadingPage />}
          {step === 3 && (<ResultPage score={score} myType={myType} onShare={shareResult} onRetry={resetAll} onShareKakao={shareKakao} onShareNaver={shareNaver} />)}
        </motion.div>

        {step === 1 && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-slate-100">
              <motion.div className="h-2 rounded-full" style={{ backgroundColor: "var(--brand)" }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 140, damping: 20 }} />
            </div>
            <div className="mt-2 text-right text-xs text-slate-500">{answers.length} / {QUESTIONS.length}</div>
          </div>
        )}

        {/* 개발자 테스트 UI 제거 요청 반영: TestPanel 렌더링 제거 */}

        <footer className="mt-8 text-center text-xs text-slate-500">가볍게 즐기는 직장인 심리유형 테스트 · 결과는 참고용입니다.</footer>
      </div>

      {/* 공유 폴백 모달 */}
      {sharePanel.open && (
        <ShareFallbackModal
          content={sharePanel.content}
          onCopy={() => handlePanelCopy(sharePanel.content, setToast)}
          onClose={() => setSharePanel({ open: false, content: "" })}
        />
      )}

      {/* 토스트 */}
      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}

// ========== 공유 폴백 유틸/컴포넌트 ==========
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
}

function handlePanelCopy(text, setToast) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => setToast('링크가 클립보드에 복사되었습니다!'));
      return;
    }
  } catch {}
  try { legacyCopy(text); setToast('링크가 클립보드에 복사되었습니다!'); } catch {}
}

function ShareFallbackModal({ content, onCopy, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>공유 내용 복사</div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="닫기"><XIcon size={18} /></button>
        </div>
        <textarea value={content} readOnly className="h-40 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:outline-none" />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm"><CopyIcon size={16} />복사</button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">닫기</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ children }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg">
      {children}
    </div>
  );
}

// ========== 브랜딩 컴포넌트 ==========
function BrandStyles() {
  return (
    <style>{`
      :root { --brand: ${BRAND.primary}; --accent: ${BRAND.accent}; }
      .brand-text { color: var(--brand); }
      .brand-bg { background-color: var(--brand); }
      .accent-text { color: var(--accent); }
      .accent-bg { background-color: var(--accent); }
    `}</style>
  );
}

function BrandHeader({ onStart }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {BRAND.logoUrl ? (
          <img src={BRAND.logoUrl} alt={`${BRAND.name} logo`} className="h-8 w-8 rounded-xl ring-1 ring-black/10 object-contain" />
        ) : (
          <div className="h-8 w-8 rounded-xl brand-bg ring-1 ring-black/10" />
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">나의 <span className="brand-text">휴식 스타일</span> 찾기</h1>
      </div>
      <BrandButton onClick={onStart} icon={PlayCircle} label="시작" variant="outline" />
    </div>
  );
}

function BrandButton({ label, onClick, icon: Icon, variant = "solid" }) {
  const base = "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm";
  const solid = { backgroundColor: "var(--brand)", color: "#fff" };
  const outline = { backgroundColor: "#ffffff", color: "#111827", border: "1px solid rgba(0,0,0,0.12)" };
  const style = variant === "solid" ? solid : outline;
  return (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={base} style={style}>
      {Icon ? <Icon size={18} /> : null}
      <span>{label}</span>
    </motion.button>
  );
}

// ========== 페이지 컴포넌트 ==========
function StartPage({ onStart }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 max-w-xl text-slate-700">
        <p className="leading-relaxed">오늘도 바쁘게 일하는 당신, 일개미의 쉬는 시간은 어떻게 보내고 있나요? 지금부터 <b>12가지 질문</b>에 답하고, 나만의 직장인 <b>휴식 스타일</b>을 확인해 보세요. 그리고 당신만의 <b>휴식 팁</b>까지 챙겨가세요 :)</p>
      </div>
      <BrandButton onClick={onStart} icon={Coffee} label="시작하기" />
      <div className="mt-4 text-xs text-slate-500">참고: 본 테스트는 업무 중 짧은 <b>마이크로 브레이크</b> 활용 아이디어를 제공합니다.</div>
    </div>
  );
}

function ResultPill({ children }) { return (<span className="inline-block rounded-full px-3 py-1 text-xs" style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{children}</span>); }

function ResultPage({ score, myType, onShare, onRetry, onShareKakao, onShareNaver }) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="text-sm text-slate-500">나의 점수</div>
        <div className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--brand)" }}>{score} / 12</div>
      </div>

      {/* 이미지 제거: 대표 썸네일, 캡처 이미지 표시 없음 */}

      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--brand)" }}>나의 휴식 스타일</div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{myType.name}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--accent)" }}>{myType.tagline}</p>

        <div className="mt-4 grid gap-2 text-sm text-slate-700">{myType.desc.map((d, i) => (<div key={i}>• {d}</div>))}</div>
        <div className="mt-4 flex flex-wrap gap-2">{myType.hashtags.map((h) => (<ResultPill key={h}>{h}</ResultPill>))}</div>

        <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: "#EEF2FF" }}>
          <div className="text-sm font-bold" style={{ color: "var(--brand)" }}>직장 내 휴식 팁</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-indigo-900">{myType.tips.map((t, i) => (<li key={i}>{t}</li>))}</ul>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BrandButton onClick={onShare} icon={Share2} label="공유하기(텍스트/링크)" />
        <BrandButton onClick={onShareKakao} label="카카오톡 공유" />
        <BrandButton onClick={onShareNaver} icon={LinkIcon} label="네이버 공유" variant="outline" />
        <BrandButton onClick={onRetry} icon={RotateCcw} label="다른 설문하기(처음으로)" variant="outline" />
      </div>

      <details className="mt-6 cursor-pointer rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <summary className="font-semibold text-slate-700">진단 로직 & 근거 보기</summary>
        <div className="mt-2 space-y-2">
          <p>• 각 문항 A=1점, B=0점으로 합산합니다. 점수(0~12)를 8구간으로 등분해 유형을 매칭합니다: <code>type = floor(score * 8 / 13)</code> (0~7).</p>
          <p>• 설계 레퍼런스: 회복 경험 모델(Detachment/Relaxation/Mastery/Control), 짧은 <em>마이크로 브레이크</em> 연구 맥락을 반영하여 실무 친화적으로 재구성했습니다.</p>
        </div>
      </details>
    </div>
  );
}

function QuizPage({ answers, onChoose, onFinish }) {
  const i = answers.length; const isLast = i === QUESTIONS.length - 1;
  if (i >= QUESTIONS.length) {
    return (
      <div className="text-center">
        <div className="mb-2 text-sm font-semibold brand-text">설문 완료</div>
        <div className="text-slate-600 text-sm">모든 문항 응답이 끝났습니다. 결과를 준비 중입니다…</div>
        <div className="mt-4"><BrandButton onClick={onFinish} label="결과 보기" /></div>
      </div>
    );
  }
  const current = QUESTIONS[i];
  return (
    <div>
      <div className="mb-4 text-sm font-medium brand-text">설문 진행 중</div>
      <div className="mb-2 text-base sm:text-lg font-semibold">{current.q}</div>
      <div className="mt-4 grid gap-3">
        <ChoiceCard label="A" text={current.a} onClick={() => onChoose("A")} />
        <ChoiceCard label="B" text={current.b} onClick={() => onChoose("B")} />
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
        <span>문항 {i + 1} / {QUESTIONS.length}</span>
        {isLast && !CONFIG.autoFinish ? (<BrandButton onClick={onFinish} label="결과 보기" variant="outline" />) : null}
      </div>
    </div>
  );
}

function ChoiceCard({ label, text, onClick }) {
  return (
    <motion.button whileHover={{ y: -2, boxShadow: "0 10px 20px rgba(0,0,0,0.06)" }} whileTap={{ scale: 0.98 }} onClick={onClick} className={classNames("w-full text-left rounded-xl border border-slate-200 bg-white/70 p-4","transition group focus:outline-none focus:ring-4",)} style={{ outlineColor: "var(--brand)" }}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-sm font-bold text-slate-700">{label}</span>
        <span className="text-sm sm:text-base">{text}</span>
      </div>
    </motion.button>
  );
}

function LoadingPage() { return (<div className="flex flex-col items-center justify-center py-8 text-center"><div className="mb-4 h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "#e0e7ff", borderTopColor: "var(--brand)" }} /><div className="text-base font-semibold">개미가 열심히 분석 중입니다!</div><div className="mt-1 text-sm text-slate-600">잠시만 기다려 주세요. 곧 마무리됩니다~</div></div>); }

// (선택) 개발 중 콘솔에서만 간단 검증하고 싶다면 아래 주석을 해제하세요.
// useEffect(() => { console.table(runSelfTests()); }, []);
function runSelfTests() {
  const results = []; const add = (name, pass, message = "") => results.push({ name, pass, message });
  add("문항 수는 12여야 한다", QUESTIONS.length === 12, `현재: ${QUESTIONS.length}`);
  add("유형 수는 8이어야 한다", TYPES.length === 8, `현재: ${TYPES.length}`);
  for (let s = 0; s <= 12; s++) { const idx = scoreToTypeIndex(s); const inRange = idx >= 0 && idx <= 7; add(`scoreToTypeIndex(${s})는 0~7 범위`, inRange, `결과: ${idx}`); }
  let prev = -1; let mono = true; for (let s = 0; s <= 12; s++) { const idx = scoreToTypeIndex(s); if (idx < prev) mono = false; prev = idx; } add("점수 증가 시 유형 인덱스가 감소하지 않는다", mono);
  // 썸네일 함수 자체는 유지되지만 UI에선 사용하지 않음
  let ok = true; for (let i = 0; i < 8; i++) { const url = getTypeDisplayImageUrl(i, TYPES[i].name, TYPES[i].tagline); if (typeof url !== "string" || !url.startsWith("data:image/svg+xml;base64,")) ok = false; }
  add("유형별 썸네일 8종 dataURL 생성", ok);
  return results;
}

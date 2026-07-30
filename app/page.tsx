"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  History,
  Link2,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  QrCode,
  Radar,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Mode = "url" | "message";
type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

type AnalysisResult = {
  id: string;
  inputType: Mode;
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  category: string;
  headline: string;
  summary: string;
  redFlags: string[];
  manipulationTechniques: string[];
  detailedAnalysis: string[];
  examples: string[];
  verificationChecklist: string[];
  recommendation: string[];
  nextSteps: string[];
  safetyScript: string;
  educationalTakeaway: string;
  model: string;
  analyzedAt: string;
  demoMode?: boolean;
  notice?: string;
};

type HistoryItem = {
  id: string;
  mode: Mode;
  input: string;
  result: AnalysisResult;
};

const STORAGE_KEY = "lang-rim-nam-ai-history-v2";

const SAMPLE_INPUTS: Record<Mode, string> = {
  url: "http://vietcombank-capnhat-bao-mat-qua-tang.vip/verify-login?account=urgent",
  message:
    "[Giao Hang Nhanh] Don hang cua ban bi treo do thieu phi xac minh 18.000d. Bam link nhan hoan tien va nhap ma OTP trong 15 phut: https://bit.ly/nhan-qua-ghn"
};

const RISK_THEME: Record<
  RiskLevel,
  { label: string; emoji: string; badge: string; text: string; glow: string; hex: string }
> = {
  safe: {
    label: "An toàn",
    emoji: "🛡️",
    badge: "border-cyber-green/45 bg-cyber-green/10 text-cyber-green",
    text: "text-cyber-green",
    glow: "shadow-[0_0_32px_rgba(41,241,156,0.22)]",
    hex: "#29f19c"
  },
  low: {
    label: "Rủi ro thấp",
    emoji: "👀",
    badge: "border-cyber-cyan/45 bg-cyber-cyan/10 text-cyber-cyan",
    text: "text-cyber-cyan",
    glow: "shadow-[0_0_32px_rgba(20,241,255,0.2)]",
    hex: "#14f1ff"
  },
  medium: {
    label: "Cần cảnh giác",
    emoji: "⚠️",
    badge: "border-cyber-orange/50 bg-cyber-orange/10 text-cyber-orange",
    text: "text-cyber-orange",
    glow: "shadow-[0_0_34px_rgba(255,122,24,0.25)]",
    hex: "#ff7a18"
  },
  high: {
    label: "Rủi ro cao",
    emoji: "🚨",
    badge: "border-red-400/50 bg-red-500/10 text-red-200",
    text: "text-red-200",
    glow: "shadow-[0_0_38px_rgba(255,56,100,0.26)]",
    hex: "#ff3864"
  },
  critical: {
    label: "Nguy hiểm",
    emoji: "🔥",
    badge: "border-red-300/60 bg-red-500/15 text-red-100",
    text: "text-red-100",
    glow: "shadow-[0_0_46px_rgba(255,56,100,0.34)]",
    hex: "#ff3864"
  }
};

const PARTICLES = [
  { x: "7%", y: "18%", size: "h-1.5 w-1.5", color: "bg-cyber-cyan", delay: "0s" },
  { x: "17%", y: "71%", size: "h-2 w-2", color: "bg-cyber-orange", delay: "1.2s" },
  { x: "29%", y: "12%", size: "h-1 w-1", color: "bg-cyber-violet", delay: "0.6s" },
  { x: "45%", y: "82%", size: "h-1.5 w-1.5", color: "bg-cyber-cyan", delay: "1.8s" },
  { x: "62%", y: "21%", size: "h-2 w-2", color: "bg-cyber-green", delay: "0.3s" },
  { x: "78%", y: "66%", size: "h-1.5 w-1.5", color: "bg-cyber-orange", delay: "1.5s" },
  { x: "91%", y: "31%", size: "h-1 w-1", color: "bg-cyber-cyan", delay: "2.1s" },
  { x: "86%", y: "86%", size: "h-2 w-2", color: "bg-cyber-violet", delay: "0.9s" }
];

const NETWORK_LINES = [
  ["7%", "18%", "29%", "12%"],
  ["29%", "12%", "62%", "21%"],
  ["62%", "21%", "91%", "31%"],
  ["17%", "71%", "45%", "82%"],
  ["45%", "82%", "78%", "66%"],
  ["78%", "66%", "86%", "86%"],
  ["45%", "82%", "62%", "21%"]
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("url");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState("https://lang-rim-nam-ai-guard.vercel.app");

  const canSubmit = useMemo(() => content.trim().length >= 4 && !isLoading, [content, isLoading]);

  useEffect(() => {
    setSiteUrl(window.location.origin);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError("");
    setCopied(false);
    setShared(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, content })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Không thể phân tích lúc này.");

      const nextResult = data.result as AnalysisResult;
      const nextItem = { id: nextResult.id, mode, input: content, result: nextResult };

      setResult(nextResult);
      setHistory((current) => {
        const next = [nextItem, ...current.filter((item) => item.id !== nextItem.id)].slice(0, 12);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Có lỗi bất ngờ khi phân tích.");
    } finally {
      setIsLoading(false);
    }
  }

  function selectHistory(item: HistoryItem) {
    setMode(item.mode);
    setContent(item.input);
    setResult(item.result);
    setHistoryOpen(false);
    setError("");
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(formatResult(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1700);
  }

  async function shareResult() {
    if (!result) return;
    const text = formatResult(result);

    if (navigator.share) {
      await navigator.share({
        title: "Làng Rim Nam AI Guard",
        text,
        url: siteUrl
      });
    } else {
      await navigator.clipboard.writeText(`${text}\n\nMở công cụ: ${siteUrl}`);
    }

    setShared(true);
    window.setTimeout(() => setShared(false), 1700);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-cyber-ink text-white">
      <CyberBackground />
      <Header historyCount={history.length} onOpenHistory={() => setHistoryOpen(true)} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <HeroIntro />

            <motion.form
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              onSubmit={handleSubmit}
              className="glass-panel cyber-border overflow-hidden rounded-lg p-4 sm:p-6"
            >
              <ModeTabs mode={mode} onChange={setMode} />

              <div className="mt-5">
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/84">
                  {mode === "url" ? <Link2 className="h-4 w-4 text-cyber-cyan" /> : <MessageSquareText className="h-4 w-4 text-cyber-orange" />}
                  {mode === "url" ? "Link/URL cần kiểm tra" : "Tin nhắn cần phân tích"}
                </label>
                <div className="relative overflow-hidden rounded-lg border border-white/12 bg-black/34">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent" />
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="custom-scrollbar min-h-[190px] w-full resize-none border-0 bg-transparent px-4 py-4 text-base leading-7 text-white placeholder:text-white/34 sm:min-h-[220px] sm:px-5"
                    placeholder={
                      mode === "url"
                        ? "https://ten-mien-can-kiem-tra.com/..."
                        : "Dán nội dung tin nhắn, email, bình luận hoặc lời mời đáng ngờ..."
                    }
                    maxLength={6000}
                  />
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/45">
                    <span>{content.length.toLocaleString("vi-VN")} / 6.000 ký tự</span>
                    <span className="hidden sm:inline">Gemini JSON mode + safety prompt</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <SampleButton icon={<Link2 className="h-4 w-4" />} label="Mẫu link" onClick={() => { setMode("url"); setContent(SAMPLE_INPUTS.url); }} />
                  <SampleButton icon={<MessageSquareText className="h-4 w-4" />} label="Mẫu tin nhắn" onClick={() => { setMode("message"); setContent(SAMPLE_INPUTS.message); }} />
                  <SampleButton icon={<RefreshCw className="h-4 w-4" />} label="Xóa" muted onClick={() => { setContent(""); setError(""); }} />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-cyber-orange via-cyber-violet to-cyber-cyan px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-neon transition hover:scale-[1.01] hover:shadow-orange disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 sm:min-w-[250px]"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5 transition group-hover:rotate-6" />}
                  <span>Phân tích với AI</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
              </div>

              <AnimatePresence>
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-4 flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.form>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <LoadingPanel key="loading" />
                ) : result ? (
                  <ResultPanel key={result.id} result={result} copied={copied} shared={shared} onCopy={copyResult} onShare={shareResult} />
                ) : (
                  <IdlePanel key="idle" />
                )}
              </AnimatePresence>
            </div>

            <StatsSection />
            <AboutPreview />
          </div>

          <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:block">
            <QrPanel siteUrl={siteUrl} />
            <HistoryPanel
              history={history}
              activeId={result?.id}
              onSelect={selectHistory}
              onClear={() => {
                setHistory([]);
                localStorage.removeItem(STORAGE_KEY);
              }}
            />
          </aside>
        </section>
      </div>

      <MobileHistoryDrawer
        open={historyOpen}
        history={history}
        activeId={result?.id}
        onClose={() => setHistoryOpen(false)}
        onSelect={selectHistory}
        onClear={() => {
          setHistory([]);
          localStorage.removeItem(STORAGE_KEY);
        }}
      />

      <Footer />
    </main>
  );
}

function CyberBackground() {
  return (
    <div className="cyber-shell pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber bg-[size:42px_42px] opacity-[0.08]" />
      <div className="noise-layer absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full opacity-35" aria-hidden="true">
        {NETWORK_LINES.map(([x1, y1, x2, y2], index) => (
          <motion.line
            key={`${x1}-${y1}-${x2}-${y2}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={index % 2 ? "rgba(255,122,24,0.32)" : "rgba(20,241,255,0.32)"}
            strokeWidth="1"
            strokeDasharray="8 12"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.4, delay: index * 0.16, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
      </svg>
      {PARTICLES.map((particle) => (
        <span
          key={`${particle.x}-${particle.y}`}
          className={cn("absolute rounded-full opacity-80 blur-[0.2px] shadow-[0_0_18px_currentColor] animate-floatNode", particle.size, particle.color)}
          style={{ left: particle.x, top: particle.y, animationDelay: particle.delay }}
        />
      ))}
      <div className="scan-lines absolute inset-0 opacity-35" />
      <div className="absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-cyber-cyan/10 to-transparent" />
    </div>
  );
}

function Header({ historyCount, onOpenHistory }: { historyCount: number; onOpenHistory: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-cyber-ink/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyber-cyan/35 bg-white/[0.06] shadow-neon">
            <ShieldCheck className="h-6 w-6 text-cyber-cyan" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-cyber-orange shadow-[0_0_16px_rgba(255,122,24,0.9)]" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-white sm:text-lg">Kỹ năng chống lừa đảo trên Internet</p>
            <p className="truncate text-xs text-white/52">Làng Rim Nam Cyber Safety Lab</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/about" className="hidden rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white/70 transition hover:border-cyber-orange/40 hover:text-white sm:inline-flex">
            About nhóm
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-cyber-cyan/25 bg-cyber-cyan/10 px-3 py-2 text-xs font-semibold text-cyber-cyan md:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Gemini 3.6 Flash
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-3 text-sm text-white/78 transition hover:border-cyber-cyan/45 hover:text-white lg:hidden"
            aria-label="Mở lịch sử phân tích"
          >
            <History className="h-4 w-4" />
            <span className="font-semibold">{historyCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroIntro() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end"
    >
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyber-orange/35 bg-cyber-orange/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-cyber-orange">
          <Zap className="h-3.5 w-3.5" />
          AI Scam Defense Lab
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
          <span className="shimmer">Làng Rim Nam</span>
          <br />
          AI Guard
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/66 sm:text-lg">
          Trạm phân tích link và tin nhắn đáng ngờ, giải thích bằng tâm lý học lừa đảo để ông bà, phụ huynh và sinh viên đều hiểu cách tự bảo vệ mình.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="AI mode" value="JSON" accent="text-cyber-cyan" />
        <StatPill label="Focus" value="Psychology" accent="text-cyber-orange" />
        <StatPill label="Mobile" value="QR ready" accent="text-cyber-green" />
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className={cn("mt-1 font-display text-lg font-bold", accent)}>{value}</p>
    </div>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const tabs: Array<{ value: Mode; label: string; icon: typeof Link2 }> = [
    { value: "url", label: "Kiểm tra Link/URL", icon: Link2 },
    { value: "message", label: "Phân tích Tin nhắn", icon: MessageSquareText }
  ];

  return (
    <div className="grid rounded-lg border border-white/10 bg-black/28 p-1 sm:grid-cols-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = mode === tab.value;

        return (
          <button
            type="button"
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn("relative flex min-h-12 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition", active ? "text-white" : "text-white/50 hover:text-white/78")}
          >
            {active ? (
              <motion.span
                layoutId="active-mode-tab"
                className="absolute inset-0 rounded-md border border-cyber-cyan/28 bg-gradient-to-r from-cyber-cyan/18 via-cyber-violet/16 to-cyber-orange/18 shadow-neon"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SampleButton({ icon, label, onClick, muted }: { icon: React.ReactNode; label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:border-cyber-cyan/45 hover:text-white",
        muted ? "text-white/58" : "text-white/72"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function IdlePanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="glass-panel cyber-border rounded-lg p-5 sm:p-6">
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
        <div className="relative mx-auto grid h-44 w-44 place-items-center">
          <div className="absolute inset-0 rounded-full border border-cyber-cyan/20" />
          <div className="absolute inset-6 rounded-full border border-cyber-orange/20" />
          <div className="absolute inset-12 rounded-full border border-cyber-violet/24" />
          <div className="absolute left-1/2 top-1/2 h-[1px] w-20 origin-left animate-spin bg-gradient-to-r from-cyber-cyan to-transparent" />
          <Radar className="h-16 w-16 text-cyber-cyan drop-shadow-[0_0_18px_rgba(20,241,255,0.65)]" />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyber-cyan">Threat radar online</p>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Radar sẵn sàng</h2>
          <p className="mt-3 text-sm leading-7 text-white/62 sm:text-base">
            Dán nội dung đáng ngờ để AI bóc tách dấu hiệu kỹ thuật, chiêu thao túng tâm lý và hướng xử lý an toàn.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["OTP", "Link rút gọn", "Khẩn cấp giả", "Giả mạo thương hiệu"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/58">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="glass-panel cyber-border overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="grid gap-6 md:grid-cols-[230px_1fr] md:items-center">
        <div className="relative mx-auto h-48 w-48">
          <div className="absolute inset-0 rounded-full border border-cyber-cyan/20" />
          <div className="absolute inset-4 animate-pulseGlow rounded-full border border-cyber-orange/30" />
          <div className="absolute inset-9 rounded-full border border-cyber-violet/30" />
          <div className="absolute left-1/2 top-1/2 h-[1px] w-24 origin-left animate-spin bg-gradient-to-r from-cyber-orange via-cyber-cyan to-transparent" />
          <div className="absolute inset-0 grid place-items-center">
            <BrainCircuit className="h-16 w-16 text-cyber-cyan drop-shadow-[0_0_22px_rgba(20,241,255,0.8)]" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyber-orange">Gemini analysis running</p>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">AI đang truy vết dấu hiệu lừa đảo</h2>
          <div className="mt-5 space-y-3">
            {["Đọc cấu trúc nội dung", "Tách tín hiệu thao túng tâm lý", "Viết lời khuyên dễ hiểu", "Chuẩn hóa kết quả JSON"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 text-sm text-white/66">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-cyber-cyan/25 bg-cyber-cyan/10 text-xs font-bold text-cyber-cyan">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="skeleton-line h-3 w-11/12 rounded-full" />
            <div className="skeleton-line h-3 w-9/12 rounded-full" />
            <div className="skeleton-line h-3 w-10/12 rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResultPanel({ result, copied, shared, onCopy, onShare }: { result: AnalysisResult; copied: boolean; shared: boolean; onCopy: () => void; onShare: () => void }) {
  const theme = RISK_THEME[result.riskLevel];

  return (
    <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45 }} className={cn("glass-panel cyber-border overflow-hidden rounded-lg", theme.glow)}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className={cn("mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold", theme.badge)}>
              <span className="text-lg">{theme.emoji}</span>
              <span>{theme.label}</span>
              <span className="h-1 w-1 rounded-full bg-current opacity-70" />
              <span>{result.riskScore}/100</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{result.headline}</h2>
            <p className="mt-2 text-sm font-semibold text-white/48">{result.category}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ActionButton onClick={onCopy} icon={copied ? <ClipboardCheck className="h-4 w-4 text-cyber-green" /> : <Copy className="h-4 w-4" />} label={copied ? "Đã copy" : "Copy"} />
            <ActionButton onClick={onShare} icon={shared ? <ClipboardCheck className="h-4 w-4 text-cyber-green" /> : <Send className="h-4 w-4" />} label={shared ? "Đã chia sẻ" : "Chia sẻ"} />
          </div>
        </div>

        {result.notice ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-cyber-orange/30 bg-cyber-orange/10 px-4 py-3 text-sm text-orange-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{result.notice}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="border-t border-white/10 pt-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/45">Confidence</p>
            <div className="mx-auto grid h-36 w-36 place-items-center rounded-full p-1" style={{ background: `conic-gradient(${theme.hex} ${result.confidence * 3.6}deg, rgba(255,255,255,0.1) 0deg)` }}>
              <div className="grid h-full w-full place-items-center rounded-full bg-cyber-panel">
                <div className="text-center">
                  <p className={cn("font-display text-3xl font-bold", theme.text)}>{result.confidence}%</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/42">AI confidence</p>
                </div>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }} transition={{ duration: 0.9, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${theme.hex}, #14f1ff)` }} />
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/45">Tóm tắt</p>
            <p className="text-base leading-8 text-white/76">{result.summary}</p>
            <div className="mt-5 rounded-lg border border-white/10 bg-black/24 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-cyber-green">
                <LockKeyhole className="h-4 w-4" />
                Câu trả lời an toàn
              </div>
              <p className="text-sm leading-7 text-white/70">{result.safetyScript}</p>
            </div>
          </div>
        </div>

        <ResultSection title="Red flags" icon={<AlertTriangle className="h-4 w-4" />}>
          <TagCloud items={result.redFlags} tone="danger" />
        </ResultSection>
        <ResultSection title="Manipulation techniques" icon={<BrainCircuit className="h-4 w-4" />}>
          <TagCloud items={result.manipulationTechniques} tone="violet" />
        </ResultSection>
        <ResultSection title="Phân tích chi tiết" icon={<Radar className="h-4 w-4" />}>
          <div className="space-y-4">
            {result.detailedAnalysis.map((paragraph, index) => (
              <motion.p key={`${paragraph}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="text-sm leading-8 text-white/72 sm:text-base">
                {paragraph}
              </motion.p>
            ))}
          </div>
        </ResultSection>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ResultSection title="Ví dụ dễ hiểu" icon={<Users className="h-4 w-4" />} compact>
            <ActionList items={result.examples} accent="orange" />
          </ResultSection>
          <ResultSection title="Checklist kiểm chứng" icon={<CheckCircle2 className="h-4 w-4" />} compact>
            <ActionList items={result.verificationChecklist} accent="cyan" />
          </ResultSection>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ResultSection title="Recommendation" icon={<ShieldCheck className="h-4 w-4" />} compact>
            <ActionList items={result.recommendation} accent="green" />
          </ResultSection>
          <ResultSection title="Next steps" icon={<CheckCircle2 className="h-4 w-4" />} compact>
            <ActionList items={result.nextSteps} accent="cyan" />
          </ResultSection>
        </div>
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyber-orange">Bài học cần nhớ</p>
          <p className="text-base leading-8 text-white/78">{result.educationalTakeaway}</p>
          <p className="mt-4 text-xs text-white/38">Model: {result.model} {result.demoMode ? "(demo fallback)" : ""} - {formatDate(result.analyzedAt)}</p>
        </div>
      </div>
    </motion.article>
  );
}

function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-4 text-sm font-bold text-white/78 transition hover:border-cyber-cyan/45 hover:text-white">
      {icon}
      {label}
    </button>
  );
}

function ResultSection({ title, icon, children, compact = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={cn("border-t border-white/10 pt-5", compact ? "mt-0" : "mt-6")}>
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
        <span className="text-cyber-cyan">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function TagCloud({ items, tone }: { items: string[]; tone: "danger" | "violet" }) {
  const className = tone === "danger" ? "border-red-400/25 bg-red-500/10 text-red-100" : "border-cyber-violet/30 bg-cyber-violet/10 text-violet-100";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={cn("rounded-full border px-3 py-2 text-sm leading-5", className)}>{item}</span>
      ))}
    </div>
  );
}

function ActionList({ items, accent }: { items: string[]; accent: "green" | "cyan" | "orange" }) {
  const color = accent === "green" ? "text-cyber-green" : accent === "orange" ? "text-cyber-orange" : "text-cyber-cyan";
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex gap-3 text-sm leading-7 text-white/72">
          <span className={cn("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-bold", color)}>{index + 1}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function QrPanel({ siteUrl }: { siteUrl: string }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&color=05060d&bgcolor=ffffff&data=${encodeURIComponent(siteUrl)}`;
  return (
    <div className="glass-panel cyber-border rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-cyber-cyan" />
        <h2 className="font-display text-base font-bold">QR quét demo</h2>
      </div>
      <div className="rounded-lg border border-white/10 bg-white p-3 shadow-neon">
        <img src={qrSrc} alt="QR code truy cập Làng Rim Nam AI Guard" className="h-auto w-full rounded-md" />
      </div>
      <p className="mt-3 break-all text-xs leading-5 text-white/50">{siteUrl}</p>
    </div>
  );
}

function HistoryPanel({ history, activeId, onSelect, onClear }: { history: HistoryItem[]; activeId?: string; onSelect: (item: HistoryItem) => void; onClear: () => void }) {
  return (
    <div className="glass-panel cyber-border overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyber-cyan" />
          <h2 className="font-display text-base font-bold">Lịch sử phân tích</h2>
        </div>
        {history.length ? (
          <button type="button" onClick={onClear} className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/50 transition hover:border-red-300/40 hover:text-red-100">Xóa</button>
        ) : null}
      </div>
      <div className="custom-scrollbar max-h-[calc(100vh-430px)] overflow-y-auto">
        {history.length ? (
          history.map((item) => {
            const theme = RISK_THEME[item.result.riskLevel];
            return (
              <button key={item.id} type="button" onClick={() => onSelect(item)} className={cn("block w-full border-b border-white/10 px-4 py-4 text-left transition hover:bg-white/[0.045]", activeId === item.id && "bg-cyber-cyan/10")}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={cn("rounded-full border px-2 py-1 text-[11px] font-bold", theme.badge)}>{theme.emoji} {theme.label}</span>
                  <span className="text-[11px] text-white/36">{formatDate(item.result.analyzedAt)}</span>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-white/70">{item.input}</p>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-8 text-sm leading-7 text-white/48">Chưa có phiên phân tích nào. Kết quả mới được lưu cục bộ trên trình duyệt.</div>
        )}
      </div>
    </div>
  );
}

function MobileHistoryDrawer({ open, history, activeId, onClose, onSelect, onClear }: { open: boolean; history: HistoryItem[]; activeId?: string; onClose: () => void; onSelect: (item: HistoryItem) => void; onClear: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md lg:hidden">
          <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Đóng" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 330, damping: 34 }} className="absolute right-0 top-0 h-full w-[min(92vw,390px)] p-3">
            <div className="relative h-full">
              <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.08] text-white/70" aria-label="Đóng lịch sử">
                <X className="h-5 w-5" />
              </button>
              <HistoryPanel history={history} activeId={activeId} onSelect={onSelect} onClear={onClear} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StatsSection() {
  const stats = [
    { label: "Kịch bản demo", value: "12+", text: "OTP, giao hàng, ngân hàng, trúng thưởng" },
    { label: "Dấu hiệu AI đọc", value: "30+", text: "Từ khóa, cấu trúc URL, cảm xúc bị thao túng" },
    { label: "Mục tiêu giáo dục", value: "3 nhóm", text: "Ông bà, phụ huynh, sinh viên" }
  ];

  return (
    <section className="mt-6 grid gap-3 md:grid-cols-3">
      {stats.map((stat) => (
        <motion.div key={stat.label} whileHover={{ y: -3 }} className="glass-panel rounded-lg p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            <BarChart3 className="h-4 w-4 text-cyber-orange" />
            {stat.label}
          </div>
          <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
          <p className="mt-2 text-sm leading-6 text-white/58">{stat.text}</p>
        </motion.div>
      ))}
    </section>
  );
}

function AboutPreview() {
  return (
    <section className="glass-panel cyber-border mt-6 rounded-lg p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyber-violet/30 bg-cyber-violet/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-100">
            <Users className="h-4 w-4" />
            About Làng Rim Nam
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Một demo nhỏ, mục tiêu rất thật</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
            Dự án biến kiến thức chống lừa đảo thành công cụ dễ dùng: dán tin nhắn/link, nhận giải thích gần gũi, biết nên làm gì ngay.
          </p>
        </div>
        <Link href="/about" className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyber-cyan/25 bg-cyber-cyan/10 px-4 py-3 text-sm font-bold text-cyber-cyan transition hover:bg-cyber-cyan/15">
          Xem nhóm
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 text-sm text-white/48 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div>
          <p className="font-semibold text-white/72">Làng Rim Nam AI Guard</p>
          <p className="mt-1">Kỹ năng chống lừa đảo trên Internet. Không lưu dữ liệu lên database; lịch sử chỉ nằm trong trình duyệt.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="rounded-md border border-white/10 px-3 py-2 transition hover:border-cyber-cyan/35 hover:text-white">Analyzer</Link>
          <Link href="/about" className="rounded-md border border-white/10 px-3 py-2 transition hover:border-cyber-orange/35 hover:text-white">About</Link>
        </div>
      </div>
    </footer>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "vừa xong";
  }
}

function formatResult(result: AnalysisResult) {
  const theme = RISK_THEME[result.riskLevel];
  return [
    "KẾT QUẢ PHÂN TÍCH - LÀNG RIM NAM AI GUARD",
    `Mức độ: ${theme.emoji} ${theme.label} (${result.riskScore}/100)`,
    `Confidence: ${result.confidence}%`,
    `Danh mục: ${result.category}`,
    "",
    `Tóm tắt: ${result.summary}`,
    "",
    "Red flags:",
    ...result.redFlags.map((item) => `- ${item}`),
    "",
    "Kỹ thuật thao túng:",
    ...result.manipulationTechniques.map((item) => `- ${item}`),
    "",
    "Phân tích chi tiết:",
    ...result.detailedAnalysis.map((item) => `- ${item}`),
    "",
    "Checklist:",
    ...result.verificationChecklist.map((item) => `- ${item}`),
    "",
    `Câu trả lời an toàn: ${result.safetyScript}`,
    `Bài học: ${result.educationalTakeaway}`
  ].join("\n");
}

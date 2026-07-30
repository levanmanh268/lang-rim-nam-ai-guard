import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import Link from "next/link";

const members = [
  { name: "Trưởng nhóm", role: "Điều phối sản phẩm, thuyết trình, kiểm thử trải nghiệm" },
  { name: "AI Engineer", role: "Thiết kế prompt Gemini, JSON schema, fallback an toàn" },
  { name: "UI/UX Designer", role: "Dark cyber neon, responsive mobile, QR demo" },
  { name: "Content Educator", role: "Nội dung chống lừa đảo, ví dụ gần gũi cho cộng đồng" }
];

const values = [
  "Giải thích dễ hiểu cho cả người ít kinh nghiệm công nghệ.",
  "Không hù dọa, nhưng giúp người dùng biết dừng lại và kiểm chứng.",
  "Tập trung vào tâm lý học lừa đảo: sợ hãi, lòng tham, khẩn cấp giả, giả mạo uy tín.",
  "Ưu tiên hành động an toàn: không bấm link, không nhập OTP, xác minh qua kênh chính thức."
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cyber-ink text-white">
      <div className="cyber-shell pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-grid-cyber bg-[size:42px_42px] opacity-[0.08]" />
        <div className="scan-lines absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-cyber-cyan/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại công cụ
        </Link>

        <section className="glass-panel cyber-border rounded-lg p-6 sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyber-orange/35 bg-cyber-orange/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyber-orange">
            <Sparkles className="h-4 w-4" />
            Làng Rim Nam Cyber Safety Lab
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Nhóm làm demo chống lừa đảo cho cộng đồng
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/66">
            Làng Rim Nam AI Guard là sản phẩm demo giáo dục an toàn số: biến một nội dung đáng ngờ thành bài học dễ hiểu,
            có dấu hiệu cảnh báo, phân tích tâm lý và checklist hành động ngay.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard icon={<ShieldCheck className="h-6 w-6" />} title="Bảo vệ" text="Giúp người dùng dừng lại trước khi bấm link hoặc cung cấp thông tin nhạy cảm." />
          <InfoCard icon={<GraduationCap className="h-6 w-6" />} title="Giáo dục" text="Giải thích như một bài học ngắn, gần gũi với ông bà, phụ huynh và sinh viên." />
          <InfoCard icon={<BrainCircuit className="h-6 w-6" />} title="AI" text="Gemini phân tích JSON có cấu trúc, kèm ví dụ và khuyến nghị thực tế." />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-lg p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyber-cyan">
              <Users className="h-4 w-4" />
              Thành viên nhóm
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.name} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-display text-lg font-bold text-white">{member.name}</p>
                  <p className="mt-1 text-sm leading-6 text-white/58">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyber-orange">
              <HeartHandshake className="h-4 w-4" />
              Nguyên tắc sản phẩm
            </div>
            <div className="space-y-3">
              {values.map((value) => (
                <div key={value} className="flex gap-3 text-sm leading-7 text-white/68">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyber-green" />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg border border-cyber-cyan/25 bg-cyber-cyan/10 text-cyber-cyan">
        {icon}
      </div>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-white/60">{text}</p>
    </div>
  );
}

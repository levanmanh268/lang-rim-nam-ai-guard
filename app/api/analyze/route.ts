import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const DEFAULT_MODEL = "gemini-3.6-flash";
const MODEL_CANDIDATES = [
  DEFAULT_MODEL,
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-1.5-flash-latest"
];
const TEMPERATURE = 0.76;

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    riskLevel: { type: "string", enum: ["safe", "low", "medium", "high", "critical"] },
    riskScore: { type: "integer" },
    confidence: { type: "integer" },
    category: { type: "string" },
    headline: { type: "string" },
    summary: { type: "string" },
    redFlags: { type: "array", items: { type: "string" } },
    manipulationTechniques: { type: "array", items: { type: "string" } },
    detailedAnalysis: { type: "array", items: { type: "string" } },
    examples: { type: "array", items: { type: "string" } },
    verificationChecklist: { type: "array", items: { type: "string" } },
    recommendation: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
    safetyScript: { type: "string" },
    educationalTakeaway: { type: "string" }
  },
  required: [
    "riskLevel",
    "riskScore",
    "confidence",
    "category",
    "headline",
    "summary",
    "redFlags",
    "manipulationTechniques",
    "detailedAnalysis",
    "examples",
    "verificationChecklist",
    "recommendation",
    "nextSteps",
    "safetyScript",
    "educationalTakeaway"
  ]
};

const SYSTEM_PROMPT = `
Bạn là chuyên gia an toàn số và giáo viên cộng đồng của dự án "Kỹ năng chống lừa đảo trên Internet - Làng Rim Nam".

Phong cách:
- Trả lời tiếng Việt rõ ràng, ấm áp, gần gũi như cô giáo hướng dẫn ông bà, phụ huynh và sinh viên.
- Giải thích sâu nhưng không hù dọa quá mức. Mỗi kết luận phải nêu lý do.
- Tập trung vào tâm lý học lừa đảo: sợ hãi, lòng tham, khẩn cấp giả, uy quyền giả, giả mạo thương hiệu, cô lập nạn nhân, mồi nhử quà tặng/hoàn tiền, ép nhập OTP/mật khẩu.
- Với URL: không giả vờ đã truy cập website. Chỉ phân tích chuỗi URL, giao thức, tên miền, link rút gọn, từ khóa và cấu trúc bất thường.
- Với tin nhắn: phân tích cách câu chữ dẫn dắt cảm xúc, tạo áp lực, hứa lợi ích hoặc đe dọa.
- Luôn khuyên: không bấm link lạ, không nhập OTP/mật khẩu/CCCD/ngân hàng, tự mở app/website chính thức, gọi tổng đài chính thức, hỏi người thân/cán bộ hỗ trợ khi nghi ngờ.
- Không cung cấp hướng dẫn thực hiện lừa đảo, vượt hệ thống bảo vệ hoặc né phát hiện.

Chỉ trả về JSON hợp lệ theo schema, không markdown, không code fence.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode: Mode = body?.mode === "message" ? "message" : "url";
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (content.length < 4) {
      return NextResponse.json({ error: "Vui lòng nhập link hoặc tin nhắn cần phân tích." }, { status: 400 });
    }

    if (content.length > 6000) {
      return NextResponse.json(
        { error: "Nội dung quá dài. Hãy rút gọn dưới 6.000 ký tự để AI phân tích nhanh hơn." },
        { status: 413 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const configuredModel = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json({
        result: createHeuristicAnalysis(mode, content, configuredModel, {
          demoMode: true,
          notice: "Chưa cấu hình GEMINI_API_KEY. Đang chạy demo fallback để phần trình bày vẫn mượt."
        })
      });
    }

    const modelCandidates = Array.from(new Set([configuredModel, ...MODEL_CANDIDATES]));
    // Finite request-wide budget: unreachable providers cannot hang the UI indefinitely.
    const deadline = Date.now() + 25000;
    let lastApiError = "";

    for (const model of modelCandidates) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        lastApiError = "Đã hết thời gian gọi Gemini (25 giây).";
        break;
      }
      const apiResult = await callGeminiInteraction({ apiKey, model, mode, content,
        timeoutMs: Math.min(9000, Math.max(1000, remaining)) });

      if (apiResult.ok) {
        return NextResponse.json({ result: normalizeAnalysis(apiResult.data, mode, model) });
      }

      lastApiError = apiResult.message;
      if (!apiResult.retryWithNextModel) break;
    }

    return NextResponse.json({
      result: createHeuristicAnalysis(mode, content, configuredModel, {
        demoMode: true,
        notice: `Gemini API chưa dùng được. Đã thử các model mới (${modelCandidates.join(", ")}). Chi tiết cuối: ${lastApiError}`
      })
    });
  } catch {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ. Hãy thử lại." }, { status: 400 });
  }
}

async function callGeminiInteraction({
  apiKey,
  model,
  mode,
  content,
  timeoutMs
}: {
  apiKey: string;
  model: string;
  mode: Mode;
  content: string;
  timeoutMs: number;
}): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string; retryWithNextModel: boolean }
> {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        model,
        store: false,
        system_instruction: SYSTEM_PROMPT,
        input: buildPrompt(mode, content),
        generation_config: {
          temperature: TEMPERATURE,
          top_p: 0.92,
          max_output_tokens: 8192
        },
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: ANALYSIS_SCHEMA
        }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        message: `${response.status} ${response.statusText}: ${safeShort(errorText)}`,
        retryWithNextModel: [400, 404, 429, 500, 503].includes(response.status)
      };
    }

    const payload = await response.json();
    const outputText = extractOutputText(payload);
    const parsed = parseJsonObject(outputText);

    if (!parsed) {
      return {
        ok: false,
        message: `Model ${model} trả về nội dung không parse được JSON.`,
        retryWithNextModel: true
      };
    }

    return { ok: true, data: parsed };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không thể kết nối Gemini.",
      retryWithNextModel: true
    };
  }
}

function buildPrompt(mode: Mode, content: string) {
  const label = mode === "url" ? "URL/LINK" : "TIN NHẮN";

  return `
Loại nội dung: ${label}
Nội dung cần phân tích:
${content}

Hãy phân tích như một bài học chống lừa đảo hoàn chỉnh:
1. Kết luận rủi ro rõ ràng nhưng không khẳng định tuyệt đối nếu thiếu dữ kiện.
2. Chỉ ra dấu hiệu cụ thể xuất hiện trong nội dung.
3. Giải thích vì sao các dấu hiệu đó nguy hiểm bằng tâm lý học lừa đảo.
4. Nếu có yếu tố đa cấp, Ponzi, "đưa tiền nhận tiền lớn hơn", lợi nhuận x2/x3, hoa hồng tuyến dưới hoặc đầu tư không rõ pháp lý, phải xếp rủi ro cao/critical.
5. Cho ví dụ đời thường để ông bà, phụ huynh và sinh viên dễ nhớ.
6. Đưa checklist kiểm chứng an toàn và hành động ngay nếu đã lỡ bấm/nhập/chuyển tiền.
7. Trả về đúng JSON schema đã yêu cầu.
`;
}

function extractOutputText(payload: unknown) {
  const data = payload as {
    output_text?: string;
    outputText?: string;
    steps?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
    outputs?: Array<{ text?: string }>;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  if (typeof data.output_text === "string") return data.output_text;
  if (typeof data.outputText === "string") return data.outputText;

  const stepText =
    data.steps
      ?.flatMap((step) => step.content || [])
      .map((part) => part.text || "")
      .filter(Boolean)
      .join("\n") || "";
  if (stepText) return stepText;

  const outputText = data.outputs?.map((output) => output.text || "").filter(Boolean).join("\n") || "";
  if (outputText) return outputText;

  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .filter(Boolean)
      .join("\n") || ""
  );
}

function parseJsonObject(text: string) {
  const clean = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAnalysis(raw: Record<string, unknown>, mode: Mode, model: string): AnalysisResult {
  const riskLevel = normalizeRiskLevel(raw.riskLevel);

  return {
    id: createId(),
    inputType: mode,
    riskLevel,
    riskScore: clampNumber(raw.riskScore, levelToScore(riskLevel)),
    confidence: clampNumber(raw.confidence, 84),
    category: toText(raw.category, "Phân tích an toàn số"),
    headline: toText(raw.headline, "Kết quả phân tích đã sẵn sàng"),
    summary: toText(raw.summary, "AI đã phân tích nội dung và đưa ra khuyến nghị an toàn."),
    redFlags: toStringArray(raw.redFlags, ["Cần xác minh nguồn gửi trước khi thao tác."]),
    manipulationTechniques: toStringArray(raw.manipulationTechniques, [
      "Tạo cảm giác khẩn cấp",
      "Dẫn dụ bằng lợi ích hoặc nỗi sợ"
    ]),
    detailedAnalysis: toStringArray(raw.detailedAnalysis, [
      "Nội dung có yếu tố cần kiểm chứng. Người dùng không nên bấm link hoặc nhập OTP, mật khẩu, thông tin ngân hàng, CCCD khi chưa xác minh qua kênh chính thức.",
      "Lừa đảo thường không thắng bằng kỹ thuật quá cao, mà bằng cách làm người nhận sợ, tham lợi hoặc vội vàng. Vì vậy bước quan trọng nhất là dừng lại và kiểm tra nguồn."
    ]),
    examples: toStringArray(raw.examples, [
      "Ví dụ: tin nhắn nói đơn hàng bị treo và yêu cầu nhập OTP trong 15 phút là cách tạo áp lực để người nhận không kịp suy nghĩ.",
      "Ví dụ: link có chữ ngân hàng nhưng tên miền lạ có thể là trang giả mạo để lấy mật khẩu."
    ]),
    verificationChecklist: toStringArray(raw.verificationChecklist, [
      "Không bấm link trong tin nhắn lạ.",
      "Tự mở ứng dụng hoặc website chính thức.",
      "Gọi tổng đài công khai của tổ chức được nhắc đến.",
      "Không cung cấp OTP, mật khẩu, CCCD hoặc thông tin ngân hàng.",
      "Hỏi người thân/cán bộ hỗ trợ nếu còn nghi ngờ."
    ]),
    recommendation: toStringArray(raw.recommendation, [
      "Dừng thao tác và xác minh qua kênh chính thức.",
      "Không nhập thông tin nhạy cảm vào link được gửi qua tin nhắn.",
      "Lưu bằng chứng nếu nội dung có dấu hiệu lừa đảo."
    ]),
    nextSteps: toStringArray(raw.nextSteps, [
      "Chụp màn hình nội dung đáng ngờ.",
      "Đổi mật khẩu nếu đã lỡ nhập.",
      "Liên hệ ngân hàng nếu đã lộ thông tin tài chính.",
      "Báo cáo link/tin nhắn cho nền tảng hoặc cơ quan chức năng."
    ]),
    safetyScript: toText(
      raw.safetyScript,
      "Tôi sẽ tự liên hệ kênh chính thức để xác minh. Tôi không cung cấp OTP, mật khẩu hoặc thông tin cá nhân qua link/tin nhắn lạ."
    ),
    educationalTakeaway: toText(
      raw.educationalTakeaway,
      "Khi một tin nhắn khiến bạn sợ, tham hoặc vội, hãy dừng lại 30 giây để kiểm chứng."
    ),
    model,
    analyzedAt: new Date().toISOString()
  };
}

function createHeuristicAnalysis(
  mode: Mode,
  content: string,
  model: string,
  meta: Pick<AnalysisResult, "demoMode" | "notice">
): AnalysisResult {
  const text = content.toLowerCase();
  const flags: string[] = [];
  const techniques = new Set<string>();
  let score = mode === "url" ? 18 : 16;

  const patterns = [
    [/otp|mã xác thực|ma xac thuc|mật khẩu|mat khau|password|pin/i, 28, "Có dấu hiệu yêu cầu OTP, mật khẩu hoặc mã xác thực.", "Đánh cắp thông tin xác thực"],
    [/ngân hàng|ngan hang|tài khoản|tai khoan|chuyển khoản|chuyen khoan|ví điện tử|vi dien tu/i, 18, "Nội dung liên quan tài khoản, ngân hàng hoặc ví điện tử.", "Khai thác nỗi sợ mất tiền"],
    [/khẩn cấp|khan cap|ngay lập tức|ngay lap tuc|trong 24h|hết hạn|het han|khóa tài khoản|khoa tai khoan/i, 18, "Tạo áp lực thời gian hoặc đe dọa mất quyền lợi.", "Tạo khẩn cấp giả"],
    [/trúng thưởng|trung thuong|nhận quà|nhan qua|miễn phí|mien phi|hoàn tiền|hoan tien/i, 16, "Dùng quà tặng, hoàn tiền hoặc phần thưởng để dẫn dụ.", "Mồi nhử lòng tham"],
    [/đa cấp|da cap|ponzi|kim tự tháp|kim tu thap|đầu tư|dau tu|lãi suất|lai suat|lợi nhuận|loi nhuan|x2|x3|nhân đôi|nhan doi|gấp đôi|gap doi|bỏ vốn|bo von|hoa hồng|hoa hong|tuyến dưới|tuyen duoi/i, 30, "Hứa hẹn đầu tư/đa cấp/lợi nhuận cao bất thường.", "Mồi nhử lợi nhuận phi thực tế"],
    [/\d+\s*(triệu|trieu|tỷ|ty|k|đ|vnd|vnđ).*?(nhận|nhan|lãi|lai|lời|loi|thu về|thu ve|được|duoc).*?\d+\s*(triệu|trieu|tỷ|ty|k|đ|vnd|vnđ)/i, 30, "Có công thức đưa tiền rồi nhận lại số tiền lớn hơn, dấu hiệu điển hình của lừa đảo đầu tư/đa cấp.", "Khuếch đại lòng tham bằng con số lớn"],
    [/cccd|căn cước|can cuoc|cmnd|số thẻ|so the|ngày sinh|ngay sinh/i, 18, "Có dấu hiệu thu thập giấy tờ hoặc dữ liệu định danh.", "Thu thập dữ liệu cá nhân"],
    [/ship|giao hàng|giao hang|bưu cục|buu cuc|phí|phi/i, 12, "Kịch bản giao hàng/phí phát sinh thường bị dùng để dụ bấm link.", "Giả mạo dịch vụ quen thuộc"]
  ] as const;

  for (const [test, points, flag, technique] of patterns) {
    if (test.test(text)) {
      score += points;
      flags.push(flag);
      techniques.add(technique);
    }
  }

  if (mode === "url") {
    if (/^http:\/\//i.test(content)) {
      score += 14;
      flags.push("Link dùng HTTP không mã hóa.");
    }
    if (/(bit\.ly|tinyurl|t\.co|shorturl|rebrand\.ly|cutt\.ly|bom\.so|s\.id)/i.test(content)) {
      score += 18;
      flags.push("Link rút gọn che giấu tên miền đích.");
      techniques.add("Che giấu nguồn thật");
    }
    if (/(login|verify|secure|account|bank|gift|bonus|claim|free|update)/i.test(content)) {
      score += 14;
      flags.push("URL chứa từ khóa nhạy cảm như đăng nhập, xác minh, quà tặng hoặc cập nhật.");
    }
    if ((content.match(/-/g) || []).length >= 3 || content.length > 90) {
      score += 8;
      flags.push("URL dài hoặc có nhiều ký tự dễ gây nhầm lẫn.");
    }
  }

  if (!flags.length) {
    flags.push("Chưa thấy dấu hiệu nguy hiểm rõ ràng, nhưng vẫn cần kiểm chứng nguồn gửi.");
    techniques.add("Rủi ro chưa đủ dữ kiện");
  }

  const riskScore = Math.min(score, 96);
  const riskLevel = scoreToLevel(riskScore);

  return {
    id: createId(),
    inputType: mode,
    riskLevel,
    riskScore,
    confidence: Math.min(92, 66 + flags.length * 6),
    category: riskScore >= 65 ? "Nghi vấn lừa đảo/social engineering" : "Cần xác minh trước khi thao tác",
    headline:
      riskScore >= 85
        ? "Nguy cơ rất cao: dừng thao tác ngay"
        : riskScore >= 65
          ? "Dấu hiệu lừa đảo rõ rệt"
          : riskScore >= 42
            ? "Có tín hiệu bất thường cần kiểm chứng"
            : "Chưa thấy nguy hiểm rõ, vẫn nên xác minh",
    summary:
      "Chế độ demo phát hiện các tín hiệu rủi ro dựa trên từ khóa, cấu trúc nội dung và cách tạo áp lực tâm lý. Nếu thấy lời hứa đưa tiền rồi nhận lại số tiền lớn hơn, hãy coi đây là tín hiệu đỏ của đa cấp/Ponzi hoặc lừa đảo đầu tư.",
    redFlags: flags.slice(0, 8),
    manipulationTechniques: Array.from(techniques).slice(0, 8),
    detailedAnalysis: [
      "Nội dung có thể đang cố làm người nhận hành động nhanh hoặc ham lợi. Đây là mẹo tâm lý phổ biến: khi con người sợ mất cơ hội kiếm tiền, họ dễ bỏ qua bước kiểm chứng.",
      "Những lời hứa như đưa 100 triệu nhận 300 triệu thường không dựa trên hoạt động kinh doanh minh bạch. Nó đánh vào lòng tham và niềm tin rằng mình đang có cơ hội đặc biệt.",
      "Nếu mô hình yêu cầu lôi kéo thêm người, nhận hoa hồng tuyến dưới hoặc nộp tiền trước để nhận lợi nhuận lớn, hãy coi đó là rủi ro cao.",
      "Cách xử lý an toàn nhất là dừng lại, chụp màn hình, không chuyển tiền và hỏi người có chuyên môn hoặc cơ quan chức năng trước khi tham gia."
    ],
    examples: [
      "Ví dụ: 'đưa 100 triệu nhận 300 triệu' là lợi nhuận phi thực tế, thường dùng để kích thích lòng tham.",
      "Ví dụ: 'mời thêm 3 người để nhận hoa hồng' là dấu hiệu mô hình đa cấp/kim tự tháp cần cực kỳ cảnh giác.",
      "Ví dụ: nếu người gửi thúc giục chuyển tiền ngay để giữ suất, đó là kỹ thuật tạo khẩn cấp giả."
    ],
    verificationChecklist: [
      "Không chuyển tiền trước chỉ vì lời hứa lợi nhuận cao.",
      "Kiểm tra pháp lý của công ty/dự án qua nguồn chính thức.",
      "Hỏi rõ tiền tạo ra từ hoạt động kinh doanh nào, không chỉ từ người mới tham gia.",
      "Không cung cấp CCCD, tài khoản ngân hàng hoặc mã OTP.",
      "Hỏi gia đình, thầy cô hoặc cơ quan chức năng trước khi quyết định."
    ],
    recommendation: [
      "Không tham gia nếu lợi nhuận được hứa hẹn quá cao và quá dễ.",
      "Không rủ thêm người thân khi chưa kiểm chứng pháp lý và mô hình kinh doanh.",
      "Lưu bằng chứng trò chuyện, số tài khoản, đường link nếu đã bị dụ chuyển tiền.",
      "Nếu đã chuyển tiền, liên hệ ngân hàng và trình báo càng sớm càng tốt."
    ],
    nextSteps: [
      "Dừng trao đổi và không chuyển thêm tiền.",
      "Chụp màn hình toàn bộ nội dung.",
      "Kiểm tra pháp lý qua kênh chính thức.",
      "Báo cho người thân hoặc người phụ trách hỗ trợ."
    ],
    safetyScript:
      "Tôi cần tự kiểm chứng pháp lý và nguồn lợi nhuận trước. Tôi không chuyển tiền hoặc cung cấp thông tin cá nhân khi chưa xác minh qua kênh chính thức.",
    educationalTakeaway:
      "Lợi nhuận càng được hứa hẹn dễ và lớn, càng phải dừng lại kiểm chứng: tiền thật không tự nhân ba chỉ bằng một lời nhắn.",
    model,
    analyzedAt: new Date().toISOString(),
    ...meta
  };
}

function normalizeRiskLevel(value: unknown): RiskLevel {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  if (["safe", "low", "medium", "high", "critical"].includes(normalized)) return normalized as RiskLevel;
  return "medium";
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 42) return "medium";
  if (score >= 20) return "low";
  return "safe";
}

function levelToScore(level: RiskLevel) {
  return { safe: 8, low: 26, medium: 52, high: 76, critical: 92 }[level];
}

function clampNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
  return items.length ? items.slice(0, 8) : fallback;
}

function safeShort(value: string) {
  return value.replace(/\s+/g, " ").slice(0, 360);
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

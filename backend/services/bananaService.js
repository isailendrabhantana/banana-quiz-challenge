const API_URL = process.env.BANANA_API_URL || "http://marcconrad.com/uob/banana/api.php?out=json";
const demos = [
  ["7 + 5 = ?", 12], ["9 - 4 = ?", 5], ["3 × 6 = ?", 18],
  ["20 ÷ 4 = ?", 5], ["8 + 7 = ?", 15], ["6 × 4 = ?", 24],
  ["18 - 9 = ?", 9], ["5 × 5 = ?", 25], ["32 ÷ 4 = ?", 8], ["14 + 8 = ?", 22]
];
function demoImage(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="300"><rect width="100%" height="100%" rx="20" fill="#fff7df"/><text x="320" y="135" text-anchor="middle" font-family="Arial" font-size="52" font-weight="bold" fill="#3b2b13">${label}</text><text x="320" y="210" text-anchor="middle" font-family="Arial" font-size="18" fill="#79664b">Demo puzzle · external API unavailable</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
export async function getQuestion(index = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(API_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Banana API HTTP ${response.status}`);
    const data = await response.json();
    if (typeof data.question !== "string" || !data.question.startsWith("http") ||
        !Number.isFinite(Number(data.solution))) throw new Error("Unexpected Banana API response.");
    return { questionImage: data.question, solution: Number(data.solution), source: "banana-api" };
  } finally { clearTimeout(timer); }
}
export async function getQuestionWithFallback(index = 0) {
  try { return await getQuestion(index); }
  catch (error) {
    console.warn("Banana API unavailable; using demo puzzle:", error.message);
    const [label, answer] = demos[index % demos.length];
    return { questionImage: demoImage(label), solution: answer, source: "demo-fallback" };
  }
}

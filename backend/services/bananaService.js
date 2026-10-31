const API_URL =
  process.env.BANANA_API_URL ||
  "http://marcconrad.com/uob/banana/api.php?out=json";

const API_TIMEOUT = 8000;

const demos = [
  ["7 + 5 = ?", 12],
  ["9 - 4 = ?", 5],
  ["3 × 6 = ?", 18],
  ["20 ÷ 4 = ?", 5],
  ["8 + 7 = ?", 15],
  ["6 × 4 = ?", 24],
  ["18 - 9 = ?", 9],
  ["5 × 5 = ?", 25],
  ["32 ÷ 4 = ?", 8],
  ["14 + 8 = ?", 22],
];

function demoImage(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="640"
         height="300">
      <rect width="100%" height="100%" rx="20" fill="#fff7df"/>
      <text x="320" y="135"
            text-anchor="middle"
            font-family="Arial"
            font-size="52"
            font-weight="bold"
            fill="#3b2b13">
        ${label}
      </text>
      <text x="320" y="210"
            text-anchor="middle"
            font-family="Arial"
            font-size="18"
            fill="#79664b">
        Demo puzzle · external API unavailable
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Check whether the API returned a valid image URL.
function isValidQuestionUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getQuestion(index = 0) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, API_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Banana API returned HTTP status ${response.status}`);
    }

    const data = await response.json();

    // Check that the API returned an object.
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Banana API returned an invalid response.");
    }

    // Validate the question image URL.
    if (!isValidQuestionUrl(data.question)) {
      throw new Error("Banana API returned an invalid question image URL.");
    }

    // Validate the puzzle solution.
    const solution = Number(data.solution);

    if (
      data.solution === null ||
      data.solution === undefined ||
      String(data.solution).trim() === "" ||
      !Number.isFinite(solution)
    ) {
      throw new Error("Banana API returned an invalid solution.");
    }

    return {
      questionImage: data.question,
      solution,
      source: "banana-api",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        `Banana API request timed out after ${API_TIMEOUT / 1000} seconds.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getQuestionWithFallback(index = 0) {
  try {
    return await getQuestion(index);
  } catch (error) {
    console.warn(`Banana API unavailable: ${error.message}`);
    console.warn("Using a local demo puzzle instead.");

    const [label, answer] = demos[index % demos.length];

    return {
      questionImage: demoImage(label),
      solution: answer,
      source: "demo-fallback",
    };
  }
}

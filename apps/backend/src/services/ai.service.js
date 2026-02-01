const https = require("https");
const { URL } = require("url");

const DEFAULT_MODEL = process.env.AI_MODEL || "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);

const buildPrompt = ({ topic, difficulty, numberOfQuestions }) => {
  return {
    system: "You are a quiz generator. Return ONLY valid JSON.",
    user: `Generate ${numberOfQuestions} multiple-choice questions on the topic: "${topic}". Difficulty: ${difficulty}.\n\nReturn a JSON array where each item has:\n- questionText: string\n- options: array of 4 strings\n- correctOptionIndex: integer (0-3)\n\nDo not include explanations or extra fields.`,
  };
};

const makeRequest = (urlString, payload, headers, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const data = JSON.stringify(payload);

    const options = {
      method: "POST",
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(
            new Error(`AI API error: ${res.statusCode} ${res.statusMessage}`)
          );
        }
        resolve(body);
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("AI API request timed out"));
    });

    req.write(data);
    req.end();
  });
};

const extractJson = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI response is empty");
  }

  const trimmed = rawText.trim();

  // Try direct JSON parse first
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    // Try to extract JSON from code fences or surrounding text
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("AI response does not contain valid JSON array");
    }
    const jsonSlice = trimmed.slice(firstBracket, lastBracket + 1);
    return JSON.parse(jsonSlice);
  }
};

const normalizeQuestion = (q, index) => {
  if (!q || typeof q !== "object") {
    throw new Error(`Question ${index + 1} is not a valid object`);
  }

  const questionText = String(q.questionText || "").trim();
  const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [];
  const correctOptionIndex = Number(q.correctOptionIndex);

  if (!questionText) {
    throw new Error(`Question ${index + 1} is missing questionText`);
  }

  if (options.length < 2) {
    throw new Error(`Question ${index + 1} must have at least 2 options`);
  }

  if (!Number.isInteger(correctOptionIndex)) {
    throw new Error(`Question ${index + 1} has invalid correctOptionIndex`);
  }

  if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
    throw new Error(`Question ${index + 1} has out-of-range correctOptionIndex`);
  }

  return { questionText, options, correctOptionIndex };
};

const validateQuestions = (questions, expectedCount) => {
  if (!Array.isArray(questions)) {
    throw new Error("AI output must be an array of questions");
  }

  if (questions.length !== expectedCount) {
    throw new Error(
      `AI returned ${questions.length} questions, expected ${expectedCount}`
    );
  }

  return questions.map((q, idx) => normalizeQuestion(q, idx));
};

const generateQuizQuestions = async ({ topic, difficulty, numberOfQuestions }) => {
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("AI_API_URL and AI_API_KEY must be configured");
  }

  const prompt = buildPrompt({ topic, difficulty, numberOfQuestions });

  const payload = {
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: 0.6,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const raw = await makeRequest(apiUrl, payload, headers, DEFAULT_TIMEOUT_MS);
      const parsed = JSON.parse(raw);
      const aiText =
        parsed?.choices?.[0]?.message?.content ||
        parsed?.output_text ||
        parsed?.text ||
        raw;

      const questions = extractJson(aiText);
      return validateQuestions(questions, numberOfQuestions);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`AI generation failed: ${lastError.message}`);
};

module.exports = {
  generateQuizQuestions,
};
/**
 * AI Quiz Generation Service using Groq API
 * 
 * Generates quiz questions based on topic, difficulty, and count
 * Falls back to mock questions if USE_MOCK_AI=true or API fails
 */
const https = require("https");

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 60000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);

/**
 * Get USE_MOCK_AI at runtime (not module load time)
 */
const shouldUseMock = () => process.env.USE_MOCK_AI === "true";
const getGroqModel = () => process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Generate mock questions when AI is unavailable
 * This allows testing the full workflow without a working API key
 */
const generateMockQuestions = ({ topic, difficulty, numberOfQuestions }) => {
  console.log("[AI Mock] Generating mock questions for:", topic);
  
  const difficultyDescriptions = {
    easy: "Basic recall and understanding",
    medium: "Application and analysis required", 
    hard: "Critical thinking and synthesis needed"
  };
  
  const questions = [];
  for (let i = 1; i <= numberOfQuestions; i++) {
    // Randomize correct answer position (0-3)
    const correctIndex = Math.floor(Math.random() * 4);
    const options = [
      `Incorrect answer A for question ${i}`,
      `Incorrect answer B for question ${i}`,
      `Incorrect answer C for question ${i}`,
      `Incorrect answer D for question ${i}`
    ];
    options[correctIndex] = `Correct answer for ${topic} - Question ${i}`;
    
    questions.push({
      questionText: `[${difficulty.toUpperCase()}] Question ${i} about ${topic}: What is a key concept in ${topic}?`,
      options: options,
      correctOptionIndex: correctIndex,
      explanation: `This is the correct answer because it accurately describes a key concept in ${topic}. ${difficultyDescriptions[difficulty] || ''}`,
      difficulty: difficulty
    });
  }
  
  console.log("[AI Mock] Generated", questions.length, "mock questions");
  return questions;
};

/**
 * Build prompt for Groq to generate quiz questions
 * Strict JSON output format with explanations
 */
const buildGroqPrompt = ({ topic, difficulty, numberOfQuestions }) => {
  const difficultyGuidelines = {
    easy: `EASY DIFFICULTY REQUIREMENTS:
- Focus on basic facts, definitions, and simple recall
- Questions should be straightforward with clear answers
- Avoid complex reasoning or multi-step problems
- Target: ~90% of students should answer correctly`,
    medium: `MEDIUM DIFFICULTY REQUIREMENTS:
- Require understanding and application of concepts
- Include some analysis and comparison questions
- May need 1-2 steps of reasoning
- Target: ~60-70% of students should answer correctly`,
    hard: `HARD DIFFICULTY REQUIREMENTS:
- Require deep analysis, synthesis, or evaluation
- Include complex scenarios and edge cases
- Questions should challenge expert knowledge
- May require multi-step reasoning
- Target: ~30-40% of students should answer correctly`
  };

  return `You are an expert quiz generator. Generate EXACTLY ${numberOfQuestions} multiple-choice questions about "${topic}".

${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

CRITICAL OUTPUT RULES:
1. Return ONLY a valid JSON array - NO markdown, NO explanations, NO extra text
2. Generate EXACTLY ${numberOfQuestions} questions - not more, not less
3. Each question MUST have exactly 4 options
4. The correctOptionIndex MUST be randomly distributed (0, 1, 2, or 3) - NOT always 0!
5. Every question MUST include a detailed explanation for why the correct answer is right

EXACT JSON STRUCTURE (follow precisely):
[
  {
    "questionText": "Clear question ending with ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 2,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
    "difficulty": "${difficulty}"
  }
]

QUALITY REQUIREMENTS:
- Questions must be educational, accurate, and well-written
- All 4 options must be plausible (no obvious wrong answers)
- Explanations should teach the concept, not just state the answer
- Ensure variety in question types (what, why, how, which, etc.)

OUTPUT EXACTLY ${numberOfQuestions} QUESTIONS AS A JSON ARRAY:`;
};

/**
 * Make HTTPS request to Groq API
 */
const makeGroqRequest = (apiKey, prompt, timeoutMs, model) => {
  return new Promise((resolve, reject) => {
    const payload = {
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a precise quiz generator that outputs ONLY valid JSON arrays. Never include markdown formatting, code fences, or any text outside the JSON array. Start your response with [ and end with ]."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8192,
      top_p: 0.9
    };

    const data = JSON.stringify(payload);

    const options = {
      method: "POST",
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: timeoutMs,
    };

    console.log("[Groq] Making request with model:", model);

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log("[Groq] Response status:", res.statusCode);
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error("[Groq] Error response:", body.substring(0, 500));
          return reject(
            new Error(`Groq API error: ${res.statusCode} - ${body.substring(0, 300)}`)
          );
        }
        resolve(body);
      });
    });

    req.on("error", (err) => {
      console.error("[Groq] Request error:", err.message);
      reject(err);
    });
    
    req.on("timeout", () => {
      console.error("[Groq] Request timeout");
      req.destroy(new Error("Groq API request timed out"));
    });

    req.write(data);
    req.end();
  });
};

/**
 * Extract JSON array from AI response
 */
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
    let cleaned = trimmed
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) {
      console.error("[Groq] Failed to find JSON array in:", cleaned.substring(0, 500));
      throw new Error("AI response does not contain valid JSON array");
    }
    const jsonSlice = cleaned.slice(firstBracket, lastBracket + 1);
    return JSON.parse(jsonSlice);
  }
};

/**
 * Normalize and validate a single question
 * Includes explanation and difficulty fields
 */
const normalizeQuestion = (q, index, expectedDifficulty) => {
  if (!q || typeof q !== "object") {
    throw new Error(`Question ${index + 1} is not a valid object`);
  }

  const questionText = String(q.questionText || q.question || "").trim();
  const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [];
  
  // Handle both correctOptionIndex and correctAnswer
  let correctOptionIndex = q.correctOptionIndex ?? q.correctAnswer ?? q.correctAnswerIndex;
  correctOptionIndex = Number(correctOptionIndex);

  // Get explanation (default to empty string if not provided)
  const explanation = String(q.explanation || "").trim();
  
  // Get difficulty (use expected difficulty as fallback)
  const difficulty = ["easy", "medium", "hard"].includes(q.difficulty) 
    ? q.difficulty 
    : expectedDifficulty;

  if (!questionText) {
    throw new Error(`Question ${index + 1} is missing questionText`);
  }

  // Ensure exactly 4 options
  if (options.length !== 4) {
    throw new Error(`Question ${index + 1} must have exactly 4 options, got ${options.length}`);
  }

  if (!Number.isInteger(correctOptionIndex)) {
    throw new Error(`Question ${index + 1} has invalid correctOptionIndex`);
  }

  if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
    throw new Error(`Question ${index + 1} has out-of-range correctOptionIndex: ${correctOptionIndex}`);
  }

  return { questionText, options, correctOptionIndex, explanation, difficulty };
};

/**
 * Validate all questions from AI response
 * Now enforces exact question count
 */
const validateQuestions = (questions, expectedCount, expectedDifficulty) => {
  if (!Array.isArray(questions)) {
    throw new Error("AI output must be an array of questions");
  }

  if (questions.length < 1) {
    throw new Error("AI returned no questions");
  }

  console.log(`[Groq] Validating ${questions.length} questions (expected ${expectedCount})`);

  // Warn if count mismatch but continue with what we have
  if (questions.length !== expectedCount) {
    console.warn(`[Groq] Question count mismatch: got ${questions.length}, expected ${expectedCount}`);
  }

  return questions.map((q, idx) => normalizeQuestion(q, idx, expectedDifficulty));
};

/**
 * Main function to generate quiz questions using Groq API
 * Falls back to mock questions if USE_MOCK_AI=true or all API attempts fail
 */
const generateQuizQuestions = async ({ topic, difficulty, numberOfQuestions }) => {
  // Use mock if explicitly requested (check at runtime)
  if (shouldUseMock()) {
    console.log("[AI] USE_MOCK_AI is enabled, using mock questions");
    return generateMockQuestions({ topic, difficulty, numberOfQuestions });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.includes("PASTE") || apiKey.includes("YOUR") || apiKey.length < 10) {
    console.log("[AI] No valid Groq API key found, using mock questions");
    return generateMockQuestions({ topic, difficulty, numberOfQuestions });
  }

  console.log("[Groq] Generating quiz questions:", { topic, difficulty, numberOfQuestions });

  const prompt = buildGroqPrompt({ topic, difficulty, numberOfQuestions });

  // Try multiple models in case one has issues
  const currentModel = getGroqModel();
  const modelsToTry = [
    currentModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];
  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError;
  
  for (const model of uniqueModels) {
    console.log(`[Groq] Trying model: ${model}`);
    
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[Groq] Attempt ${attempt}/${MAX_RETRIES + 1} with model ${model}`);
        
        const rawResponse = await makeGroqRequest(apiKey, prompt, DEFAULT_TIMEOUT_MS, model);
        console.log("[Groq] Raw response received, length:", rawResponse.length);
        
        // Parse Groq response structure (OpenAI-compatible format)
        const parsed = JSON.parse(rawResponse);
        
        // Extract text from Groq response
        const aiText = parsed?.choices?.[0]?.message?.content;
        
        if (!aiText) {
          console.error("[Groq] No text in response:", JSON.stringify(parsed, null, 2).substring(0, 500));
          throw new Error("No content in Groq response");
        }
        
        console.log("[Groq] AI text content:", aiText.substring(0, 300) + "...");
        
        // Extract and validate questions
        const questions = extractJson(aiText);
        console.log("[Groq] Extracted questions count:", questions.length);
        
        const validated = validateQuestions(questions, numberOfQuestions, difficulty);
        console.log("[Groq] Validation passed, returning", validated.length, "questions");
        
        // Log correct answer distribution for verification
        const distribution = validated.reduce((acc, q) => {
          acc[q.correctOptionIndex] = (acc[q.correctOptionIndex] || 0) + 1;
          return acc;
        }, {});
        console.log("[Groq] Correct answer distribution:", distribution);
        
        // Log difficulty distribution
        const difficultyDist = validated.reduce((acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
          return acc;
        }, {});
        console.log("[Groq] Difficulty distribution:", difficultyDist);
        
        // Log explanation stats
        const withExplanation = validated.filter(q => q.explanation.length > 0).length;
        console.log(`[Groq] Questions with explanations: ${withExplanation}/${validated.length}`);
        
        return validated;
      } catch (err) {
        console.error(`[Groq] Attempt ${attempt} with ${model} failed:`, err.message);
        lastError = err;
        
        // If it's a rate limit error (429), try next model immediately
        if (err.message.includes("429") || err.message.includes("rate") || err.message.includes("limit")) {
          console.log(`[Groq] Rate limited for ${model}, trying next model...`);
          break;
        }
        
        // Wait before retry for other errors
        if (attempt < MAX_RETRIES + 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  // Fall back to mock if all attempts failed
  console.log("[AI] All Groq API attempts failed. Falling back to mock questions.");
  console.log("[AI] Error was:", lastError?.message);
  return generateMockQuestions({ topic, difficulty, numberOfQuestions });
};

/**
 * Build prompt for generating quiz from document content
 * Different from topic-based generation - uses actual content
 */
const buildContentPrompt = ({ content, difficulty, numberOfQuestions }) => {
  const difficultyGuidelines = {
    easy: `EASY DIFFICULTY REQUIREMENTS:
- Focus on basic facts, definitions, and simple recall from the content
- Questions should be straightforward with clear answers
- Avoid complex reasoning or multi-step problems
- Target: ~90% of students should answer correctly`,
    medium: `MEDIUM DIFFICULTY REQUIREMENTS:
- Require understanding and application of concepts from the content
- Include some analysis and comparison questions
- May need 1-2 steps of reasoning
- Target: ~60-70% of students should answer correctly`,
    hard: `HARD DIFFICULTY REQUIREMENTS:
- Require deep analysis, synthesis, or evaluation of the content
- Include complex scenarios and edge cases
- Questions should challenge expert knowledge
- May require multi-step reasoning
- Target: ~30-40% of students should answer correctly`
  };

  return `You are an expert quiz generator. Generate EXACTLY ${numberOfQuestions} multiple-choice questions based on the following content.

${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

CRITICAL OUTPUT RULES:
1. Return ONLY a valid JSON array - NO markdown, NO explanations, NO extra text
2. Generate EXACTLY ${numberOfQuestions} questions - not more, not less
3. Each question MUST have exactly 4 options
4. The correctOptionIndex MUST be randomly distributed (0, 1, 2, or 3) - NOT always 0!
5. Every question MUST include a detailed explanation for why the correct answer is right
6. Questions MUST be based on the provided content - do not copy text directly

EXACT JSON STRUCTURE (follow precisely):
[
  {
    "questionText": "Clear question ending with ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 2,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
    "difficulty": "${difficulty}"
  }
]

QUALITY REQUIREMENTS:
- Questions must be educational, accurate, and based on the provided content
- All 4 options must be plausible (no obvious wrong answers)
- Explanations should teach the concept, not just state the answer
- Ensure variety in question types (what, why, how, which, etc.)
- Avoid duplicates and do not copy text directly from the content

=== CONTENT TO GENERATE QUESTIONS FROM ===
${content}
=== END OF CONTENT ===

OUTPUT EXACTLY ${numberOfQuestions} QUESTIONS AS A JSON ARRAY:`;
};

/**
 * Generate quiz questions from document content
 * Similar to generateQuizQuestions but uses content instead of topic
 */
const generateQuizFromContent = async ({ content, difficulty, numberOfQuestions }) => {
  console.log("[AI] generateQuizFromContent called:", { difficulty, numberOfQuestions, contentLength: content?.length });

  // Check for mock mode first
  if (shouldUseMock()) {
    console.log("[AI] Using MOCK mode for content-based quiz (USE_MOCK_AI=true)");
    return generateMockQuestions({ topic: "Document Content", difficulty, numberOfQuestions });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes("PASTE") || apiKey.includes("YOUR") || apiKey.length < 10) {
    console.log("[AI] Invalid or missing GROQ_API_KEY. Falling back to mock questions.");
    return generateMockQuestions({ topic: "Document Content", difficulty, numberOfQuestions });
  }

  const prompt = buildContentPrompt({ content, difficulty, numberOfQuestions });
  const timeoutMs = DEFAULT_TIMEOUT_MS;
  
  const currentModel = getGroqModel();
  const modelsToTry = [
    currentModel,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];
  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)];

  let lastError = null;

  for (const model of uniqueModels) {
    console.log(`[AI Content] Trying model: ${model}`);
    
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[AI Content] Attempt ${attempt}/${MAX_RETRIES + 1} with model ${model}`);
        
        const rawResponse = await makeGroqRequest(apiKey, prompt, timeoutMs, model);
        console.log("[AI Content] Raw response received, length:", rawResponse.length);
        
        const parsed = JSON.parse(rawResponse);
        const aiText = parsed?.choices?.[0]?.message?.content;
        
        if (!aiText) {
          console.error("[AI Content] No text in response");
          throw new Error("No content in Groq response");
        }
        
        console.log("[AI Content] AI text content:", aiText.substring(0, 300) + "...");
        
        // Extract and validate questions using existing functions
        const questions = extractJson(aiText);
        console.log("[AI Content] Extracted questions count:", questions.length);
        
        const validated = validateQuestions(questions, numberOfQuestions, difficulty);
        console.log("[AI Content] Validation passed, returning", validated.length, "questions");
        
        return validated;
        
      } catch (err) {
        console.error(`[AI Content] Attempt ${attempt} with ${model} failed:`, err.message);
        lastError = err;
        
        // If it's a rate limit error, try next model immediately
        if (err.message.includes("429") || err.message.includes("rate") || err.message.includes("limit")) {
          console.log(`[AI Content] Rate limited for ${model}, trying next model...`);
          break;
        }
        
        // Wait before retry for other errors
        if (attempt < MAX_RETRIES + 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  // Fall back to mock if all attempts failed
  console.log("[AI Content] All Groq API attempts failed. Falling back to mock questions.");
  console.log("[AI Content] Error was:", lastError?.message);
  return generateMockQuestions({ topic: "Document Content", difficulty, numberOfQuestions });
};

module.exports = {
  generateQuizQuestions,
  generateQuizFromContent,
};
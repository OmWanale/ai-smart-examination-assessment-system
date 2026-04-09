/**
 * Question Paper Generator Controller
 * Handles document upload, text extraction, and AI-based question paper generation
 */
const https = require("https");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const PDFDocument = require("pdfkit");
const asyncHandler = require("../utils/asyncHandler");

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 60000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);
const shouldUseMock = () => process.env.USE_MOCK_AI === "true";
const getGroqModel = () => process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const DEFAULT_TOPIC = "the provided topic";

const inferTopicFromContent = (content = "") => {
  const clean = String(content || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return DEFAULT_TOPIC;

  const sentence = (clean.match(/[A-Za-z][^.!?\n]{3,180}/) || [clean.slice(0, 120)])[0]
    .trim();

  const topic = sentence
    .replace(/\bmodule\s*(no\.?|number)?\s*[:\-]?\s*\d+\b/gi, "")
    .replace(/\bunit\s*(no\.?|number)?\s*[:\-]?\s*\d+\b/gi, "")
    .replace(/\bchapter\s*(no\.?|number)?\s*[:\-]?\s*\d+\b/gi, "")
    .replace(/\blesson\s*(no\.?|number)?\s*[:\-]?\s*\d+\b/gi, "")
    .replace(/\btopic\s*(no\.?|number)?\s*[:\-]?\s*\d+\b/gi, "")
    .replace(/\bno\.?\s*\d+\b/gi, "")
    .replace(/\b\d+\b$/g, "")
    .replace(/[:\-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[^A-Za-z]+/, "")
    .replace(/[^\w\s-]+$/g, "")
    .slice(0, 80)
    .trim();

  return topic || DEFAULT_TOPIC;
};

/**
 * Extract text from PDF buffer
 */
const extractPdfText = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("[Paper] PDF extraction error:", error.message);
    throw new Error("Failed to extract text from PDF file");
  }
};

/**
 * Extract text from DOC/DOCX buffer
 */
const extractDocText = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("[Paper] DOC extraction error:", error.message);
    throw new Error("Failed to extract text from Word document");
  }
};

/**
 * Extract text from file based on mime type
 */
const extractTextFromFile = async (file) => {
  const ext = file.originalname.toLowerCase().split('.').pop();
  
  if (ext === 'pdf') {
    return extractPdfText(file.buffer);
  } else if (ext === 'doc' || ext === 'docx') {
    return extractDocText(file.buffer);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
};

/**
 * Build prompt for 20-marks question paper generation
 */
const build20MarksPrompt = ({ content, difficulty }) => {
  const difficultyGuidelines = {
    easy: "Focus on basic facts, definitions, and recall questions.",
    medium: "Include application and analysis questions requiring understanding.",
    hard: "Include critical thinking, synthesis, and evaluation questions."
  };

  return `You are an expert exam paper creator. Generate a structured 20 marks question paper based on the provided content.

STRICT STRUCTURE (MUST FOLLOW EXACTLY):

Section A:
- 3 questions
- Each question = 3 marks
- Instruction: "Solve any 2"
- Total obtainable marks: 6

Section B:
- 2 questions
- Each question = 7 marks
- Instruction: "Solve any 1"
- Total obtainable marks: 7

Section C:
- 2 questions
- Each question = 7 marks
- Instruction: "Solve any 1"
- Total obtainable marks: 7

DIFFICULTY LEVEL: ${difficulty} - ${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

CRITICAL RULES:
1. Return ONLY valid JSON - NO markdown, NO explanations
2. Questions must be meaningful and exam-oriented
3. Do NOT copy text directly from source
4. Each question should be clear and educational
5. Do not include answers
6. Every question must explicitly mention a concrete topic/concept from the content (avoid vague wording like "the concept" or "the topic" without naming it)

EXACT JSON STRUCTURE:
{
  "title": "Examination Question Paper",
  "totalMarks": 20,
  "sections": [
    {
      "title": "Section A",
      "instruction": "Solve any 2",
      "marksPerQuestion": 3,
      "questions": [
        { "questionText": "Question 1 text here", "marks": 3 },
        { "questionText": "Question 2 text here", "marks": 3 },
        { "questionText": "Question 3 text here", "marks": 3 }
      ]
    },
    {
      "title": "Section B",
      "instruction": "Solve any 1",
      "marksPerQuestion": 7,
      "questions": [
        { "questionText": "Question 1 text here", "marks": 7 },
        { "questionText": "Question 2 text here", "marks": 7 }
      ]
    },
    {
      "title": "Section C",
      "instruction": "Solve any 1",
      "marksPerQuestion": 7,
      "questions": [
        { "questionText": "Question 1 text here", "marks": 7 },
        { "questionText": "Question 2 text here", "marks": 7 }
      ]
    }
  ]
}

=== CONTENT TO BASE QUESTIONS ON ===
${content.substring(0, 15000)}
=== END OF CONTENT ===

OUTPUT THE JSON QUESTION PAPER:`;
};

/**
 * Build prompt for 60-marks question paper generation
 */
const build60MarksPrompt = ({ content, difficulty }) => {
  const difficultyGuidelines = {
    easy: "Focus on basic facts, definitions, and recall questions.",
    medium: "Include application and analysis questions requiring understanding.",
    hard: "Include critical thinking, synthesis, and evaluation questions."
  };

  return `You are an expert exam paper creator. Generate a structured 60 marks question paper based on the provided content.

STRICT STRUCTURE (MUST FOLLOW EXACTLY):

Section A:
- 7 questions
- Each question = 3 marks
- Instruction: "Solve any 5"
- Total obtainable marks: 15

Sections B, C, D, E (EACH section has):
- 3 questions with different marks:
  - Question 1 = 4 marks
  - Question 2 = 5 marks
  - Question 3 = 6 marks
- Instruction: "Attempt all questions"
- Total marks per section: 15

Overall Instruction for B-E:
"Solve any 3 sections (if a section is selected, all 3 questions must be attempted)"
Total obtainable from B-E: 45 marks

TOTAL PAPER MARKS: 15 (Section A) + 45 (any 3 of B-E) = 60 marks

DIFFICULTY LEVEL: ${difficulty} - ${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}

CRITICAL RULES:
1. Return ONLY valid JSON - NO markdown, NO explanations
2. Questions must be meaningful and exam-oriented
3. Do NOT copy text directly from source
4. Avoid duplication across sections
5. Maintain consistent difficulty within each section
6. Every question must explicitly mention a concrete topic/concept from the content (avoid vague wording like "the concept" or "the topic" without naming it)

EXACT JSON STRUCTURE:
{
  "title": "Examination Question Paper",
  "totalMarks": 60,
  "sections": [
    {
      "title": "Section A",
      "instruction": "Solve any 5",
      "marksPerQuestion": 3,
      "questions": [
        { "questionText": "Q1 text", "marks": 3 },
        { "questionText": "Q2 text", "marks": 3 },
        { "questionText": "Q3 text", "marks": 3 },
        { "questionText": "Q4 text", "marks": 3 },
        { "questionText": "Q5 text", "marks": 3 },
        { "questionText": "Q6 text", "marks": 3 },
        { "questionText": "Q7 text", "marks": 3 }
      ]
    },
    {
      "title": "Section B",
      "instruction": "Attempt all questions",
      "questions": [
        { "questionText": "Q1 text", "marks": 4 },
        { "questionText": "Q2 text", "marks": 5 },
        { "questionText": "Q3 text", "marks": 6 }
      ]
    },
    {
      "title": "Section C",
      "instruction": "Attempt all questions",
      "questions": [
        { "questionText": "Q1 text", "marks": 4 },
        { "questionText": "Q2 text", "marks": 5 },
        { "questionText": "Q3 text", "marks": 6 }
      ]
    },
    {
      "title": "Section D",
      "instruction": "Attempt all questions",
      "questions": [
        { "questionText": "Q1 text", "marks": 4 },
        { "questionText": "Q2 text", "marks": 5 },
        { "questionText": "Q3 text", "marks": 6 }
      ]
    },
    {
      "title": "Section E",
      "instruction": "Attempt all questions",
      "questions": [
        { "questionText": "Q1 text", "marks": 4 },
        { "questionText": "Q2 text", "marks": 5 },
        { "questionText": "Q3 text", "marks": 6 }
      ]
    }
  ]
}

=== CONTENT TO BASE QUESTIONS ON ===
${content.substring(0, 15000)}
=== END OF CONTENT ===

OUTPUT THE JSON QUESTION PAPER:`;
};

/**
 * Build prompt for custom question generation
 */
const buildCustomQuestionsPrompt = ({ content, numQuestions, difficulty }) => {
  const difficultyGuidelines = {
    easy: "Focus on basic facts, definitions, and recall questions.",
    medium: "Include application and analysis questions requiring understanding.",
    hard: "Include critical thinking, synthesis, and evaluation questions."
  };

  return `You are an expert exam question creator. Generate ${numQuestions} exam questions based on the provided content.

REQUIREMENTS:
- Generate exactly ${numQuestions} questions
- Difficulty: ${difficulty} - ${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}
- For each question, suggest appropriate marks (2, 3, 5, 7, or 10)
- Questions must be meaningful and exam-oriented
- Vary question types: definition, explanation, analysis, comparison, application

CRITICAL RULES:
1. Return ONLY valid JSON - NO markdown, NO explanations
2. Do NOT copy text directly from source
3. Each question should be clear and educational
4. Do not include answers
5. Every question must explicitly mention a concrete topic/concept from the content (avoid vague wording like "the concept" or "the topic" without naming it)

EXACT JSON STRUCTURE:
{
  "title": "Generated Questions",
  "questions": [
    { "questionText": "Question text here", "suggestedMarks": 3 },
    { "questionText": "Another question", "suggestedMarks": 5 }
  ]
}

=== CONTENT TO BASE QUESTIONS ON ===
${content.substring(0, 15000)}
=== END OF CONTENT ===

OUTPUT THE JSON:`;
};

/**
 * Build prompt for question paper generation (legacy/fallback)
 */
const buildPaperPrompt = ({ content, totalMarks, marksPerQuestion, difficulty }) => {
  const numQuestions = Math.ceil(totalMarks / marksPerQuestion);
  
  // Calculate sections based on marks
  let sections = [];
  if (marksPerQuestion <= 2) {
    sections.push({ title: "Section A", marks: marksPerQuestion, count: numQuestions });
  } else if (marksPerQuestion <= 5) {
    const shortCount = Math.floor(numQuestions * 0.4);
    const longCount = numQuestions - shortCount;
    sections.push({ title: "Section A", marks: 2, count: shortCount });
    sections.push({ title: "Section B", marks: marksPerQuestion, count: longCount });
  } else {
    const section1Count = Math.floor(numQuestions * 0.3);
    const section2Count = Math.floor(numQuestions * 0.4);
    const section3Count = numQuestions - section1Count - section2Count;
    sections.push({ title: "Section A", marks: 2, count: section1Count });
    sections.push({ title: "Section B", marks: 5, count: section2Count });
    sections.push({ title: "Section C", marks: marksPerQuestion, count: section3Count });
  }

  const sectionInstructions = sections.map(s => 
    `- ${s.title}: ${s.count} questions worth ${s.marks} marks each`
  ).join('\n');

  const difficultyGuidelines = {
    easy: "Focus on basic facts, definitions, and recall questions.",
    medium: "Include application and analysis questions requiring understanding.",
    hard: "Include critical thinking, synthesis, and evaluation questions."
  };

  return `You are an expert exam paper creator. Generate a structured question paper based on the provided content.

REQUIREMENTS:
- Total marks: ${totalMarks}
- Difficulty: ${difficulty} - ${difficultyGuidelines[difficulty] || difficultyGuidelines.medium}
- Create questions divided into sections:
${sectionInstructions}

CRITICAL OUTPUT RULES:
1. Return ONLY a valid JSON object - NO markdown, NO explanations, NO extra text
2. Questions must be derived from the content - do NOT copy text directly
3. Each question should be clear and educational
4. Do not include answers in the question paper
5. Vary question types: definition, explanation, analysis, comparison, application
6. Every question must explicitly mention a concrete topic/concept from the content (avoid vague wording like "the concept" or "the topic" without naming it)

EXACT JSON STRUCTURE:
{
  "title": "Examination Question Paper",
  "totalMarks": ${totalMarks},
  "sections": [
    {
      "title": "Section A",
      "marksPerQuestion": 2,
      "instructions": "Answer all questions",
      "questions": [
        "What is the definition of...?",
        "Explain briefly..."
      ]
    },
    {
      "title": "Section B",
      "marksPerQuestion": 5,
      "instructions": "Answer all questions",
      "questions": [
        "Discuss the importance of...",
        "Compare and contrast..."
      ]
    }
  ]
}

=== CONTENT TO BASE QUESTIONS ON ===
${content.substring(0, 15000)}
=== END OF CONTENT ===

OUTPUT THE JSON QUESTION PAPER:`;
};

/**
 * Generate mock question paper for testing
 */
const generateMockPaper = ({ totalMarks, marksPerQuestion, difficulty, topic }) => {
  const numQuestions = Math.ceil(totalMarks / marksPerQuestion);
  const safeTopic = topic || DEFAULT_TOPIC;
  
  return {
    title: "Mock Examination Question Paper",
    totalMarks,
    sections: [
      {
        title: "Section A",
        marksPerQuestion: 2,
        instructions: "Answer all questions briefly",
        questions: Array(Math.min(5, Math.floor(numQuestions / 2))).fill(null).map((_, i) => 
          `Q${i + 1} Define and explain a key concept of ${safeTopic}.`
        )
      },
      {
        title: "Section B",
        marksPerQuestion: marksPerQuestion,
        instructions: "Answer all questions in detail",
        questions: Array(Math.ceil(numQuestions / 2)).fill(null).map((_, i) => 
          `Q${i + 1} Discuss and analyze an important aspect of ${safeTopic}.`
        )
      }
    ]
  };
};

/**
 * Generate mock 20-marks paper
 */
const generateMock20MarksPaper = ({ difficulty, topic }) => {
  const safeTopic = topic || DEFAULT_TOPIC;
  return {
    title: "Mock 20 Marks Question Paper",
    totalMarks: 20,
    sections: [
      {
        title: "Section A",
        instruction: "Solve any 2",
        marksPerQuestion: 3,
        questions: [
          { questionText: `Define a key concept in ${safeTopic}.`, marks: 3 },
          { questionText: `Explain the significance of ${safeTopic}.`, marks: 3 },
          { questionText: `What are the primary characteristics of ${safeTopic}?`, marks: 3 }
        ]
      },
      {
        title: "Section B",
        instruction: "Solve any 1",
        marksPerQuestion: 7,
        questions: [
          { questionText: `Discuss ${safeTopic} in detail and explain its implications.`, marks: 7 },
          { questionText: `Analyze how the major concepts within ${safeTopic} are related.`, marks: 7 }
        ]
      },
      {
        title: "Section C",
        instruction: "Solve any 1",
        marksPerQuestion: 7,
        questions: [
          { questionText: `Evaluate key arguments related to ${safeTopic} and provide your perspective.`, marks: 7 },
          { questionText: `Compare and contrast different viewpoints about ${safeTopic}.`, marks: 7 }
        ]
      }
    ]
  };
};

/**
 * Generate mock 60-marks paper
 */
const generateMock60MarksPaper = ({ difficulty, topic }) => {
  const safeTopic = topic || DEFAULT_TOPIC;
  return {
    title: "Mock 60 Marks Question Paper",
    totalMarks: 60,
    sections: [
      {
        title: "Section A",
        instruction: "Solve any 5",
        marksPerQuestion: 3,
        questions: [
          { questionText: `Define the primary concept of ${safeTopic}.`, marks: 3 },
          { questionText: `What is the significance of ${safeTopic}?`, marks: 3 },
          { questionText: `List the main characteristics of ${safeTopic}.`, marks: 3 },
          { questionText: `Explain a basic principle related to ${safeTopic}.`, marks: 3 },
          { questionText: `What are key features of ${safeTopic}?`, marks: 3 },
          { questionText: `Describe the fundamental aspects of ${safeTopic}.`, marks: 3 },
          { questionText: `Outline the main points of ${safeTopic}.`, marks: 3 }
        ]
      },
      {
        title: "Section B",
        instruction: "Attempt all questions",
        questions: [
          { questionText: `Explain the concept of ${safeTopic} with examples.`, marks: 4 },
          { questionText: `Discuss the importance and applications of ${safeTopic}.`, marks: 5 },
          { questionText: `Analyze major factors affecting ${safeTopic} and their impact.`, marks: 6 }
        ]
      },
      {
        title: "Section C",
        instruction: "Attempt all questions",
        questions: [
          { questionText: `Describe an important process in ${safeTopic} in detail.`, marks: 4 },
          { questionText: `Compare different approaches used in ${safeTopic}.`, marks: 5 },
          { questionText: `Evaluate the effectiveness of methods applied in ${safeTopic}.`, marks: 6 }
        ]
      },
      {
        title: "Section D",
        instruction: "Attempt all questions",
        questions: [
          { questionText: `What are the advantages and disadvantages of ${safeTopic}?`, marks: 4 },
          { questionText: `Discuss practical implications of ${safeTopic}.`, marks: 5 },
          { questionText: `Critically examine the theoretical framework behind ${safeTopic}.`, marks: 6 }
        ]
      },
      {
        title: "Section E",
        instruction: "Attempt all questions",
        questions: [
          { questionText: `Summarize key findings related to ${safeTopic}.`, marks: 4 },
          { questionText: `Propose solutions to common challenges in ${safeTopic}.`, marks: 5 },
          { questionText: `Synthesize information about ${safeTopic} and draw conclusions.`, marks: 6 }
        ]
      }
    ]
  };
};

/**
 * Generate mock custom questions
 */
const generateMockCustomQuestions = ({ numQuestions, difficulty, topic }) => {
  const count = parseInt(numQuestions) || 10;
  const markOptions = [2, 3, 5, 7, 10];
  const safeTopic = topic || DEFAULT_TOPIC;
  
  return {
    title: "Generated Questions",
    questions: Array(count).fill(null).map((_, i) => ({
      questionText: `Q${i + 1} This is a sample ${difficulty} difficulty question about ${safeTopic}.`,
      suggestedMarks: markOptions[i % markOptions.length]
    }))
  };
};

/**
 * Make HTTPS request to Groq API for paper generation
 */
const makeGroqRequest = (apiKey, prompt, timeoutMs, model) => {
  return new Promise((resolve, reject) => {
    const payload = {
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a precise exam paper generator that outputs ONLY valid JSON. Never include markdown formatting, code fences, or any text outside the JSON. Start your response with { and end with }."
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

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Groq API error: ${res.statusCode}`));
        }
        resolve(body);
      });
    });

    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.write(data);
    req.end();
  });
};

/**
 * Extract JSON from AI response
 */
const extractJson = (rawText) => {
  const trimmed = rawText.trim();
  
  try {
    return JSON.parse(trimmed);
  } catch {
    let cleaned = trimmed
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("AI response does not contain valid JSON");
    }
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
};

/**
 * Generate question paper using AI
 */
const generatePaperWithAI = async ({ content, totalMarks, marksPerQuestion, difficulty }) => {
  const topic = inferTopicFromContent(content);
  if (shouldUseMock()) {
    console.log("[Paper] Using mock mode");
    return generateMockPaper({ totalMarks, marksPerQuestion, difficulty, topic });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log("[Paper] No valid API key, using mock");
    return generateMockPaper({ totalMarks, marksPerQuestion, difficulty, topic });
  }

  const prompt = buildPaperPrompt({ content, totalMarks, marksPerQuestion, difficulty });
  const models = [getGroqModel(), "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const uniqueModels = [...new Set(models)];

  let lastError;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[Paper] Trying ${model}, attempt ${attempt}`);
        
        const rawResponse = await makeGroqRequest(apiKey, prompt, DEFAULT_TIMEOUT_MS, model);
        const parsed = JSON.parse(rawResponse);
        const aiText = parsed?.choices?.[0]?.message?.content;
        
        if (!aiText) throw new Error("No content in response");
        
        const paper = extractJson(aiText);
        
        // Validate paper structure
        if (!paper.sections || !Array.isArray(paper.sections)) {
          throw new Error("Invalid paper structure");
        }
        
        console.log("[Paper] Generated successfully");
        return paper;
        
      } catch (err) {
        console.error(`[Paper] Attempt failed:`, err.message);
        lastError = err;
        
        if (err.message.includes("429")) break;
        if (attempt < MAX_RETRIES + 1) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  console.log("[Paper] Falling back to mock");
  return generateMockPaper({ totalMarks, marksPerQuestion, difficulty, topic });
};

/**
 * Generate 20-marks paper using AI
 */
const generate20MarksPaperWithAI = async ({ content, difficulty }) => {
  const topic = inferTopicFromContent(content);
  if (shouldUseMock()) {
    console.log("[Paper] Using mock mode for 20-marks");
    return generateMock20MarksPaper({ difficulty, topic });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log("[Paper] No valid API key, using mock for 20-marks");
    return generateMock20MarksPaper({ difficulty, topic });
  }

  const prompt = build20MarksPrompt({ content, difficulty });
  const models = [getGroqModel(), "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const uniqueModels = [...new Set(models)];

  let lastError;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[Paper] 20-marks: Trying ${model}, attempt ${attempt}`);
        
        const rawResponse = await makeGroqRequest(apiKey, prompt, DEFAULT_TIMEOUT_MS, model);
        const parsed = JSON.parse(rawResponse);
        const aiText = parsed?.choices?.[0]?.message?.content;
        
        if (!aiText) throw new Error("No content in response");
        
        const paper = extractJson(aiText);
        
        // Validate paper structure
        if (!paper.sections || !Array.isArray(paper.sections) || paper.sections.length !== 3) {
          throw new Error("Invalid 20-marks paper structure");
        }
        
        console.log("[Paper] 20-marks generated successfully");
        return paper;
        
      } catch (err) {
        console.error(`[Paper] 20-marks attempt failed:`, err.message);
        lastError = err;
        
        if (err.message.includes("429")) break;
        if (attempt < MAX_RETRIES + 1) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  console.log("[Paper] 20-marks falling back to mock");
  return generateMock20MarksPaper({ difficulty, topic });
};

/**
 * Generate 60-marks paper using AI
 */
const generate60MarksPaperWithAI = async ({ content, difficulty }) => {
  const topic = inferTopicFromContent(content);
  if (shouldUseMock()) {
    console.log("[Paper] Using mock mode for 60-marks");
    return generateMock60MarksPaper({ difficulty, topic });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log("[Paper] No valid API key, using mock for 60-marks");
    return generateMock60MarksPaper({ difficulty, topic });
  }

  const prompt = build60MarksPrompt({ content, difficulty });
  const models = [getGroqModel(), "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const uniqueModels = [...new Set(models)];

  let lastError;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[Paper] 60-marks: Trying ${model}, attempt ${attempt}`);
        
        const rawResponse = await makeGroqRequest(apiKey, prompt, DEFAULT_TIMEOUT_MS, model);
        const parsed = JSON.parse(rawResponse);
        const aiText = parsed?.choices?.[0]?.message?.content;
        
        if (!aiText) throw new Error("No content in response");
        
        const paper = extractJson(aiText);
        
        // Validate paper structure
        if (!paper.sections || !Array.isArray(paper.sections) || paper.sections.length !== 5) {
          throw new Error("Invalid 60-marks paper structure");
        }
        
        console.log("[Paper] 60-marks generated successfully");
        return paper;
        
      } catch (err) {
        console.error(`[Paper] 60-marks attempt failed:`, err.message);
        lastError = err;
        
        if (err.message.includes("429")) break;
        if (attempt < MAX_RETRIES + 1) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  console.log("[Paper] 60-marks falling back to mock");
  return generateMock60MarksPaper({ difficulty, topic });
};

/**
 * Generate custom questions using AI
 */
const generateCustomQuestionsWithAI = async ({ content, numQuestions, difficulty }) => {
  const topic = inferTopicFromContent(content);
  if (shouldUseMock()) {
    console.log("[Paper] Using mock mode for custom questions");
    return generateMockCustomQuestions({ numQuestions, difficulty, topic });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log("[Paper] No valid API key, using mock for custom questions");
    return generateMockCustomQuestions({ numQuestions, difficulty, topic });
  }

  const prompt = buildCustomQuestionsPrompt({ content, numQuestions, difficulty });
  const models = [getGroqModel(), "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const uniqueModels = [...new Set(models)];

  let lastError;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        console.log(`[Paper] Custom questions: Trying ${model}, attempt ${attempt}`);
        
        const rawResponse = await makeGroqRequest(apiKey, prompt, DEFAULT_TIMEOUT_MS, model);
        const parsed = JSON.parse(rawResponse);
        const aiText = parsed?.choices?.[0]?.message?.content;
        
        if (!aiText) throw new Error("No content in response");
        
        const result = extractJson(aiText);
        
        // Validate structure
        if (!result.questions || !Array.isArray(result.questions)) {
          throw new Error("Invalid custom questions structure");
        }
        
        console.log("[Paper] Custom questions generated successfully");
        return result;
        
      } catch (err) {
        console.error(`[Paper] Custom questions attempt failed:`, err.message);
        lastError = err;
        
        if (err.message.includes("429")) break;
        if (attempt < MAX_RETRIES + 1) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  console.log("[Paper] Custom questions falling back to mock");
  return generateMockCustomQuestions({ numQuestions, difficulty, topic });
};

/**
 * @route   POST /api/papers/generate
 * @desc    Generate question paper from uploaded documents
 * @access  Private/Teacher
 */
const generatePaper = asyncHandler(async (req, res) => {
  console.log("[Paper] Generate request received");
  
  const { mode = '20-marks', difficulty = 'medium', numQuestions, totalMarks, marksPerQuestion } = req.body;
  const files = req.files;

  // Validation
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please upload at least one file"
    });
  }

  // Validate mode-specific inputs
  if (mode === 'custom') {
    const num = parseInt(numQuestions);
    if (isNaN(num) || num < 1 || num > 50) {
      return res.status(400).json({
        success: false,
        message: "Number of questions must be between 1 and 50"
      });
    }
  }

  try {
    // Extract text from all files
    console.log(`[Paper] Processing ${files.length} files for mode: ${mode}`);
    const textParts = [];
    
    for (const file of files) {
      console.log(`[Paper] Extracting text from: ${file.originalname}`);
      const text = await extractTextFromFile(file);
      if (text.trim()) {
        textParts.push(text);
      }
    }

    if (textParts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from uploaded files"
      });
    }

    const combinedText = textParts.join("\n\n---\n\n");
    console.log(`[Paper] Combined text length: ${combinedText.length}`);

    let paper;

    // Generate paper based on mode
    switch (mode) {
      case '20-marks':
        paper = await generate20MarksPaperWithAI({
          content: combinedText,
          difficulty
        });
        break;
        
      case '60-marks':
        paper = await generate60MarksPaperWithAI({
          content: combinedText,
          difficulty
        });
        break;
        
      case 'custom':
        paper = await generateCustomQuestionsWithAI({
          content: combinedText,
          numQuestions: parseInt(numQuestions),
          difficulty
        });
        break;
        
      default:
        // Legacy fallback for old API calls
        if (totalMarks && marksPerQuestion) {
          paper = await generatePaperWithAI({
            content: combinedText,
            totalMarks: parseInt(totalMarks),
            marksPerQuestion: parseInt(marksPerQuestion),
            difficulty
          });
        } else {
          // Default to 20-marks if no valid mode specified
          paper = await generate20MarksPaperWithAI({
            content: combinedText,
            difficulty
          });
        }
    }

    res.json({
      success: true,
      data: { paper }
    });

  } catch (error) {
    console.error("[Paper] Generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate question paper"
    });
  }
});

/**
 * @route   POST /api/papers/download
 * @desc    Generate and download PDF of question paper
 * @access  Private/Teacher
 */
const downloadPaper = asyncHandler(async (req, res) => {
  const { paper, examTitle, duration, instructions, mode } = req.body;

  // Handle both sectioned papers and custom questions
  if (!paper || (!paper.sections && !paper.questions)) {
    return res.status(400).json({
      success: false,
      message: "Invalid paper data"
    });
  }

  try {
    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="question-paper.pdf"`);
    
    // Pipe to response
    doc.pipe(res);

    // Title
    doc.fontSize(18).font('Helvetica-Bold')
       .text(examTitle || paper.title || 'Examination Question Paper', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Total marks and duration
    if (paper.totalMarks) {
      doc.fontSize(12).font('Helvetica')
         .text(`Total Marks: ${paper.totalMarks}`, { align: 'center' });
    }
    
    if (duration) {
      doc.fontSize(12).font('Helvetica')
         .text(`Duration: ${duration}`, { align: 'center' });
    }

    doc.moveDown();

    // General Instructions
    if (instructions) {
      doc.fontSize(11).font('Helvetica-Bold').text('General Instructions:', { underline: true });
      doc.fontSize(10).font('Helvetica').text(instructions);
      doc.moveDown();
    }

    // Add mode-specific general instructions
    if (mode === '60-marks') {
      doc.fontSize(10).font('Helvetica-Oblique')
         .text('Note: Solve any 3 sections from B, C, D, E. If a section is selected, all questions in that section must be attempted.', {
           indent: 10
         });
      doc.moveDown();
    }

    // Handle custom questions (flat array)
    if (paper.questions && !paper.sections) {
      doc.fontSize(15).font('Helvetica-Bold').text('Questions');
      doc.moveDown(0.8);
      
      // Fixed left margin for all questions
      const leftMargin = doc.page.margins.left;
      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const numberWidth = 30;
      
      paper.questions.forEach((question, index) => {
        const questionText = typeof question === 'object' ? question.questionText : question;
        const marks = typeof question === 'object' ? (question.marks || question.suggestedMarks) : null;
        
        // Format: "Question text... (X marks)" - marks at end
        const marksText = marks ? ` (${marks} marks)` : '';
        const fullQuestionText = `${questionText}${marksText}`;
        
        // Reset X to left margin before each question
        const startY = doc.y;
        
        // Draw question number at fixed position
        doc.fontSize(12).font('Helvetica')
           .text(`${index + 1}.`, leftMargin, startY, { 
             width: numberWidth, 
             continued: false 
           });
        
        // Draw question text aligned to the right of number
        doc.fontSize(12).font('Helvetica')
           .text(fullQuestionText, leftMargin + numberWidth, startY, {
             width: contentWidth - numberWidth,
             lineGap: 3
           });
        
        doc.moveDown(0.8);
      });
    }

    // Handle sectioned papers
    if (paper.sections) {
      let questionNumber = 1;
      
      // Fixed left margin for all questions
      const leftMargin = doc.page.margins.left;
      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const numberWidth = 30;
      
      for (const section of paper.sections) {
        doc.moveDown(1.2);
        
        // Check if section has variable marks (questions with individual marks)
        const hasVariableMarks = section.questions?.some(q => typeof q === 'object' && q.marks);
        
        // Section header - reset X position
        doc.x = leftMargin;
        if (hasVariableMarks) {
          doc.fontSize(15).font('Helvetica-Bold')
             .text(section.title);
        } else {
          doc.fontSize(15).font('Helvetica-Bold')
             .text(`${section.title}${section.marksPerQuestion ? ` (${section.marksPerQuestion} marks each)` : ''}`);
        }
        
        // Section instruction (e.g., "Solve any 2") - reset X position
        doc.x = leftMargin;
        if (section.instruction) {
          doc.fontSize(11).font('Helvetica-Oblique')
             .text(`Instruction: ${section.instruction}`);
        } else if (section.instructions) {
          doc.fontSize(11).font('Helvetica-Oblique')
             .text(section.instructions);
        }
        
        doc.moveDown(0.8);

        // Questions
        for (const question of section.questions || []) {
          const questionText = typeof question === 'object' ? question.questionText : question;
          const questionMarks = typeof question === 'object' ? question.marks : section.marksPerQuestion;
          
          // Format: "Question text... (X marks)" - marks always at end
          let marksText = '';
          if (hasVariableMarks && questionMarks) {
            marksText = ` (${questionMarks} marks)`;
          }
          const fullQuestionText = `${questionText}${marksText}`;
          
          // Get current Y position, use fixed X
          const startY = doc.y;
          
          // Draw question number at fixed left margin position
          doc.fontSize(12).font('Helvetica')
             .text(`${questionNumber}.`, leftMargin, startY, { 
               width: numberWidth, 
               continued: false 
             });
          
          // Draw question text aligned to the right of number
          doc.fontSize(12).font('Helvetica')
             .text(fullQuestionText, leftMargin + numberWidth, startY, {
               width: contentWidth - numberWidth,
               lineGap: 3
             });
          
          doc.moveDown(0.8);
          questionNumber++;
        }
      }
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Oblique')
       .text('--- End of Question Paper ---', { align: 'center' });

    // Finalize
    doc.end();

  } catch (error) {
    console.error("[Paper] PDF generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF"
    });
  }
});

module.exports = {
  generatePaper,
  downloadPaper
};

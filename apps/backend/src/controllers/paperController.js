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
 * Build prompt for question paper generation
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
const generateMockPaper = ({ totalMarks, marksPerQuestion, difficulty }) => {
  const numQuestions = Math.ceil(totalMarks / marksPerQuestion);
  
  return {
    title: "Mock Examination Question Paper",
    totalMarks,
    sections: [
      {
        title: "Section A",
        marksPerQuestion: 2,
        instructions: "Answer all questions briefly",
        questions: Array(Math.min(5, Math.floor(numQuestions / 2))).fill(null).map((_, i) => 
          `[Mock Q${i + 1}] Define and explain a key concept from the document.`
        )
      },
      {
        title: "Section B",
        marksPerQuestion: marksPerQuestion,
        instructions: "Answer all questions in detail",
        questions: Array(Math.ceil(numQuestions / 2)).fill(null).map((_, i) => 
          `[Mock Q${i + 1}] Discuss and analyze an important topic from the document.`
        )
      }
    ]
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
  if (shouldUseMock()) {
    console.log("[Paper] Using mock mode");
    return generateMockPaper({ totalMarks, marksPerQuestion, difficulty });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log("[Paper] No valid API key, using mock");
    return generateMockPaper({ totalMarks, marksPerQuestion, difficulty });
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
  return generateMockPaper({ totalMarks, marksPerQuestion, difficulty });
};

/**
 * @route   POST /api/papers/generate
 * @desc    Generate question paper from uploaded documents
 * @access  Private/Teacher
 */
const generatePaper = asyncHandler(async (req, res) => {
  console.log("[Paper] Generate request received");
  
  const { totalMarks, marksPerQuestion, difficulty = 'medium' } = req.body;
  const files = req.files;

  // Validation
  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please upload at least one file"
    });
  }

  if (!totalMarks || !marksPerQuestion) {
    return res.status(400).json({
      success: false,
      message: "Please provide total marks and marks per question"
    });
  }

  const marks = parseInt(totalMarks);
  const perQuestion = parseInt(marksPerQuestion);

  if (isNaN(marks) || marks < 10 || marks > 500) {
    return res.status(400).json({
      success: false,
      message: "Total marks must be between 10 and 500"
    });
  }

  if (isNaN(perQuestion) || perQuestion < 1 || perQuestion > 20) {
    return res.status(400).json({
      success: false,
      message: "Marks per question must be between 1 and 20"
    });
  }

  try {
    // Extract text from all files
    console.log(`[Paper] Processing ${files.length} files`);
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

    // Generate paper using AI
    const paper = await generatePaperWithAI({
      content: combinedText,
      totalMarks: marks,
      marksPerQuestion: perQuestion,
      difficulty
    });

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
  const { paper, examTitle, duration, instructions } = req.body;

  if (!paper || !paper.sections) {
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
    doc.fontSize(12).font('Helvetica')
       .text(`Total Marks: ${paper.totalMarks}`, { align: 'center' });
    
    if (duration) {
      doc.text(`Duration: ${duration}`, { align: 'center' });
    }

    doc.moveDown();

    // Instructions
    if (instructions) {
      doc.fontSize(11).font('Helvetica-Bold').text('Instructions:', { underline: true });
      doc.fontSize(10).font('Helvetica').text(instructions);
      doc.moveDown();
    }

    // Sections
    let questionNumber = 1;
    
    for (const section of paper.sections) {
      doc.moveDown(0.5);
      
      // Section header
      doc.fontSize(14).font('Helvetica-Bold')
         .text(`${section.title} (${section.marksPerQuestion} marks each)`);
      
      if (section.instructions) {
        doc.fontSize(10).font('Helvetica-Oblique')
           .text(section.instructions);
      }
      
      doc.moveDown(0.5);

      // Questions
      for (const question of section.questions) {
        doc.fontSize(11).font('Helvetica')
           .text(`${questionNumber}. ${question}`, {
             indent: 20,
             lineGap: 4
           });
        doc.moveDown(0.5);
        questionNumber++;
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

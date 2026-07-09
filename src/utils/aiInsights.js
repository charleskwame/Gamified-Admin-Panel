/**
 * AI Insights Analysis Module
 * Provides AI-powered analysis of student wrong answers using DeepSeek (primary) and OpenAI (fallback)
 * All content is AI-generated — no hardcoded resources or rule-based fallbacks
 */

/**
 * Analyze questions and generate AI insights
 * @param {Array} insights - Array of question insights with wrong counts
 * @param {string} course - Course identifier
 * @returns {Promise<Object>} AI analysis results
 */
export async function generateAIInsights(insights, course) {
  // Try DeepSeek first if API key is available
  const deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (deepseekApiKey && insights.length > 0) {
    try {
      const deepseekResult = await getDeepSeekAnalysis(insights, course, deepseekApiKey);
      if (deepseekResult) return deepseekResult;
    } catch (error) {
      console.warn("DeepSeek analysis failed, falling back to OpenAI:", error);
    }
  }

  // Try OpenAI as fallback if API key is available
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiApiKey && insights.length > 0) {
    try {
      const openaiResult = await getOpenAIAnalysis(insights, course, openaiApiKey);
      if (openaiResult) return openaiResult;
    } catch (error) {
      console.warn("OpenAI analysis failed, falling back to minimal fallback:", error);
    }
  }

  // Minimal fallback — no hardcoded data
  return generateMinimalFallback(insights);
}

/**
 * Minimal fallback that only returns summary stats with empty arrays
 * No hardcoded learning resources or rule-based content
 */
function generateMinimalFallback(insights) {
  const totalWrong = insights.reduce((sum, q) => sum + (q.number_of_wrong || 0), 0);
  const avgWrong = insights.length > 0 ? totalWrong / insights.length : 0;
  const highPriority = insights.filter((q) => (q.number_of_wrong || 0) >= 5);
  const mediumPriority = insights.filter((q) => (q.number_of_wrong || 0) >= 2 && (q.number_of_wrong || 0) < 5);

  return {
    summary: {
      totalQuestions: insights.length,
      totalWrongAnswers: totalWrong,
      averageWrongPerQuestion: avgWrong.toFixed(1),
      highPriorityCount: highPriority.length,
      mediumPriorityCount: mediumPriority.length,
    },
    priorityTopics: [],
    actionItems: [],
    learningMaterials: [],
  };
}

/**
 * DeepSeek-powered analysis — all content AI-generated
 */
async function getDeepSeekAnalysis(insights, course, apiKey) {
  const questionSummaries = insights.slice(0, 10).map((q) => ({
    question: q.questionText,
    wrongCount: q.number_of_wrong,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || "",
  }));

  const prompt = `You are an expert Computer Science educator analyzing multiple-choice questions that students frequently get wrong in a ${course.replace(/_/g, " ").toUpperCase()} course.

Questions data (sorted by wrong count, most frequent first):
${JSON.stringify(questionSummaries, null, 2)}

Analyze these questions comprehensively and provide the following in EXACT JSON format (no markdown, no code blocks):

1. priorityTopics: array of 5-7 specific topics/subtopics identified from the questions with:
   - topic: string (specific subtopic, e.g. "Two's Complement Representation")
   - count: number (total wrong answers for this topic)
   - questions: array of question text snippets

2. actionItems: array of 3-4 actionable items for the LECTURER with:
   - type: "immediate" | "focus_area" | "suggestion" | "misconception"
   - icon: emoji
   - title: specific issue
   - description: detailed explanation with pedagogical reasoning tied to the actual questions
   - recommendations: array of concrete, SPECIFIC actions

3. learningMaterials: array of recommended learning resources for STUDENTS with:
   - topic: which topic this resource helps with
   - resourceType: "Article" | "Book" | "Interactive"
   - title: name of the resource
   - description: what it covers and why it's useful
   - url: Wikipedia article URL (use https://en.wikipedia.org/wiki/... for the relevant topic). Wikipedia is preferred because it stays updated and links are highly stable.
   - priority: "high" | "medium" | "low"

   CRITICAL: Use Wikipedia as the primary source for article URLs (https://en.wikipedia.org/wiki/...). Wikipedia articles are well-maintained, frequently updated, and highly likely to remain available. Include 5-8 high-quality resources total.

Return ONLY valid JSON. Do NOT wrap in code blocks. Do NOT include markdown formatting.`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Add summary if not present
        if (!parsed.summary) {
          parsed.summary = {
            totalQuestions: insights.length,
            totalWrongAnswers: insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0),
            averageWrongPerQuestion: (insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0) / insights.length).toFixed(1),
            highPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 5).length,
            mediumPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 2 && (q.number_of_wrong || 0) < 5).length,
          };
        }
        // Ensure arrays exist
        if (!parsed.priorityTopics) parsed.priorityTopics = [];
        if (!parsed.actionItems) parsed.actionItems = [];
        if (!parsed.learningMaterials) parsed.learningMaterials = [];
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse DeepSeek response:", e);
    }
  }

  return null;
}

/**
 * OpenAI-powered analysis — all content AI-generated
 */
async function getOpenAIAnalysis(insights, course, apiKey) {
  const questionSummaries = insights.slice(0, 10).map((q) => ({
    question: q.questionText,
    wrongCount: q.number_of_wrong,
    correctAnswer: q.correctAnswer,
  }));

  const prompt = `You are an expert Computer Science educator analyzing student performance data in a ${course.replace(/_/g, " ").toUpperCase()} course.

Questions data (sorted by wrong count, most frequent first):
${JSON.stringify(questionSummaries)}

Provide a JSON response with:
1. priorityTopics: array of topics with counts (topic name, count, questions sample)
2. actionItems: array of actionable items for the lecturer with type ("immediate"|"focus_area"|"suggestion"|"misconception"), icon (emoji), title, description, and recommendations (array of specific actions)
3. learningMaterials: array of recommended resources for students with topic (string), resourceType ("Article"|"Book"|"Interactive"), title, description, url (MUST be a real, working URL — do NOT make up URLs), priority ("high"|"medium"|"low")

CRITICAL: Only include learningMaterials with real, currently active URLs. Do not make up or hallucinate URLs. Recommend well-known resources like specific YouTube channels, GeeksforGeeks, freeCodeCamp, Khan Academy, Cloudflare Learning, official docs, etc.

Focus on practical, specific advice. Return ONLY valid JSON without markdown formatting.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Add summary if not present
        if (!parsed.summary) {
          parsed.summary = {
            totalQuestions: insights.length,
            totalWrongAnswers: insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0),
            averageWrongPerQuestion: (insights.reduce((s, q) => s + (q.number_of_wrong || 0), 0) / insights.length).toFixed(1),
            highPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 5).length,
            mediumPriorityCount: insights.filter((q) => (q.number_of_wrong || 0) >= 2 && (q.number_of_wrong || 0) < 5).length,
          };
        }
        // Ensure arrays exist
        if (!parsed.priorityTopics) parsed.priorityTopics = [];
        if (!parsed.actionItems) parsed.actionItems = [];
        if (!parsed.learningMaterials) parsed.learningMaterials = [];
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse OpenAI response:", e);
    }
  }

  return null;
}

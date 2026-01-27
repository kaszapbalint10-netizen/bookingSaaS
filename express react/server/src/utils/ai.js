// server/src/utils/ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

function stripFences(s = "") {
  // távolítsuk el az esetleges ```json ... ``` kódfence-et
  const m = String(s).match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return m ? m[1].trim() : String(s).trim();
}

function safeParseJSON(txt) {
  try { return JSON.parse(txt); } catch { return null; }
}

/**
 * A modell kap egy nagy, beágyazott promptot (pricing + data + workflow),
 * és KIZÁRÓLAG JSON-t adhat vissza az előírt sémában.
 */
async function generateJSON(systemPrompt, userMessage, history = []) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Egyszerű history összeillesztés (user/assistant turnok szöveggel)
  const historyBlock = history?.length
    ? `\n\n# KORÁBBI PÁRBESZÉD\n${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}`
    : "";

  const finalPrompt =
`${systemPrompt}

# AKTUÁLIS ÜZENET
USER: ${userMessage}
${historyBlock}

# FONTOS
- KIZÁRÓLAG a megadott JSON sémát add vissza.
- Ne tegyél kódfence-et.
- Ne írj magyarázó szöveget a JSON elé vagy után.`;

  // 1. próbálkozás
  let resp = await model.generateContent(finalPrompt).then(r => r.response.text());
  let json = safeParseJSON(stripFences(resp));

  // Ha elsőre nem tiszta JSON, próbáljuk meg még egyszer rövid "repair" üzenettel
  if (!json) {
    const repairPrompt = `${finalPrompt}\n\nFIGYELEM: Az előző kimenet nem volt érvényes JSON. Most AZONNAL add vissza ugyanazt a választ ÉRVÉNYES JSON-ként.`;
    resp = await model.generateContent(repairPrompt).then(r => r.response.text());
    json = safeParseJSON(stripFences(resp));
  }

  // Ha még mindig nem JSON, adjunk vissza minimál vázat, hogy ne dőljön el a kliens
  if (!json) {
    json = {
      intent: "unknown",
      next_step: "ask_goal",
      reply_markdown: "Sajnálom, nem értettem. Miben segíthetek? 😊",
      entities: {
        service: null, carModel: null, date: null, dateEnd: null, days: null,
        pickupLocation: null, returnLocation: null, email: null, phone: null
      },
      clarifications: ["Kérlek, írd le, hogy bérelni szeretnél-e, vagy csak érdeklődsz."]
    };
  }

  return json;
}

module.exports = { generateJSON };

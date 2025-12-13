import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `Tu es ARTHUR, un expert en gestion locative et résolution de problèmes immobiliers avec 15+ ans d'expérience.

DIRECTIVES:
1. Diagnostic: Identifie le problème immédiatement
2. Solutions: Propose 2-3 solutions structurées
3. Urgence: Évalue l'urgence (0-100%)
4. Professionnalisme: Sois clair, précis, actionnable
5. Langage: Simple pour les locataires/propriétaires

QUAND TU ANALYSES DES IMAGES:
- Photos: Décris ce que tu vois, identifie les problèmes, évalue l'urgence
- Screenshots: Lis les données, propose des optimisations
- Captures: Donne des conseils basés sur ce que tu vois

FORMAT DE RÉPONSE:
Sois structuré mais naturel. Utilise des emojis pour clarté.
`;

const SCORING_SYSTEM_PROMPT = `Tu es un expert en évaluation de problèmes immobiliers. 
Retourne UNIQUEMENT un JSON valide (pas de texte avant ni après) avec cette structure:

{
  "urgency": 75,
  "urgencyLabel": "Urgent",
  "urgencyColor": "#ef4444",
  "estimatedCost": "800-2000€",
  "costLevel": "Modéré",
  "diyDifficulty": 4,
  "diyLabel": "Difficile",
  "resolutionTime": "2-3 jours",
  "mainRisks": ["Dégâts d'eau", "Moisissure"],
  "priority": "Haute"
}

REGLES:
- urgency: 0-100 (0=rien, 100=urgence extrême)
- urgencyColor: rouge (#ef4444) si >75, orange (#f59e0b) si >50, bleu (#3b82f6) si <50
- estimatedCost: gamme en euros (ex: "500-1000€")
- costLevel: Faible/Modéré/Élevé/Très élevé
- diyDifficulty: 1-5 (1=très facile, 5=impossible seul)
- diyLabel: basé sur la difficulté
- resolutionTime: estimé (jours/semaines)
- mainRisks: array de risques principaux
- priority: Basse/Moyenne/Haute/Urgente

Réponds UNIQUEMENT avec le JSON!`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, fileData, fileType, fileName } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    let claudeMessages = [];

    // If there's an image to analyze
    if (fileData && fileType && fileType.startsWith('image/')) {
      const userMessage = messages[messages.length - 1];
      const userText = userMessage?.content || 'Analyse cette image et dis-moi ce que tu vois';

      claudeMessages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: fileType,
                data: fileData
              }
            },
            {
              type: 'text',
              text: userText
            }
          ]
        }
      ];
    } else {
      // Handle regular text messages
      claudeMessages = messages.map((msg) => {
        if (typeof msg.content === 'string') {
          return {
            role: msg.role,
            content: msg.content,
          };
        }
        return msg;
      });
    }

    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return res.status(500).json({ error: "Unexpected response type" });
    }

    // Now generate scoring in parallel
    let scoringData = null;
    try {
      const problemDescription = messages[messages.length - 1].content;
      
      const scoringResponse = await client.messages.create({
        model: "claude-opus-4-1",
        max_tokens: 500,
        system: SCORING_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Évalue ce problème immobilier:\n${problemDescription}`
          }
        ],
      });

      const scoringContent = scoringResponse.content[0];
      if (scoringContent.type === "text") {
        try {
          scoringData = JSON.parse(scoringContent.text);
        } catch (e) {
          console.error("Scoring parse error:", e);
          scoringData = null;
        }
      }
    } catch (scoringError) {
      console.error("Scoring generation error:", scoringError);
      // Continue sans scoring si erreur
    }

    res.status(200).json({ 
      message: content.text,
      scoring: scoringData 
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      details: error.toString()
    });
  }
}
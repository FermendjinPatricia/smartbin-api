const express = require("express");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const AnthropicModule = require("@anthropic-ai/sdk");
const Anthropic = AnthropicModule.default ?? AnthropicModule;
const User = require("../models/User");
const ScanHistory = require("../models/ScanHistory");

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUCKET = process.env.S3_BUCKET_NAME;

// GET /api/scan/upload-url
// Returns a presigned S3 URL so the frontend can upload the image directly
router.get("/upload-url", async (req, res) => {
  try {
    const { filename, contentType } = req.query;

    if (!filename || !contentType) {
      return res.status(400).json({ message: "filename and contentType are required" });
    }

    const s3Key = `scans/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({ uploadUrl, s3Key });
  } catch (error) {
    console.error("Upload URL error:", error);
    res.status(500).json({ message: "Could not generate upload URL" });
  }
});

// POST /api/scan/analyze
// Fetches the image from S3, sends it to Claude, saves result, awards points
router.post("/analyze", async (req, res) => {
  try {
    const { s3Key, firebaseUid } = req.body;

    if (!s3Key || !firebaseUid) {
      return res.status(400).json({ message: "s3Key and firebaseUid are required" });
    }

    // Fetch image from S3
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
    const s3Response = await s3.send(getCommand);

    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);
    const base64Image = imageBuffer.toString("base64");
    const mediaType = s3Response.ContentType || "image/jpeg";

    // Call Claude Vision API
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Ești un asistent de reciclare pentru aplicația SmartBin. Analizează imaginea și identifică tipul de deșeu.

Răspunde STRICT cu un obiect JSON valid, fără text suplimentar:
{
  "label": "Descrierea scurtă a obiectului detectat (în română, ex: Sticlă de plastic)",
  "wasteType": "plastic",
  "compartment": "Plastic",
  "confidence": 92,
  "advice": "Sfat scurt de maxim 8 cuvinte despre aruncare corectă (în română)"
}

Reguli de clasificare:
- "plastic" / "Plastic": sticle PET, recipiente plastic, pungi, ambalaje
- "paper" / "Hârtie": ziare, reviste, carton, cutii, hârtie
- "metal" / "Metal": doze aluminiu, conserve, obiecte metalice
- "general" / "Menajer": resturi alimentare, deșeuri menajere, orice altceva

Dacă nu poți identifica un deșeu clar, clasifică ca "general" / "Menajer".`,
            },
          ],
        },
      ],
    });

    let aiResult;
    try {
      const raw = message.content[0].text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      aiResult = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      aiResult = {
        label: "Deșeu detectat",
        wasteType: "general",
        compartment: "Menajer",
        confidence: 70,
        advice: "Aruncă la compartimentul menajer.",
      };
    }

    const POINTS_MAP = { plastic: 10, paper: 8, metal: 12, general: 5 };
    const pointsAwarded = POINTS_MAP[aiResult.wasteType] ?? 5;

    // Save scan to history
    await ScanHistory.create({
      firebaseUid,
      s3Key,
      label: aiResult.label,
      wasteType: aiResult.wasteType,
      compartment: aiResult.compartment,
      confidence: aiResult.confidence,
      advice: aiResult.advice,
      pointsAwarded,
    });

    // Award points to user
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { $inc: { points: pointsAwarded } },
      { new: true }
    );

    res.json({
      label: aiResult.label,
      wasteType: aiResult.wasteType,
      compartment: aiResult.compartment,
      confidence: aiResult.confidence,
      advice: aiResult.advice,
      pointsAwarded,
      totalPoints: updatedUser?.points ?? 0,
    });
  } catch (error) {
    console.error("Scan analyze error:", error);
    res.status(500).json({ message: "Eroare la analiza imaginii" });
  }
});

// GET /api/scan/history/:firebaseUid
// Returns scan history for a user (most recent 20)
router.get("/history/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const history = await ScanHistory.find({ firebaseUid })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    console.error("Scan history error:", error);
    res.status(500).json({ message: "Eroare la încărcarea istoricului" });
  }
});

module.exports = router;

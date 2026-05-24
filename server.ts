/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Ensure environment variables are loaded
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload sizes for base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy Gemni client initialisation
let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Silakan atur di Settings > Secrets.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

/// 1. Analyze Photo or Manual Ingredient List
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, textIngredients, regionFilter, isEmergencyMode, cookingVibe, lang } = req.body;
    const isEn = lang === "en";

    // Validate inputs
    if (!image && !textIngredients) {
      if (isEn) {
        res.status(400).json({ error: "Please provide a photo or type an ingredient list." });
      } else {
        res.status(400).json({ error: "Mohon sediakan foto atau ketik daftar bahan." });
      }
      return;
    }

    const ai = getGeminiClient();

    let contentsParts: any[] = [];

    // System prompt setting behavior rules
    let systemPrompt = "";
    if (isEn) {
      systemPrompt = `
You are WasteNot, an innovative AI Indonesian cooking assistant focusing on reducing food waste.
You are warm, friendly, encouraging, and use a casual and friendly English tone.

RULES OF BEHAVIOR:
1. Analyze the kitchen ingredients provided (via photo or text list).
2. If a photo is sent, detect all clearly visible ingredients. If the photo is too dark, blurry, or does not show food ingredients, fill the 'unclearPhotoError' field with a polite warning in English asking the user to retake the photo with better lighting.
3. List the detected ingredients enthusiastically in the 'pesan_sapaan' field.
4. Construct exactly 2 delicious Indonesian recipes leveraging these detected ingredients (bold those ingredients in description/steps) plus basic kitchen spices (cooking oil, water, salt, sugar, shallot, garlic, pepper, red chili). Avoid including recipes requiring major secondary ingredients not in the list.
5. Provide simple recipes (done in < 30 mins).
6. Tag each recipe: [Java], [Padang], [Betawi], or [General].
7. If the user requests a regional filter (e.g., "${regionFilter || 'All'}"), prioritize that region's recipes if possible.
8. Provide step-by-step instructions (max 5 simple, clear steps).
9. Offer a realistic estimate in grams for food rescued in 'estimasi_waste' (e.g., 250 representing 250g spinach/chicken rescued).
10. Add a short motivational food waste reduction sentence at the end of 'pesan_sapaan'.
11. For each detected ingredient, provide nutrient data (calories/100g, protein, fat, carbs in grams/100g) and shelf life before spoiling in 'ingredients_info' (shelf_life like '3 - 5 days', '1 week').

ADDITIONAL USER SPECS:
- Emergency Fridge Mode: ${isEmergencyMode ? 'YES' : 'NO'}. If YES, prioritize perishable items (e.g. leafy veggies). In 'pesan_sapaan', add a high-urgency message prefix, for example: '⚠️ [Ingredient]: 1-2 days left!' (e.g., '⚠️ Spinach: must be cooked in 1-2 days! Use it, don't waste it!').
- Vibe: ${cookingVibe || 'General'}.
  * If 'quick', make it extremely practical (< 10 mins).
  * If 'pro', make it an authentic regional recipe (30 mins).
  * If 'healthy', focus on low-calorie, high-fiber.
  * If 'family', make it family-sized portions.
      `;
    } else {
      systemPrompt = `
Kamu adalah WasteNot, asisten memasak AI Indonesia inovatif yang fokus mengurangi food waste (sampah makanan).
Kamu ramah, hangat, menyemangati, dan menggunakan Bahasa Indonesia santai yang bersahabat.

ATURAN PERILAKU:
1. Analisis bahan dapur yang disediakan (bisa lewat foto atau daftar teks).
2. Jika yang dikirim adalah foto, deteksi semua bahan makanan yang terlihat jelas. Jika fotonya gelap, kabur, atau tidak menampilkan bahan makanan sama sekali, isi bidang 'unclearPhotoError' dengan pesan peringatan santun agar pengguna memfoto ulang dengan cahaya lebih baik.
3. Sebutkan bahan yang terdeteksi dengan antusias di bidang 'pesan_sapaan'.
4. Buat tepat 2 resep masakan Indonesia lezat yang murni memanfaatkan bahan yang dideteksi (bahan-bahan itu dicetak tebal/bold) ditambah dengan bumbu dapur dasar (minyak goreng, air, garam, gula, bawang merah, bawang putih, lada, cabai merah). Harap hindari memasukkan resep yang membutuhkan bahan utama sekunder yang tidak tercantum dalam daftar.
5. Jalankan resep simpel (selesai dalam waktu kurang dari 30 menit).
6. Untuk tiap resep, berikan tag daerah: [Jawa], [Padang], [Betawi], atau [Umum].
7. Jika pengguna meminta filter wilayah tertentu (misal: "${regionFilter || 'Semua'}"), prioritaskan resep dari daerah tersebut jika cocok, atau sesuaikan nuansa masakan ke daerah pilihan itu.
8. Berikan langkah memasak secara urut, maksimal 5 langkah pengerjaan yang sederhana dan jelas.
9. Berikan perkiraan objektif berat dalam satuan gram bahan makanan sisa yang telah diselamatkan dari potensi terbuang di bidang 'estimasi_waste'. Jadikan nilai integer positif bulat (misal: 250 yang melambangkan 250 gram bayam/ayam didaur ulang).
10. Masukkan kalimat motivasi pembersih sampah makanan di bagian akhir pesan sapaan.
11. SEKALIGUS, untuk setiap bahan sisa / bahan makanan yang terdeteksi, wajib sediakan data nutrisinya (kalori per 100g, protein, lemak, karbohidrat dalam gram per 100g) dan taksir waktu simpan di kulkas sebelum rusak/terbuang di bidang 'ingredients_info'.

INFORMASI TAMBAHAN PENGGUNA:
- Mode Darurat Kulkas Aktif: ${isEmergencyMode ? 'YA' : 'TIDAK'}. Jika YA, prioritaskan bahan yang berumur pendek (misal: sayuran daun / bayam), dan di dalam 'pesan_sapaan' tambahkan peringatan urgensi format khusus, contoh: '⚠️ [Bahan]: 1-2 hari lagi!' (misal '⚠️ Bayam: harus dimasak dalam 1-2 hari lagi! Jangan buang, masak sekarang!').
- Vibe Masak Pilihan: ${cookingVibe || 'Umum'}. 
  * Jika 'quick', buat resep sangat praktis/ringkas yang selesai < 10 menit.
  * Jika 'pro', berikan resep masakan Nusantara sungguhan bumbu harum (30 menit).
  * Jika 'healthy', fokus ke menu sehat rendah kalori, serat tinggi, seimbang.
  * Jika 'family', sediakan menu porsi besar/bersahabat untuk dinikmati bersama keluarga tercinta.
      `;
    }

    let userPromptText = isEn
      ? "Please analyze the following ingredients and create 2 delicious Indonesian recipes that reduce food waste."
      : "Tolong analisis bahan-bahan berikut dan buatkan 2 resep khas Indonesia yang lezat dan mengurangi sampah makanan.";
    
    if (regionFilter && regionFilter !== "Semua" && regionFilter !== "All") {
      userPromptText += isEn
        ? ` Prioritize regional cooking style: ${regionFilter}.`
        : ` Utamakan resep dengan gaya masakan regional: ${regionFilter}.`;
    }

    if (isEmergencyMode) {
      userPromptText += isEn
        ? `\n\n[URGENT: EMERGENCY FRIDGE MODE ACTIVE] Identify ingredients that will expire fastest and create a recipe prioritizing them! Warn the user with the direct explanation: "Don't discard, cook now!".`
        : `\n\n[URGENT: MODE DARURAT KULKAS AKTIF] Cari bahan yang paling cepat kadaluarsa (misalnya bayam/sayur) dan wajib kreasikan resep mengutamakan bahan darurat tersebut! Beritahu pengguna agar memasaknya hari ini dengan kalimat penjelas tegas "Jangan buang, masak sekarang!".`;
    }

    if (cookingVibe) {
      userPromptText += isEn
        ? `\n\n[ACTIVE COOKING VIBE] Cooking vibe: ${cookingVibe}. Adapt step instruction, complexity, portion size, and auxiliary items to match this choice!`
        : `\n\n[VIBE MASAK AKTIF] Vibe masakan: ${cookingVibe}. Sesuaikan langkah, kerumitan, porsi, atau bahan pendukung agar pas dengan nuansa ini!`;
    }

    if (textIngredients) {
      userPromptText += isEn
        ? `\n\nMy leftover ingredients:\n${textIngredients}`
        : `\n\nBahan sisa yang saya miliki:\n${textIngredients}`;
    }

    contentsParts.push({ text: userPromptText });

    if (image) {
      // Decode base64 image data
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      } else {
        contentsParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: image
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contentsParts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            unclearPhotoError: {
              type: Type.STRING,
              description: isEn
                ? "Error message in English if the photo is blurry, too dark, or not cooking ingredients. Leave empty if clear."
                : "Pesan kesalahan dalam Bahasa Indonesia jika foto buram, terlalu gelap, atau bukan merupakan bahan makanan/dapur. Kosongkan jika foto jelas."
            },
            detectedIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: isEn
                ? "List of ingredients detected from the photo or typed text."
                : "Daftar bahan makanan yang berhasil dideteksi dalam foto atau ketikan teks."
            },
            recipes: {
              type: Type.ARRAY,
              description: isEn
                ? "List of 2 delicious Indonesian recipes built using the detected ingredients."
                : "Saran 2 resep inovatif Indonesia yang lezat berdasarkan bahan makanan tadi.",
              items: {
                type: Type.OBJECT,
                properties: {
                  nama: { type: Type.STRING, description: isEn ? "English recipe name followed by region tag in trailing bracket, e.g. 'Stir Fried Kangkung [Java]'" : "Nama masakan diikuti tag regional khas Indonesia seperti [Jawa], [Padang], [Betawi], atau [Umum] di dalam string, misal: 'Tumis Kangkung Tempe Semangit [Jawa]'" },
                  daerah: { type: Type.STRING, description: isEn ? "One of: Java, Padang, Betawi, or General" : "Salah satu dari: Jawa, Padang, Betawi, atau Umum" },
                  bahan_dipakai: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: isEn ? "Ingredients from the leftover list used in this recipe." : "Bahan-bahan dari daftar sisa yang terpakai di resep ini (misal: 'ayam sisa', 'bayam')"
                  },
                  langkah: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: isEn ? "Max 5 recipe instructions in English, sequential, simplified." : "Maksimal 5 langkah memasak urut bertahap yang sangat praktis dan simpel."
                  },
                  estimasi_waste: { type: Type.INTEGER, description: "Weight estimate in grams of saved food waste (positive integer e.g. 300)" }
                },
                required: ["nama", "daerah", "bahan_dipakai", "langkah", "estimasi_waste"]
              }
            },
            pesan_sapaan: {
              type: Type.STRING,
              description: isEn
                ? "Warm enthusiastic greeting in English listing detected items with cheer and closing on a motivating eco message."
                : "Sambutan hangat, menyebut bahan dapur yang didapat dengan ceria, serta diakhiri dorongan semangat menyelamatkan makanan. (Contoh: 'Wah, ada telur, bayam, dan bawang putih nih! Yuk kita ubah jadi sesuatu yang enak 🍳')"
            },
            ingredients_info: {
              type: Type.ARRAY,
              description: isEn ? "List of nutrients and fridge shelf lives of the detected ingredients." : "Daftar nutrisi dan daya simpan kulkas bahan makanan yang terdeteksi.",
              items: {
                type: Type.OBJECT,
                properties: {
                  nama: { type: Type.STRING, description: isEn ? "Name of ingredient, e.g. 'Spinach', 'Egg'" : "Nama bahan dapur singkat, misal: 'Bayam', 'Telur'" },
                  kalori: { type: Type.INTEGER, description: "Estimated energy (per 100g) in kcal" },
                  protein: { type: Type.INTEGER, description: "Estimated protein (per 100g) in grams" },
                  lemak: { type: Type.INTEGER, description: "Estimated fat (per 100g) in grams" },
                  karbohidrat: { type: Type.INTEGER, description: "Estimated carbs (per 100g) in grams" },
                  shelf_life: { type: Type.STRING, description: isEn ? "Shelf life inside the fridge, e.g. '3 - 5 days', '1 week'" : "Berapa lama bisa bertahan disimpan di kulkas (chiller) sebelum basi, misal: '3 - 5 hari', '1 minggu', '2 minggu'" },
                  icon: { type: Type.STRING, description: "One emoji character representing the ingredient, e.g. '🥬', '🥚'" }
                },
                required: ["nama", "kalori", "protein", "lemak", "karbohidrat", "shelf_life", "icon"]
              }
            }
          },
          required: ["detectedIngredients", "recipes", "pesan_sapaan", "ingredients_info"]
        }
      }
    });

    const parsedResult = JSON.parse(response.text || "{}");
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Gagal menganalisis bahan:", error);
    res.status(500).json({ error: error.message || "Gagal melakukan analisis menggunakan Gemini AI." });
  }
});

// 2. Chat/Ask Cooking queries and regional instructions
app.post("/api/ask", async (req, res) => {
  try {
    const { question, history, currentIngredients, lang } = req.body;
    const isEn = lang === "en";

    if (!question) {
      if (isEn) {
        res.status(400).json({ error: "Please provide a cooking question." });
      } else {
        res.status(400).json({ error: "Sediakan pertanyaan memasak atau klausa penjelas." });
      }
      return;
    }

    const ai = getGeminiClient();

    let systemPrompt = "";
    if (isEn) {
      systemPrompt = `
You are WasteNot, an innovative AI Indonesian cooking assistant combatting food waste.
You are friendly, motivating, and highly knowledgeable about Indonesian culinary arts and storage methods.

COMMUNICATION RULES:
1. Always respond in friendly, casual, conversational English.
2. If the user asks about storage or preservation of leftovers (spinach, onion, old rice, chicken), offer actionable households tricks.
3. If the user mentions regional filters, confirm that you prioritize recipes matching that region (Java, Padang, Betawi).
4. If asked about subjects unrelated to culinary arts or food waste, politely steer the conversation back to food preservation or fun recipes.
5. End every helpful advice with a short positive quote on eco-dapur care or kitchen budget savings.
      `;
    } else {
      systemPrompt = `
Kamu adalah WasteNot, asisten memasak AI Indonesia inovatif penumpas sampah makanan.
Kamu ramah, memotivasi, dan berpengetahuan luas tentang dunia memasak Nusantara serta tips penyimpanan bahan makanan.

ATURAN KOMUNIKASI:
1. Selalu merespons dalam Bahasa Indonesia yang kasual, komunikatif, dan bersahabat.
2. Jika pengguna menanyakan tips penyimpanan atau cara membuat bahan makanan sisa lebih awet (seperti wortel, bawang, nasi, daging ayam), berikan solusi praktis khas rumah tangga yang mudah dipraktikkan.
3. Jika pengguna menyebut "filter [daerah]" (misal: "filter Padang"), konfirmasikan bahwa kamu sekarang menyaring rekomendasi resep masakan murni khas daerah tersebut (Padang/Jawa/Betawi).
4. Jika pengguna menanyakan hal lain di luar kuliner atau mitigasi sampah makanan, alihkan secara halus kembali ke topik memasak dan mitigasi food waste yang asyik.
5. Akhiri semua saran dengan kata-kata mutiara pendek tentang kepedulian lingkungan dapur atau hemat berbelanja.
      `;
    }

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    let userMessage = question;
    if (currentIngredients && currentIngredients.length > 0) {
      userMessage = isEn
        ? `(Context of currently scanned ingredients: ${currentIngredients.join(", ")})\n\nMy Question: ${question}`
        : `(Konteks bahan tersimpan saat ini: ${currentIngredients.join(", ")})\n\nPertanyaan saya: ${question}`;
    }

    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gagal menjawab pertanyaan kuliner:", error);
    res.status(500).json({ error: error.message || "Terjadi kendala saat menghubungi asisten AI." });
  }
});

// Serve frontend assets in production and Vite middleware in development
const distPath = path.join(process.cwd(), "dist");

if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server WasteNot berjalan aktif pada port http://0.0.0.0:${PORT}`);
});

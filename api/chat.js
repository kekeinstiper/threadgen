// api/chat.js
export default async function handler(req, res) {
  // Hanya izinkan POST request
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Menangkap data yang dikirim dari frontend
  const { topic, affiliateLink, style } = req.body;

  // Mengambil API Key dari Environment Variable Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "API Key belum dikonfigurasi di server." });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  // Memindahkan System Prompt ke backend agar lebih aman
  const systemPrompt = `Kamu adalah seorang ahli viral marketer, copywriter, dan storyteller yang sangat handal membuat thread viral di aplikasi X/Twitter dan Threads. 
Tugasmu: Membuat draft thread berdasarkan input user.
Kriteria Wajib:
1. JUMLAH: Buat antara 4 sampai 7 bagian thread.
2. HOOK (Thread 1): Harus SANGAT memancing rasa penasaran, bikin pembaca berhenti scroll. Gunakan teknik psikologi copywriting (kontroversi, relate, atau cliffhanger). JANGAN terlihat kaku seperti robot.
3. STORYTELLING (Thread 2 dst): Ceritakan masalah/pengalaman dengan alur yang jelas, mengalir seperti cerita (curhat) ke teman sendiri.
4. GAYA BAHASA: Gunakan bahasa gaul Indonesia yang natural sesuai permintaan user (misal: pake gue-lo, singkatan wajar spt yg, dgn, bgt). Jangan pakai hashtag sama sekali. Jangan pakai emoji berlebihan.
5. SOFT-SELLING: Pada thread terakhir, masukkan solusi dari masalah cerita tersebut dengan merekomendasikan sebuah produk dan sertakan link affiliate yang diberikan. Harus terdengar seperti rekomendasi tulus dari teman, bukan iklan jualan murahan.

Format Output: JSON Object murni. Tidak boleh ada markdown block (\`\`\`json).
Struktur JSON:
{
  "threads": [
    "Isi thread bagian 1 (Hook)...",
    "Isi thread bagian 2...",
    "Isi thread bagian akhir (berisi link)..."
  ]
}`;

  const userPrompt = `
Buatkan thread dengan detail berikut:
Topik/Cerita: ${topic}
Gaya Bahasa: ${style}
Link Affiliate: ${affiliateLink ? affiliateLink : "(Tidak ada link, tutup saja ceritanya dengan menarik)"}
`;

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          threads: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: ["threads"],
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error di Backend:", error);
    return res.status(500).json({ error: "Gagal menghubungi AI dari server." });
  }
}

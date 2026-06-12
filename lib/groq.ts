import type { CTPillar } from "@prisma/client";

type EssayReviewInput = {
  prompt: string;
  studentAnswer: string;
  rubricAnswer: string;
  pillar: CTPillar | string;
};

export type EssayReview = {
  score: number;
  isCorrect: boolean;
  feedback: string;
  weakness: string;
};

export async function reviewEssayWithGroq(input: EssayReviewInput): Promise<EssayReview> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "AI review belum aktif karena GROQ_API_KEY belum diatur.",
      weakness: "Guru perlu menilai jawaban ini secara manual."
    };
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah evaluator jawaban essay siswa SMP. Nilai berdasarkan pertanyaan dan rubrik guru, toleransi variasi bahasa dan typo ringan. Feedback harus spesifik: jelaskan bagian jawaban siswa yang sudah sesuai, bagian yang belum menjawab, dan contoh perbaikan singkat sesuai konteks pertanyaan. Jangan hanya menulis 'terlalu umum' tanpa menyebut apa yang terlalu umum. Balas hanya JSON valid dengan field score 0-10, isCorrect boolean, feedback, weakness."
        },
        {
          role: "user",
          content: JSON.stringify({
            pilar_ct: input.pillar,
            pertanyaan: input.prompt,
            rubrik_guru: input.rubricAnswer,
            jawaban_siswa: input.studentAnswer,
            aturan:
              "Jawaban benar jika makna utama sesuai rubrik meskipun kata-katanya berbeda. Jangan menuntut jawaban sama persis. Jika jawaban terlalu umum, jelaskan informasi apa yang kurang spesifik berdasarkan rubrik. Jika jawaban tidak menjawab pertanyaan, sebutkan bagian pertanyaan yang belum dijawab."
          })
        }
      ]
    })
  });

  if (!response.ok) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "AI review gagal diproses. Guru perlu menilai jawaban ini secara manual.",
      weakness: `Groq error ${response.status}`
    };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  try {
    const parsed = JSON.parse(content);
    const score = Math.max(0, Math.min(10, Number(parsed.score) || 0));
    return {
      score,
      isCorrect: Boolean(parsed.isCorrect ?? score >= 7),
      feedback: String(parsed.feedback || "Jawaban sudah direview AI."),
      weakness: String(parsed.weakness || "Tidak ada catatan khusus.")
    };
  } catch {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Format respons AI tidak valid. Guru perlu menilai jawaban ini secara manual.",
      weakness: "Respons Groq bukan JSON valid."
    };
  }
}

export type GeneratedQuestion = {
  pillar: "DECOMPOSITION" | "PATTERN_RECOGNITION" | "ABSTRACTION" | "ALGORITHMIC_THINKING";
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  prompt: string;
  options?: string[];
  answer: string;
};

export type GeneratedChallenge = GeneratedQuestion & {
  feedbackCorrect: string;
  feedbackWrong: string;
};

export type GeneratedMissionPackage = {
  title: string;
  description: string;
  storyIntro: string;
  preTest: GeneratedQuestion[];
  postTest: GeneratedQuestion[];
  challenges: GeneratedChallenge[];
};

export async function generateMissionPackageWithGroq(prompt: string): Promise<GeneratedMissionPackage> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY belum diatur di .env");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah pembuat quiz pembelajaran untuk siswa SMP. Kamu menerima judul materi dan isi materi dari guru. Buat soal hanya dari informasi yang benar-benar ada atau dapat disimpulkan wajar dari isi materi tersebut. Jangan memasukkan konteks lain yang tidak ada di materi. Pemetaan CT hanya dipakai sebagai metadata internal, jangan menulis istilah CT di pertanyaan. Balas hanya JSON valid."
        },
        {
          role: "user",
          content: JSON.stringify({
            instruksi_guru: prompt,
            format_wajib: {
              title: "judul kuis singkat yang spesifik sesuai instruksi guru",
              description: "tujuan pembelajaran singkat yang sesuai materi/topik",
              storyIntro: "ringkasan singkat isi materi guru, tidak menambah konteks baru",
              preTest: "array kosong []",
              postTest: "array kosong []",
              challenges: "array tepat 15 soal quiz utama tentang materi/topik guru"
            },
            aturan_item:
              "Setiap soal punya pillar DECOMPOSITION/PATTERN_RECOGNITION/ABSTRACTION/ALGORITHMIC_THINKING sebagai metadata internal, type MULTIPLE_CHOICE/TRUE_FALSE/SHORT_ANSWER, prompt, options jika pilihan ganda, answer. TRUE_FALSE answer harus Benar atau Salah. MULTIPLE_CHOICE options 4 item dan answer harus sama persis dengan salah satu option. SHORT_ANSWER answer berupa rubrik singkat. Soal wajib punya feedbackCorrect dan feedbackWrong.",
            aturan_bahasa:
              "Gunakan bahasa Indonesia yang natural untuk siswa SMP. Setiap soal harus spesifik, unik, dan jawabannya harus ada jelas di materi. DILARANG membuat soal umum seperti 'Apa yang dapat kita lihat dari ...', 'Apakah ... biasanya ...', 'Setelah solusi diterapkan ...', atau mengulang prompt yang sama. DILARANG menulis kata Decomposition, Pattern Recognition, Abstraction, Algorithmic Thinking, CT, pilar, atau computational thinking di prompt soal. Soal harus terlihat seperti quiz materi biasa.",
            aturan_alur:
              "Tidak ada tes awal dan tes akhir. Semua soal berada di challenges sebagai quiz utama. Buat tepat 15 soal tentang topik guru. Metadata pillar tetap diisi merata: minimal 3 DECOMPOSITION, 4 PATTERN_RECOGNITION, 4 ABSTRACTION, dan 4 ALGORITHMIC_THINKING.",
            aturan_tipe:
              "Variasikan tipe soal: MULTIPLE_CHOICE, TRUE_FALSE, dan SHORT_ANSWER. Buat campuran soal definisi konsep, fungsi, contoh, perbandingan, pengelompokan, dan pemahaman sederhana. Opsi benar harus jelas, opsi salah masuk akal tetapi tetap salah. Jangan membuat opsi yang mirip semua, misalnya semua diawali 'kumpulan instruksi'. Jangan membuat soal yang meminta siswa mencari siapa yang salah.",
            aturan_cerita_kasus:
              "Semua soal harus bisa dijawab dari isi materi guru, bukan asumsi bebas. Jika isi materi tidak memiliki angka, waktu, atau tabel, jangan mengarang angka/waktu/tabel baru. Gunakan informasi yang tersedia di materi.",
            aturan_kesesuaian_materi:
              "Sebelum membuat setiap soal, cek apakah jawaban benar tertulis eksplisit atau sangat jelas tersirat dalam materi. Jika tidak ada di materi, jangan jadikan soal. Untuk materi konsep seperti HTML dan CSS, prioritaskan fungsi, perbedaan, contoh tag, contoh properti, dan analogi yang tertulis di materi.",
            contoh_soal_baik: [
              "Berdasarkan materi, faktor apa yang paling memengaruhi kemacetan pada pukul 07.00?",
              "Jika jumlah kendaraan di jalur utama terus meningkat, tindakan awal yang paling tepat adalah...",
              "Urutan langkah mana yang paling logis untuk menyusun jadwal kegiatan agar tidak bentrok?"
            ],
            jumlah:
              "Buat tepat 15 soal quiz utama di challenges. preTest dan postTest harus array kosong. Tidak boleh ada prompt duplikat. Tidak boleh ada 3 soal berturut-turut dengan kalimat/tampilan yang sama. Buat level mudah-sedang untuk siswa SMP."
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq gagal membuat konten: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  const packageData = (parsed.mission || parsed.data || parsed.result || parsed) as GeneratedMissionPackage;
  return normalizeGeneratedMission(packageData, prompt);
}

function fallbackTitle(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("macet") || lower.includes("jalan")) return "Kuis Macet Jalanan";
  if (lower.includes("algoritma") && lower.includes("jadwal")) return "Kuis Algoritma Penjadwalan";
  if (lower.includes("perpustakaan") || lower.includes("buku")) return "Kuis Buku Perpustakaan";
  if (lower.includes("piket")) return "Kuis Jadwal Piket";
  if (lower.includes("sampah") || lower.includes("bersih")) return "Kuis Kebersihan Sekolah";
  if (lower.includes("kantin")) return "Kuis Masalah Kantin";
  return `Kuis ${cleanTopic(prompt)}`;
}

function fallbackDescription(prompt: string) {
  return `Siswa mengerjakan quiz untuk mengukur pemahaman materi tentang ${cleanTopic(prompt).toLowerCase()}.`;
}

function fallbackStory(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("macet") || lower.includes("jalan")) {
    return "Materi ini membahas masalah macet jalanan di jalur utama kota pada pagi hari. Data menunjukkan jumlah kendaraan pada pukul 07.00 adalah 50 kendaraan pada Senin, 30 kendaraan pada Selasa, dan 20 kendaraan pada Rabu. Kemacetan paling parah terjadi saat jumlah kendaraan paling tinggi. Solusi dapat melibatkan pengaturan waktu berangkat, pembagian jalur, rambu lalu lintas, dan evaluasi data kendaraan.";
  }
  if (lower.includes("algoritma") && lower.includes("jadwal")) {
    return "Materi ini membahas algoritma penjadwalan, yaitu cara menyusun urutan kegiatan agar tidak bentrok dan lebih efisien. Contohnya, tiga kegiatan A, B, dan C memiliki durasi berbeda serta batas waktu tertentu. Penjadwalan yang baik perlu memperhatikan prioritas, durasi, urutan, dan konflik waktu. Hasil jadwal kemudian diperiksa kembali agar semua kegiatan dapat berjalan sesuai rencana.";
  }
  if (lower.includes("perpustakaan") || lower.includes("buku")) {
    return "Materi ini membahas pengelolaan buku perpustakaan sekolah. Beberapa buku sulit ditemukan karena ada buku yang salah rak, tidak tercatat saat dipinjam, atau belum dikembalikan tepat waktu. Catatan peminjaman dan label rak membantu petugas mengetahui posisi buku. Solusi yang baik perlu memperhatikan pencatatan, pengembalian, dan penataan rak.";
  }
  if (lower.includes("piket")) {
    return "Materi ini membahas jadwal piket kelas agar kebersihan berjalan tertib. Kelas sering kotor setelah jam istirahat karena beberapa siswa lupa jadwal, jadwal kurang terlihat, dan belum ada pengecekan rutin. Jadwal yang jelas, pengingat, dan pembagian tugas dapat membantu piket berjalan lebih baik.";
  }
  if (lower.includes("sampah") || lower.includes("bersih")) {
    return "Lingkungan sekolah sering kotor setelah jam istirahat. Catatan petugas menunjukkan: Senin dekat kantin ada 18 sampah plastik, Rabu depan kelas ada 14 bungkus makanan, Jumat dekat kantin ada 20 sampah plastik. Tempat sampah tersedia di dekat kantin, tetapi tidak ada poster pengingat dan jadwal piket setelah istirahat belum jelas. Warna tempat sampah dan ukuran papan tulis tidak berhubungan langsung dengan masalah.";
  }
  return `Materi ini membahas ${cleanTopic(prompt).toLowerCase()} dengan contoh sederhana yang dekat dengan kehidupan siswa SMP. Siswa perlu memahami pengertian utama, informasi penting, contoh penerapan, dan langkah penyelesaian yang sesuai dengan materi. Quiz berisi pertanyaan untuk mengecek pemahaman konsep, data, dan penerapan materi.`;
}

function cleanTopic(prompt: string) {
  const materialTitle = prompt.match(/Judul materi:\s*(.+?)(?:\r?\n|$)/i)?.[1]?.trim();
  if (materialTitle) return materialTitle.replace(/^./, (char) => char.toUpperCase());
  return prompt
    .replace(/\b(buat|quiz|kuis|materi|tentang|topik|soal|untuk|siswa|smp)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase()) || "Materi Pembelajaran";
}

function isGenericTitle(title: string | undefined) {
  if (!title) return true;
  return ["misi ct instan", "misi pembelajaran ct", "misi computational thinking", "kuis ct instan", "kuis pembelajaran ct"].includes(title.trim().toLowerCase());
}

const orderedPillars: GeneratedQuestion["pillar"][] = [
  "DECOMPOSITION",
  "PATTERN_RECOGNITION",
  "ABSTRACTION",
  "ALGORITHMIC_THINKING"
];

const pillarConcept: Record<GeneratedQuestion["pillar"], string> = {
  DECOMPOSITION: "memecah masalah menjadi bagian kecil",
  PATTERN_RECOGNITION: "mencari pola dari data atau kejadian",
  ABSTRACTION: "memilih informasi penting dan mengabaikan pengecoh",
  ALGORITHMIC_THINKING: "menyusun langkah solusi yang logis"
};

const challengeTypeByPillar: Record<GeneratedQuestion["pillar"], GeneratedQuestion["type"]> = {
  DECOMPOSITION: "SHORT_ANSWER",
  PATTERN_RECOGNITION: "TRUE_FALSE",
  ABSTRACTION: "MULTIPLE_CHOICE",
  ALGORITHMIC_THINKING: "MULTIPLE_CHOICE"
};

const quizPillarPlan: GeneratedQuestion["pillar"][] = [
  "DECOMPOSITION",
  "PATTERN_RECOGNITION",
  "ABSTRACTION",
  "ALGORITHMIC_THINKING",
  "DECOMPOSITION",
  "PATTERN_RECOGNITION",
  "ABSTRACTION",
  "ALGORITHMIC_THINKING",
  "DECOMPOSITION",
  "PATTERN_RECOGNITION",
  "ABSTRACTION",
  "ALGORITHMIC_THINKING",
  "PATTERN_RECOGNITION",
  "ABSTRACTION",
  "ALGORITHMIC_THINKING"
];

function missionTopic(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("macet") || lower.includes("jalan")) return "macet jalanan";
  if (lower.includes("algoritma") && lower.includes("jadwal")) return "algoritma penjadwalan";
  if (lower.includes("perpustakaan") || lower.includes("buku")) return "buku perpustakaan";
  if (lower.includes("piket")) return "jadwal piket kelas";
  if (lower.includes("sampah")) return "kebersihan sekolah";
  if (lower.includes("kantin")) return "masalah kantin";
  return cleanTopic(prompt).toLowerCase();
}

function materialContent(prompt: string) {
  return prompt.match(/Isi materi:\s*([\s\S]*)/i)?.[1]?.trim() || prompt;
}

function isHtmlCssMaterial(prompt: string) {
  const lower = prompt.toLowerCase();
  return lower.includes("html") && lower.includes("css");
}

function isAmbiguousPrompt(prompt: string, sourcePrompt: string) {
  const lower = prompt.trim().toLowerCase();
  const sourceLower = sourcePrompt.toLowerCase();
  const sourceIsLibrary = sourceLower.includes("perpustakaan") || sourceLower.includes("buku");
  if (!lower) return true;
  if (lower.includes("pertanyaan belum tersedia")) return true;
  if (lower.includes("apa yang dapat kita lihat")) return true;
  if (lower.includes("biasanya menjadi kotor pada waktu tertentu")) return true;
  if (lower.includes("apakah kebersihan sekolah")) return true;
  if (lower.includes("setelah solusi") || lower.includes("solusi untuk")) return true;
  if (lower.includes("hal yang perlu dilakukan adalah") && !sourceLower.includes("hal yang perlu dilakukan")) return true;
  if (lower.includes("informasi tentang jadwal piket penting")) return true;
  if (lower.includes("pecahkan masalah kebersihan sekolah menjadi beberapa penyebab kecil") && lower.includes("diselidiki")) return true;
  if (lower.includes("mengidentifikasi masalah siswa yang lupa piket")) return true;
  if (lower.includes("mengidentifikasi siswa yang lupa piket")) return true;
  if (!sourceIsLibrary && sourceLower.includes("piket") && lower.includes("siapa siswa yang lupa")) return true;
  if (lower.length < 18) return true;
  return false;
}

function hasWeakMultipleChoice(item: GeneratedQuestion, sourcePrompt: string) {
  if (item.type !== "MULTIPLE_CHOICE") return false;
  const options = (item.options || []).map((option) => option.trim().toLowerCase()).filter(Boolean);
  const prompt = item.prompt.toLowerCase();
  if (options.length < 4) return true;
  const repeatedKumpulan = options.filter((option) => option.startsWith("kumpulan")).length >= 3;
  if (repeatedKumpulan) return true;
  if (isHtmlCssMaterial(sourcePrompt) && prompt.includes("link")) {
    return !options.some((option) => option.includes("menghubungkan") || option.includes("alamat") || option.includes("halaman"));
  }
  if (isHtmlCssMaterial(sourcePrompt) && prompt.includes("rumah")) {
    return !options.some((option) => option.includes("pondasi") || option.includes("struktur"));
  }
  return false;
}

function fallbackQuestion(pillar: GeneratedQuestion["pillar"], sourcePrompt: string, stage: "pre" | "post" | "challenge", index = 0): GeneratedQuestion {
  const topic = missionTopic(sourcePrompt);
  const sourceLower = sourcePrompt.toLowerCase();
  const isLibraryMission = sourceLower.includes("perpustakaan") || sourceLower.includes("buku");
  const isPicketMission = !isLibraryMission && sourceLower.includes("piket");
  const material = materialContent(sourcePrompt);

  const htmlCssQuestions: Record<number, GeneratedQuestion> = {
    1: {
      pillar: "DECOMPOSITION",
      type: "MULTIPLE_CHOICE",
      prompt: "HTML digunakan untuk...",
      options: ["Membuat struktur website", "Mengatur warna website", "Membuat database", "Menyimpan file gambar"],
      answer: "Membuat struktur website"
    },
    2: {
      pillar: "PATTERN_RECOGNITION",
      type: "MULTIPLE_CHOICE",
      prompt: "CSS digunakan untuk...",
      options: ["Mengatur tampilan website", "Membuat struktur halaman", "Membuka alamat website lain", "Membuat paragraf"],
      answer: "Mengatur tampilan website"
    },
    3: {
      pillar: "ABSTRACTION",
      type: "MULTIPLE_CHOICE",
      prompt: "Tag HTML yang digunakan untuk membuat paragraf adalah...",
      options: ["<p>", "<h1>", "<img>", "<a>"],
      answer: "<p>"
    },
    4: {
      pillar: "ALGORITHMIC_THINKING",
      type: "MULTIPLE_CHOICE",
      prompt: "Tag HTML yang digunakan untuk membuat link adalah...",
      options: ["<a>", "<p>", "<img>", "<ul>"],
      answer: "<a>"
    },
    5: {
      pillar: "DECOMPOSITION",
      type: "MULTIPLE_CHOICE",
      prompt: "Dalam perumpamaan rumah, HTML diibaratkan sebagai...",
      options: ["Pondasi dan struktur rumah", "Cat dan dekorasi rumah", "Perabot rumah", "Lampu rumah"],
      answer: "Pondasi dan struktur rumah"
    },
    6: {
      pillar: "PATTERN_RECOGNITION",
      type: "TRUE_FALSE",
      prompt: "CSS digunakan untuk mempercantik tampilan website.",
      options: ["Benar", "Salah"],
      answer: "Benar"
    },
    7: {
      pillar: "ABSTRACTION",
      type: "TRUE_FALSE",
      prompt: "HTML digunakan untuk mengatur warna teks.",
      options: ["Benar", "Salah"],
      answer: "Salah"
    },
    8: {
      pillar: "ALGORITHMIC_THINKING",
      type: "SHORT_ANSWER",
      prompt: "Tuliskan perbedaan HTML dan CSS secara singkat.",
      answer: "HTML digunakan untuk membuat struktur/konten website, sedangkan CSS digunakan untuk mengatur tampilan seperti warna, ukuran, atau layout."
    },
    9: {
      pillar: "DECOMPOSITION",
      type: "MULTIPLE_CHOICE",
      prompt: "Bagian berikut yang termasuk contoh isi atau struktur HTML adalah...",
      options: ["Judul dan paragraf", "Warna teks dan ukuran huruf", "Database dan server", "Password dan email"],
      answer: "Judul dan paragraf"
    },
    10: {
      pillar: "PATTERN_RECOGNITION",
      type: "MULTIPLE_CHOICE",
      prompt: "Bagian berikut yang termasuk contoh pengaturan CSS adalah...",
      options: ["Warna teks dan ukuran huruf", "Judul dan paragraf", "Link dan gambar", "Alamat website dan folder"],
      answer: "Warna teks dan ukuran huruf"
    },
    11: {
      pillar: "ABSTRACTION",
      type: "MULTIPLE_CHOICE",
      prompt: "Jika ingin membuat teks terlihat lebih menarik, bagian yang perlu digunakan adalah...",
      options: ["CSS", "HTML saja", "Tag paragraf saja", "Link"],
      answer: "CSS"
    },
    12: {
      pillar: "ALGORITHMIC_THINKING",
      type: "MULTIPLE_CHOICE",
      prompt: "Urutan paling masuk akal saat membuat halaman web sederhana adalah...",
      options: ["Buat struktur HTML, lalu atur tampilannya dengan CSS", "Atur CSS dulu tanpa membuat isi halaman", "Buat database dulu sebelum menulis HTML", "Langsung membuka link tanpa membuat halaman"],
      answer: "Buat struktur HTML, lalu atur tampilannya dengan CSS"
    },
    13: {
      pillar: "PATTERN_RECOGNITION",
      type: "TRUE_FALSE",
      prompt: "Tag <a> digunakan untuk menghubungkan halaman atau membuka alamat website lain.",
      options: ["Benar", "Salah"],
      answer: "Benar"
    },
    14: {
      pillar: "ABSTRACTION",
      type: "SHORT_ANSWER",
      prompt: "Kelompokkan komponen berikut menjadi HTML atau CSS: judul, paragraf, warna teks, ukuran huruf.",
      answer: "HTML: judul dan paragraf. CSS: warna teks dan ukuran huruf."
    },
    15: {
      pillar: "ALGORITHMIC_THINKING",
      type: "SHORT_ANSWER",
      prompt: "Sebutkan satu contoh website yang sering kamu gunakan.",
      answer: "Jawaban menyebut contoh website yang relevan, misalnya Google, YouTube, Wikipedia, atau website sekolah."
    }
  };

  if (stage === "challenge" && isHtmlCssMaterial(sourcePrompt) && htmlCssQuestions[index]) {
    return htmlCssQuestions[index];
  }

  const materialQuestions: Record<number, GeneratedQuestion> = {
    1: {
      pillar: "DECOMPOSITION",
      type: "MULTIPLE_CHOICE",
      prompt: `Apa bagian utama yang perlu dipahami dari materi ${topic}?`,
      options: [`Pengertian ${topic}, data/contoh, penyebab atau faktor, dan solusi`, "Warna tulisan, ukuran kertas, dan nama pembuat soal", "Hal yang tidak berhubungan dengan materi", "Jawaban acak tanpa melihat materi"],
      answer: `Pengertian ${topic}, data/contoh, penyebab atau faktor, dan solusi`
    },
    2: {
      pillar: "PATTERN_RECOGNITION",
      type: "MULTIPLE_CHOICE",
      prompt: `Berdasarkan materi, data atau contoh apa yang menunjukkan pola penting pada ${topic}?`,
      options: ["Data yang muncul berulang atau paling menonjol", "Informasi yang tidak disebutkan dalam materi", "Bagian dekorasi halaman", "Pilihan yang tidak memakai data"],
      answer: "Data yang muncul berulang atau paling menonjol"
    },
    3: {
      pillar: "ABSTRACTION",
      type: "MULTIPLE_CHOICE",
      prompt: `Informasi seperti apa yang paling penting untuk memahami ${topic}?`,
      options: ["Informasi yang langsung menjelaskan masalah, data, atau solusi", "Informasi pengecoh yang tidak berkaitan", "Warna dan hiasan yang tidak memengaruhi materi", "Hal yang tidak ada di materi"],
      answer: "Informasi yang langsung menjelaskan masalah, data, atau solusi"
    },
    4: {
      pillar: "ALGORITHMIC_THINKING",
      type: "MULTIPLE_CHOICE",
      prompt: `Urutan belajar yang paling tepat untuk memahami ${topic} adalah...`,
      options: ["Pahami konsep, baca data/contoh, tentukan faktor penting, lalu pilih solusi", "Langsung menebak jawaban tanpa membaca materi", "Mengabaikan data lalu memilih jawaban terpanjang", "Membaca opsi salah lebih dulu tanpa melihat konteks"],
      answer: "Pahami konsep, baca data/contoh, tentukan faktor penting, lalu pilih solusi"
    },
    5: {
      pillar: "DECOMPOSITION",
      type: "SHORT_ANSWER",
      prompt: `Tuliskan dua hal penting yang perlu diperiksa saat mempelajari ${topic}.`,
      answer: `Jawaban menyebut dua hal relevan dari materi ${topic}, seperti konsep utama, data/contoh, faktor penyebab, dampak, atau solusi.`
    },
    6: {
      pillar: "PATTERN_RECOGNITION",
      type: "TRUE_FALSE",
      prompt: `Untuk memahami ${topic}, data atau contoh yang berulang perlu diperhatikan.`,
      options: ["Benar", "Salah"],
      answer: "Benar"
    },
    7: {
      pillar: "ABSTRACTION",
      type: "TRUE_FALSE",
      prompt: `Informasi yang tidak berkaitan langsung dengan ${topic} sebaiknya tidak dijadikan dasar jawaban utama.`,
      options: ["Benar", "Salah"],
      answer: "Benar"
    },
    8: {
      pillar: "ALGORITHMIC_THINKING",
      type: "SHORT_ANSWER",
      prompt: `Susun tiga langkah sederhana untuk menyelesaikan masalah atau tugas yang berkaitan dengan ${topic}.`,
      answer: `Jawaban memuat langkah runtut yang sesuai materi ${topic}, misalnya memahami data, menentukan faktor penting, memilih solusi, dan mengecek hasil.`
    },
    9: {
      pillar: "DECOMPOSITION",
      type: "MULTIPLE_CHOICE",
      prompt: `Jika materi ${topic} terasa rumit, cara paling tepat untuk mulai memahaminya adalah...`,
      options: ["Membagi materi menjadi konsep, data, contoh, dan solusi", "Menghafal semua kalimat tanpa memahami", "Memilih jawaban secara acak", "Mengabaikan contoh dalam materi"],
      answer: "Membagi materi menjadi konsep, data, contoh, dan solusi"
    },
    10: {
      pillar: "PATTERN_RECOGNITION",
      type: "SHORT_ANSWER",
      prompt: `Sebutkan satu pola atau hubungan yang dapat dicari dari materi ${topic}.`,
      answer: `Jawaban menyebut pola/hubungan relevan dalam materi ${topic}, misalnya perubahan data, kejadian berulang, hubungan sebab-akibat, atau urutan proses.`
    },
    11: {
      pillar: "ABSTRACTION",
      type: "MULTIPLE_CHOICE",
      prompt: `Paket informasi mana yang paling membantu untuk menjawab quiz tentang ${topic}?`,
      options: ["Konsep utama, data penting, contoh, dan solusi", "Warna halaman, panjang paragraf, dan ukuran font", "Hal yang tidak disebutkan guru", "Jawaban yang terdengar paling panjang"],
      answer: "Konsep utama, data penting, contoh, dan solusi"
    },
    12: {
      pillar: "ALGORITHMIC_THINKING",
      type: "MULTIPLE_CHOICE",
      prompt: `Langkah pertama sebelum memilih solusi pada materi ${topic} sebaiknya adalah...`,
      options: ["Memahami masalah dan data yang tersedia", "Langsung memilih solusi tanpa alasan", "Menghapus data yang diberikan", "Menebak dari pilihan terakhir"],
      answer: "Memahami masalah dan data yang tersedia"
    },
    13: {
      pillar: "PATTERN_RECOGNITION",
      type: "MULTIPLE_CHOICE",
      prompt: `Saat ada beberapa data dalam materi ${topic}, hal yang perlu dicari adalah...`,
      options: ["Kesamaan, perbedaan, atau perubahan yang terlihat", "Warna tulisan pada soal", "Urutan opsi jawaban saja", "Kata yang paling panjang"],
      answer: "Kesamaan, perbedaan, atau perubahan yang terlihat"
    },
    14: {
      pillar: "ABSTRACTION",
      type: "SHORT_ANSWER",
      prompt: `Tuliskan satu informasi penting dan satu informasi yang bisa diabaikan dari materi ${topic}.`,
      answer: `Jawaban menyebut satu informasi relevan dan satu pengecoh/tidak relevan berdasarkan materi ${topic}.`
    },
    15: {
      pillar: "ALGORITHMIC_THINKING",
      type: "SHORT_ANSWER",
      prompt: `Tuliskan satu hal penting yang kamu pahami dari materi ${topic}.`,
      answer: `Jawaban menyebut hal penting yang sesuai dengan isi materi, misalnya konsep utama, contoh, fungsi, perbedaan, atau langkah yang memang dijelaskan dalam materi. Materi sumber: ${material.slice(0, 240)}`
    }
  };

  const questionIndex = index || Math.max(1, quizPillarPlan.indexOf(pillar) + 1);
  if (stage === "challenge" && materialQuestions[questionIndex]) {
    return materialQuestions[questionIndex];
  }

  const challengePrompts: Record<GeneratedQuestion["pillar"], string> = isLibraryMission
    ? {
        DECOMPOSITION: "Dari cerita kasus, pecahkan masalah buku sulit ditemukan menjadi beberapa penyebab kecil yang perlu diselidiki.",
        PATTERN_RECOGNITION: "Dari cerita kasus, masalah buku sulit ditemukan terjadi berulang pada waktu atau kondisi tertentu.",
        ABSTRACTION: "Informasi mana yang paling penting untuk mencari penyebab buku sulit ditemukan?",
        ALGORITHMIC_THINKING: "Urutan langkah mana yang paling logis untuk membantu petugas menemukan dan mencegah buku sulit ditemukan?"
      }
    : isPicketMission
    ? {
        DECOMPOSITION: "Dari cerita kasus, pecahkan masalah kelas kotor menjadi beberapa penyebab kecil yang perlu diselidiki.",
        PATTERN_RECOGNITION: "Mengamati bahwa kelas biasanya menjadi kotor pada waktu tertentu, lalu mencocokkannya dengan jadwal kelompok piket yang bertugas, termasuk contoh Pattern Recognition.",
        ABSTRACTION: "Informasi mana yang paling penting untuk menentukan penyebab piket tidak berjalan tertib?",
        ALGORITHMIC_THINKING: "Urutan langkah mana yang paling logis untuk membuat piket berjalan tertib?"
      }
    : {
        DECOMPOSITION: `Dari cerita kasus, pecahkan masalah ${topic} menjadi beberapa bagian kecil yang perlu diselidiki.`,
        PATTERN_RECOGNITION: `Mengamati kejadian yang berulang pada ${topic}, lalu mencocokkannya dengan data yang tersedia, termasuk contoh Pattern Recognition.`,
        ABSTRACTION: `Informasi mana yang paling penting untuk menyelesaikan ${topic}?`,
        ALGORITHMIC_THINKING: `Langkah solusi mana yang paling runtut untuk menyelesaikan ${topic}?`
      };

  if (stage === "challenge") {
    const prefix = index ? `Soal ${index}: ` : "";
    if (pillar === "PATTERN_RECOGNITION") {
      return {
        pillar,
        type: "TRUE_FALSE",
        prompt: `${prefix}${challengePrompts[pillar]}`,
        options: ["Benar", "Salah"],
        answer: "Benar"
      };
    }
    if (pillar === "ABSTRACTION") {
      const options = isPicketMission
        ? ["Jadwal piket, waktu kelas kotor, dan kebiasaan lupa piket", "Warna dinding kelas", "Merek sapu yang dipakai", "Ukuran meja guru"]
        : isLibraryMission
          ? ["Waktu buku sulit ditemukan, rak tempat buku ditemukan, dan catatan peminjaman", "Warna poster perpustakaan", "Ukuran meja baca", "Warna sampul buku yang paling menarik"]
        : ["Data yang berkaitan langsung dengan penyebab masalah", "Warna benda di sekitar lokasi", "Cerita yang tidak berhubungan", "Pendapat tanpa bukti"];
      return { pillar, type: "MULTIPLE_CHOICE", prompt: `${prefix}${challengePrompts[pillar]}`, options, answer: options[0] };
    }
    if (pillar === "ALGORITHMIC_THINKING") {
      const options = isPicketMission
        ? [
            "Cek jadwal piket, cari pola kelas kotor, buat pengingat, lalu evaluasi hasilnya",
            "Mengganti semua meja kelas",
            "Menunggu kelas kotor lagi tanpa mencatat",
            "Menyalahkan satu siswa tanpa melihat data"
          ]
        : isLibraryMission
          ? [
              "Periksa rak dan catatan peminjaman, rapikan label rak, buat aturan pengembalian, lalu evaluasi hasilnya",
              "Langsung menutup perpustakaan tanpa memeriksa data",
              "Mengganti warna poster perpustakaan lebih dulu",
              "Menyalahkan semua siswa tanpa mengecek catatan peminjaman"
            ]
        : [
            "Kumpulkan data, cari pola, pilih informasi penting, lalu susun solusi",
            "Menebak penyebab tanpa data",
            "Mengabaikan semua bukti",
            "Langsung membuat aturan tanpa memahami masalah"
          ];
      return { pillar, type: "MULTIPLE_CHOICE", prompt: `${prefix}${challengePrompts[pillar]}`, options, answer: options[0] };
    }
    return {
      pillar,
      type: "SHORT_ANSWER",
      prompt: `${prefix}${challengePrompts[pillar]}`,
      options: [],
      answer: isPicketMission
        ? "Masalah dapat dipecah menjadi siswa lupa jadwal, jadwal kurang terlihat, tidak ada pengingat, dan pengecekan piket belum rutin."
        : "Jawaban menyebut beberapa bagian kecil dari masalah utama yang perlu diselidiki."
    };
  }

  const prePrompts: Record<GeneratedQuestion["pillar"], string> = {
    DECOMPOSITION: `Saat menghadapi ${topic}, apa langkah awal yang sesuai dengan Decomposition?`,
    PATTERN_RECOGNITION: `Mengamati kejadian yang berulang pada ${topic}, lalu mencocokkannya dengan data yang tersedia, termasuk contoh Pattern Recognition.`,
    ABSTRACTION: `Apa tujuan Abstraction saat siswa membaca informasi tentang ${topic}?`,
    ALGORITHMIC_THINKING: `Apa ciri langkah penyelesaian yang sesuai dengan Algorithmic Thinking?`
  };
  const postPrompts: Record<GeneratedQuestion["pillar"], string> = {
    DECOMPOSITION: `Setelah memahami kasus ${topic}, tindakan mana yang menunjukkan Decomposition?`,
    PATTERN_RECOGNITION: `Setelah data kasus dikumpulkan, menemukan kejadian yang berulang dan membandingkannya dengan data pendukung termasuk Pattern Recognition.`,
    ABSTRACTION: `Setelah membaca semua petunjuk, informasi seperti apa yang harus dipilih?`,
    ALGORITHMIC_THINKING: `Setelah penyebab masalah ditemukan, langkah solusi seperti apa yang paling tepat?`
  };
  const prompt = stage === "pre" ? prePrompts[pillar] : postPrompts[pillar];
  const optionsByPillar: Record<GeneratedQuestion["pillar"], string[]> = {
    DECOMPOSITION: ["Memecah masalah menjadi beberapa bagian kecil", "Langsung menebak siapa yang salah", "Mengabaikan data", "Memilih jawaban paling panjang"],
    PATTERN_RECOGNITION: ["Menemukan kejadian yang berulang", "Menghapus semua catatan", "Mengganti topik", "Memilih data acak"],
    ABSTRACTION: ["Memilih informasi yang berhubungan langsung dengan masalah", "Memakai semua informasi tanpa disaring", "Fokus pada warna benda", "Mengabaikan tujuan masalah"],
    ALGORITHMIC_THINKING: ["Menyusun langkah solusi yang runtut", "Melakukan tindakan secara acak", "Mengulang kesalahan yang sama", "Berhenti sebelum membuat solusi"]
  };
  return { pillar, type: "MULTIPLE_CHOICE", prompt, options: optionsByPillar[pillar], answer: optionsByPillar[pillar][0] };
}

function normalizeGeneratedMission(data: GeneratedMissionPackage, sourcePrompt: string): GeneratedMissionPackage {
  const normalizeQuestion = (item: GeneratedQuestion, stage: "pre" | "post" | "challenge", forcedPillar?: GeneratedQuestion["pillar"], index = 0): GeneratedQuestion => {
    const type = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"].includes(item.type) ? item.type : "MULTIPLE_CHOICE";
    const pillar = forcedPillar || (["DECOMPOSITION", "PATTERN_RECOGNITION", "ABSTRACTION", "ALGORITHMIC_THINKING"].includes(item.pillar)
      ? item.pillar
      : "DECOMPOSITION");
    const fallback = fallbackQuestion(pillar, sourcePrompt, stage, index);
    const safeType = type || challengeTypeByPillar[pillar];
    const useFallback = isAmbiguousPrompt(item.prompt || "", sourcePrompt) || hasWeakMultipleChoice(item, sourcePrompt);
    const prompt = useFallback ? fallback.prompt : item.prompt.trim();
    const options = safeType === "TRUE_FALSE"
      ? ["Benar", "Salah"]
      : safeType === "SHORT_ANSWER"
        ? []
        : (useFallback ? fallback.options || [] : item.options || []).filter(Boolean).slice(0, 4);
    const safeOptions = safeType === "MULTIPLE_CHOICE" && options.length < 4
      ? fallback.options || []
      : options;
    const answer = useFallback
      ? fallback.answer
      : safeType === "MULTIPLE_CHOICE" && !safeOptions.includes(item.answer)
      ? safeOptions[0]
      : safeType === "TRUE_FALSE" && !["Benar", "Salah"].includes(item.answer)
        ? fallback.answer
        : item.answer || fallback.answer;
    return {
      pillar,
      type: safeType,
      prompt,
      options: safeOptions,
      answer: answer || fallback.answer
    };
  };

  const normalizeTestSet = () => [];

  const normalizeChallenges = (items: GeneratedChallenge[] | undefined) => {
    const usedIndexes = new Set<number>();
    const seenPrompts = new Set<string>();
    return quizPillarPlan.map((pillar, index) => {
      const generatedIndex = (items || []).findIndex((item, itemIndex) => item.pillar === pillar && !usedIndexes.has(itemIndex));
      if (generatedIndex >= 0) usedIndexes.add(generatedIndex);
      const generatedItem = generatedIndex >= 0 ? items?.[generatedIndex] : undefined;
      const fallback = fallbackQuestion(pillar, sourcePrompt, "challenge", index + 1);
      const candidate = generatedItem || fallback;
      let normalized = normalizeQuestion(candidate, "challenge", pillar, index + 1);
      const promptKey = normalized.prompt.toLowerCase().replace(/^soal\s+\d+:\s*/, "").trim();
      if (seenPrompts.has(promptKey) || isAmbiguousPrompt(normalized.prompt, sourcePrompt)) {
        normalized = normalizeQuestion(fallback, "challenge", pillar, index + 1);
      }
      seenPrompts.add(normalized.prompt.toLowerCase().replace(/^soal\s+\d+:\s*/, "").trim());
      return {
        ...normalized,
        feedbackCorrect: generatedItem?.feedbackCorrect || `Tepat. Jawabanmu sudah menunjukkan kemampuan ${pillarConcept[pillar]}.`,
        feedbackWrong: generatedItem?.feedbackWrong || `Coba cek lagi. Pada tahap ini fokusnya adalah ${pillarConcept[pillar]}.`
      };
    });
  };

  return {
    title: isGenericTitle(data.title) ? fallbackTitle(sourcePrompt) : data.title,
    description: data.description || fallbackDescription(sourcePrompt),
    storyIntro: data.storyIntro || fallbackStory(sourcePrompt),
    preTest: normalizeTestSet(),
    postTest: normalizeTestSet(),
    challenges: normalizeChallenges(data.challenges)
  };
}

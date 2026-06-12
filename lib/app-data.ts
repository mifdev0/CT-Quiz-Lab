import { Filter, Footprints, GitBranch, Puzzle, Search } from "lucide-react";
import type { CTPillar } from "@prisma/client";

export const studentNav = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/mission", label: "Kuis" },
  { href: "/student/results", label: "Hasil" }
];

export const teacherNav = [
  { href: "/teacher", label: "Dashboard" },
  { href: "/teacher/materials", label: "Materi" },
  { href: "/teacher/missions", label: "Kuis" },
  { href: "/teacher/challenges", label: "Soal Kuis" },
  { href: "/teacher/reports", label: "Laporan" }
];

export const pillars = [
  { key: "decomposition", title: "Decomposition", short: "Pecah Masalah", icon: Puzzle, color: "bg-leaf" },
  { key: "pattern", title: "Pattern Recognition", short: "Cari Pola", icon: Search, color: "bg-sky" },
  { key: "abstraction", title: "Abstraction", short: "Pilih Bukti", icon: Filter, color: "bg-honey" },
  { key: "algorithm", title: "Algorithmic Thinking", short: "Susun Langkah", icon: GitBranch, color: "bg-coral" }
];

export const pillarLabels: Record<CTPillar | string, { title: string; short: string; helper: string }> = {
  DECOMPOSITION: {
    title: "Decomposition",
    short: "Pecah Masalah",
    helper: "Memecah masalah besar menjadi beberapa bagian kecil."
  },
  PATTERN_RECOGNITION: {
    title: "Pattern Recognition",
    short: "Cari Pola",
    helper: "Menemukan pola dari data atau kejadian yang berulang."
  },
  ABSTRACTION: {
    title: "Abstraction",
    short: "Pilih Informasi Penting",
    helper: "Memilih informasi penting dan mengabaikan pengecoh."
  },
  ALGORITHMIC_THINKING: {
    title: "Algorithmic Thinking",
    short: "Susun Langkah",
    helper: "Menyusun urutan solusi yang logis."
  }
};

export function formatPillar(value: CTPillar | string) {
  return pillarLabels[value]?.title || String(value).replaceAll("_", " ");
}

export function formatPillarShort(value: CTPillar | string) {
  return pillarLabels[value]?.short || formatPillar(value);
}

export function detectiveStepLabel(pillar: CTPillar | string) {
  if (pillar === "DECOMPOSITION") {
    return {
      title: "Pecah Masalah",
      helper: "Uraikan masalah dari materi menjadi bagian kecil yang mudah dipahami."
    };
  }
  if (pillar === "PATTERN_RECOGNITION") {
    return {
      title: "Cari Pola",
      helper: "Temukan pola, hubungan, atau kejadian berulang dari informasi yang diberikan."
    };
  }
  if (pillar === "ABSTRACTION") {
    return {
      title: "Pilih Informasi Penting",
      helper: "Pilih informasi yang relevan dan abaikan bagian yang tidak membantu."
    };
  }
  if (pillar === "ALGORITHMIC_THINKING") {
    return {
      title: "Susun Langkah",
      helper: "Susun urutan penyelesaian yang logis dan bisa dilakukan."
    };
  }
  return {
    title: "Soal Interaktif",
    helper: "Gunakan materi untuk menyelesaikan tugas."
  };
}

export function missionEvidenceItems(missionContext: string) {
  const context = missionContext.toLowerCase();

  if (context.includes("perpustakaan") || context.includes("buku")) {
    return [
      "Senin, 3 buku IPA ditemukan di rak Bahasa Indonesia.",
      "Rabu, 2 buku Matematika tidak tercatat di buku peminjaman.",
      "Buku yang paling sering sulit ditemukan berasal dari rak mata pelajaran.",
      "Rak buku fiksi jarang bermasalah karena diberi label warna yang jelas.",
      "Masalah paling sering muncul setelah jam literasi selesai."
    ];
  }

  if (context.includes("piket") || context.includes("kelas kotor")) {
    return [
      "Senin dan Rabu, kelas paling sering kotor setelah jam istirahat.",
      "Pada dua hari tersebut, kelompok piket yang bertugas sering belum memberi tanda selesai di daftar piket.",
      "Jadwal piket ditempel di belakang pintu sehingga beberapa siswa jarang melihatnya.",
      "Saat ketua kelas mengingatkan sebelum istirahat, kelas lebih sering bersih.",
      "Warna dinding dan ukuran meja tidak berhubungan langsung dengan masalah piket."
    ];
  }

  if (context.includes("sampah") || context.includes("kebersihan")) {
    return [
      "Sampah paling sering terlihat setelah jam istirahat pertama.",
      "Area yang paling sering kotor adalah dekat kantin dan depan kelas.",
      "Tempat sampah tersedia, tetapi beberapa siswa belum membuang sampah pada tempatnya.",
      "Saat guru piket mengingatkan, jumlah sampah terlihat berkurang.",
      "Warna tempat sampah tidak berhubungan langsung dengan penyebab masalah."
    ];
  }

  if (context.includes("kantin")) {
    return [
      "Antrean paling panjang terjadi saat istirahat pertama.",
      "Siswa sering berkumpul di satu penjual karena menu favorit tersedia di sana.",
      "Beberapa siswa belum membaca daftar harga sebelum memesan.",
      "Antrean lebih cepat saat siswa sudah menyiapkan uang pas.",
      "Warna meja kantin tidak berhubungan langsung dengan lamanya antrean."
    ];
  }

  return [
    "Ada beberapa kejadian yang berulang dan perlu dibandingkan.",
    "Sebagian informasi berkaitan langsung dengan masalah, sebagian lain hanya pengecoh.",
    "Data waktu, tempat, dan pihak yang terlibat perlu diperiksa.",
    "Solusi harus disusun setelah penyebab utama dipahami."
  ];
}

export function studentFriendlyChallengePrompt(pillar: CTPillar | string, prompt: string, missionContext = "") {
  const lowerPrompt = prompt.trim().toLowerCase();
  const lowerContext = missionContext.toLowerCase();
  const isLibrary = lowerContext.includes("perpustakaan") || lowerContext.includes("buku");
  const isPicket = !isLibrary && (lowerContext.includes("piket") || lowerContext.includes("kelas kotor"));
  const ambiguous =
    !prompt.trim() ||
    lowerPrompt.includes("mengidentifikasi masalah siswa yang lupa piket") ||
    lowerPrompt.includes("mengidentifikasi siswa yang lupa piket") ||
    lowerPrompt.includes("siapa siswa yang lupa") ||
    lowerPrompt.includes("pola waktu kelas menjadi kotor") ||
    lowerPrompt.includes("pola waktu kelas kotor");

  if (!ambiguous) return prompt;

  if (isLibrary) {
    if (pillar === "DECOMPOSITION") return "Dari cerita kasus, pecahkan masalah buku sulit ditemukan menjadi beberapa penyebab kecil yang perlu diselidiki.";
    if (pillar === "PATTERN_RECOGNITION") return "Dari cerita kasus, buku yang sulit ditemukan paling sering berkaitan dengan waktu tertentu, rak tertentu, atau pencatatan peminjaman.";
    if (pillar === "ABSTRACTION") return "Informasi mana yang paling penting untuk mencari penyebab buku sulit ditemukan?";
    if (pillar === "ALGORITHMIC_THINKING") return "Susun langkah solusi agar buku lebih mudah ditemukan dan tidak sering salah tempat.";
  } else if (isPicket) {
    if (pillar === "DECOMPOSITION") return "Dari cerita kasus, pecahkan masalah kelas kotor menjadi beberapa penyebab kecil yang perlu diselidiki.";
    if (pillar === "PATTERN_RECOGNITION") return "Mengamati bahwa kelas biasanya menjadi kotor pada waktu tertentu, lalu mencocokkannya dengan jadwal kelompok piket yang bertugas, termasuk contoh Pattern Recognition.";
    if (pillar === "ABSTRACTION") return "Informasi mana yang paling penting untuk menentukan penyebab piket tidak berjalan tertib?";
    if (pillar === "ALGORITHMIC_THINKING") return "Susun langkah solusi agar jadwal piket berjalan tertib dan mudah diikuti.";
  }

  if (pillar === "DECOMPOSITION") return "Dari cerita kasus, pecahkan masalah utama menjadi beberapa bagian kecil yang perlu diselidiki.";
  if (pillar === "PATTERN_RECOGNITION") return "Mengamati kejadian yang berulang, lalu mencocokkannya dengan data yang tersedia, termasuk contoh Pattern Recognition.";
  if (pillar === "ABSTRACTION") return "Informasi mana yang paling penting untuk menyelesaikan masalah, dan informasi apa yang bisa diabaikan?";
  if (pillar === "ALGORITHMIC_THINKING") return "Susun langkah penyelesaian masalah secara logis dan berurutan.";
  return prompt;
}

export function studentFriendlyTestPrompt(pillar: CTPillar | string, prompt: string, missionContext = "") {
  const lowerPrompt = prompt.trim().toLowerCase();
  const lowerContext = missionContext.toLowerCase();
  const isLibrary = lowerContext.includes("perpustakaan") || lowerContext.includes("buku");
  const isPicket = !isLibrary && (lowerContext.includes("piket") || lowerContext.includes("kelas kotor"));
  const ambiguous =
    !prompt.trim() ||
    lowerPrompt.includes("pola waktu kelas menjadi kotor") ||
    lowerPrompt.includes("pola waktu kelas kotor") ||
    lowerPrompt.includes("selalu berubah");

  if (!ambiguous) return prompt;

  if (pillar === "PATTERN_RECOGNITION") {
    return isLibrary
      ? "Mengamati bahwa buku sulit ditemukan pada waktu atau rak tertentu, lalu membandingkannya dengan catatan peminjaman, termasuk contoh Pattern Recognition."
      : isPicket
      ? "Mengamati bahwa kelas biasanya menjadi kotor pada waktu tertentu, lalu mencocokkannya dengan jadwal kelompok piket yang bertugas, termasuk contoh Pattern Recognition."
      : "Mengamati kejadian yang berulang, lalu mencocokkannya dengan data yang tersedia, termasuk contoh Pattern Recognition.";
  }

  return studentFriendlyChallengePrompt(pillar, prompt, missionContext);
}

type FriendlyOption = {
  id: string;
  text: string;
  value?: string;
};

export function openingChallengeView({
  pillar,
  prompt,
  correctAnswer
}: {
  pillar: CTPillar | string;
  prompt: string;
  correctAnswer: string;
}) {
  if (pillar === "DECOMPOSITION") {
    return {
      prompt: "Saat menemukan masalah yang terlihat rumit, apa langkah pertama yang paling masuk akal?",
      options: [
        { id: "opening-decomposition-correct", text: "Memecah masalah menjadi beberapa bagian kecil", value: correctAnswer },
        { id: "opening-decomposition-wrong-1", text: "Langsung menebak penyebab tanpa memeriksa situasi" },
        { id: "opening-decomposition-wrong-2", text: "Mengabaikan masalah sampai ada orang lain yang menyelesaikan" },
        { id: "opening-decomposition-wrong-3", text: "Memilih jawaban paling cepat tanpa alasan" }
      ]
    };
  }

  if (pillar === "PATTERN_RECOGNITION") {
    return {
      prompt: "Kalau kejadian yang sama muncul berulang, apa yang sebaiknya kamu lakukan?",
      options: [
        { id: "opening-pattern-correct", text: "Membandingkan kejadian itu untuk mencari pola", value: correctAnswer },
        { id: "opening-pattern-wrong-1", text: "Menghapus semua catatan kejadian" },
        { id: "opening-pattern-wrong-2", text: "Menganggap semua kejadian tidak berhubungan" },
        { id: "opening-pattern-wrong-3", text: "Menebak solusi tanpa melihat kejadian yang berulang" }
      ]
    };
  }

  if (pillar === "ABSTRACTION") {
    return {
      prompt: "Saat membaca banyak informasi, informasi seperti apa yang perlu kamu pilih?",
      options: [
        { id: "opening-abstraction-correct", text: "Informasi yang paling berhubungan dengan masalah", value: correctAnswer },
        { id: "opening-abstraction-wrong-1", text: "Semua informasi tanpa disaring" },
        { id: "opening-abstraction-wrong-2", text: "Informasi yang paling menarik walaupun tidak penting" },
        { id: "opening-abstraction-wrong-3", text: "Informasi yang tidak ada hubungannya dengan masalah" }
      ]
    };
  }

  if (pillar === "ALGORITHMIC_THINKING") {
    return {
      prompt: "Solusi yang baik sebaiknya disusun dengan cara seperti apa?",
      options: [
        { id: "opening-algorithm-correct", text: "Runtut, logis, dan bisa dilakukan langkah demi langkah", value: correctAnswer },
        { id: "opening-algorithm-wrong-1", text: "Acak asal cepat selesai" },
        { id: "opening-algorithm-wrong-2", text: "Berdasarkan tebakan tanpa urutan" },
        { id: "opening-algorithm-wrong-3", text: "Langsung ke akhir tanpa memahami masalah" }
      ]
    };
  }

  return {
    prompt,
    options: []
  };
}

export function studentFriendlyChallengeView({
  pillar,
  prompt,
  options,
  correctAnswer,
  missionContext
}: {
  pillar: CTPillar | string;
  prompt: string;
  options: FriendlyOption[];
  correctAnswer: string;
  missionContext: string;
}) {
  return { prompt, options };

  const context = missionContext.toLowerCase();
  const lowerPrompt = prompt.toLowerCase();
  const isLibrary = context.includes("perpustakaan") || context.includes("buku");
  const isPicket = !isLibrary && (context.includes("piket") || context.includes("kelas kotor"));
  const shouldUseFallback =
    !prompt.trim() ||
    lowerPrompt.length < 18 ||
    lowerPrompt.includes("mengidentifikasi masalah siswa yang lupa piket") ||
    lowerPrompt.includes("mengidentifikasi siswa yang lupa piket") ||
    lowerPrompt.includes("pola waktu kelas menjadi kotor") ||
    lowerPrompt.includes("pola waktu kelas kotor") ||
    (isLibrary && (lowerPrompt.includes("piket") || lowerPrompt.includes("kelas kotor"))) ||
    (isPicket && (lowerPrompt.includes("perpustakaan") || lowerPrompt.includes("buku sulit")));

  if (!shouldUseFallback) {
    return { prompt, options };
  }

  if (isLibrary) {
      if (pillar === "DECOMPOSITION") {
        return {
          prompt: "Dari cerita kasus, pecahkan masalah buku sulit ditemukan menjadi beberapa penyebab kecil yang perlu diselidiki.",
          options
        };
      }
      if (pillar === "PATTERN_RECOGNITION") {
        return {
          prompt: "Dari cerita kasus, masalah buku sulit ditemukan terjadi berulang pada waktu atau kondisi tertentu.",
          options: [
            { id: "library-pattern-benar", text: "Benar", value: "Benar" },
            { id: "library-pattern-salah", text: "Salah", value: "Salah" }
          ]
        };
      }
      if (pillar === "ABSTRACTION") {
        return {
          prompt: "Informasi mana yang paling penting untuk mencari penyebab buku sulit ditemukan?",
          options: [
            { id: "library-abstraction-correct", text: "Waktu buku sering hilang, rak tempat buku ditemukan, dan catatan peminjaman", value: correctAnswer },
            { id: "library-abstraction-wrong-1", text: "Warna poster perpustakaan" },
            { id: "library-abstraction-wrong-2", text: "Ukuran meja baca" },
            { id: "library-abstraction-wrong-3", text: "Warna sampul buku yang paling menarik" }
          ]
        };
      }
      if (pillar === "ALGORITHMIC_THINKING") {
        return {
          prompt: "Urutan langkah mana yang paling logis untuk membantu petugas menemukan dan mencegah buku sulit ditemukan?",
          options: [
            { id: "library-algorithm-correct", text: "Periksa rak dan catatan peminjaman, rapikan label rak, buat aturan pengembalian, lalu evaluasi hasilnya", value: correctAnswer },
            { id: "library-algorithm-wrong-1", text: "Langsung menutup perpustakaan tanpa memeriksa data" },
            { id: "library-algorithm-wrong-2", text: "Mengganti warna poster perpustakaan lebih dulu" },
            { id: "library-algorithm-wrong-3", text: "Menyalahkan semua siswa tanpa mengecek catatan peminjaman" }
          ]
        };
      }
  } else if (!isPicket) {
    return {
      prompt: studentFriendlyChallengePrompt(pillar, prompt, missionContext),
      options
    };
  }

  if (pillar === "PATTERN_RECOGNITION") {
    return {
          prompt: "Mengamati bahwa kelas biasanya menjadi kotor pada waktu tertentu, lalu mencocokkannya dengan jadwal kelompok piket yang bertugas, termasuk contoh Pattern Recognition.",
      options: [
        { id: "pattern-benar", text: "Benar", value: "Benar" },
        { id: "pattern-salah", text: "Salah", value: "Salah" }
      ]
    };
  }

  if (pillar === "ABSTRACTION") {
    const shouldImprove =
      lowerPrompt.includes("informasi mana") ||
      options.some((option) => option.text.toLowerCase().includes("selalu bersih") || option.text.toLowerCase().includes("tidak pernah kotor"));
    if (shouldImprove) {
      return {
        prompt: "Informasi mana yang paling penting untuk mencari penyebab piket tidak berjalan tertib?",
        options: [
          { id: "abstraction-correct", text: "Jadwal piket, waktu kelas kotor, dan kelompok yang bertugas", value: correctAnswer },
          { id: "abstraction-wrong-1", text: "Warna dinding kelas" },
          { id: "abstraction-wrong-2", text: "Ukuran meja guru" },
          { id: "abstraction-wrong-3", text: "Hiasan yang ada di kelas" }
        ]
      };
    }
  }

  if (pillar === "ALGORITHMIC_THINKING") {
    const shouldImprove =
      lowerPrompt.includes("langkah solusi") ||
      options.some((option) => option.text.toLowerCase().includes("mengatur ulang"));
    if (shouldImprove) {
      return {
        prompt: "Urutan langkah mana yang paling logis untuk membuat piket berjalan tertib?",
        options: [
          { id: "algorithm-correct", text: "Cek jadwal piket, amati waktu kelas kotor, buat pengingat, lalu evaluasi hasilnya", value: correctAnswer },
          { id: "algorithm-wrong-1", text: "Langsung mengganti semua jadwal tanpa melihat data" },
          { id: "algorithm-wrong-2", text: "Menunggu kelas kotor lagi tanpa mencatat penyebabnya" },
          { id: "algorithm-wrong-3", text: "Menyalahkan satu kelompok tanpa membandingkan jadwal dan kejadian" }
        ]
      };
    }
  }

  return {
    prompt: studentFriendlyChallengePrompt(pillar, prompt, missionContext),
    options
  };
}

export const mission = {
  title: "Kasus Data Perpustakaan",
  intro:
    "Beberapa buku hilang dari rak perpustakaan. Catatan peminjaman, jadwal petugas, dan laporan siswa tidak cocok. Gunakan Computational Thinking untuk memahami masalah dan menyusun solusi.",
  levels: [
    {
      pillar: "decomposition",
      title: "Pecah Kasus Besar",
      icon: Puzzle,
      prompt: "Pilih tiga bagian masalah yang paling masuk akal untuk diselidiki lebih dulu.",
      options: ["Catatan peminjaman", "Warna sampul buku", "Jadwal piket", "Laporan buku hilang", "Ukuran meja baca"],
      correct: ["Catatan peminjaman", "Jadwal piket", "Laporan buku hilang"],
      feedback:
        "Masalah besar lebih mudah ditangani saat dipecah menjadi sumber data utama: peminjaman, jadwal orang yang bertugas, dan laporan kehilangan."
    },
    {
      pillar: "pattern",
      title: "Temukan Pola",
      icon: Search,
      prompt: "Dari data kejadian, pola mana yang paling kuat?",
      options: [
        "Buku hilang lebih sering pada hari Selasa saat rak diperiksa setelah istirahat",
        "Buku bersampul biru selalu hilang",
        "Semua buku hilang di rak lain",
        "Buku hilang hanya saat cuaca hujan"
      ],
      correct: ["Buku hilang lebih sering pada hari Selasa saat rak diperiksa setelah istirahat"],
      feedback:
        "Pola yang kuat muncul berulang dan terkait langsung dengan waktu kejadian. Hindari kesimpulan dari petunjuk yang hanya muncul sekali."
    },
    {
      pillar: "abstraction",
      title: "Saring Bukti",
      icon: Filter,
      prompt: "Pilih informasi yang relevan untuk menyelesaikan kasus.",
      options: [
        "Tiga laporan kehilangan terjadi setelah jam istirahat",
        "Rak buku dicat ulang bulan lalu",
        "Petugas piket belum menulis log peminjaman pada Selasa",
        "Poster perpustakaan memakai warna hijau",
        "Dua buku ditemukan di meja baca tanpa kartu pinjam"
      ],
      correct: [
        "Tiga laporan kehilangan terjadi setelah jam istirahat",
        "Petugas piket belum menulis log peminjaman pada Selasa",
        "Dua buku ditemukan di meja baca tanpa kartu pinjam"
      ],
      feedback:
        "Abstraction berarti menyimpan bukti yang membantu keputusan dan membuang detail pengecoh seperti warna poster atau cat rak."
    },
    {
      pillar: "algorithm",
      title: "Susun Langkah Solusi",
      icon: Footprints,
      prompt: "Urutan tindakan mana yang paling logis?",
      options: [
        "Periksa log, cocokkan dengan jadwal piket, cek meja baca, buat aturan pencatatan baru",
        "Buat aturan baru, cek meja baca, cocokkan jadwal, periksa log",
        "Cek warna buku, tanya semua kelas, tutup perpustakaan, hapus log",
        "Tunggu laporan berikutnya, lalu mulai mencatat"
      ],
      correct: ["Periksa log, cocokkan dengan jadwal piket, cek meja baca, buat aturan pencatatan baru"],
      feedback:
        "Algorithmic thinking menuntut langkah runtut: pahami data, cocokkan bukti, verifikasi lokasi, lalu buat solusi pencegahan."
    }
  ]
};

export const pretestQuestions = [
  {
    pillar: "Decomposition",
    prompt: "Saat masalah terlalu besar, langkah awal Computational Thinking yang tepat adalah...",
    options: ["Memecah masalah menjadi bagian kecil", "Menebak jawaban tercepat", "Menghapus semua data", "Mencari warna yang menarik"],
    answer: "Memecah masalah menjadi bagian kecil"
  },
  {
    pillar: "Pattern Recognition",
    prompt: "Pola dapat ditemukan dengan cara...",
    options: ["Membandingkan data yang muncul berulang", "Mengabaikan semua kejadian", "Memilih data paling lucu", "Membuat jawaban acak"],
    answer: "Membandingkan data yang muncul berulang"
  },
  {
    pillar: "Abstraction",
    prompt: "Abstraction membantu siswa untuk...",
    options: ["Memilih informasi penting", "Menambah pengecoh", "Mengubah topik", "Menghindari alasan"],
    answer: "Memilih informasi penting"
  },
  {
    pillar: "Algorithmic Thinking",
    prompt: "Algoritma yang baik harus...",
    options: ["Runtut dan logis", "Acak dan cepat", "Panjang tanpa tujuan", "Tanpa bukti"],
    answer: "Runtut dan logis"
  }
];

export const posttestQuestions = pretestQuestions.map((question) => ({
  ...question,
  prompt: question.prompt.replace("adalah", "setelah latihan kuis adalah")
}));

export const reportRows = [
  { name: "Naya", pre: 56, post: 84, decomposition: 86, pattern: 78, abstraction: 64, algorithm: 82 },
  { name: "Raka", pre: 62, post: 76, decomposition: 78, pattern: 70, abstraction: 58, algorithm: 74 },
  { name: "Salsa", pre: 71, post: 91, decomposition: 90, pattern: 86, abstraction: 82, algorithm: 88 },
  { name: "Dimas", pre: 48, post: 70, decomposition: 72, pattern: 66, abstraction: 52, algorithm: 69 }
];

import {
  BadgeCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  ClipboardCheck,
  Compass,
  FileQuestion,
  Filter,
  Footprints,
  GitBranch,
  Lightbulb,
  Puzzle,
  Search
} from "lucide-react";

export const ctPillars = [
  {
    key: "decomposition",
    label: "Decomposition",
    shortLabel: "Pecah Masalah",
    icon: Puzzle,
    color: "bg-leaf",
    score: 82,
    description: "Memecah masalah besar menjadi bagian kecil yang mudah dipahami."
  },
  {
    key: "pattern_recognition",
    label: "Pattern Recognition",
    shortLabel: "Cari Pola",
    icon: Search,
    color: "bg-sky",
    score: 74,
    description: "Menemukan pola dari data, informasi, dan kejadian berulang."
  },
  {
    key: "abstraction",
    label: "Abstraction",
    shortLabel: "Pilih Bukti",
    icon: Filter,
    color: "bg-honey",
    score: 61,
    description: "Memilih informasi penting dan mengabaikan pengecoh."
  },
  {
    key: "algorithmic_thinking",
    label: "Algorithmic Thinking",
    shortLabel: "Susun Langkah",
    icon: GitBranch,
    color: "bg-coral",
    score: 78,
    description: "Menyusun urutan penyelesaian yang logis dan bisa diikuti."
  }
];

export const missionSteps = [
  {
    title: "Materi Kuis",
    subtitle: "Data Perpustakaan",
    status: "done",
    icon: Compass,
    helper: "Siswa membaca materi dan tujuan pembelajaran."
  },
  {
    title: "Quiz CT",
    subtitle: "Kemampuan awal",
    status: "done",
    icon: FileQuestion,
    helper: "Mengukur cara berpikir awal sebelum kuis utama."
  },
  {
    title: "Bagian 1",
    subtitle: "Decomposition",
    status: "done",
    icon: Puzzle,
    helper: "Pecah masalah menjadi data peminjaman, jadwal petugas, dan laporan buku hilang."
  },
  {
    title: "Bagian 2",
    subtitle: "Pattern Recognition",
    status: "active",
    icon: Search,
    helper: "Temukan pola dari daftar waktu kehilangan buku."
  },
  {
    title: "Bagian 3",
    subtitle: "Abstraction",
    status: "locked",
    icon: Filter,
    helper: "Pilih petunjuk yang paling relevan."
  },
  {
    title: "Bagian 4",
    subtitle: "Algorithmic Thinking",
    status: "locked",
    icon: Footprints,
    helper: "Susun langkah penyelesaian masalah."
  },
  {
    title: "Hasil Quiz",
    subtitle: "Kesimpulan solusi",
    status: "locked",
    icon: Lightbulb,
    helper: "Gabungkan informasi penting menjadi solusi."
  },
  {
    title: "Hasil",
    subtitle: "Peningkatan belajar",
    status: "locked",
    icon: ClipboardCheck,
    helper: "Bandingkan hasil setelah pembelajaran."
  }
];

export const studentProgress = {
  name: "Naya",
  className: "SMP",
  pretest: 56,
  posttest: 0,
  missionProgress: 48,
  badges: [
    { label: "Pemecah Masalah", icon: BadgeCheck },
    { label: "Pencari Pola", icon: ChartNoAxesCombined },
    { label: "Berpikir Kritis", icon: BrainCircuit }
  ]
};

export const teacherRows = [
  {
    name: "Naya",
    pretest: 56,
    posttest: 0,
    decomposition: 82,
    pattern: 74,
    abstraction: 61,
    algorithm: 78,
    note: "Perlu penguatan abstraction"
  },
  {
    name: "Raka",
    pretest: 62,
    posttest: 0,
    decomposition: 76,
    pattern: 68,
    abstraction: 58,
    algorithm: 70,
    note: "Sering memilih informasi pengecoh"
  },
  {
    name: "Salsa",
    pretest: 71,
    posttest: 0,
    decomposition: 88,
    pattern: 80,
    abstraction: 77,
    algorithm: 83,
    note: "Stabil di semua pilar"
  }
];

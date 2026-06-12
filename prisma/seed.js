const { PrismaClient, UserRole, CTPillar, TestType, ChallengeType, ProgressStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.upsert({
    where: { email: "guru@ctmission.test" },
    update: {},
    create: {
      name: "Bu Rani",
      email: "guru@ctmission.test",
      passwordHash: "prototype-password",
      role: UserRole.TEACHER
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "naya@ctmission.test" },
    update: {},
    create: {
      name: "Naya",
      email: "naya@ctmission.test",
      passwordHash: "prototype-password",
      role: UserRole.STUDENT
    }
  });

  const existingMission = await prisma.mission.findFirst({
    where: { title: "Kasus Data Perpustakaan", createdById: teacher.id }
  });

  const mission =
    existingMission ??
    (await prisma.mission.create({
      data: {
      title: "Kasus Data Perpustakaan",
      description: "Kuis interaktif untuk melatih Computational Thinking siswa SMP.",
      storyIntro:
        "Beberapa buku hilang dari rak perpustakaan. Catatan peminjaman, jadwal petugas, dan laporan siswa tidak cocok.",
      createdById: teacher.id,
      levels: {
        create: [
          {
            pillar: CTPillar.DECOMPOSITION,
            title: "Pecah Kasus Besar",
            description: "Siswa memecah kasus menjadi beberapa bagian data.",
            order: 1,
            challenges: {
              create: [
                {
                  type: ChallengeType.SELECT_RELEVANT_INFO,
                  prompt: "Pilih bagian masalah yang perlu diselidiki lebih dulu.",
                  correctAnswer: ["Catatan peminjaman", "Jadwal piket", "Laporan buku hilang"],
                  feedbackCorrect: "Kamu berhasil memecah kasus menjadi sumber data utama.",
                  feedbackWrong: "Coba pilih bagian yang berhubungan langsung dengan kasus kehilangan buku.",
                  options: {
                    create: [
                      { text: "Catatan peminjaman", isCorrect: true, order: 1 },
                      { text: "Warna sampul buku", isCorrect: false, order: 2 },
                      { text: "Jadwal piket", isCorrect: true, order: 3 },
                      { text: "Laporan buku hilang", isCorrect: true, order: 4 }
                    ]
                  }
                }
              ]
            }
          },
          {
            pillar: CTPillar.PATTERN_RECOGNITION,
            title: "Temukan Pola",
            description: "Siswa mencari pola dari data kejadian.",
            order: 2
          },
          {
            pillar: CTPillar.ABSTRACTION,
            title: "Saring Bukti",
            description: "Siswa memilih informasi penting dan membuang pengecoh.",
            order: 3
          },
          {
            pillar: CTPillar.ALGORITHMIC_THINKING,
            title: "Susun Langkah Solusi",
            description: "Siswa menyusun langkah penyelesaian kasus.",
            order: 4
          }
        ]
      },
      tests: {
        create: [
          {
            type: TestType.PRE_TEST,
            title: "Bank Soal Quiz",
            questions: {
              create: [
                {
                  pillar: CTPillar.DECOMPOSITION,
                  type: ChallengeType.MULTIPLE_CHOICE,
                  prompt: "Saat masalah terlalu besar, langkah awal yang tepat adalah...",
                  correctAnswer: "Memecah masalah menjadi bagian kecil",
                  score: 10,
                  options: {
                    create: [
                      { text: "Memecah masalah menjadi bagian kecil", isCorrect: true, order: 1 },
                      { text: "Menebak jawaban tercepat", isCorrect: false, order: 2 }
                    ]
                  }
                }
              ]
            }
          },
          {
            type: TestType.POST_TEST,
            title: "Bank Soal Quiz"
          }
        ]
      }
    }
    }));

  await prisma.studentMissionProgress.upsert({
    where: { studentId_missionId: { studentId: student.id, missionId: mission.id } },
    update: {},
    create: {
      studentId: student.id,
      missionId: mission.id,
      currentLevelOrder: 1,
      status: ProgressStatus.IN_PROGRESS,
      startedAt: new Date()
    }
  });

  const existingBadge = await prisma.badge.findFirst({ where: { name: "Pemecah Masalah" } });
  const badge =
    existingBadge ??
    (await prisma.badge.create({
      data: {
        name: "Pemecah Masalah",
        description: "Menyelesaikan level Decomposition.",
        criteria: { pillar: "DECOMPOSITION", minimumScore: 70 }
      }
    }));

  await prisma.studentBadge.upsert({
    where: { studentId_badgeId: { studentId: student.id, badgeId: badge.id } },
    update: {},
    create: { studentId: student.id, badgeId: badge.id }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

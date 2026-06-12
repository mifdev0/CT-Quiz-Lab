"use server";

import { ChallengeType, CTPillar, TestType, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, hashPassword, requireUser, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMissionPackageWithGroq, reviewEssayWithGroq } from "@/lib/groq";
import { setFlash } from "@/lib/flash";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optionsFrom(formData: FormData) {
  return [1, 2, 3, 4].map((n) => text(formData, `option${n}`)).filter(Boolean);
}

function answerFrom(formData: FormData, qType: ChallengeType) {
  if (qType !== ChallengeType.MULTIPLE_CHOICE) return text(formData, "answer");
  const answerChoice = text(formData, "answerChoice");
  if (answerChoice.startsWith("option")) return text(formData, answerChoice);
  return text(formData, "answer");
}

function questionType(formData: FormData) {
  const value = text(formData, "questionType");
  if (value === "TRUE_FALSE") return ChallengeType.TRUE_FALSE;
  if (value === "SHORT_ANSWER") return ChallengeType.SHORT_ANSWER;
  return ChallengeType.MULTIPLE_CHOICE;
}

function isCorrectAnswer(expected: unknown, actual: string) {
  return String(expected).trim().toLowerCase() === actual.trim().toLowerCase();
}

async function assertTeacherMission(teacherId: string, missionId: string) {
  const mission = await prisma.mission.findFirst({ where: { id: missionId, createdById: teacherId } });
  if (!mission) redirect("/teacher?error=Akses ditolak");
  return mission;
}

async function assertTeacherMaterial(teacherId: string, materialId: string) {
  const material = await prisma.material.findFirst({ where: { id: materialId, createdById: teacherId } });
  if (!material) redirect("/teacher/materials?error=Materi tidak ditemukan");
  return material;
}

export async function registerAction(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const role = text(formData, "role") === "TEACHER" ? UserRole.TEACHER : UserRole.STUDENT;
  if (!name || !email || !password) redirect("/login?error=Lengkapi data register");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/login?error=Email sudah terdaftar, silakan login");
  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password), role }
  });
  setSession(user.id);
  redirect(role === UserRole.TEACHER ? "/teacher" : "/student");
}

export async function loginAction(formData: FormData) {
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  if (!email || !password) redirect("/login?error=Email dan password wajib diisi");
  const passwordHash = hashPassword(password);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login?error=Email belum terdaftar");
  if (user.passwordHash !== passwordHash) redirect("/login?error=Password salah");
  setSession(user.id);
  redirect(user.role === UserRole.TEACHER ? "/teacher" : "/student");
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}

export async function createMaterialAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const title = text(formData, "title");
  const content = text(formData, "content");
  if (!title || !content) {
    setFlash("error", "Judul dan isi materi wajib diisi");
    redirect("/teacher/materials");
  }
  await prisma.material.create({ data: { title, content, createdById: teacher.id } });
  revalidatePath("/teacher/materials");
  setFlash("success", "Materi berhasil ditambahkan");
  redirect("/teacher/materials");
}

export async function updateMaterialAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const materialId = text(formData, "materialId");
  const title = text(formData, "title");
  const content = text(formData, "content");
  if (!title || !content) {
    setFlash("error", "Judul dan isi materi wajib diisi");
    redirect("/teacher/materials");
  }
  await assertTeacherMaterial(teacher.id, materialId);
  await prisma.material.update({ where: { id: materialId }, data: { title, content } });
  revalidatePath("/teacher/materials");
  setFlash("success", "Materi berhasil diperbarui");
  redirect("/teacher/materials");
}

export async function deleteMaterialAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const materialId = text(formData, "materialId");
  await assertTeacherMaterial(teacher.id, materialId);
  await prisma.material.delete({ where: { id: materialId } });
  revalidatePath("/teacher/materials");
  setFlash("success", "Materi berhasil dihapus");
  redirect("/teacher/materials");
}

export async function createMissionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const title = text(formData, "title");
  const materialId = text(formData, "materialId");
  if (!title) {
    setFlash("error", "Judul wajib diisi");
    redirect("/teacher/missions");
  }
  if (!materialId) {
    setFlash("error", "Pilih materi terlebih dahulu sebelum membuat kuis");
    redirect("/teacher/missions");
  }
  const material = await assertTeacherMaterial(teacher.id, materialId);
  await prisma.mission.create({
    data: {
      title,
      description: text(formData, "description"),
      storyIntro: material.content,
      materialId: material.id,
      createdById: teacher.id,
      levels: {
        create: [
          { order: 1, pillar: CTPillar.DECOMPOSITION, title: "Decomposition - Pecah Masalah", description: "Memecah masalah besar menjadi beberapa bagian kecil yang bisa diselidiki." },
          { order: 2, pillar: CTPillar.PATTERN_RECOGNITION, title: "Pattern Recognition - Cari Pola", description: "Menemukan pola dari data atau kejadian yang berulang." },
          { order: 3, pillar: CTPillar.ABSTRACTION, title: "Abstraction - Pilih Informasi Penting", description: "Memilih informasi penting dan mengabaikan pengecoh." },
          { order: 4, pillar: CTPillar.ALGORITHMIC_THINKING, title: "Algorithmic Thinking - Susun Langkah", description: "Menyusun urutan solusi yang logis dan bisa diikuti." }
        ]
      },
      tests: { create: [{ type: TestType.PRE_TEST, title: "Bank Soal A" }, { type: TestType.POST_TEST, title: "Bank Soal B" }] }
    }
  });
  revalidatePath("/teacher/missions");
  setFlash("success", "Kuis berhasil ditambahkan");
  redirect("/teacher/missions");
}

export async function generateInstantMissionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const materialId = text(formData, "materialId");
  if (!materialId) {
    setFlash("error", "Pilih materi terlebih dahulu");
    redirect("/teacher/missions");
  }
  const material = await assertTeacherMaterial(teacher.id, materialId);
  const prompt = `Judul materi: ${material.title}\n\nIsi materi:\n${material.content}`;

  try {
    const generated = await generateMissionPackageWithGroq(prompt);
    await prisma.$transaction(async (tx) => {
      const mission = await tx.mission.create({
        data: {
          title: generated.title,
          description: generated.description,
          storyIntro: material.content,
          materialId: material.id,
          createdById: teacher.id,
          levels: {
            create: [
              { order: 1, pillar: CTPillar.DECOMPOSITION, title: "Decomposition - Pecah Masalah", description: "Memecah masalah besar menjadi beberapa bagian kecil yang bisa diselidiki." },
              { order: 2, pillar: CTPillar.PATTERN_RECOGNITION, title: "Pattern Recognition - Cari Pola", description: "Menemukan pola dari data atau kejadian yang berulang." },
              { order: 3, pillar: CTPillar.ABSTRACTION, title: "Abstraction - Pilih Informasi Penting", description: "Memilih informasi penting dan mengabaikan pengecoh." },
              { order: 4, pillar: CTPillar.ALGORITHMIC_THINKING, title: "Algorithmic Thinking - Susun Langkah", description: "Menyusun urutan solusi yang logis dan bisa diikuti." }
            ]
          },
          tests: {
            create: [
              { type: TestType.PRE_TEST, title: "Bank Soal A" },
              { type: TestType.POST_TEST, title: "Bank Soal B" }
            ]
          }
        },
        include: { levels: true, tests: true }
      });

      const createQuestion = async (testType: TestType, item: Awaited<ReturnType<typeof generateMissionPackageWithGroq>>["preTest"][number]) => {
        const test = mission.tests.find((row) => row.type === testType);
        if (!test) return;
        await tx.testQuestion.create({
          data: {
            testId: test.id,
            pillar: item.pillar as CTPillar,
            type: item.type as ChallengeType,
            prompt: item.prompt,
            correctAnswer: item.answer,
            score: 10,
            options: item.type === "SHORT_ANSWER" ? undefined : {
              create: (item.options || []).map((option, index) => ({
                text: option,
                isCorrect: option === item.answer,
                order: index + 1
              }))
            }
          }
        });
      };

      for (const item of generated.preTest) await createQuestion(TestType.PRE_TEST, item);
      for (const item of generated.postTest) await createQuestion(TestType.POST_TEST, item);

      for (const item of generated.challenges) {
        const level = mission.levels.find((row) => row.pillar === item.pillar);
        if (!level) continue;
        await tx.challenge.create({
          data: {
            levelId: level.id,
            type: item.type as ChallengeType,
            prompt: item.prompt,
            correctAnswer: item.answer,
            score: 10,
            feedbackCorrect: item.feedbackCorrect,
            feedbackWrong: item.feedbackWrong,
            options: item.type === "SHORT_ANSWER" ? undefined : {
              create: (item.options || []).map((option, index) => ({
                text: option,
                isCorrect: option === item.answer,
                order: index + 1
              }))
            }
          }
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI gagal membuat kuis";
    setFlash("error", message);
    redirect("/teacher/missions");
  }

  revalidatePath("/teacher/missions");
  revalidatePath("/teacher/tests");
  revalidatePath("/teacher/challenges");
  setFlash("success", "Kuis instan AI berhasil dibuat");
  redirect("/teacher/missions");
}

export async function updateMissionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const missionId = text(formData, "missionId");
  const title = text(formData, "title");
  const materialId = text(formData, "materialId");
  if (!title) {
    setFlash("error", "Judul wajib diisi");
    redirect("/teacher/missions");
  }
  await assertTeacherMission(teacher.id, missionId);
  const material = materialId ? await assertTeacherMaterial(teacher.id, materialId) : null;
  await prisma.mission.update({
    where: { id: missionId },
    data: {
      title,
      description: text(formData, "description"),
      storyIntro: material?.content || text(formData, "storyIntro"),
      materialId: material?.id
    }
  });
  revalidatePath("/teacher/missions");
  setFlash("success", "Kuis berhasil diperbarui");
  redirect("/teacher/missions");
}

export async function deleteMissionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const missionId = text(formData, "missionId");
  await assertTeacherMission(teacher.id, missionId);
  await prisma.mission.delete({ where: { id: missionId } });
  revalidatePath("/teacher/missions");
  setFlash("success", "Kuis berhasil dihapus");
  redirect("/teacher/missions");
}

export async function createTestQuestionAction(formData: FormData) {
  await requireUser(UserRole.TEACHER);
  const missionId = text(formData, "missionId");
  const type = text(formData, "testType") === "POST_TEST" ? TestType.POST_TEST : TestType.PRE_TEST;
  const qType = questionType(formData);
  const options = qType === ChallengeType.TRUE_FALSE ? ["Benar", "Salah"] : optionsFrom(formData);
  const answer = answerFrom(formData, qType);
  const test = await prisma.test.findUnique({ where: { missionId_type: { missionId, type } } });
  if (!test || !answer || (qType !== ChallengeType.SHORT_ANSWER && options.length < 2)) redirect("/teacher/tests?error=Data soal belum lengkap");
  await prisma.testQuestion.create({
    data: {
      testId: test.id,
      pillar: text(formData, "pillar") as CTPillar,
      type: qType,
      prompt: text(formData, "prompt"),
      correctAnswer: answer,
      score: 10,
      options: qType === ChallengeType.SHORT_ANSWER ? undefined : { create: options.map((option, index) => ({ text: option, isCorrect: option === answer, order: index + 1 })) }
    }
  });
  revalidatePath("/teacher/tests");
  redirect("/teacher/tests?success=Soal berhasil ditambahkan");
}

export async function updateTestQuestionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const questionId = text(formData, "questionId");
  const question = await prisma.testQuestion.findUnique({ where: { id: questionId }, include: { test: true } });
  if (!question) redirect("/teacher/tests?error=Soal tidak ditemukan");
  await assertTeacherMission(teacher.id, question.test.missionId);
  const qType = questionType(formData);
  const options = qType === ChallengeType.TRUE_FALSE ? ["Benar", "Salah"] : optionsFrom(formData);
  const answer = answerFrom(formData, qType);
  if (!answer || (qType !== ChallengeType.SHORT_ANSWER && options.length < 2)) redirect("/teacher/tests?error=Data edit soal belum lengkap");
  await prisma.testOption.deleteMany({ where: { questionId } });
  await prisma.testQuestion.update({
    where: { id: questionId },
    data: {
      pillar: text(formData, "pillar") as CTPillar,
      type: qType,
      prompt: text(formData, "prompt"),
      correctAnswer: answer,
      options: qType === ChallengeType.SHORT_ANSWER ? undefined : { create: options.map((option, index) => ({ text: option, isCorrect: option === answer, order: index + 1 })) }
    }
  });
  revalidatePath("/teacher/tests");
  redirect("/teacher/tests?success=Soal berhasil diperbarui");
}

export async function deleteTestQuestionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const questionId = text(formData, "questionId");
  const question = await prisma.testQuestion.findUnique({ where: { id: questionId }, include: { test: true } });
  if (!question) redirect("/teacher/tests?error=Soal tidak ditemukan");
  await assertTeacherMission(teacher.id, question.test.missionId);
  await prisma.testQuestion.delete({ where: { id: questionId } });
  revalidatePath("/teacher/tests");
  redirect("/teacher/tests?success=Soal berhasil dihapus");
}

export async function duplicateTestQuestionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const questionId = text(formData, "questionId");
  const question = await prisma.testQuestion.findUnique({
    where: { id: questionId },
    include: { test: true, options: { orderBy: { order: "asc" } } }
  });
  if (!question) redirect("/teacher/tests?error=Soal tidak ditemukan");
  await assertTeacherMission(teacher.id, question.test.missionId);
  await prisma.testQuestion.create({
    data: {
      testId: question.testId,
      pillar: question.pillar,
      type: question.type,
      prompt: `${question.prompt} (salinan)`,
      correctAnswer: String(question.correctAnswer),
      score: question.score,
      options: question.type === ChallengeType.SHORT_ANSWER ? undefined : {
        create: question.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect, order: option.order }))
      }
    }
  });
  revalidatePath("/teacher/tests");
  redirect("/teacher/tests?success=Soal berhasil diduplikasi");
}

export async function createChallengeAction(formData: FormData) {
  await requireUser(UserRole.TEACHER);
  const levelId = text(formData, "levelId");
  const qType = questionType(formData);
  const options = qType === ChallengeType.TRUE_FALSE ? ["Benar", "Salah"] : optionsFrom(formData);
  const answer = answerFrom(formData, qType);
  if (!levelId || !answer || (qType !== ChallengeType.SHORT_ANSWER && options.length < 2)) redirect("/teacher/challenges?error=Data soal interaktif belum lengkap");
  await prisma.challenge.create({
    data: {
      levelId,
      type: qType,
      prompt: text(formData, "prompt"),
      correctAnswer: answer,
      score: 10,
      feedbackCorrect: text(formData, "feedbackCorrect") || "Jawabanmu tepat. Alasanmu sudah sesuai dengan pilar CT.",
      feedbackWrong: text(formData, "feedbackWrong") || "Coba evaluasi lagi bukti dan alasan yang kamu pakai.",
      options: qType === ChallengeType.SHORT_ANSWER ? undefined : { create: options.map((option, index) => ({ text: option, isCorrect: option === answer, order: index + 1 })) }
    }
  });
  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges?success=Soal interaktif berhasil ditambahkan");
}

export async function updateChallengeAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const challengeId = text(formData, "challengeId");
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, include: { level: true } });
  if (!challenge) redirect("/teacher/challenges?error=Soal interaktif tidak ditemukan");
  await assertTeacherMission(teacher.id, challenge.level.missionId);
  const qType = questionType(formData);
  const options = qType === ChallengeType.TRUE_FALSE ? ["Benar", "Salah"] : optionsFrom(formData);
  const answer = answerFrom(formData, qType);
  if (!answer || (qType !== ChallengeType.SHORT_ANSWER && options.length < 2)) redirect("/teacher/challenges?error=Data edit soal interaktif belum lengkap");
  await prisma.challengeOption.deleteMany({ where: { challengeId } });
  await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      type: qType,
      prompt: text(formData, "prompt"),
      correctAnswer: answer,
      feedbackCorrect: text(formData, "feedbackCorrect") || "Jawabanmu tepat. Alasanmu sudah sesuai dengan pilar CT.",
      feedbackWrong: text(formData, "feedbackWrong") || "Coba evaluasi lagi bukti dan alasan yang kamu pakai.",
      options: qType === ChallengeType.SHORT_ANSWER ? undefined : { create: options.map((option, index) => ({ text: option, isCorrect: option === answer, order: index + 1 })) }
    }
  });
  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges?success=Soal interaktif berhasil diperbarui");
}

export async function deleteChallengeAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const challengeId = text(formData, "challengeId");
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, include: { level: true } });
  if (!challenge) redirect("/teacher/challenges?error=Soal interaktif tidak ditemukan");
  await assertTeacherMission(teacher.id, challenge.level.missionId);
  await prisma.challenge.delete({ where: { id: challengeId } });
  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges?success=Soal interaktif berhasil dihapus");
}

export async function duplicateChallengeAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const challengeId = text(formData, "challengeId");
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { level: true, options: { orderBy: { order: "asc" } } }
  });
  if (!challenge) redirect("/teacher/challenges?error=Soal interaktif tidak ditemukan");
  await assertTeacherMission(teacher.id, challenge.level.missionId);
  await prisma.challenge.create({
    data: {
      levelId: challenge.levelId,
      type: challenge.type,
      prompt: `${challenge.prompt} (salinan)`,
      correctAnswer: String(challenge.correctAnswer),
      score: challenge.score,
      feedbackCorrect: challenge.feedbackCorrect,
      feedbackWrong: challenge.feedbackWrong,
      options: challenge.type === ChallengeType.SHORT_ANSWER ? undefined : {
        create: challenge.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect, order: option.order }))
      }
    }
  });
  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges?success=Soal interaktif berhasil diduplikasi");
}

export async function submitTestAction(formData: FormData) {
  const student = await requireUser(UserRole.STUDENT);
  const testId = text(formData, "testId");
  const next = text(formData, "next") || "/student/results";
  const questions = await prisma.testQuestion.findMany({ where: { testId }, include: { test: true } });
  const existing = await prisma.studentTestAnswer.findFirst({
    where: { studentId: student.id, testQuestionId: { in: questions.map((question) => question.id) } }
  });
  if (existing) redirect("/student/results?error=Kuis sudah pernah dikerjakan");
  for (const question of questions) {
    const answer = text(formData, question.id);
    if (!answer) continue;
    const aiReview = question.type === ChallengeType.SHORT_ANSWER
      ? await reviewEssayWithGroq({
          prompt: question.prompt,
          studentAnswer: answer,
          rubricAnswer: String(question.correctAnswer),
          pillar: question.pillar
        })
      : null;
    const correct = aiReview ? aiReview.isCorrect : isCorrectAnswer(question.correctAnswer, answer);
    await prisma.studentTestAnswer.create({
      data: {
        studentId: student.id,
        testQuestionId: question.id,
        answer,
        isCorrect: correct,
        scoreObtained: aiReview ? aiReview.score : correct ? question.score : 0,
        aiScore: aiReview?.score,
        aiFeedback: aiReview ? `${aiReview.feedback}\n\nCatatan: ${aiReview.weakness}` : undefined,
        needsReview: Boolean(aiReview)
      }
    });
  }
  redirect(next);
}

export async function submitChallengesAction(formData: FormData) {
  const student = await requireUser(UserRole.STUDENT);
  const missionId = text(formData, "missionId");
  const challenges = await prisma.challenge.findMany({ where: { level: { missionId } }, include: { level: true } });
  const existing = await prisma.studentChallengeAnswer.findFirst({
    where: { studentId: student.id, challengeId: { in: challenges.map((challenge) => challenge.id) } }
  });
  if (existing) redirect(`/student/results?error=Kuis sudah pernah dikerjakan`);
  for (const challenge of challenges) {
    const answer = text(formData, challenge.id);
    if (!answer) continue;
    const aiReview = challenge.type === ChallengeType.SHORT_ANSWER
      ? await reviewEssayWithGroq({
          prompt: challenge.prompt,
          studentAnswer: answer,
          rubricAnswer: String(challenge.correctAnswer),
          pillar: challenge.level.pillar
        })
      : null;
    const correct = aiReview ? aiReview.isCorrect : isCorrectAnswer(challenge.correctAnswer, answer);
    await prisma.studentChallengeAnswer.create({
      data: {
        studentId: student.id,
        challengeId: challenge.id,
        answer,
        isCorrect: correct,
        scoreObtained: aiReview ? aiReview.score : correct ? challenge.score : 0,
        aiScore: aiReview?.score,
        aiFeedback: aiReview ? `${aiReview.feedback}\n\nCatatan: ${aiReview.weakness}` : undefined,
        needsReview: Boolean(aiReview)
      }
    });
  }
  await prisma.studentMissionProgress.upsert({
    where: { studentId_missionId: { studentId: student.id, missionId } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { studentId: student.id, missionId, status: "COMPLETED", startedAt: new Date(), completedAt: new Date() }
  });
  redirect("/student/results");
}

export async function markMaterialReadAction(formData: FormData) {
  const student = await requireUser(UserRole.STUDENT);
  const missionId = text(formData, "missionId");
  const materialId = text(formData, "materialId");
  if (!materialId) redirect(`/student/mission?mission=${missionId}`);
  await prisma.studentMaterialRead.upsert({
    where: { studentId_materialId: { studentId: student.id, materialId } },
    update: { readAt: new Date() },
    create: { studentId: student.id, materialId }
  });
  redirect(`/student/mission?mission=${missionId}`);
}

export async function resetStudentMissionAction(formData: FormData) {
  const teacher = await requireUser(UserRole.TEACHER);
  const studentId = text(formData, "studentId");
  const missionId = text(formData, "missionId");
  await assertTeacherMission(teacher.id, missionId);
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      tests: { include: { questions: true } },
      levels: { include: { challenges: true } }
    }
  });
  if (!mission) redirect("/teacher/reports?error=Kuis tidak ditemukan");
  const questionIds = mission.tests.flatMap((test) => test.questions.map((question) => question.id));
  const challengeIds = mission.levels.flatMap((level) => level.challenges.map((challenge) => challenge.id));
  await prisma.studentTestAnswer.deleteMany({ where: { studentId, testQuestionId: { in: questionIds } } });
  await prisma.studentChallengeAnswer.deleteMany({ where: { studentId, challengeId: { in: challengeIds } } });
  await prisma.studentMissionProgress.deleteMany({ where: { studentId, missionId } });
  revalidatePath("/teacher/reports");
  redirect("/teacher/reports?success=Progress siswa berhasil direset");
}

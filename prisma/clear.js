const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.studentBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.studentMissionProgress.deleteMany();
  await prisma.studentChallengeAnswer.deleteMany();
  await prisma.studentTestAnswer.deleteMany();
  await prisma.challengeOption.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.testOption.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.test.deleteMany();
  await prisma.cTLevel.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.user.deleteMany();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

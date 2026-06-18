CREATE INDEX "User_role_idx" ON "User"("role");

CREATE INDEX "Material_createdById_idx" ON "Material"("createdById");

CREATE INDEX "Mission_createdById_idx" ON "Mission"("createdById");

CREATE INDEX "Mission_materialId_idx" ON "Mission"("materialId");

CREATE INDEX "CTLevel_missionId_pillar_idx" ON "CTLevel"("missionId", "pillar");

CREATE INDEX "Challenge_levelId_idx" ON "Challenge"("levelId");

CREATE INDEX "StudentChallengeAnswer_studentId_idx" ON "StudentChallengeAnswer"("studentId");

CREATE INDEX "StudentChallengeAnswer_challengeId_idx" ON "StudentChallengeAnswer"("challengeId");

CREATE INDEX "StudentMissionProgress_studentId_status_idx" ON "StudentMissionProgress"("studentId", "status");

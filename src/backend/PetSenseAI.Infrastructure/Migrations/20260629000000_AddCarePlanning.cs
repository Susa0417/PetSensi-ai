using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PetSenseAI.Infrastructure.Data;

#nullable disable

namespace PetSenseAI.Infrastructure.Migrations;

[DbContext(typeof(PetSenseDbContext))]
[Migration("20260629000000_AddCarePlanning")]
public partial class AddCarePlanning : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "NutritionPlans" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "PetType" text NOT NULL,
                "Breed" text NOT NULL,
                "Age" integer NOT NULL,
                "Weight" numeric(8,2) NOT NULL,
                "Allergies" text NOT NULL,
                "MedicalConditions" text NOT NULL,
                "ActivityLevel" text NOT NULL,
                "CurrentFood" text NOT NULL,
                "FeedingSchedule" text NOT NULL,
                "HealthGoal" text NOT NULL,
                "RecommendedFoodType" text NOT NULL,
                "MealFrequency" text NOT NULL,
                "PortionSuggestion" text NOT NULL,
                "HydrationReminder" text NOT NULL,
                "FoodsToAvoid" text NOT NULL,
                "AllergyNotes" text NOT NULL,
                "HealthGoalGuidance" text NOT NULL,
                "GeneratedAt" timestamp with time zone NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "NutritionPlanItems" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "NutritionPlanId" uuid NOT NULL REFERENCES "NutritionPlans"("Id") ON DELETE CASCADE,
                "Category" text NOT NULL,
                "Name" text NOT NULL,
                "Recommendation" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "DailyProgressLogs" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "LogDate" timestamp with time zone NOT NULL,
                "Weight" numeric(8,2) NULL,
                "Mood" text NOT NULL,
                "ActivityLevel" text NOT NULL,
                "SleepHours" numeric(5,2) NOT NULL,
                "FoodIntake" text NOT NULL,
                "WaterIntake" text NOT NULL,
                "Symptoms" text NOT NULL,
                "MedicationTaken" boolean NOT NULL,
                "TrainingProgress" text NOT NULL,
                "Notes" text NOT NULL,
                "WellnessScore" integer NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "WellnessMetrics" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "DailyProgressLogId" uuid NULL REFERENCES "DailyProgressLogs"("Id") ON DELETE CASCADE,
                "MetricDate" timestamp with time zone NOT NULL,
                "MetricType" text NOT NULL,
                "Value" numeric(8,2) NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE INDEX IF NOT EXISTS "IX_NutritionPlans_PetProfileId" ON "NutritionPlans"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_NutritionPlanItems_NutritionPlanId" ON "NutritionPlanItems"("NutritionPlanId");
            CREATE INDEX IF NOT EXISTS "IX_DailyProgressLogs_PetProfileId" ON "DailyProgressLogs"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_WellnessMetrics_PetProfileId" ON "WellnessMetrics"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_WellnessMetrics_DailyProgressLogId" ON "WellnessMetrics"("DailyProgressLogId");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "WellnessMetrics";
            DROP TABLE IF EXISTS "DailyProgressLogs";
            DROP TABLE IF EXISTS "NutritionPlanItems";
            DROP TABLE IF EXISTS "NutritionPlans";
            """);
    }
}

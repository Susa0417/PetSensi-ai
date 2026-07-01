using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetSenseAI.Infrastructure.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            CREATE TABLE IF NOT EXISTS "Roles" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Name" text NOT NULL UNIQUE,
                "Description" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Users" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "FirstName" text NOT NULL,
                "LastName" text NOT NULL,
                "Email" text NOT NULL UNIQUE,
                "PasswordHash" text NOT NULL,
                "IsActive" boolean NOT NULL DEFAULT true,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "UserRole" (
                "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
                "RoleId" uuid NOT NULL REFERENCES "Roles"("Id") ON DELETE CASCADE,
                PRIMARY KEY ("UserId", "RoleId")
            );

            CREATE TABLE IF NOT EXISTS "RefreshTokens" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
                "TokenHash" text NOT NULL,
                "ExpiresAt" timestamp with time zone NOT NULL,
                "RevokedAt" timestamp with time zone NULL,
                "ReplacedByTokenHash" text NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "PetProfiles" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
                "Name" text NOT NULL,
                "Species" text NOT NULL,
                "Breed" text NOT NULL,
                "Age" integer NOT NULL,
                "Weight" numeric(8,2) NOT NULL,
                "Gender" text NOT NULL,
                "PhotoUrl" text NULL,
                "Allergies" text NOT NULL,
                "MedicalHistory" text NOT NULL,
                "VetName" text NOT NULL,
                "VetPhone" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "HealthLogs" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "LogDate" timestamp with time zone NOT NULL,
                "Weight" numeric(8,2) NULL,
                "WellnessScore" integer NOT NULL,
                "Symptoms" text NOT NULL,
                "Appetite" text NOT NULL,
                "Hydration" text NOT NULL,
                "EnergyLevel" text NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "BehaviorLogs" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "LogDate" timestamp with time zone NOT NULL,
                "Eating" text NOT NULL,
                "Sleeping" text NOT NULL,
                "Mood" text NOT NULL,
                "Activity" text NOT NULL,
                "BathroomHabits" text NOT NULL,
                "Symptoms" text NOT NULL,
                "UnusualBehavior" text NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "MedicationReminders" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "MedicineName" text NOT NULL,
                "Dosage" text NOT NULL,
                "Frequency" text NOT NULL,
                "StartDate" timestamp with time zone NOT NULL,
                "EndDate" timestamp with time zone NULL,
                "Status" text NOT NULL,
                "AlertTime" interval NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Appointments" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "Type" text NOT NULL,
                "Title" text NOT NULL,
                "ProviderName" text NOT NULL,
                "Location" text NOT NULL,
                "ScheduledAt" timestamp with time zone NOT NULL,
                "Status" text NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "VaccineRecords" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "VaccineName" text NOT NULL,
                "GivenDate" timestamp with time zone NOT NULL,
                "DueDate" timestamp with time zone NULL,
                "ProviderName" text NOT NULL,
                "LotNumber" text NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "MedicalRecords" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "Title" text NOT NULL,
                "RecordType" text NOT NULL,
                "RecordDate" timestamp with time zone NOT NULL,
                "ProviderName" text NOT NULL,
                "FileUrl" text NOT NULL,
                "Notes" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "TrainingGuides" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Title" text NOT NULL,
                "Species" text NOT NULL,
                "Breed" text NOT NULL,
                "AgeRange" text NOT NULL,
                "Concern" text NOT NULL,
                "Steps" text NOT NULL,
                "Difficulty" text NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "AiInsights" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "Title" text NOT NULL,
                "RiskLevel" text NOT NULL,
                "Recommendation" text NOT NULL,
                "NextAction" text NOT NULL,
                "SourceSummary" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Recommendations" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NULL REFERENCES "PetProfiles"("Id") ON DELETE SET NULL,
                "Category" text NOT NULL,
                "Title" text NOT NULL,
                "Body" text NOT NULL,
                "TriggerRule" text NOT NULL,
                "IsTemplate" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "ProgressReports" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "PetProfileId" uuid NOT NULL REFERENCES "PetProfiles"("Id") ON DELETE CASCADE,
                "PeriodStart" timestamp with time zone NOT NULL,
                "PeriodEnd" timestamp with time zone NOT NULL,
                "AverageWellnessScore" integer NOT NULL,
                "BehaviorTrend" text NOT NULL,
                "HealthTrend" text NOT NULL,
                "Summary" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "WebsiteSections" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Key" text NOT NULL UNIQUE,
                "Title" text NOT NULL,
                "Subtitle" text NOT NULL,
                "Body" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "HeroSections" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Title" text NOT NULL,
                "Headline" text NOT NULL,
                "Subtitle" text NOT NULL,
                "PrimaryCtaText" text NOT NULL,
                "SecondaryCtaText" text NOT NULL,
                "ImageUrl" text NOT NULL,
                "IsActive" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Problems" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Title" text NOT NULL,
                "Description" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Solutions" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Title" text NOT NULL,
                "Description" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Features" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Title" text NOT NULL,
                "Description" text NOT NULL,
                "Icon" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "HowItWorksSteps" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Title" text NOT NULL,
                "Description" text NOT NULL,
                "StepNumber" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "TargetCustomers" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Name" text NOT NULL,
                "Description" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "ComparisonItems" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Capability" text NOT NULL,
                "PetSenseValue" text NOT NULL,
                "TraditionalValue" text NOT NULL,
                "SortOrder" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "Testimonials" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "CustomerName" text NOT NULL,
                "CustomerRole" text NOT NULL,
                "Quote" text NOT NULL,
                "Rating" integer NOT NULL,
                "IsPublished" boolean NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "ContactSubmissions" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "Name" text NOT NULL,
                "Email" text NOT NULL,
                "Phone" text NOT NULL,
                "PetType" text NOT NULL,
                "Message" text NOT NULL,
                "Status" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE TABLE IF NOT EXISTS "MediaFiles" (
                "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "FileName" text NOT NULL,
                "ContentType" text NOT NULL,
                "Size" bigint NOT NULL,
                "Url" text NOT NULL,
                "Category" text NOT NULL,
                "AltText" text NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NULL,
                "CreatedBy" text NULL,
                "UpdatedBy" text NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false,
                "DeletedAt" timestamp with time zone NULL
            );

            CREATE INDEX IF NOT EXISTS "IX_PetProfiles_UserId" ON "PetProfiles"("UserId");
            CREATE INDEX IF NOT EXISTS "IX_HealthLogs_PetProfileId" ON "HealthLogs"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_BehaviorLogs_PetProfileId" ON "BehaviorLogs"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_Appointments_PetProfileId" ON "Appointments"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_MedicationReminders_PetProfileId" ON "MedicationReminders"("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_ContactSubmissions_Email" ON "ContactSubmissions"("Email");
            CREATE INDEX IF NOT EXISTS "IX_MediaFiles_Category" ON "MediaFiles"("Category");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "MediaFiles";
            DROP TABLE IF EXISTS "ContactSubmissions";
            DROP TABLE IF EXISTS "Testimonials";
            DROP TABLE IF EXISTS "ComparisonItems";
            DROP TABLE IF EXISTS "TargetCustomers";
            DROP TABLE IF EXISTS "HowItWorksSteps";
            DROP TABLE IF EXISTS "Features";
            DROP TABLE IF EXISTS "Solutions";
            DROP TABLE IF EXISTS "Problems";
            DROP TABLE IF EXISTS "HeroSections";
            DROP TABLE IF EXISTS "WebsiteSections";
            DROP TABLE IF EXISTS "ProgressReports";
            DROP TABLE IF EXISTS "Recommendations";
            DROP TABLE IF EXISTS "AiInsights";
            DROP TABLE IF EXISTS "TrainingGuides";
            DROP TABLE IF EXISTS "MedicalRecords";
            DROP TABLE IF EXISTS "VaccineRecords";
            DROP TABLE IF EXISTS "Appointments";
            DROP TABLE IF EXISTS "MedicationReminders";
            DROP TABLE IF EXISTS "BehaviorLogs";
            DROP TABLE IF EXISTS "HealthLogs";
            DROP TABLE IF EXISTS "PetProfiles";
            DROP TABLE IF EXISTS "RefreshTokens";
            DROP TABLE IF EXISTS "UserRole";
            DROP TABLE IF EXISTS "Users";
            DROP TABLE IF EXISTS "Roles";
            """);
    }
}

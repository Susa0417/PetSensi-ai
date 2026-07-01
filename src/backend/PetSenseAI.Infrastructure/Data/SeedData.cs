using PetSenseAI.Application.Abstractions;
using PetSenseAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace PetSenseAI.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(PetSenseDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        if (dbContext.Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
        {
            await dbContext.Database.EnsureCreatedAsync(cancellationToken);
            await EnsureCareSchemaAsync(dbContext, cancellationToken);
        }
        else
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }

        if (!await dbContext.Roles.AnyAsync(cancellationToken))
        {
            dbContext.Roles.AddRange(
                new Role { Name = "Admin", Description = "Can manage users, app content, and website content." },
                new Role { Name = "User", Description = "Can manage personal pet care workspace." });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (!await dbContext.Users.AnyAsync(x => x.Email == "admin@petsense.ai", cancellationToken))
        {
            var adminRole = await dbContext.Roles.FirstAsync(x => x.Name == "Admin", cancellationToken);
            dbContext.Users.Add(new User
            {
                FirstName = "PetSense",
                LastName = "Admin",
                Email = "admin@petsense.ai",
                PasswordHash = passwordHasher.Hash("Admin123!"),
                UserRoles = [new UserRole { RoleId = adminRole.Id }]
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (!await dbContext.HeroSections.AnyAsync(cancellationToken))
        {
            dbContext.HeroSections.Add(new HeroSection
            {
                Title = "PetSense AI",
                Headline = "Complete Care for Every Pet",
                Subtitle = "Track your pet's health, create personalized nutrition plans, monitor daily progress, and understand your pet like never before.",
                PrimaryCtaText = "Start Tracking",
                SecondaryCtaText = "Create Nutrition Plan",
                ImageUrl = "assets/petsense-complete-care.png"
            });
        }

        if (!await dbContext.WebsiteSections.AnyAsync(cancellationToken))
        {
            dbContext.WebsiteSections.AddRange(
                new WebsiteSection { Key = "why-now", Title = "Why Now", Subtitle = "Pet care is becoming proactive.", Body = "Owners expect the same intelligent tracking for pets that they already use for personal wellness. PetSense AI turns daily observations into safer, earlier decisions.", SortOrder = 1 },
                new WebsiteSection { Key = "contact", Title = "Join the PetSense AI waitlist", Subtitle = "Get early access.", Body = "Tell us about your pet and we will invite you as new care workflows launch.", SortOrder = 2 });
        }

        if (!await dbContext.Problems.AnyAsync(cancellationToken))
        {
            dbContext.Problems.AddRange(ToProblem("Pets hide symptoms until conditions become serious", 1),
                ToProblem("Poor management of health records", 2),
                ToProblem("Owners forget medication and appointments", 3),
                ToProblem("First-time pet parents need training guidance", 4),
                ToProblem("Pets cannot speak human language", 5));
        }

        if (!await dbContext.Solutions.AnyAsync(cancellationToken))
        {
            dbContext.Solutions.AddRange(ToSolution("Monitor pet behavior", 1),
                ToSolution("Track health and wellness", 2),
                ToSolution("Manage medication and appointments", 3),
                ToSolution("Provide training guidance", 4),
                ToSolution("Create complete pet profiles", 5));
        }

        if (!await dbContext.Features.AnyAsync(cancellationToken))
        {
            dbContext.Features.AddRange(
                ToFeature("Health and wellness intelligence", "Score daily health patterns with context.", "health_and_safety", 1),
                ToFeature("Behavior tracking", "Capture eating, sleeping, mood, activity, bathroom habits, and unusual behavior.", "psychology", 2),
                ToFeature("Symptom analysis", "Turn owner notes into vet-safe next steps.", "monitor_heart", 3),
                ToFeature("Training assistant", "Guidance by pet age, breed, behavior, and owner concern.", "school", 4),
                ToFeature("Vaccine and appointment care management", "Keep reminders and visits organized.", "event_available", 5),
                ToFeature("Pet medical records", "Store vaccine history and important documents.", "folder_special", 6),
                ToFeature("Wellness scoring", "Track progress over time.", "insights", 7),
                ToFeature("AI behavior analysis", "Understand patterns across logs and medication data.", "auto_awesome", 8));
        }

        if (!await dbContext.HowItWorksSteps.AnyAsync(cancellationToken))
        {
            dbContext.HowItWorksSteps.AddRange(
                ToStep("Create pet profile", "Add breed, age, weight, allergies, vet info, vaccines, and records.", 1),
                ToStep("Log behavior and health updates", "Track daily eating, sleep, mood, symptoms, and notes.", 2),
                ToStep("AI analyzes patterns", "PetSense reviews trends across health, behavior, and medication.", 3),
                ToStep("Receive insights and recommendations", "Get risk level, recommendation, and a clear next action.", 4),
                ToStep("Track overall progress", "Use reports and charts to see wellness changes over time.", 5));
        }

        if (!await dbContext.TargetCustomers.AnyAsync(cancellationToken))
        {
            dbContext.TargetCustomers.AddRange(
                ToCustomer("Pet parents", "Households that want a single place for health, behavior, and care routines.", 1),
                ToCustomer("First-time owners", "New pet parents who need training and wellness guidance.", 2),
                ToCustomer("Multi-pet homes", "Families managing multiple schedules, records, and reminders.", 3),
                ToCustomer("Veterinary partners", "Care teams that benefit from clearer owner-provided history.", 4));
        }

        if (!await dbContext.ComparisonItems.AnyAsync(cancellationToken))
        {
            dbContext.ComparisonItems.AddRange(
                ToComparison("Health history", "Unified profile, logs, records, vaccines", "Scattered notes and paper records", 1),
                ToComparison("Medication adherence", "Reminder schedules with status", "Manual memory or calendar only", 2),
                ToComparison("Behavior insight", "Pattern-based guidance", "Guesswork from isolated moments", 3),
                ToComparison("Training support", "Age, breed, and concern-aware guides", "Generic articles", 4));
        }

        if (!await dbContext.Testimonials.AnyAsync(cancellationToken))
        {
            dbContext.Testimonials.AddRange(
                new Testimonial { CustomerName = "Maya R.", CustomerRole = "Dog parent", Quote = "PetSense AI helped me notice a sleep and appetite change before our vet visit.", Rating = 5 },
                new Testimonial { CustomerName = "Daniel K.", CustomerRole = "Cat parent", Quote = "Medication reminders and records finally live in one place.", Rating = 5 });
        }

        if (!await dbContext.TrainingGuides.AnyAsync(cancellationToken))
        {
            dbContext.TrainingGuides.AddRange(
                new TrainingGuide { Title = "Puppy crate confidence", Species = "Dog", AgeRange = "8 weeks - 6 months", Concern = "Crate training", Steps = "Start with short positive sessions. Feed meals near the crate. Increase quiet time gradually. Never use the crate as punishment.", Difficulty = "Beginner" },
                new TrainingGuide { Title = "Cat carrier desensitization", Species = "Cat", AgeRange = "Any", Concern = "Vet visit anxiety", Steps = "Leave the carrier open in a calm room. Add treats and bedding. Practice short closes before travel day.", Difficulty = "Beginner" });
        }

        await UpsertCompleteCareContentAsync(dbContext, cancellationToken);

        if (!await dbContext.Users.AnyAsync(x => x.Email == "owner@petsense.ai", cancellationToken))
        {
            var userRole = await dbContext.Roles.FirstAsync(x => x.Name == "User", cancellationToken);
            var sampleUser = new User
            {
                FirstName = "Sample",
                LastName = "Owner",
                Email = "owner@petsense.ai",
                PasswordHash = passwordHasher.Hash("Owner123!"),
                UserRoles = [new UserRole { RoleId = userRole.Id }]
            };
            var pet = new PetProfile
            {
                User = sampleUser,
                Name = "Buddy",
                Species = "Dog",
                Breed = "Golden Retriever",
                Age = 4,
                Weight = 68,
                Gender = "Male",
                Allergies = "Chicken sensitivity",
                MedicalHistory = "Routine wellness care",
                VetName = "Northside Animal Clinic",
                VetPhone = "555-0177"
            };
            pet.HealthLogs.Add(new HealthLog { WellnessScore = 82, Weight = 68, Appetite = "Normal", Hydration = "Good", EnergyLevel = "Playful", Symptoms = "", Notes = "Morning walk and normal meals." });
            pet.BehaviorLogs.Add(new BehaviorLog { Eating = "Normal", Sleeping = "8 hours", Mood = "Happy", Activity = "High", BathroomHabits = "Normal", Symptoms = "", UnusualBehavior = "", Notes = "Responded well to training." });
            pet.MedicationReminders.Add(new MedicationReminder { MedicineName = "Flea prevention", Dosage = "1 chew", Frequency = "Monthly", StartDate = DateTime.UtcNow.Date, AlertTime = new TimeSpan(9, 0, 0) });
            pet.Appointments.Add(new Appointment { Type = "Vet Visit", Title = "Annual wellness exam", ProviderName = "Northside Animal Clinic", Location = "Main clinic", ScheduledAt = DateTime.UtcNow.AddDays(14) });
            pet.VaccineRecords.Add(new VaccineRecord { VaccineName = "Rabies", GivenDate = DateTime.UtcNow.AddMonths(-10), DueDate = DateTime.UtcNow.AddMonths(2), ProviderName = "Northside Animal Clinic" });
            pet.NutritionPlans.Add(new NutritionPlan
            {
                PetType = "Dog",
                Breed = "Golden Retriever",
                Age = 4,
                Weight = 68,
                Allergies = "Chicken sensitivity",
                ActivityLevel = "High",
                CurrentFood = "Sensitive-skin kibble",
                FeedingSchedule = "Morning and evening",
                HealthGoal = "Maintain lean muscle and steady energy",
                RecommendedFoodType = "High-protein sensitive-stomach adult dog food",
                MealFrequency = "2 measured meals per day",
                PortionSuggestion = "Use the food label for a 68 lb active dog, then adjust with weekly weight checks.",
                HydrationReminder = "Refresh water at every meal and after walks.",
                FoodsToAvoid = "Chicken, high-fat table scraps, grapes, raisins, chocolate, onions, garlic.",
                AllergyNotes = "Avoid chicken-based proteins and monitor itching or digestive changes.",
                HealthGoalGuidance = "Pair nutrition with daily walks and monthly weight review."
            });
            pet.DailyProgressLogs.Add(new DailyProgressLog { Weight = 68, Mood = "Happy", ActivityLevel = "High", SleepHours = 8, FoodIntake = "Finished both meals", WaterIntake = "Good", Symptoms = "", MedicationTaken = true, TrainingProgress = "Practiced recall", Notes = "Playful and energetic.", WellnessScore = 86 });
            dbContext.PetProfiles.Add(pet);
        }

        var existingBuddy = await dbContext.PetProfiles.FirstOrDefaultAsync(x => x.Name == "Buddy" && x.Breed == "Golden Retriever", cancellationToken);
        if (existingBuddy is not null && !await dbContext.NutritionPlans.AnyAsync(x => x.PetProfileId == existingBuddy.Id, cancellationToken))
        {
            dbContext.NutritionPlans.Add(new NutritionPlan
            {
                PetProfileId = existingBuddy.Id,
                PetType = existingBuddy.Species,
                Breed = existingBuddy.Breed,
                Age = existingBuddy.Age,
                Weight = existingBuddy.Weight,
                Allergies = existingBuddy.Allergies,
                ActivityLevel = "High",
                CurrentFood = "Sensitive-skin kibble",
                FeedingSchedule = "Morning and evening",
                HealthGoal = "Maintain lean muscle and steady energy",
                RecommendedFoodType = "High-protein sensitive-stomach adult dog food",
                MealFrequency = "2 measured meals per day",
                PortionSuggestion = "Use the food label for current weight, then adjust with weekly weigh-ins.",
                HydrationReminder = "Refresh water at every meal and after walks.",
                FoodsToAvoid = "Chicken, grapes, raisins, chocolate, onions, garlic.",
                AllergyNotes = "Avoid chicken-based proteins and monitor skin or digestion changes.",
                HealthGoalGuidance = "Review weight and stool quality weekly."
            });
        }

        if (existingBuddy is not null && !await dbContext.DailyProgressLogs.AnyAsync(x => x.PetProfileId == existingBuddy.Id, cancellationToken))
        {
            dbContext.DailyProgressLogs.Add(new DailyProgressLog { PetProfileId = existingBuddy.Id, Weight = existingBuddy.Weight, Mood = "Happy", ActivityLevel = "High", SleepHours = 8, FoodIntake = "Finished both meals", WaterIntake = "Good", Symptoms = "", MedicationTaken = true, TrainingProgress = "Practiced recall", Notes = "Playful and energetic.", WellnessScore = 86 });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureCareSchemaAsync(PetSenseDbContext dbContext, CancellationToken cancellationToken)
    {
        await dbContext.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "NutritionPlans" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_NutritionPlans" PRIMARY KEY,
                "PetProfileId" TEXT NOT NULL,
                "PetType" TEXT NOT NULL,
                "Breed" TEXT NOT NULL,
                "Age" INTEGER NOT NULL,
                "Weight" TEXT NOT NULL,
                "Allergies" TEXT NOT NULL,
                "MedicalConditions" TEXT NOT NULL,
                "ActivityLevel" TEXT NOT NULL,
                "CurrentFood" TEXT NOT NULL,
                "FeedingSchedule" TEXT NOT NULL,
                "HealthGoal" TEXT NOT NULL,
                "RecommendedFoodType" TEXT NOT NULL,
                "MealFrequency" TEXT NOT NULL,
                "PortionSuggestion" TEXT NOT NULL,
                "HydrationReminder" TEXT NOT NULL,
                "FoodsToAvoid" TEXT NOT NULL,
                "AllergyNotes" TEXT NOT NULL,
                "HealthGoalGuidance" TEXT NOT NULL,
                "GeneratedAt" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NULL,
                "CreatedBy" TEXT NULL,
                "UpdatedBy" TEXT NULL,
                "IsDeleted" INTEGER NOT NULL DEFAULT 0,
                "DeletedAt" TEXT NULL,
                CONSTRAINT "FK_NutritionPlans_PetProfiles_PetProfileId" FOREIGN KEY ("PetProfileId") REFERENCES "PetProfiles" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "NutritionPlanItems" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_NutritionPlanItems" PRIMARY KEY,
                "NutritionPlanId" TEXT NOT NULL,
                "Category" TEXT NOT NULL,
                "Name" TEXT NOT NULL,
                "Recommendation" TEXT NOT NULL,
                "SortOrder" INTEGER NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NULL,
                "CreatedBy" TEXT NULL,
                "UpdatedBy" TEXT NULL,
                "IsDeleted" INTEGER NOT NULL DEFAULT 0,
                "DeletedAt" TEXT NULL,
                CONSTRAINT "FK_NutritionPlanItems_NutritionPlans_NutritionPlanId" FOREIGN KEY ("NutritionPlanId") REFERENCES "NutritionPlans" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "DailyProgressLogs" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_DailyProgressLogs" PRIMARY KEY,
                "PetProfileId" TEXT NOT NULL,
                "LogDate" TEXT NOT NULL,
                "Weight" TEXT NULL,
                "Mood" TEXT NOT NULL,
                "ActivityLevel" TEXT NOT NULL,
                "SleepHours" TEXT NOT NULL,
                "FoodIntake" TEXT NOT NULL,
                "WaterIntake" TEXT NOT NULL,
                "Symptoms" TEXT NOT NULL,
                "MedicationTaken" INTEGER NOT NULL,
                "TrainingProgress" TEXT NOT NULL,
                "Notes" TEXT NOT NULL,
                "WellnessScore" INTEGER NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NULL,
                "CreatedBy" TEXT NULL,
                "UpdatedBy" TEXT NULL,
                "IsDeleted" INTEGER NOT NULL DEFAULT 0,
                "DeletedAt" TEXT NULL,
                CONSTRAINT "FK_DailyProgressLogs_PetProfiles_PetProfileId" FOREIGN KEY ("PetProfileId") REFERENCES "PetProfiles" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "WellnessMetrics" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_WellnessMetrics" PRIMARY KEY,
                "PetProfileId" TEXT NOT NULL,
                "DailyProgressLogId" TEXT NULL,
                "MetricDate" TEXT NOT NULL,
                "MetricType" TEXT NOT NULL,
                "Value" TEXT NOT NULL,
                "Notes" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NULL,
                "CreatedBy" TEXT NULL,
                "UpdatedBy" TEXT NULL,
                "IsDeleted" INTEGER NOT NULL DEFAULT 0,
                "DeletedAt" TEXT NULL,
                CONSTRAINT "FK_WellnessMetrics_PetProfiles_PetProfileId" FOREIGN KEY ("PetProfileId") REFERENCES "PetProfiles" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_WellnessMetrics_DailyProgressLogs_DailyProgressLogId" FOREIGN KEY ("DailyProgressLogId") REFERENCES "DailyProgressLogs" ("Id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_NutritionPlans_PetProfileId" ON "NutritionPlans" ("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_NutritionPlanItems_NutritionPlanId" ON "NutritionPlanItems" ("NutritionPlanId");
            CREATE INDEX IF NOT EXISTS "IX_DailyProgressLogs_PetProfileId" ON "DailyProgressLogs" ("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_WellnessMetrics_PetProfileId" ON "WellnessMetrics" ("PetProfileId");
            CREATE INDEX IF NOT EXISTS "IX_WellnessMetrics_DailyProgressLogId" ON "WellnessMetrics" ("DailyProgressLogId");
            """, cancellationToken);
    }

    private static async Task UpsertCompleteCareContentAsync(PetSenseDbContext dbContext, CancellationToken cancellationToken)
    {
        var hero = await dbContext.HeroSections.OrderByDescending(x => x.IsActive).ThenByDescending(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        if (hero is not null)
        {
            hero.Title = "PetSense AI";
            hero.Headline = "Complete Care for Every Pet";
            hero.Subtitle = "Track your pet's health, create personalized nutrition plans, monitor daily progress, and understand your pet like never before.";
            hero.PrimaryCtaText = "Start Tracking";
            hero.SecondaryCtaText = "Create Nutrition Plan";
            hero.ImageUrl = "assets/petsense-complete-care.png";
            hero.IsActive = true;
        }

        await UpsertSectionAsync(dbContext, "complete-care", "Complete Care for Every Pet", "Health, nutrition, daily progress, and wellness in one place.", "PetSense AI helps owners provide complete care for every pet with connected profiles, health tracking, nutrition planning, appointments, medication, and AI wellness insights.", 3, cancellationToken);
        await UpsertSectionAsync(dbContext, "health-tracking", "Easy Health Tracking", "Log important health changes before they become hard to understand.", "Track symptoms, weight, mood, sleep, activity, food, hydration, and wellness changes from one simple care workspace.", 4, cancellationToken);
        await UpsertSectionAsync(dbContext, "nutrition-plan", "AI-Powered Nutrition Planning", "Personalized feeding guidance for healthier routines.", "Create nutrition plans using pet type, breed, age, weight, allergies, activity level, current food, and health goals.", 5, cancellationToken);
        await UpsertSectionAsync(dbContext, "daily-progress", "Daily Progress Tracking", "See how care decisions affect wellness over time.", "Monitor daily, weekly, and monthly progress charts for health, behavior, nutrition, training, medication, and wellness score.", 6, cancellationToken);
        await UpsertSectionAsync(dbContext, "ai-wellness-insights", "AI Wellness Insights", "Better care, stronger bond, healthier pets.", "PetSense AI turns health logs, behavior patterns, nutrition records, and progress reports into clear recommendations and next actions.", 7, cancellationToken);

        UpsertFeature(dbContext, "Complete Pet Care", "Manage everything your pet needs in one place, including health, behavior, nutrition, appointments, medication, and progress.", "health_and_safety", 1);
        UpsertFeature(dbContext, "Easy Health Tracking", "Log daily health updates, symptoms, weight, mood, activity, sleep, and wellness changes.", "monitor_heart", 2);
        UpsertFeature(dbContext, "Personalized Nutrition Plan", "Create food and nutrition plans based on pet type, breed, age, weight, allergies, activity level, and health goals.", "restaurant", 3);
        UpsertFeature(dbContext, "Daily Progress Monitoring", "View charts and reports showing your pet's health, behavior, nutrition, and wellness progress every day.", "query_stats", 4);
        UpsertFeature(dbContext, "AI Wellness Insights", "Get AI-powered insights and recommendations based on health logs, behavior patterns, nutrition records, and progress reports.", "auto_awesome", 5);
        UpsertFeature(dbContext, "Better Care, Stronger Bond", "Help owners understand their pets better and make smarter care decisions.", "favorite", 6);
    }

    private static async Task UpsertSectionAsync(PetSenseDbContext dbContext, string key, string title, string subtitle, string body, int sortOrder, CancellationToken cancellationToken)
    {
        var section = await dbContext.WebsiteSections.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
        if (section is null)
        {
            dbContext.WebsiteSections.Add(new WebsiteSection { Key = key, Title = title, Subtitle = subtitle, Body = body, SortOrder = sortOrder, IsPublished = true });
            return;
        }

        section.Title = title;
        section.Subtitle = subtitle;
        section.Body = body;
        section.SortOrder = sortOrder;
        section.IsPublished = true;
    }

    private static void UpsertFeature(PetSenseDbContext dbContext, string title, string description, string icon, int sortOrder)
    {
        var feature = dbContext.Features.Local.FirstOrDefault(x => x.Title == title)
            ?? dbContext.Features.FirstOrDefault(x => x.Title == title);

        if (feature is null)
        {
            dbContext.Features.Add(ToFeature(title, description, icon, sortOrder));
            return;
        }

        feature.Description = description;
        feature.Icon = icon;
        feature.SortOrder = sortOrder;
        feature.IsPublished = true;
    }

    private static Problem ToProblem(string title, int order) => new() { Title = title, Description = title, SortOrder = order };
    private static Solution ToSolution(string title, int order) => new() { Title = title, Description = title, SortOrder = order };
    private static Feature ToFeature(string title, string description, string icon, int order) => new() { Title = title, Description = description, Icon = icon, SortOrder = order };
    private static HowItWorksStep ToStep(string title, string description, int step) => new() { Title = title, Description = description, StepNumber = step };
    private static TargetCustomer ToCustomer(string name, string description, int order) => new() { Name = name, Description = description, SortOrder = order };
    private static ComparisonItem ToComparison(string capability, string petSense, string traditional, int order) => new() { Capability = capability, PetSenseValue = petSense, TraditionalValue = traditional, SortOrder = order };
}

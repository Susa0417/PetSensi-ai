using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/nutrition-plans")]
public sealed class NutritionPlansController(PetSenseDbContext dbContext, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<NutritionPlanDto>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var userId = RequireUserId();
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 100 ? 20 : pageSize;
        var query = dbContext.NutritionPlans
            .Include(x => x.Items)
            .Where(x => x.PetProfile!.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.PetType.Contains(term) || x.Breed.Contains(term) || x.HealthGoal.Contains(term));
        }

        var total = await query.CountAsync(HttpContext.RequestAborted);
        var plans = await query
            .OrderByDescending(x => x.GeneratedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(HttpContext.RequestAborted);

        return new PagedResult<NutritionPlanDto>(plans.Select(MapPlan).ToList(), total, safePage, safePageSize);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NutritionPlanDto>> Get(Guid id)
    {
        var plan = await OwnedPlanQuery().FirstOrDefaultAsync(x => x.Id == id, HttpContext.RequestAborted);
        return plan is null ? NotFound() : Ok(MapPlan(plan));
    }

    [HttpPost]
    public async Task<NutritionPlanDto> Create(NutritionPlanRequest request)
    {
        await EnsureOwnedPetAsync(request.PetProfileId);
        var plan = CreatePlan(request);
        ApplyProvidedRecommendations(plan, request);
        dbContext.NutritionPlans.Add(plan);
        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return MapPlan(plan);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, NutritionPlanRequest request)
    {
        var plan = await OwnedPlanQuery().FirstOrDefaultAsync(x => x.Id == id, HttpContext.RequestAborted);
        if (plan is null)
        {
            return NotFound();
        }

        await EnsureOwnedPetAsync(request.PetProfileId);
        ApplyPlanRequest(plan, request);
        ApplyProvidedRecommendations(plan, request);
        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plan = await OwnedPlanQuery().FirstOrDefaultAsync(x => x.Id == id, HttpContext.RequestAborted);
        if (plan is null)
        {
            return NotFound();
        }

        plan.IsDeleted = true;
        plan.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return NoContent();
    }

    [HttpPost("generate")]
    public async Task<NutritionPlanDto> Generate(NutritionGenerateRequest request)
    {
        var pet = await EnsureOwnedPetAsync(request.PetProfileId);
        var planRequest = request.ToPlanRequest(pet);
        var generated = GenerateNutrition(planRequest);

        NutritionPlan plan;
        if (request.NutritionPlanId is Guid planId)
        {
            plan = await OwnedPlanQuery().FirstOrDefaultAsync(x => x.Id == planId, HttpContext.RequestAborted)
                ?? throw new ApiException("Nutrition plan was not found.", 404);
            ApplyPlanRequest(plan, planRequest);
            plan.Items.Clear();
        }
        else
        {
            plan = CreatePlan(planRequest);
            dbContext.NutritionPlans.Add(plan);
        }

        plan.RecommendedFoodType = generated.RecommendedFoodType;
        plan.MealFrequency = generated.MealFrequency;
        plan.PortionSuggestion = generated.PortionSuggestion;
        plan.HydrationReminder = generated.HydrationReminder;
        plan.FoodsToAvoid = generated.FoodsToAvoid;
        plan.AllergyNotes = generated.AllergyNotes;
        plan.HealthGoalGuidance = generated.HealthGoalGuidance;
        plan.GeneratedAt = DateTime.UtcNow;
        AddPlanItems(plan);

        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return MapPlan(plan);
    }

    private IQueryable<NutritionPlan> OwnedPlanQuery()
    {
        var userId = RequireUserId();
        return dbContext.NutritionPlans.Include(x => x.Items).Where(x => x.PetProfile!.UserId == userId);
    }

    private Guid RequireUserId() =>
        currentUser.UserId ?? throw new ApiException("User is not authenticated.", 401);

    private async Task<PetProfile> EnsureOwnedPetAsync(Guid petProfileId) =>
        await dbContext.PetProfiles.FirstOrDefaultAsync(x => x.Id == petProfileId && x.UserId == RequireUserId(), HttpContext.RequestAborted)
            ?? throw new ApiException("Pet profile was not found for this user.", 404);

    private static NutritionPlan CreatePlan(NutritionPlanRequest request)
    {
        var plan = new NutritionPlan();
        ApplyPlanRequest(plan, request);
        return plan;
    }

    private static void ApplyPlanRequest(NutritionPlan plan, NutritionPlanRequest request)
    {
        plan.PetProfileId = request.PetProfileId;
        plan.PetType = Clean(request.PetType, "Dog");
        plan.Breed = Clean(request.Breed);
        plan.Age = request.Age;
        plan.Weight = request.Weight;
        plan.Allergies = Clean(request.Allergies);
        plan.MedicalConditions = Clean(request.MedicalConditions);
        plan.ActivityLevel = Clean(request.ActivityLevel, "Moderate");
        plan.CurrentFood = Clean(request.CurrentFood);
        plan.FeedingSchedule = Clean(request.FeedingSchedule);
        plan.HealthGoal = Clean(request.HealthGoal, "Maintain healthy weight");
    }

    private static void ApplyProvidedRecommendations(NutritionPlan plan, NutritionPlanRequest request)
    {
        plan.RecommendedFoodType = request.RecommendedFoodType ?? plan.RecommendedFoodType;
        plan.MealFrequency = request.MealFrequency ?? plan.MealFrequency;
        plan.PortionSuggestion = request.PortionSuggestion ?? plan.PortionSuggestion;
        plan.HydrationReminder = request.HydrationReminder ?? plan.HydrationReminder;
        plan.FoodsToAvoid = request.FoodsToAvoid ?? plan.FoodsToAvoid;
        plan.AllergyNotes = request.AllergyNotes ?? plan.AllergyNotes;
        plan.HealthGoalGuidance = request.HealthGoalGuidance ?? plan.HealthGoalGuidance;
    }

    private static GeneratedNutritionDto GenerateNutrition(NutritionPlanRequest request)
    {
        // Mock AI logic for local/dev use. Replace this block with an OpenAI or Azure OpenAI
        // call that sends pet profile, allergies, current diet, activity, and health goals,
        // then maps the model response back into GeneratedNutritionDto.
        var petType = request.PetType.Contains("cat", StringComparison.OrdinalIgnoreCase) ? "cat" : "dog";
        var activity = request.ActivityLevel.ToLowerInvariant();
        var ageLabel = request.Age < 1 ? "young" : request.Age >= 8 ? "senior" : "adult";
        var protein = request.Allergies.Contains("chicken", StringComparison.OrdinalIgnoreCase) ? "fish or lamb" : "high-quality animal protein";
        var foodType = petType == "cat"
            ? $"{ageLabel} cat wet-and-dry balanced food with {protein}"
            : $"{ageLabel} dog complete-and-balanced food with {protein}";
        var mealFrequency = request.Age < 1 ? "3 small meals per day" : request.Age >= 8 ? "2 smaller meals per day" : "2 measured meals per day";
        var activityAdjustment = activity.Contains("high") ? "slightly higher energy needs" : activity.Contains("low") ? "lower calorie needs" : "steady maintenance needs";
        var portion = $"Start from the package guide for {request.Weight:0.#} lb and {activityAdjustment}; adjust every 1-2 weeks using weight and wellness trends.";
        var commonAvoid = petType == "cat"
            ? "onions, garlic, chocolate, grapes, raisins, alcohol, caffeine, raw dough, and dog-only foods"
            : "chocolate, grapes, raisins, onions, garlic, macadamia nuts, alcohol, caffeine, and high-fat table scraps";
        var allergyNotes = string.IsNullOrWhiteSpace(request.Allergies)
            ? "No allergies listed. Introduce new foods gradually and watch stool, skin, and appetite."
            : $"Avoid listed allergens: {request.Allergies}. Review ingredient labels and introduce changes slowly.";

        return new GeneratedNutritionDto(
            foodType,
            mealFrequency,
            portion,
            "Keep fresh water available all day; refresh at every meal and after active play or walks.",
            commonAvoid,
            allergyNotes,
            $"Goal: {request.HealthGoal}. Pair feeding changes with daily progress logs, weekly weight checks, and vet guidance for medical conditions.");
    }

    private static void AddPlanItems(NutritionPlan plan)
    {
        plan.Items.Add(new NutritionPlanItem { Category = "Food", Name = "Recommended food type", Recommendation = plan.RecommendedFoodType, SortOrder = 1 });
        plan.Items.Add(new NutritionPlanItem { Category = "Schedule", Name = "Meal frequency", Recommendation = plan.MealFrequency, SortOrder = 2 });
        plan.Items.Add(new NutritionPlanItem { Category = "Portion", Name = "Portion suggestion", Recommendation = plan.PortionSuggestion, SortOrder = 3 });
        plan.Items.Add(new NutritionPlanItem { Category = "Hydration", Name = "Hydration reminder", Recommendation = plan.HydrationReminder, SortOrder = 4 });
        plan.Items.Add(new NutritionPlanItem { Category = "Safety", Name = "Foods to avoid", Recommendation = plan.FoodsToAvoid, SortOrder = 5 });
        plan.Items.Add(new NutritionPlanItem { Category = "Goal", Name = "Health goal guidance", Recommendation = plan.HealthGoalGuidance, SortOrder = 6 });
    }

    private static NutritionPlanDto MapPlan(NutritionPlan plan) => new(
        plan.Id,
        plan.PetProfileId,
        plan.PetType,
        plan.Breed,
        plan.Age,
        plan.Weight,
        plan.Allergies,
        plan.MedicalConditions,
        plan.ActivityLevel,
        plan.CurrentFood,
        plan.FeedingSchedule,
        plan.HealthGoal,
        plan.RecommendedFoodType,
        plan.MealFrequency,
        plan.PortionSuggestion,
        plan.HydrationReminder,
        plan.FoodsToAvoid,
        plan.AllergyNotes,
        plan.HealthGoalGuidance,
        plan.GeneratedAt,
        plan.Items.OrderBy(x => x.SortOrder).Select(x => new NutritionPlanItemDto(x.Id, x.Category, x.Name, x.Recommendation, x.SortOrder)).ToList());

    private static string Clean(string? value, string fallback = "") =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}

[ApiController]
[Authorize]
[Route("api/daily-progress")]
public sealed class DailyProgressController(PetSenseDbContext dbContext, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<DailyProgressLogDto>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var userId = RequireUserId();
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 100 ? 20 : pageSize;
        var query = dbContext.DailyProgressLogs.Where(x => x.PetProfile!.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Mood.Contains(term) || x.ActivityLevel.Contains(term) || x.Symptoms.Contains(term) || x.Notes.Contains(term));
        }

        var total = await query.CountAsync(HttpContext.RequestAborted);
        var logs = await query
            .OrderByDescending(x => x.LogDate)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(HttpContext.RequestAborted);

        return new PagedResult<DailyProgressLogDto>(logs.Select(MapLog).ToList(), total, safePage, safePageSize);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DailyProgressLogDto>> Get(Guid id)
    {
        var log = await OwnedLogsQuery().FirstOrDefaultAsync(x => x.Id == id, HttpContext.RequestAborted);
        return log is null ? NotFound() : Ok(MapLog(log));
    }

    [HttpPost]
    public async Task<DailyProgressLogDto> Create(DailyProgressRequest request)
    {
        await EnsureOwnedPetAsync(request.PetProfileId);
        var log = CreateLog(request);
        dbContext.DailyProgressLogs.Add(log);
        AddMetrics(log);
        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return MapLog(log);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, DailyProgressRequest request)
    {
        var log = await OwnedLogsQuery().Include(x => x.Metrics).FirstOrDefaultAsync(x => x.Id == id, HttpContext.RequestAborted);
        if (log is null)
        {
            return NotFound();
        }

        await EnsureOwnedPetAsync(request.PetProfileId);
        ApplyLogRequest(log, request);
        dbContext.WellnessMetrics.RemoveRange(log.Metrics);
        AddMetrics(log);
        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var log = await OwnedLogsQuery().FirstOrDefaultAsync(x => x.Id == id, HttpContext.RequestAborted);
        if (log is null)
        {
            return NotFound();
        }

        log.IsDeleted = true;
        log.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(HttpContext.RequestAborted);
        return NoContent();
    }

    [HttpGet("pet/{petId:guid}/summary")]
    public async Task<DailyProgressSummaryDto> Summary(Guid petId)
    {
        await EnsureOwnedPetAsync(petId);
        var logs = await dbContext.DailyProgressLogs
            .Where(x => x.PetProfileId == petId)
            .OrderByDescending(x => x.LogDate)
            .Take(30)
            .ToListAsync(HttpContext.RequestAborted);
        var ordered = logs.OrderBy(x => x.LogDate).ToList();
        var latest = logs.FirstOrDefault();
        var previous = logs.Skip(1).FirstOrDefault();
        var average = logs.Count == 0 ? 0 : (int)Math.Round(logs.Average(x => x.WellnessScore));
        var delta = latest is not null && previous is not null ? latest.WellnessScore - previous.WellnessScore : 0;
        var improvements = BuildImprovements(latest, previous, ordered);
        var warnings = BuildWarnings(latest, previous, ordered);

        return new DailyProgressSummaryDto(
            petId,
            logs.Count,
            latest?.WellnessScore ?? 0,
            average,
            delta,
            improvements,
            warnings,
            latest is null ? null : MapLog(latest));
    }

    [HttpGet("pet/{petId:guid}/charts")]
    public async Task<DailyProgressChartsDto> Charts(Guid petId)
    {
        await EnsureOwnedPetAsync(petId);
        var logs = await dbContext.DailyProgressLogs
            .Where(x => x.PetProfileId == petId)
            .OrderBy(x => x.LogDate)
            .Take(180)
            .ToListAsync(HttpContext.RequestAborted);

        var daily = logs.Select(x => new ProgressChartPointDto(x.LogDate, x.WellnessScore, $"{x.Mood} / {x.ActivityLevel}")).ToList();
        var weekly = logs
            .GroupBy(x => new { x.LogDate.Year, Week = Math.Floor(x.LogDate.DayOfYear / 7d) })
            .Select(x => new ProgressChartPointDto(x.Min(v => v.LogDate), (int)Math.Round(x.Average(v => v.WellnessScore)), "Weekly average"))
            .ToList();
        var monthly = logs
            .GroupBy(x => new { x.LogDate.Year, x.LogDate.Month })
            .Select(x => new ProgressChartPointDto(new DateTime(x.Key.Year, x.Key.Month, 1), (int)Math.Round(x.Average(v => v.WellnessScore)), "Monthly average"))
            .ToList();
        var weight = logs.Where(x => x.Weight.HasValue).Select(x => new ProgressChartPointDto(x.LogDate, (int)Math.Round(x.Weight!.Value), "Weight")).ToList();
        var sleep = logs.Select(x => new ProgressChartPointDto(x.LogDate, (int)Math.Round(x.SleepHours), "Sleep hours")).ToList();

        return new DailyProgressChartsDto(petId, daily, weekly, monthly, weight, sleep);
    }

    private IQueryable<DailyProgressLog> OwnedLogsQuery()
    {
        var userId = RequireUserId();
        return dbContext.DailyProgressLogs.Where(x => x.PetProfile!.UserId == userId);
    }

    private Guid RequireUserId() =>
        currentUser.UserId ?? throw new ApiException("User is not authenticated.", 401);

    private async Task<PetProfile> EnsureOwnedPetAsync(Guid petProfileId) =>
        await dbContext.PetProfiles.FirstOrDefaultAsync(x => x.Id == petProfileId && x.UserId == RequireUserId(), HttpContext.RequestAborted)
            ?? throw new ApiException("Pet profile was not found for this user.", 404);

    private static DailyProgressLog CreateLog(DailyProgressRequest request)
    {
        var log = new DailyProgressLog();
        ApplyLogRequest(log, request);
        return log;
    }

    private static void ApplyLogRequest(DailyProgressLog log, DailyProgressRequest request)
    {
        log.PetProfileId = request.PetProfileId;
        log.LogDate = request.LogDate == default ? DateTime.UtcNow : request.LogDate;
        log.Weight = request.Weight;
        log.Mood = Clean(request.Mood, "Calm");
        log.ActivityLevel = Clean(request.ActivityLevel, "Moderate");
        log.SleepHours = Math.Max(0, request.SleepHours);
        log.FoodIntake = Clean(request.FoodIntake);
        log.WaterIntake = Clean(request.WaterIntake);
        log.Symptoms = Clean(request.Symptoms);
        log.MedicationTaken = request.MedicationTaken;
        log.TrainingProgress = Clean(request.TrainingProgress);
        log.Notes = Clean(request.Notes);
        log.WellnessScore = Math.Clamp(request.WellnessScore, 0, 100);
    }

    private static void AddMetrics(DailyProgressLog log)
    {
        log.Metrics.Add(new WellnessMetric { PetProfileId = log.PetProfileId, DailyProgressLog = log, MetricDate = log.LogDate, MetricType = "WellnessScore", Value = log.WellnessScore, Notes = log.Notes });
        log.Metrics.Add(new WellnessMetric { PetProfileId = log.PetProfileId, DailyProgressLog = log, MetricDate = log.LogDate, MetricType = "SleepHours", Value = log.SleepHours, Notes = log.ActivityLevel });
        if (log.Weight.HasValue)
        {
            log.Metrics.Add(new WellnessMetric { PetProfileId = log.PetProfileId, DailyProgressLog = log, MetricDate = log.LogDate, MetricType = "Weight", Value = log.Weight.Value, Notes = log.FoodIntake });
        }
    }

    private static IReadOnlyList<string> BuildImprovements(DailyProgressLog? latest, DailyProgressLog? previous, IReadOnlyList<DailyProgressLog> ordered)
    {
        var improvements = new List<string>();
        if (latest is null)
        {
            return improvements;
        }

        if (previous is not null && latest.WellnessScore > previous.WellnessScore)
        {
            improvements.Add($"Wellness score improved by {latest.WellnessScore - previous.WellnessScore} points.");
        }

        if (latest.MedicationTaken)
        {
            improvements.Add("Medication was marked as taken today.");
        }

        if (!string.IsNullOrWhiteSpace(latest.TrainingProgress))
        {
            improvements.Add("Training progress was logged.");
        }

        if (ordered.Count >= 2 && ordered.TakeLast(2).All(x => string.IsNullOrWhiteSpace(x.Symptoms)))
        {
            improvements.Add("No symptoms were logged in the latest entries.");
        }

        return improvements;
    }

    private static IReadOnlyList<string> BuildWarnings(DailyProgressLog? latest, DailyProgressLog? previous, IReadOnlyList<DailyProgressLog> ordered)
    {
        var warnings = new List<string>();
        if (latest is null)
        {
            return warnings;
        }

        if (latest.WellnessScore < 65)
        {
            warnings.Add("Wellness score is below the preferred range.");
        }

        if (!string.IsNullOrWhiteSpace(latest.Symptoms))
        {
            warnings.Add($"Symptoms noted: {latest.Symptoms}");
        }

        if (latest.SleepHours < 6)
        {
            warnings.Add("Sleep hours look low for a typical daily routine.");
        }

        if (previous is not null && latest.WellnessScore < previous.WellnessScore)
        {
            warnings.Add($"Wellness score dropped by {previous.WellnessScore - latest.WellnessScore} points from the previous log.");
        }

        if (ordered.Count >= 2 && latest.Weight.HasValue)
        {
            var previousWeight = ordered.Reverse().Skip(1).FirstOrDefault(x => x.Weight.HasValue)?.Weight;
            if (previousWeight.HasValue && previousWeight.Value > 0)
            {
                var percent = Math.Abs((latest.Weight.Value - previousWeight.Value) / previousWeight.Value) * 100;
                if (percent >= 5)
                {
                    warnings.Add("Weight changed by 5% or more compared with the previous logged weight.");
                }
            }
        }

        return warnings;
    }

    private static DailyProgressLogDto MapLog(DailyProgressLog log) => new(
        log.Id,
        log.PetProfileId,
        log.LogDate,
        log.Weight,
        log.Mood,
        log.ActivityLevel,
        log.SleepHours,
        log.FoodIntake,
        log.WaterIntake,
        log.Symptoms,
        log.MedicationTaken,
        log.TrainingProgress,
        log.Notes,
        log.WellnessScore);

    private static string Clean(string? value, string fallback = "") =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}

public sealed record NutritionPlanRequest(
    Guid PetProfileId,
    string PetType,
    string Breed,
    int Age,
    decimal Weight,
    string Allergies,
    string MedicalConditions,
    string ActivityLevel,
    string CurrentFood,
    string FeedingSchedule,
    string HealthGoal,
    string? RecommendedFoodType,
    string? MealFrequency,
    string? PortionSuggestion,
    string? HydrationReminder,
    string? FoodsToAvoid,
    string? AllergyNotes,
    string? HealthGoalGuidance);

public sealed record NutritionGenerateRequest(
    Guid PetProfileId,
    Guid? NutritionPlanId,
    string? PetType,
    string? Breed,
    int? Age,
    decimal? Weight,
    string? Allergies,
    string? MedicalConditions,
    string? ActivityLevel,
    string? CurrentFood,
    string? FeedingSchedule,
    string? HealthGoal)
{
    public NutritionPlanRequest ToPlanRequest(PetProfile pet) => new(
        PetProfileId,
        string.IsNullOrWhiteSpace(PetType) ? pet.Species : PetType,
        string.IsNullOrWhiteSpace(Breed) ? pet.Breed : Breed,
        Age ?? pet.Age,
        Weight ?? pet.Weight,
        string.IsNullOrWhiteSpace(Allergies) ? pet.Allergies : Allergies,
        MedicalConditions ?? pet.MedicalHistory,
        ActivityLevel ?? "Moderate",
        CurrentFood ?? string.Empty,
        FeedingSchedule ?? "Morning and evening",
        HealthGoal ?? "Maintain healthy weight",
        null,
        null,
        null,
        null,
        null,
        null,
        null);
}

public sealed record NutritionPlanDto(
    Guid Id,
    Guid PetProfileId,
    string PetType,
    string Breed,
    int Age,
    decimal Weight,
    string Allergies,
    string MedicalConditions,
    string ActivityLevel,
    string CurrentFood,
    string FeedingSchedule,
    string HealthGoal,
    string RecommendedFoodType,
    string MealFrequency,
    string PortionSuggestion,
    string HydrationReminder,
    string FoodsToAvoid,
    string AllergyNotes,
    string HealthGoalGuidance,
    DateTime GeneratedAt,
    IReadOnlyList<NutritionPlanItemDto> Items);

public sealed record NutritionPlanItemDto(Guid Id, string Category, string Name, string Recommendation, int SortOrder);
public sealed record GeneratedNutritionDto(string RecommendedFoodType, string MealFrequency, string PortionSuggestion, string HydrationReminder, string FoodsToAvoid, string AllergyNotes, string HealthGoalGuidance);

public sealed record DailyProgressRequest(
    Guid PetProfileId,
    DateTime LogDate,
    decimal? Weight,
    string Mood,
    string ActivityLevel,
    decimal SleepHours,
    string FoodIntake,
    string WaterIntake,
    string Symptoms,
    bool MedicationTaken,
    string TrainingProgress,
    string Notes,
    int WellnessScore);

public sealed record DailyProgressLogDto(
    Guid Id,
    Guid PetProfileId,
    DateTime LogDate,
    decimal? Weight,
    string Mood,
    string ActivityLevel,
    decimal SleepHours,
    string FoodIntake,
    string WaterIntake,
    string Symptoms,
    bool MedicationTaken,
    string TrainingProgress,
    string Notes,
    int WellnessScore);

public sealed record DailyProgressSummaryDto(Guid PetProfileId, int LogCount, int LatestWellnessScore, int AverageWellnessScore, int WellnessDelta, IReadOnlyList<string> Improvements, IReadOnlyList<string> Warnings, DailyProgressLogDto? LatestLog);
public sealed record DailyProgressChartsDto(Guid PetProfileId, IReadOnlyList<ProgressChartPointDto> Daily, IReadOnlyList<ProgressChartPointDto> Weekly, IReadOnlyList<ProgressChartPointDto> Monthly, IReadOnlyList<ProgressChartPointDto> Weight, IReadOnlyList<ProgressChartPointDto> Sleep);
public sealed record ProgressChartPointDto(DateTime Date, int Value, string Label);

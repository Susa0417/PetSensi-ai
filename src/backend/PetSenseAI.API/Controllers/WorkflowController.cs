using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Application.Insights;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/workflow")]
public sealed class WorkflowController(
    PetSenseDbContext dbContext,
    ICurrentUserService currentUser,
    IAiInsightService aiInsightService) : ControllerBase
{
    [HttpGet("status")]
    public async Task<WorkflowStatusDto> Status(CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        var pets = await dbContext.PetProfiles.Where(x => x.UserId == userId).Select(x => x.Id).ToListAsync(cancellationToken);
        var hasPet = pets.Count > 0;
        var hasDailyLog = hasPet && (await dbContext.BehaviorLogs.AnyAsync(x => pets.Contains(x.PetProfileId), cancellationToken)
            || await dbContext.HealthLogs.AnyAsync(x => pets.Contains(x.PetProfileId), cancellationToken));
        var hasAnalysisData = hasDailyLog && await dbContext.HealthLogs.AnyAsync(x => pets.Contains(x.PetProfileId), cancellationToken);
        var hasInsight = hasPet && await dbContext.AiInsights.AnyAsync(x => pets.Contains(x.PetProfileId), cancellationToken);
        var hasProgress = hasPet && await dbContext.ProgressReports.AnyAsync(x => pets.Contains(x.PetProfileId), cancellationToken);

        return new WorkflowStatusDto([
            new("profile", "Create Your Pet Profile", StepState(hasPet, false)),
            new("daily-log", "Log 1: Behavior and Health Updates", StepState(hasDailyLog, hasPet)),
            new("analysis", "Log 2: Pattern Analyzing AI Site", StepState(hasAnalysisData, hasDailyLog)),
            new("insights", "Log 3: Insight and Recommendation", StepState(hasInsight, hasAnalysisData)),
            new("progress", "Log 4: Tracker for Overall Progress", StepState(hasProgress, hasInsight))
        ]);
    }

    [HttpGet("pets")]
    public Task<List<WorkflowPetProfileDto>> Pets(CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        return dbContext.PetProfiles
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new WorkflowPetProfileDto(
                x.Id,
                x.UserId,
                x.Name,
                x.Species,
                x.Breed,
                x.Age,
                x.Weight,
                x.Gender,
                x.PhotoUrl,
                x.Allergies,
                x.MedicalHistory,
                x.VetName,
                x.VetPhone))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("pet-profile")]
    public async Task<WorkflowPetProfileDto> SavePetProfile(WorkflowPetProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        var pet = new PetProfile
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Species = string.IsNullOrWhiteSpace(request.Species) ? "Dog" : request.Species.Trim(),
            Breed = request.Breed.Trim(),
            Age = request.Age,
            Weight = request.Weight,
            Gender = string.IsNullOrWhiteSpace(request.Gender) ? "Unknown" : request.Gender.Trim(),
            PhotoUrl = request.PhotoUrl,
            Allergies = request.Allergies ?? string.Empty,
            MedicalHistory = request.MedicalHistory ?? string.Empty,
            VetName = request.VetName ?? string.Empty,
            VetPhone = request.VetPhone ?? string.Empty
        };

        if (!string.IsNullOrWhiteSpace(request.VaccineName))
        {
            pet.VaccineRecords.Add(new VaccineRecord
            {
                VaccineName = request.VaccineName.Trim(),
                GivenDate = request.VaccineGivenDate ?? DateTime.UtcNow.Date,
                DueDate = request.VaccineDueDate,
                ProviderName = request.VetName ?? string.Empty,
                LotNumber = request.VaccineLotNumber ?? string.Empty,
                Notes = request.VaccineNotes ?? string.Empty
            });
        }

        dbContext.PetProfiles.Add(pet);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPet(pet);
    }

    [HttpPost("daily-log")]
    public async Task<WorkflowDailyLogResponse> SaveDailyLog(WorkflowDailyLogRequest request, CancellationToken cancellationToken)
    {
        await EnsureOwnedPetAsync(request.PetProfileId, cancellationToken);
        var logDate = request.LogDate == default ? DateTime.UtcNow : request.LogDate;

        var behavior = new BehaviorLog
        {
            PetProfileId = request.PetProfileId,
            LogDate = logDate,
            Eating = request.EatingHabit ?? string.Empty,
            Sleeping = request.SleepingPattern ?? string.Empty,
            Mood = request.Mood ?? string.Empty,
            Activity = request.ActivityLevel ?? string.Empty,
            BathroomHabits = request.BathroomHabit ?? string.Empty,
            Symptoms = request.Symptoms ?? string.Empty,
            UnusualBehavior = request.UnusualBehavior ?? string.Empty,
            Notes = request.BehaviorNotes ?? string.Empty
        };

        var health = new HealthLog
        {
            PetProfileId = request.PetProfileId,
            LogDate = logDate,
            Weight = request.Weight,
            WellnessScore = Math.Clamp(request.WellnessScore, 0, 100),
            Symptoms = request.Symptoms ?? string.Empty,
            Appetite = request.EatingHabit ?? string.Empty,
            Hydration = request.Hydration ?? string.Empty,
            EnergyLevel = request.ActivityLevel ?? string.Empty,
            Notes = request.HealthNotes ?? string.Empty
        };

        dbContext.BehaviorLogs.Add(behavior);
        dbContext.HealthLogs.Add(health);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new WorkflowDailyLogResponse(
            behavior.Id,
            health.Id,
            request.PetProfileId,
            logDate,
            behavior.Notes,
            health.Notes,
            health.WellnessScore);
    }

    [HttpGet("analysis")]
    public async Task<WorkflowAnalysisDto> Analysis([FromQuery] Guid petProfileId, CancellationToken cancellationToken)
    {
        var pet = await EnsureOwnedPetAsync(petProfileId, cancellationToken);
        var behaviorLogs = await dbContext.BehaviorLogs
            .Where(x => x.PetProfileId == petProfileId)
            .OrderByDescending(x => x.LogDate)
            .Take(30)
            .ToListAsync(cancellationToken);
        var healthLogs = await dbContext.HealthLogs
            .Where(x => x.PetProfileId == petProfileId)
            .OrderByDescending(x => x.LogDate)
            .Take(30)
            .ToListAsync(cancellationToken);
        var medications = await dbContext.MedicationReminders
            .Where(x => x.PetProfileId == petProfileId)
            .ToListAsync(cancellationToken);

        var symptoms = healthLogs.SelectMany(x => SplitWords(x.Symptoms))
            .Concat(behaviorLogs.SelectMany(x => SplitWords(x.Symptoms)))
            .GroupBy(x => x)
            .Where(x => x.Count() > 1)
            .OrderByDescending(x => x.Count())
            .Take(5)
            .Select(x => $"{x.Key} repeated {x.Count()} times")
            .ToList();

        var averageWellness = healthLogs.Count == 0 ? 0 : (int)Math.Round(healthLogs.Average(x => x.WellnessScore));
        var lowActivityCount = behaviorLogs.Count(x => ContainsAny(x.Activity, "low", "tired", "lethargic", "slow"));
        var eatingChanges = behaviorLogs.Count(x => ContainsAny(x.Eating, "less", "low", "poor", "skip", "vomit"));
        var sleepingChanges = behaviorLogs.Count(x => ContainsAny(x.Sleeping, "restless", "less", "more", "poor"));
        var activeMedications = medications.Count(x => x.Status.Equals("Active", StringComparison.OrdinalIgnoreCase));

        var findings = new List<WorkflowFindingDto>
        {
            new("Repeated symptoms", symptoms.Count == 0 ? "No repeated symptoms found in recent logs." : string.Join("; ", symptoms), symptoms.Count > 0 ? "Needs attention" : "Completed"),
            new("Behavior changes", lowActivityCount == 0 ? "Activity is steady in recent behavior logs." : $"{lowActivityCount} recent logs mention low activity or fatigue.", lowActivityCount > 1 ? "Needs attention" : "Pending"),
            new("Eating changes", eatingChanges == 0 ? "No eating disruption pattern detected." : $"{eatingChanges} recent logs mention eating changes.", eatingChanges > 1 ? "Needs attention" : "Pending"),
            new("Sleeping changes", sleepingChanges == 0 ? "No sleeping disruption pattern detected." : $"{sleepingChanges} recent logs mention sleep changes.", sleepingChanges > 1 ? "Needs attention" : "Pending"),
            new("Medication effects", activeMedications == 0 ? "No active medication to compare yet." : $"{activeMedications} active medication reminders can be compared against daily logs.", activeMedications > 0 ? "Pending" : "Completed"),
            new("Wellness trend", healthLogs.Count == 0 ? "Add health logs to calculate wellness trends." : $"Average wellness score is {averageWellness}.", averageWellness > 0 && averageWellness < 70 ? "Needs attention" : "Completed")
        };

        // Replace this deterministic analysis with OpenAI or Azure OpenAI later.
        // Recommended prompt context: pet profile, recent health logs, behavior logs,
        // active medications, appointment history, and vet-safe response constraints.
        return new WorkflowAnalysisDto(
            pet.Id,
            pet.Name,
            behaviorLogs.Count,
            healthLogs.Count,
            findings,
            DateTime.UtcNow);
    }

    [HttpPost("insights/{petProfileId:guid}")]
    public async Task<GeneratedAiInsightDto> GenerateInsight(Guid petProfileId, CancellationToken cancellationToken)
    {
        await EnsureOwnedPetAsync(petProfileId, cancellationToken);
        return await aiInsightService.AnalyzePetAsync(petProfileId, cancellationToken);
    }

    [HttpGet("progress")]
    public async Task<WorkflowProgressDto> Progress(
        [FromQuery] Guid petProfileId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var pet = await EnsureOwnedPetAsync(petProfileId, cancellationToken);
        var start = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
        var end = to.HasValue ? to.Value.Date.AddDays(1) : DateTime.UtcNow.AddDays(1);
        var displayEnd = end.AddTicks(-1);

        var healthLogs = await dbContext.HealthLogs
            .Where(x => x.PetProfileId == petProfileId && x.LogDate >= start && x.LogDate < end)
            .OrderBy(x => x.LogDate)
            .ToListAsync(cancellationToken);
        var behaviorLogs = await dbContext.BehaviorLogs
            .Where(x => x.PetProfileId == petProfileId && x.LogDate >= start && x.LogDate < end)
            .OrderBy(x => x.LogDate)
            .ToListAsync(cancellationToken);
        var medications = await dbContext.MedicationReminders.Where(x => x.PetProfileId == petProfileId).ToListAsync(cancellationToken);
        var appointments = await dbContext.Appointments.Where(x => x.PetProfileId == petProfileId).OrderBy(x => x.ScheduledAt).ToListAsync(cancellationToken);
        var vaccines = await dbContext.VaccineRecords.Where(x => x.PetProfileId == petProfileId).OrderBy(x => x.DueDate).ToListAsync(cancellationToken);

        var report = new ProgressReport
        {
            PetProfileId = petProfileId,
            PeriodStart = start,
            PeriodEnd = displayEnd,
            AverageWellnessScore = healthLogs.Count == 0 ? 0 : (int)Math.Round(healthLogs.Average(x => x.WellnessScore)),
            BehaviorTrend = behaviorLogs.Count == 0 ? "No behavior logs yet" : $"{behaviorLogs.Count} behavior logs tracked",
            HealthTrend = healthLogs.Count == 0 ? "No health logs yet" : $"{healthLogs.Count} health logs tracked",
            Summary = $"Progress report for {pet.Name} from {start:d} to {displayEnd:d}."
        };

        dbContext.ProgressReports.Add(report);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new WorkflowProgressDto(
            pet.Id,
            pet.Name,
            healthLogs.Select(x => new ChartPointDto(x.LogDate, x.WellnessScore, x.Notes)).ToList(),
            behaviorLogs.Select(x => new ChartPointDto(x.LogDate, ScoreBehavior(x), $"{x.Mood} / {x.Activity}")).ToList(),
            new MedicationSummaryDto(medications.Count, medications.Count(x => x.Status.Equals("Complete", StringComparison.OrdinalIgnoreCase)), medications.Count(x => x.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))),
            appointments.Select(x => new AppointmentSummaryDto(x.ScheduledAt, x.Title, x.Status, x.Notes)).ToList(),
            vaccines.Select(x => new VaccineSummaryDto(x.VaccineName, x.GivenDate, x.DueDate, VaccineStatus(x))).ToList(),
            new WorkflowProgressReportDto(
                report.Id,
                report.PetProfileId,
                report.PeriodStart,
                report.PeriodEnd,
                report.AverageWellnessScore,
                report.BehaviorTrend,
                report.HealthTrend,
                report.Summary));
    }

    private Guid RequireUserId() =>
        currentUser.UserId ?? throw new ApiException("User is not authenticated.", 401);

    private async Task<PetProfile> EnsureOwnedPetAsync(Guid petProfileId, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        return await dbContext.PetProfiles.FirstOrDefaultAsync(x => x.Id == petProfileId && x.UserId == userId, cancellationToken)
            ?? throw new ApiException("Pet profile was not found for this user.", 404);
    }

    private static string StepState(bool completed, bool prerequisiteReady) =>
        completed ? "completed" : prerequisiteReady ? "pending" : "needs attention";

    private static IEnumerable<string> SplitWords(string? value) =>
        (value ?? string.Empty).ToLowerInvariant()
            .Split([' ', ',', '.', ';', ':', '/', '\\', '|'], StringSplitOptions.RemoveEmptyEntries)
            .Where(x => x.Length > 3);

    private static bool ContainsAny(string? text, params string[] keywords) =>
        keywords.Any(keyword => (text ?? string.Empty).Contains(keyword, StringComparison.OrdinalIgnoreCase));

    private static int ScoreBehavior(BehaviorLog log)
    {
        var text = $"{log.Mood} {log.Activity} {log.Eating} {log.Sleeping}".ToLowerInvariant();
        if (ContainsAny(text, "happy", "play", "normal", "good", "high")) return 85;
        if (ContainsAny(text, "low", "tired", "sad", "anxious", "poor")) return 45;
        return 65;
    }

    private static string VaccineStatus(VaccineRecord vaccine)
    {
        if (vaccine.DueDate is null) return "No due date";
        if (vaccine.DueDate.Value.Date < DateTime.UtcNow.Date) return "Overdue";
        if (vaccine.DueDate.Value.Date <= DateTime.UtcNow.AddDays(30).Date) return "Due soon";
        return "Current";
    }

    private static WorkflowPetProfileDto MapPet(PetProfile pet) => new(
        pet.Id,
        pet.UserId,
        pet.Name,
        pet.Species,
        pet.Breed,
        pet.Age,
        pet.Weight,
        pet.Gender,
        pet.PhotoUrl,
        pet.Allergies,
        pet.MedicalHistory,
        pet.VetName,
        pet.VetPhone);
}

public sealed record WorkflowStatusDto(IReadOnlyList<WorkflowStepStatusDto> Steps);
public sealed record WorkflowStepStatusDto(string Key, string Title, string Status);

public sealed record WorkflowPetProfileDto(
    Guid Id,
    Guid UserId,
    string Name,
    string Species,
    string Breed,
    int Age,
    decimal Weight,
    string Gender,
    string? PhotoUrl,
    string Allergies,
    string MedicalHistory,
    string VetName,
    string VetPhone);

public sealed record WorkflowPetProfileRequest(
    string Name,
    string Species,
    string Breed,
    int Age,
    decimal Weight,
    string Gender,
    string? PhotoUrl,
    string? Allergies,
    string? MedicalHistory,
    string? VetName,
    string? VetPhone,
    string? VaccineName,
    DateTime? VaccineGivenDate,
    DateTime? VaccineDueDate,
    string? VaccineLotNumber,
    string? VaccineNotes);

public sealed record WorkflowDailyLogRequest(
    Guid PetProfileId,
    DateTime LogDate,
    string? EatingHabit,
    string? SleepingPattern,
    string? Mood,
    string? ActivityLevel,
    string? BathroomHabit,
    string? Symptoms,
    string? UnusualBehavior,
    string? BehaviorNotes,
    string? HealthNotes,
    string? Hydration,
    decimal? Weight,
    int WellnessScore);

public sealed record WorkflowDailyLogResponse(Guid BehaviorLogId, Guid HealthLogId, Guid PetProfileId, DateTime LogDate, string BehaviorNotes, string HealthNotes, int WellnessScore);
public sealed record WorkflowAnalysisDto(Guid PetProfileId, string PetName, int BehaviorLogCount, int HealthLogCount, IReadOnlyList<WorkflowFindingDto> Findings, DateTime GeneratedAt);
public sealed record WorkflowFindingDto(string Title, string Detail, string Status);
public sealed record WorkflowProgressDto(Guid PetProfileId, string PetName, IReadOnlyList<ChartPointDto> WellnessScore, IReadOnlyList<ChartPointDto> BehaviorTrend, MedicationSummaryDto MedicationCompletion, IReadOnlyList<AppointmentSummaryDto> AppointmentHistory, IReadOnlyList<VaccineSummaryDto> VaccineStatus, WorkflowProgressReportDto Report);
public sealed record ChartPointDto(DateTime Date, int Value, string Label);
public sealed record MedicationSummaryDto(int Total, int Complete, int Active);
public sealed record AppointmentSummaryDto(DateTime Date, string Title, string Status, string Notes);
public sealed record VaccineSummaryDto(string VaccineName, DateTime GivenDate, DateTime? DueDate, string Status);
public sealed record WorkflowProgressReportDto(Guid Id, Guid PetProfileId, DateTime PeriodStart, DateTime PeriodEnd, int AverageWellnessScore, string BehaviorTrend, string HealthTrend, string Summary);

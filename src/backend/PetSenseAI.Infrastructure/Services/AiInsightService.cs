using PetSenseAI.Application.Common;
using PetSenseAI.Application.Insights;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PetSenseAI.Infrastructure.Services;

public sealed class AiInsightService(PetSenseDbContext dbContext) : IAiInsightService
{
    public async Task<GeneratedAiInsightDto> AnalyzePetAsync(Guid petProfileId, CancellationToken cancellationToken = default)
    {
        var pet = await dbContext.PetProfiles
            .Include(x => x.HealthLogs.OrderByDescending(h => h.LogDate).Take(10))
            .Include(x => x.BehaviorLogs.OrderByDescending(b => b.LogDate).Take(10))
            .Include(x => x.MedicationReminders)
            .FirstOrDefaultAsync(x => x.Id == petProfileId, cancellationToken)
            ?? throw new ApiException("Pet profile was not found.", 404);

        var recentHealth = pet.HealthLogs.OrderByDescending(x => x.LogDate).ToList();
        var recentBehavior = pet.BehaviorLogs.OrderByDescending(x => x.LogDate).ToList();
        var symptomText = string.Join(' ', recentHealth.Select(x => x.Symptoms).Concat(recentBehavior.Select(x => x.Symptoms))).ToLowerInvariant();
        var unusualText = string.Join(' ', recentBehavior.Select(x => x.UnusualBehavior)).ToLowerInvariant();
        var averageWellness = recentHealth.Count == 0 ? 75 : (int)Math.Round(recentHealth.Average(x => x.WellnessScore));
        var activeMedications = pet.MedicationReminders.Count(x => x.Status.Equals("Active", StringComparison.OrdinalIgnoreCase));

        var risk = "Low";
        var title = $"{pet.Name} looks steady";
        var nextAction = "Continue daily logging and keep routines consistent.";

        if (averageWellness < 50 || ContainsAny(symptomText, "vomit", "blood", "seizure", "limp", "pain"))
        {
            risk = "High";
            title = $"Potential health concern for {pet.Name}";
            nextAction = "Contact your veterinarian promptly and bring recent logs.";
        }
        else if (averageWellness < 70 || ContainsAny(unusualText, "anxious", "aggressive", "hiding", "lethargic"))
        {
            risk = "Medium";
            title = $"{pet.Name} may need closer observation";
            nextAction = "Track symptoms twice daily for 48 hours and schedule care if the pattern continues.";
        }

        var recommendation = risk switch
        {
            "High" => "Recent symptoms or low wellness scores may indicate a condition that needs professional review.",
            "Medium" => "Behavior and wellness patterns show a change. Keep food, sleep, bathroom, and mood notes consistent.",
            _ => activeMedications > 0
                ? "Wellness is stable. Keep medication reminders active and verify doses at the same time daily."
                : "Wellness is stable. Add weekly weight and vaccine updates to improve future insights."
        };

        var sourceSummary = $"{recentHealth.Count} health logs, {recentBehavior.Count} behavior logs, {activeMedications} active medications analyzed.";

        // Replace this mock rules engine with OpenAI or Azure OpenAI later.
        // Recommended prompt context: pet profile, normalized recent logs, medication schedule,
        // owner concern, and vet-safe response rules that never replace professional diagnosis.
        var insight = new AiInsight
        {
            PetProfileId = pet.Id,
            Title = title,
            RiskLevel = risk,
            Recommendation = recommendation,
            NextAction = nextAction,
            SourceSummary = sourceSummary
        };

        dbContext.AiInsights.Add(insight);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new GeneratedAiInsightDto(pet.Id, title, risk, recommendation, nextAction, sourceSummary);
    }

    private static bool ContainsAny(string text, params string[] keywords) =>
        keywords.Any(text.Contains);
}

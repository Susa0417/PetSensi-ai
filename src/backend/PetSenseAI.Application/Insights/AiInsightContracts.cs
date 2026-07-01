using MediatR;

namespace PetSenseAI.Application.Insights;

public sealed record GenerateAiInsightCommand(Guid PetProfileId) : IRequest<GeneratedAiInsightDto>;

public sealed record GeneratedAiInsightDto(
    Guid PetProfileId,
    string Title,
    string RiskLevel,
    string Recommendation,
    string NextAction,
    string SourceSummary);

public interface IAiInsightService
{
    Task<GeneratedAiInsightDto> AnalyzePetAsync(Guid petProfileId, CancellationToken cancellationToken = default);
}

using MediatR;

namespace PetSenseAI.Application.Insights;

public sealed class GenerateAiInsightCommandHandler(IAiInsightService aiInsightService)
    : IRequestHandler<GenerateAiInsightCommand, GeneratedAiInsightDto>
{
    public Task<GeneratedAiInsightDto> Handle(GenerateAiInsightCommand request, CancellationToken cancellationToken) =>
        aiInsightService.AnalyzePetAsync(request.PetProfileId, cancellationToken);
}

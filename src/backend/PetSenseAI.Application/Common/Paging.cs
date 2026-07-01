namespace PetSenseAI.Application.Common;

public sealed record PagedRequest(int Page = 1, int PageSize = 20, string? Search = null);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

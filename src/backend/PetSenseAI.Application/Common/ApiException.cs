namespace PetSenseAI.Application.Common;

public sealed class ApiException(string message, int statusCode = 400) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

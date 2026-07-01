using System.Net;
using FluentValidation;
using PetSenseAI.Application.Common;

namespace PetSenseAI.API.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException exception)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Validation failed.",
                errors = exception.Errors.Select(x => new { x.PropertyName, x.ErrorMessage })
            });
        }
        catch (ApiException exception)
        {
            context.Response.StatusCode = exception.StatusCode;
            await context.Response.WriteAsJsonAsync(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled API exception.");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await context.Response.WriteAsJsonAsync(new { message = "A server error occurred." });
        }
    }
}

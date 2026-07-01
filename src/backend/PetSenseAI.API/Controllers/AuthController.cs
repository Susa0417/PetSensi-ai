using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Auth;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IMediator mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public Task<AuthResponse> Register(RegisterCommand command) => mediator.Send(command);

    [HttpPost("login")]
    [AllowAnonymous]
    public Task<AuthResponse> Login(LoginCommand command) => mediator.Send(command);

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public Task<AuthResponse> Refresh(RefreshTokenCommand command) => mediator.Send(command);

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutCommand command)
    {
        await mediator.Send(command);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() => Ok(new { currentUser.UserId, currentUser.Email, currentUser.Roles });
}

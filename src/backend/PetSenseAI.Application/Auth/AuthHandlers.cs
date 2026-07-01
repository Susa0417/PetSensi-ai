using MediatR;

namespace PetSenseAI.Application.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterCommand command, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshAsync(RefreshTokenCommand command, CancellationToken cancellationToken = default);
    Task LogoutAsync(LogoutCommand command, CancellationToken cancellationToken = default);
}

public sealed class RegisterCommandHandler(IAuthService authService) : IRequestHandler<RegisterCommand, AuthResponse>
{
    public Task<AuthResponse> Handle(RegisterCommand request, CancellationToken cancellationToken) =>
        authService.RegisterAsync(request, cancellationToken);
}

public sealed class LoginCommandHandler(IAuthService authService) : IRequestHandler<LoginCommand, AuthResponse>
{
    public Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken) =>
        authService.LoginAsync(request, cancellationToken);
}

public sealed class RefreshTokenCommandHandler(IAuthService authService) : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    public Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken) =>
        authService.RefreshAsync(request, cancellationToken);
}

public sealed class LogoutCommandHandler(IAuthService authService) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken) =>
        await authService.LogoutAsync(request, cancellationToken);
}

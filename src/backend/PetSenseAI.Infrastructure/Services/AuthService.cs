using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Auth;
using PetSenseAI.Application.Common;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace PetSenseAI.Infrastructure.Services;

public sealed class AuthService(
    PetSenseDbContext dbContext,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterCommand command, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();
        var exists = await dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(x => x.Email.ToLower() == normalizedEmail, cancellationToken);

        if (exists)
        {
            throw new ApiException("An account with this email already exists.", 409);
        }

        var role = await EnsureUserRoleAsync(cancellationToken);
        var user = new User
        {
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(command.Password),
            UserRoles = [new UserRole { Role = role }]
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await IssueTokensAsync(user.Id, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginCommand command, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .Include(x => x.UserRoles).ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (user is null || !user.IsActive || !passwordHasher.Verify(command.Password, user.PasswordHash))
        {
            throw new ApiException("Invalid email or password.", 401);
        }

        return await IssueTokensAsync(user.Id, cancellationToken);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshTokenCommand command, CancellationToken cancellationToken = default)
    {
        var tokenHash = jwtTokenService.HashRefreshToken(command.RefreshToken);
        var refreshToken = await dbContext.RefreshTokens
            .IgnoreQueryFilters()
            .Include(x => x.User!)
            .ThenInclude(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);

        if (refreshToken is null || !refreshToken.IsActive || refreshToken.User is null || !refreshToken.User.IsActive)
        {
            throw new ApiException("Refresh token is invalid or expired.", 401);
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        var response = await IssueTokensAsync(refreshToken.UserId, cancellationToken, saveImmediately: false);
        refreshToken.ReplacedByTokenHash = jwtTokenService.HashRefreshToken(response.RefreshToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return response;
    }

    public async Task LogoutAsync(LogoutCommand command, CancellationToken cancellationToken = default)
    {
        var tokenHash = jwtTokenService.HashRefreshToken(command.RefreshToken);
        var token = await dbContext.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (token is not null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<AuthResponse> IssueTokensAsync(Guid userId, CancellationToken cancellationToken, bool saveImmediately = true)
    {
        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstAsync(x => x.Id == userId, cancellationToken);

        var roles = user.UserRoles.Select(x => x.Role?.Name).Where(x => !string.IsNullOrWhiteSpace(x)).Cast<string>().ToArray();
        var expiresAt = DateTime.UtcNow.AddMinutes(jwtOptions.Value.AccessTokenMinutes);
        var refreshToken = jwtTokenService.CreateRefreshToken();
        var refreshTokenHash = jwtTokenService.HashRefreshToken(refreshToken);

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(jwtOptions.Value.RefreshTokenDays)
        });

        if (saveImmediately)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var accessToken = jwtTokenService.CreateAccessToken(user.Id, user.Email, roles, expiresAt);
        return new AuthResponse(user.Id, user.FirstName, user.LastName, user.Email, roles, accessToken, refreshToken, expiresAt);
    }

    private async Task<Role> EnsureUserRoleAsync(CancellationToken cancellationToken)
    {
        const string roleName = "User";
        const string roleDescription = "Can manage personal pet care workspace.";

        var role = await dbContext.Roles
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Name == roleName, cancellationToken);

        if (role is null)
        {
            role = new Role { Name = roleName, Description = roleDescription };
            dbContext.Roles.Add(role);
            return role;
        }

        if (role.IsDeleted)
        {
            role.IsDeleted = false;
            role.DeletedAt = null;
        }

        if (string.IsNullOrWhiteSpace(role.Description))
        {
            role.Description = roleDescription;
        }

        return role;
    }
}

using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Auth;
using PetSenseAI.Application.Insights;
using PetSenseAI.Infrastructure.Data;
using PetSenseAI.Infrastructure.Repositories;
using PetSenseAI.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PetSenseAI.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection("Jwt");
        services.Configure<JwtOptions>(options =>
        {
            options.Issuer = jwtSection["Issuer"] ?? options.Issuer;
            options.Audience = jwtSection["Audience"] ?? options.Audience;
            options.SigningKey = jwtSection["SigningKey"] ?? options.SigningKey;
            options.AccessTokenMinutes = int.TryParse(jwtSection["AccessTokenMinutes"], out var accessMinutes) ? accessMinutes : options.AccessTokenMinutes;
            options.RefreshTokenDays = int.TryParse(jwtSection["RefreshTokenDays"], out var refreshDays) ? refreshDays : options.RefreshTokenDays;
        });
        services.AddDbContext<PetSenseDbContext>(options =>
        {
            var provider = configuration["Database:Provider"];
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            if (provider?.Equals("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
            {
                options.UseSqlite(connectionString ?? "Data Source=petsense-dev.db");
                return;
            }

            options.UseNpgsql(connectionString);
        });

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<PetSenseDbContext>());
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAiInsightService, AiInsightService>();
        return services;
    }
}

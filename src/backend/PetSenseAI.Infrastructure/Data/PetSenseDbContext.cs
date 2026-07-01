using System.Linq.Expressions;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace PetSenseAI.Infrastructure.Data;

public sealed class PetSenseDbContext(DbContextOptions<PetSenseDbContext> options, ICurrentUserService? currentUser = null)
    : DbContext(options), IUnitOfWork
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PetProfile> PetProfiles => Set<PetProfile>();
    public DbSet<HealthLog> HealthLogs => Set<HealthLog>();
    public DbSet<BehaviorLog> BehaviorLogs => Set<BehaviorLog>();
    public DbSet<MedicationReminder> MedicationReminders => Set<MedicationReminder>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<VaccineRecord> VaccineRecords => Set<VaccineRecord>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<TrainingGuide> TrainingGuides => Set<TrainingGuide>();
    public DbSet<AiInsight> AiInsights => Set<AiInsight>();
    public DbSet<Recommendation> Recommendations => Set<Recommendation>();
    public DbSet<ProgressReport> ProgressReports => Set<ProgressReport>();
    public DbSet<NutritionPlan> NutritionPlans => Set<NutritionPlan>();
    public DbSet<NutritionPlanItem> NutritionPlanItems => Set<NutritionPlanItem>();
    public DbSet<DailyProgressLog> DailyProgressLogs => Set<DailyProgressLog>();
    public DbSet<WellnessMetric> WellnessMetrics => Set<WellnessMetric>();
    public DbSet<WebsiteSection> WebsiteSections => Set<WebsiteSection>();
    public DbSet<HeroSection> HeroSections => Set<HeroSection>();
    public DbSet<Problem> Problems => Set<Problem>();
    public DbSet<Solution> Solutions => Set<Solution>();
    public DbSet<Feature> Features => Set<Feature>();
    public DbSet<HowItWorksStep> HowItWorksSteps => Set<HowItWorksStep>();
    public DbSet<TargetCustomer> TargetCustomers => Set<TargetCustomer>();
    public DbSet<ComparisonItem> ComparisonItems => Set<ComparisonItem>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();
    public DbSet<MediaFile> MediaFiles => Set<MediaFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(180);
            entity.Property(x => x.PasswordHash).HasMaxLength(500);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(80);
        });

        modelBuilder.Entity<UserRole>().HasKey(x => new { x.UserId, x.RoleId });
        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.User)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.UserId);
        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.Role)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.RoleId);

        modelBuilder.Entity<PetProfile>().Property(x => x.Weight).HasPrecision(8, 2);
        modelBuilder.Entity<HealthLog>().Property(x => x.Weight).HasPrecision(8, 2);
        modelBuilder.Entity<NutritionPlan>().Property(x => x.Weight).HasPrecision(8, 2);
        modelBuilder.Entity<DailyProgressLog>().Property(x => x.Weight).HasPrecision(8, 2);
        modelBuilder.Entity<DailyProgressLog>().Property(x => x.SleepHours).HasPrecision(5, 2);
        modelBuilder.Entity<WellnessMetric>().Property(x => x.Value).HasPrecision(8, 2);

        modelBuilder.Entity<NutritionPlan>()
            .HasMany(x => x.Items)
            .WithOne(x => x.NutritionPlan)
            .HasForeignKey(x => x.NutritionPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DailyProgressLog>()
            .HasMany(x => x.Metrics)
            .WithOne(x => x.DailyProgressLog)
            .HasForeignKey(x => x.DailyProgressLogId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WebsiteSection>().HasIndex(x => x.Key).IsUnique();
        modelBuilder.Entity<HeroSection>().HasIndex(x => x.IsActive);
        modelBuilder.Entity<ContactSubmission>().HasIndex(x => x.Email);
        modelBuilder.Entity<MediaFile>().HasIndex(x => x.Category);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(t => typeof(AuditableEntity).IsAssignableFrom(t.ClrType)))
        {
            var parameter = Expression.Parameter(entityType.ClrType, "entity");
            var deletedProperty = Expression.Property(parameter, nameof(AuditableEntity.IsDeleted));
            var compare = Expression.Equal(deletedProperty, Expression.Constant(false));
            var lambda = Expression.Lambda(compare, parameter);
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
        }

        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var actor = currentUser?.Email ?? "system";

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy ??= actor;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = actor;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

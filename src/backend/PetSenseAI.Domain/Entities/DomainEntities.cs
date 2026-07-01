namespace PetSenseAI.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<PetProfile> Pets { get; set; } = new List<PetProfile>();
}

public class Role : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
}

public class RefreshToken : AuditableEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
}

public class PetProfile : AuditableEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Species { get; set; } = "Dog";
    public string Breed { get; set; } = string.Empty;
    public int Age { get; set; }
    public decimal Weight { get; set; }
    public string Gender { get; set; } = "Unknown";
    public string? PhotoUrl { get; set; }
    public string Allergies { get; set; } = string.Empty;
    public string MedicalHistory { get; set; } = string.Empty;
    public string VetName { get; set; } = string.Empty;
    public string VetPhone { get; set; } = string.Empty;
    public ICollection<HealthLog> HealthLogs { get; set; } = new List<HealthLog>();
    public ICollection<BehaviorLog> BehaviorLogs { get; set; } = new List<BehaviorLog>();
    public ICollection<MedicationReminder> MedicationReminders { get; set; } = new List<MedicationReminder>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<VaccineRecord> VaccineRecords { get; set; } = new List<VaccineRecord>();
    public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
    public ICollection<NutritionPlan> NutritionPlans { get; set; } = new List<NutritionPlan>();
    public ICollection<DailyProgressLog> DailyProgressLogs { get; set; } = new List<DailyProgressLog>();
    public ICollection<WellnessMetric> WellnessMetrics { get; set; } = new List<WellnessMetric>();
}

public class HealthLog : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public DateTime LogDate { get; set; } = DateTime.UtcNow;
    public decimal? Weight { get; set; }
    public int WellnessScore { get; set; }
    public string Symptoms { get; set; } = string.Empty;
    public string Appetite { get; set; } = string.Empty;
    public string Hydration { get; set; } = string.Empty;
    public string EnergyLevel { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class BehaviorLog : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public DateTime LogDate { get; set; } = DateTime.UtcNow;
    public string Eating { get; set; } = string.Empty;
    public string Sleeping { get; set; } = string.Empty;
    public string Mood { get; set; } = string.Empty;
    public string Activity { get; set; } = string.Empty;
    public string BathroomHabits { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
    public string UnusualBehavior { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class MedicationReminder : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "Active";
    public TimeSpan AlertTime { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class Appointment : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string Type { get; set; } = "Vet Visit";
    public string Title { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string Status { get; set; } = "Scheduled";
    public string Notes { get; set; } = string.Empty;
}

public class VaccineRecord : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string VaccineName { get; set; } = string.Empty;
    public DateTime GivenDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class MedicalRecord : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RecordType { get; set; } = string.Empty;
    public DateTime RecordDate { get; set; } = DateTime.UtcNow;
    public string ProviderName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class TrainingGuide : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Species { get; set; } = string.Empty;
    public string Breed { get; set; } = string.Empty;
    public string AgeRange { get; set; } = string.Empty;
    public string Concern { get; set; } = string.Empty;
    public string Steps { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Beginner";
    public bool IsPublished { get; set; } = true;
}

public class AiInsight : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "Low";
    public string Recommendation { get; set; } = string.Empty;
    public string NextAction { get; set; } = string.Empty;
    public string SourceSummary { get; set; } = string.Empty;
}

public class Recommendation : AuditableEntity
{
    public Guid? PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string Category { get; set; } = "Care";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string TriggerRule { get; set; } = string.Empty;
    public bool IsTemplate { get; set; }
}

public class ProgressReport : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int AverageWellnessScore { get; set; }
    public string BehaviorTrend { get; set; } = string.Empty;
    public string HealthTrend { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
}

public class NutritionPlan : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public string PetType { get; set; } = "Dog";
    public string Breed { get; set; } = string.Empty;
    public int Age { get; set; }
    public decimal Weight { get; set; }
    public string Allergies { get; set; } = string.Empty;
    public string MedicalConditions { get; set; } = string.Empty;
    public string ActivityLevel { get; set; } = "Moderate";
    public string CurrentFood { get; set; } = string.Empty;
    public string FeedingSchedule { get; set; } = string.Empty;
    public string HealthGoal { get; set; } = "Maintain healthy weight";
    public string RecommendedFoodType { get; set; } = string.Empty;
    public string MealFrequency { get; set; } = string.Empty;
    public string PortionSuggestion { get; set; } = string.Empty;
    public string HydrationReminder { get; set; } = string.Empty;
    public string FoodsToAvoid { get; set; } = string.Empty;
    public string AllergyNotes { get; set; } = string.Empty;
    public string HealthGoalGuidance { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public ICollection<NutritionPlanItem> Items { get; set; } = new List<NutritionPlanItem>();
}

public class NutritionPlanItem : AuditableEntity
{
    public Guid NutritionPlanId { get; set; }
    public NutritionPlan? NutritionPlan { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class DailyProgressLog : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public DateTime LogDate { get; set; } = DateTime.UtcNow;
    public decimal? Weight { get; set; }
    public string Mood { get; set; } = string.Empty;
    public string ActivityLevel { get; set; } = string.Empty;
    public decimal SleepHours { get; set; }
    public string FoodIntake { get; set; } = string.Empty;
    public string WaterIntake { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
    public bool MedicationTaken { get; set; }
    public string TrainingProgress { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public int WellnessScore { get; set; }
    public ICollection<WellnessMetric> Metrics { get; set; } = new List<WellnessMetric>();
}

public class WellnessMetric : AuditableEntity
{
    public Guid PetProfileId { get; set; }
    public PetProfile? PetProfile { get; set; }
    public Guid? DailyProgressLogId { get; set; }
    public DailyProgressLog? DailyProgressLog { get; set; }
    public DateTime MetricDate { get; set; } = DateTime.UtcNow;
    public string MetricType { get; set; } = "WellnessScore";
    public decimal Value { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class WebsiteSection : AuditableEntity
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class HeroSection : AuditableEntity
{
    public string Title { get; set; } = "PetSense AI";
    public string Headline { get; set; } = "Understand Your Pet Like Never Before.";
    public string Subtitle { get; set; } = string.Empty;
    public string PrimaryCtaText { get; set; } = "Get Started";
    public string SecondaryCtaText { get; set; } = "Learn More";
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class Problem : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class Solution : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class Feature : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "pets";
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class HowItWorksStep : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int StepNumber { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class TargetCustomer : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class ComparisonItem : AuditableEntity
{
    public string Capability { get; set; } = string.Empty;
    public string PetSenseValue { get; set; } = string.Empty;
    public string TraditionalValue { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class Testimonial : AuditableEntity
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerRole { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public bool IsPublished { get; set; } = true;
}

public class ContactSubmission : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PetType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "New";
}

public class MediaFile : AuditableEntity
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
}

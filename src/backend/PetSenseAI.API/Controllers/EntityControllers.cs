using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Application.Insights;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Route("api/pets")]
public sealed class PetProfilesController : CrudControllerBase<PetProfile>
{
    private readonly IRepository<PetProfile> _repository;
    private readonly ICurrentUserService _currentUser;

    public PetProfilesController(IRepository<PetProfile> repository, ICurrentUserService currentUser)
        : base(repository)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    [HttpGet]
    public override async Task<PagedResult<PetProfile>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var result = await _repository.ListAsync(new PagedRequest(page, pageSize, search), HttpContext.RequestAborted);
        if (_currentUser.Roles.Contains("Admin"))
        {
            return result;
        }

        var owned = result.Items.Where(x => x.UserId == _currentUser.UserId).ToList();
        return result with { Items = owned, TotalCount = owned.Count };
    }

    [HttpPost]
    public override Task<PetProfile> Create(PetProfile entity)
    {
        entity.UserId = _currentUser.UserId ?? entity.UserId;
        return base.Create(entity);
    }
}

[ApiController]
[Route("api/health-logs")]
public sealed class HealthLogsController(IRepository<HealthLog> repository) : CrudControllerBase<HealthLog>(repository);

[ApiController]
[Route("api/behavior-logs")]
public sealed class BehaviorLogsController(IRepository<BehaviorLog> repository) : CrudControllerBase<BehaviorLog>(repository);

[ApiController]
[Route("api/medication-reminders")]
public sealed class MedicationRemindersController(IRepository<MedicationReminder> repository) : CrudControllerBase<MedicationReminder>(repository);

[ApiController]
[Route("api/appointments")]
public sealed class AppointmentsController(IRepository<Appointment> repository) : CrudControllerBase<Appointment>(repository);

[ApiController]
[Route("api/vaccine-records")]
public sealed class VaccineRecordsController(IRepository<VaccineRecord> repository) : CrudControllerBase<VaccineRecord>(repository);

[ApiController]
[Route("api/medical-records")]
public sealed class MedicalRecordsController(IRepository<MedicalRecord> repository) : CrudControllerBase<MedicalRecord>(repository);

[ApiController]
[Route("api/training-guides")]
public sealed class TrainingGuidesController(IRepository<TrainingGuide> repository) : CrudControllerBase<TrainingGuide>(repository);

[ApiController]
[Route("api/recommendations")]
public sealed class RecommendationsController(IRepository<Recommendation> repository) : CrudControllerBase<Recommendation>(repository);

[ApiController]
[Route("api/progress-reports")]
public sealed class ProgressReportsController(IRepository<ProgressReport> repository) : CrudControllerBase<ProgressReport>(repository);

[ApiController]
[Route("api/ai-insights")]
public sealed class AiInsightsController(IRepository<AiInsight> repository, IMediator mediator) : CrudControllerBase<AiInsight>(repository)
{
    [HttpPost("generate/{petProfileId:guid}")]
    public Task<GeneratedAiInsightDto> Generate(Guid petProfileId) =>
        mediator.Send(new GenerateAiInsightCommand(petProfileId), HttpContext.RequestAborted);
}

[ApiController]
[Route("api/admin/roles")]
[Authorize(Roles = "Admin")]
public sealed class RolesController(IRepository<Role> repository) : CrudControllerBase<Role>(repository);

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public sealed class UsersController(PetSenseDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search = null)
    {
        var query = dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Email.Contains(search) || x.FirstName.Contains(search) || x.LastName.Contains(search));
        }

        var users = await query.OrderByDescending(x => x.CreatedAt).Select(x => new
        {
            x.Id,
            x.FirstName,
            x.LastName,
            x.Email,
            x.IsActive,
            Roles = x.UserRoles.Select(r => r.Role!.Name).ToArray(),
            x.CreatedAt
        }).ToListAsync();

        return Ok(users);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] bool isActive)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsActive = isActive;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}

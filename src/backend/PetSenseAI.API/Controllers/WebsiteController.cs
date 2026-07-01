using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Route("api/website")]
public sealed class WebsiteController(PetSenseDbContext dbContext, IRepository<ContactSubmission> contactRepository) : ControllerBase
{
    [HttpGet("home")]
    [AllowAnonymous]
    public async Task<IActionResult> Home()
    {
        var hero = await dbContext.HeroSections.OrderByDescending(x => x.IsActive).ThenByDescending(x => x.CreatedAt).FirstOrDefaultAsync();
        var whyNow = await dbContext.WebsiteSections.FirstOrDefaultAsync(x => x.Key == "why-now");
        return Ok(new
        {
            hero,
            whyNow,
            sections = await dbContext.WebsiteSections.Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            problems = await dbContext.Problems.Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            solutions = await dbContext.Solutions.Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            features = await dbContext.Features.Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            steps = await dbContext.HowItWorksSteps.Where(x => x.IsPublished).OrderBy(x => x.StepNumber).ToListAsync(),
            targetCustomers = await dbContext.TargetCustomers.Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            comparison = await dbContext.ComparisonItems.Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            testimonials = await dbContext.Testimonials.Where(x => x.IsPublished).OrderByDescending(x => x.CreatedAt).ToListAsync()
        });
    }

    [HttpPost("waitlist")]
    [AllowAnonymous]
    public async Task<ContactSubmission> JoinWaitlist(ContactSubmission submission)
    {
        submission.Status = "New";
        return await contactRepository.AddAsync(submission, HttpContext.RequestAborted);
    }
}

[ApiController]
[Route("api/admin/website-sections")]
[Authorize(Roles = "Admin")]
public sealed class WebsiteSectionsController(IRepository<WebsiteSection> repository) : CrudControllerBase<WebsiteSection>(repository);

[ApiController]
[Route("api/admin/hero-sections")]
[Authorize(Roles = "Admin")]
public sealed class HeroSectionsController(IRepository<HeroSection> repository) : CrudControllerBase<HeroSection>(repository);

[ApiController]
[Route("api/admin/problems")]
[Authorize(Roles = "Admin")]
public sealed class ProblemsController(IRepository<Problem> repository) : CrudControllerBase<Problem>(repository);

[ApiController]
[Route("api/admin/solutions")]
[Authorize(Roles = "Admin")]
public sealed class SolutionsController(IRepository<Solution> repository) : CrudControllerBase<Solution>(repository);

[ApiController]
[Route("api/admin/features")]
[Authorize(Roles = "Admin")]
public sealed class FeaturesController(IRepository<Feature> repository) : CrudControllerBase<Feature>(repository);

[ApiController]
[Route("api/admin/how-it-works")]
[Authorize(Roles = "Admin")]
public sealed class HowItWorksController(IRepository<HowItWorksStep> repository) : CrudControllerBase<HowItWorksStep>(repository);

[ApiController]
[Route("api/admin/target-customers")]
[Authorize(Roles = "Admin")]
public sealed class TargetCustomersController(IRepository<TargetCustomer> repository) : CrudControllerBase<TargetCustomer>(repository);

[ApiController]
[Route("api/admin/comparison-items")]
[Authorize(Roles = "Admin")]
public sealed class ComparisonItemsController(IRepository<ComparisonItem> repository) : CrudControllerBase<ComparisonItem>(repository);

[ApiController]
[Route("api/admin/testimonials")]
[Authorize(Roles = "Admin")]
public sealed class TestimonialsController(IRepository<Testimonial> repository) : CrudControllerBase<Testimonial>(repository);

[ApiController]
[Route("api/admin/contact-submissions")]
[Authorize(Roles = "Admin")]
public sealed class ContactSubmissionsController(IRepository<ContactSubmission> repository) : CrudControllerBase<ContactSubmission>(repository);

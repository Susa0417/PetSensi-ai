using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Domain.Entities;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Route("api/admin/media-files")]
[Authorize(Roles = "Admin")]
public sealed class MediaFilesController : CrudControllerBase<MediaFile>
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".txt"];
    private static readonly string[] AllowedContentTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    private readonly IRepository<MediaFile> _repository;
    private readonly IWebHostEnvironment _environment;

    public MediaFilesController(IRepository<MediaFile> repository, IWebHostEnvironment environment)
        : base(repository)
    {
        _repository = repository;
        _environment = environment;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(20_000_000)]
    public async Task<MediaFile> Upload(IFormFile file, [FromForm] string category = "general", [FromForm] string altText = "")
    {
        ValidateUpload(file);

        var uploads = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploads);
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeFileName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(uploads, safeFileName);

        await using (var stream = System.IO.File.Create(path))
        {
            await file.CopyToAsync(stream, HttpContext.RequestAborted);
        }

        return await _repository.AddAsync(new MediaFile
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length,
            Category = category,
            AltText = altText,
            Url = $"/uploads/{safeFileName}"
        }, HttpContext.RequestAborted);
    }

    [HttpDelete("{id:guid}")]
    public override async Task<IActionResult> Delete(Guid id)
    {
        var media = await _repository.GetByIdAsync(id, HttpContext.RequestAborted)
            ?? throw new ApiException("Media file was not found.", 404);

        await _repository.SoftDeleteAsync(id, HttpContext.RequestAborted);
        DeletePhysicalFile(media.Url);
        return NoContent();
    }

    private static void ValidateUpload(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            throw new BadHttpRequestException("Please choose a file to upload.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new BadHttpRequestException("File size must be 5 MB or less.");
        }

        var normalizedType = (file.ContentType ?? string.Empty).ToLowerInvariant();
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var isAllowed = AllowedContentTypes.Contains(normalizedType) || AllowedExtensions.Contains(extension);
        if (!isAllowed)
        {
            throw new BadHttpRequestException("Only JPG, PNG, WEBP, PDF, DOCX, or TXT files are supported.");
        }
    }

    private void DeletePhysicalFile(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl) || !relativeUrl.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var uploadsPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");
        var fileName = relativeUrl.Replace("/uploads/", string.Empty, StringComparison.OrdinalIgnoreCase);
        var fullPath = Path.Combine(uploadsPath, fileName);
        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }
    }
}

[ApiController]
[Route("api/media-files")]
public sealed class UserMediaFilesController(IRepository<MediaFile> repository, IWebHostEnvironment environment) : ControllerBase
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".txt"];
    private static readonly string[] AllowedContentTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<MediaFile>>> GetActiveMedia([FromQuery] int take = 12)
    {
        var limit = Math.Clamp(take, 1, 24);
        var items = await repository.Query()
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(items);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(20_000_000)]
    [Authorize]
    public async Task<MediaFile> Upload(IFormFile file, [FromForm] string category = "pet-record", [FromForm] string altText = "")
    {
        ValidateUpload(file);

        var uploads = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploads);
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeFileName = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(uploads, safeFileName);

        await using (var stream = System.IO.File.Create(path))
        {
            await file.CopyToAsync(stream, HttpContext.RequestAborted);
        }

        return await repository.AddAsync(new MediaFile
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length,
            Category = category,
            AltText = altText,
            Url = $"/uploads/{safeFileName}"
        }, HttpContext.RequestAborted);
    }

    private static void ValidateUpload(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            throw new BadHttpRequestException("Please choose a file to upload.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new BadHttpRequestException("File size must be 5 MB or less.");
        }

        var normalizedType = (file.ContentType ?? string.Empty).ToLowerInvariant();
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var isAllowed = AllowedContentTypes.Contains(normalizedType) || AllowedExtensions.Contains(extension);
        if (!isAllowed)
        {
            throw new BadHttpRequestException("Only JPG, PNG, WEBP, PDF, DOCX, or TXT files are supported.");
        }
    }
}

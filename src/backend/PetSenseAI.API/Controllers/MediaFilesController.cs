using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Domain.Entities;

namespace PetSenseAI.API.Controllers;

[ApiController]
[Route("api/admin/media-files")]
[Authorize(Roles = "Admin")]
public sealed class MediaFilesController : CrudControllerBase<MediaFile>
{
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
        if (file.Length == 0)
        {
            throw new BadHttpRequestException("File is empty.");
        }

        var uploads = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploads);
        var safeFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
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
}

[ApiController]
[Route("api/media-files")]
[Authorize]
public sealed class UserMediaFilesController(IRepository<MediaFile> repository, IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("upload")]
    [RequestSizeLimit(20_000_000)]
    public async Task<MediaFile> Upload(IFormFile file, [FromForm] string category = "pet-record", [FromForm] string altText = "")
    {
        if (file.Length == 0)
        {
            throw new BadHttpRequestException("File is empty.");
        }

        var uploads = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploads);
        var safeFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
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
}

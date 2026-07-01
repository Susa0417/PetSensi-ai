using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Domain.Entities;

namespace PetSenseAI.API.Controllers;

[Authorize]
public abstract class CrudControllerBase<T>(IRepository<T> repository) : ControllerBase where T : AuditableEntity
{
    [HttpGet]
    public virtual Task<PagedResult<T>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null) =>
        repository.ListAsync(new PagedRequest(page, pageSize, search), HttpContext.RequestAborted);

    [HttpGet("{id:guid}")]
    public virtual async Task<ActionResult<T>> Get(Guid id)
    {
        var entity = await repository.GetByIdAsync(id, HttpContext.RequestAborted);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    public virtual Task<T> Create(T entity) => repository.AddAsync(entity, HttpContext.RequestAborted);

    [HttpPut("{id:guid}")]
    public virtual async Task<IActionResult> Update(Guid id, T entity)
    {
        if (id != entity.Id)
        {
            return BadRequest(new { message = "Route id must match body id." });
        }

        await repository.UpdateAsync(entity, HttpContext.RequestAborted);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public virtual async Task<IActionResult> Delete(Guid id)
    {
        await repository.SoftDeleteAsync(id, HttpContext.RequestAborted);
        return NoContent();
    }
}

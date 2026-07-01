using System.Linq.Expressions;
using PetSenseAI.Application.Abstractions;
using PetSenseAI.Application.Common;
using PetSenseAI.Domain.Entities;
using PetSenseAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PetSenseAI.Infrastructure.Repositories;

public sealed class Repository<T>(PetSenseDbContext dbContext) : IRepository<T> where T : AuditableEntity
{
    public IQueryable<T> Query() => dbContext.Set<T>().AsQueryable();

    public async Task<PagedResult<T>> ListAsync(PagedRequest request, CancellationToken cancellationToken = default)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;
        var query = Query();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = ApplySearch(query, request.Search.Trim());
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, total, page, pageSize);
    }

    public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Set<T>().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        dbContext.Set<T>().Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        dbContext.Set<T>().Update(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken)
            ?? throw new ApiException($"{typeof(T).Name} was not found.", 404);

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<T> ApplySearch(IQueryable<T> query, string search)
    {
        var stringProperties = typeof(T).GetProperties()
            .Where(p => p.PropertyType == typeof(string) && p.CanRead)
            .Take(6)
            .ToList();

        if (stringProperties.Count == 0)
        {
            return query;
        }

        var parameter = Expression.Parameter(typeof(T), "entity");
        Expression? body = null;

        foreach (var property in stringProperties)
        {
            var propertyAccess = Expression.Property(parameter, property);
            var notNull = Expression.NotEqual(propertyAccess, Expression.Constant(null, typeof(string)));
            var contains = Expression.Call(
                propertyAccess,
                nameof(string.Contains),
                Type.EmptyTypes,
                Expression.Constant(search, typeof(string)));
            var safeContains = Expression.AndAlso(notNull, contains);
            body = body is null ? safeContains : Expression.OrElse(body, safeContains);
        }

        return body is null ? query : query.Where(Expression.Lambda<Func<T, bool>>(body, parameter));
    }
}

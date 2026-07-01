using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PetSenseAI.Infrastructure.Data;

#nullable disable

namespace PetSenseAI.Infrastructure.Migrations;

[DbContext(typeof(PetSenseDbContext))]
public sealed class PetSenseDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "9.0.0");
    }
}

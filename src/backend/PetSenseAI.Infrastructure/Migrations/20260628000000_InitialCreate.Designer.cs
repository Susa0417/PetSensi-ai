using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PetSenseAI.Infrastructure.Data;

#nullable disable

namespace PetSenseAI.Infrastructure.Migrations;

[DbContext(typeof(PetSenseDbContext))]
[Migration("20260628000000_InitialCreate")]
public partial class InitialCreate
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "9.0.0");
    }
}

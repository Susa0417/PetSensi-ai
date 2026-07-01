FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY PetSenseAI.sln ./
COPY src/backend/PetSenseAI.Domain/PetSenseAI.Domain.csproj src/backend/PetSenseAI.Domain/
COPY src/backend/PetSenseAI.Application/PetSenseAI.Application.csproj src/backend/PetSenseAI.Application/
COPY src/backend/PetSenseAI.Infrastructure/PetSenseAI.Infrastructure.csproj src/backend/PetSenseAI.Infrastructure/
COPY src/backend/PetSenseAI.API/PetSenseAI.API.csproj src/backend/PetSenseAI.API/
RUN dotnet restore src/backend/PetSenseAI.API/PetSenseAI.API.csproj

COPY . .
RUN dotnet publish src/backend/PetSenseAI.API/PetSenseAI.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "PetSenseAI.API.dll"]

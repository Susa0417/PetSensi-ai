$ErrorActionPreference = "Stop"
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5000"
$env:Database__Provider = "Sqlite"
$env:ConnectionStrings__DefaultConnection = "Data Source=petsense-dev.db"

& ".\.dotnet\dotnet.exe" ".\src\backend\PetSenseAI.API\bin\Debug\net9.0\PetSenseAI.API.dll"

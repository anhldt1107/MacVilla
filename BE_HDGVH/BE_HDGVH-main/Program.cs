using BE_API.Authorization;
using BE_API.Configuration;
using BE_API.Controllers;
using BE_API.Options;
using BE_API.Database;
using BE_API.Entities;
using BE_API.Dto.Common;
using BE_API.ExceptionHandling;
using BE_API.Extensions;
using BE_API.Service;
using BE_API.Service.IService;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;
using System.Text.Json;
using System.Text.Json.Serialization;

DotEnvLoader.LoadOptional();
DotEnvLoader.ApplyCloudinaryAspNetEnvAliases();
DotEnvLoader.ApplyGeminiAspNetEnvAliases();
DotEnvLoader.ApplyGoongAspNetEnvAliases();
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigin", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = AdminMediaUploadController.MaxRequestBodyBytes;
});

builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = AdminMediaUploadController.MaxRequestBodyBytes;
});

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    x => x.Key,
                    x => x.Value!.Errors
                        .Select(e => string.IsNullOrEmpty(e.ErrorMessage)
                            ? "Giá trị không hợp lệ."
                            : e.ErrorMessage)
                        .ToArray());

            var response = new ResponseDto
            {
                Success = false,
                Message = "Dữ liệu không hợp lệ.",
                ErrorCode = "VALIDATION_ERROR",
                Errors = errors
            };

            return new BadRequestObjectResult(response);
        };
    })
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddDbContext<BeContext>(options =>
    options
        .UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
        .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

builder.Services.AddAppAuthenticationAndAuthorization(builder.Configuration);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BE_API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token theo định dạng: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
{
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        new List<string>()
    }
});



    c.EnableAnnotations();
    c.ExampleFilters();
});

builder.Services.AddSwaggerExamplesFromAssemblyOf<Program>();

builder.Services.Register();
builder.Services.Configure<GoogleOAuthOptions>(
    builder.Configuration.GetSection(GoogleOAuthOptions.SectionName));
builder.Services.AddSingleton<IGoogleIdTokenVerifier, GoogleIdTokenVerifier>();
builder.Services.AddPayOsIntegration();
builder.Services.Configure<B2bBankTransferOptions>(
    builder.Configuration.GetSection(B2bBankTransferOptions.SectionName));
builder.Services.AddCloudinaryMediaUpload();
builder.Services.AddHttpClient();
builder.Services.AddAiAssistant(builder.Configuration);
builder.Services.AddGoongIntegration(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();

app.UseCors("AllowAllOrigin");

EnsureMigrateAndSeedDefaultAdmin(app);

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BE_API v1");
    });
}

// Trong image .NET chính thức, DOTNET_RUNNING_IN_CONTAINER=true — chỉ dùng HTTPS redirect khi chạy ngoài container (Kestrel có HTTPS).
if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") != "true")
    app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
static void EnsureMigrateAndSeedDefaultAdmin(WebApplication webApp)
{
    using var scope = webApp.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<BeContext>();
    context.Database.Migrate();
    SeedDefaultAdminIfNoUsersAsync(context).GetAwaiter().GetResult();
}

/// <summary>
/// Lần đầu chạy: nếu chưa có user nhân viên nào, tạo role admin (nếu thiếu) và user admin / 123456 (plain, khớp AuthService).
/// </summary>
static async Task SeedDefaultAdminIfNoUsersAsync(BeContext context)
{
    if (await context.AppUsers.AnyAsync())
        return;

    var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == AppRoles.Admin);
    if (adminRole is null)
    {
        adminRole = new Role
        {
            RoleName = AppRoles.Admin,
            Description = "Administrator (seed mặc định)"
        };
        context.Roles.Add(adminRole);
        await context.SaveChangesAsync();
    }

    context.AppUsers.Add(new AppUser
    {
        Username = "admin",
        PasswordHash = "123456",
        FullName = "Administrator",
        RoleId = adminRole.Id,
        Status = "Active",
        CreatedAt = DateTime.UtcNow
    });
    await context.SaveChangesAsync();
}

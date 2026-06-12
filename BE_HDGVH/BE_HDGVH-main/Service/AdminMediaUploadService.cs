using System.Text.RegularExpressions;
using BE_API.Dto.Admin;
using BE_API.Options;
using BE_API.Service.IService;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace BE_API.Service;

public class AdminMediaUploadService(IOptions<CloudinaryOptions> options) : IAdminMediaUploadService
{
    private static readonly Dictionary<string, UploadKind> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = UploadKind.Image,
        [".jpeg"] = UploadKind.Image,
        [".png"] = UploadKind.Image,
        [".gif"] = UploadKind.Image,
        [".webp"] = UploadKind.Image,
        [".pdf"] = UploadKind.Raw,
        [".doc"] = UploadKind.Raw,
        [".docx"] = UploadKind.Raw
    };

    private static readonly Regex SafeSegment = new(@"^[a-zA-Z0-9_-]{1,64}$", RegexOptions.Compiled);

    private readonly CloudinaryOptions _opt = options.Value;

    public Task<AdminMediaUploadResultDto> UploadAsync(
        IFormFile file,
        string? subFolder,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_opt.CloudName)
            || string.IsNullOrWhiteSpace(_opt.ApiKey)
            || string.IsNullOrWhiteSpace(_opt.ApiSecret))
        {
            throw new InvalidOperationException(
                "Chưa cấu hình Cloudinary. Thêm Cloudinary:CloudName, ApiKey, ApiSecret vào appsettings hoặc biến môi trường.");
        }

        if (file is null || file.Length == 0)
            throw new ArgumentException("Chưa chọn file hoặc file rỗng.");

        if (file.Length > _opt.MaxFileBytes)
        {
            throw new InvalidOperationException(
                $"File vượt quá giới hạn ({_opt.MaxFileBytes / 1024L / 1024L} MB).");
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.TryGetValue(ext, out var kind))
        {
            throw new InvalidOperationException(
                "Định dạng không được phép. Chấp nhận: ảnh (jpg, jpeg, png, gif, webp), pdf, doc, docx.");
        }

        var folder = BuildCloudinaryFolder(subFolder);
        var cloudinary = new Cloudinary(new Account(
            _opt.CloudName.Trim(),
            _opt.ApiKey.Trim(),
            _opt.ApiSecret.Trim()));

        return kind == UploadKind.Image
            ? UploadImageAsync(cloudinary, file, folder, cancellationToken)
            : UploadRawAsync(cloudinary, file, folder, cancellationToken);
    }

    private async Task<AdminMediaUploadResultDto> UploadImageAsync(
        Cloudinary cloudinary,
        IFormFile file,
        string folder,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var prm = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = false
        };

        var result = await Task.Run(() => cloudinary.Upload(prm), cancellationToken);
        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary: {result.Error.Message}");

        return new AdminMediaUploadResultDto
        {
            SecureUrl = result.SecureUrl?.ToString() ?? "",
            PublicId = result.PublicId ?? "",
            ResourceType = "image",
            Format = result.Format,
            Bytes = result.Bytes,
            OriginalFileName = file.FileName
        };
    }

    private async Task<AdminMediaUploadResultDto> UploadRawAsync(
        Cloudinary cloudinary,
        IFormFile file,
        string folder,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var prm = new RawUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = false
        };

        var result = await Task.Run(() => cloudinary.Upload(prm), cancellationToken);
        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary: {result.Error.Message}");

        return new AdminMediaUploadResultDto
        {
            SecureUrl = result.SecureUrl?.ToString() ?? "",
            PublicId = result.PublicId ?? "",
            ResourceType = "raw",
            Format = result.Format,
            Bytes = result.Bytes,
            OriginalFileName = file.FileName
        };
    }

    private string BuildCloudinaryFolder(string? subFolder)
    {
        var basePart = string.IsNullOrWhiteSpace(_opt.BaseFolder)
            ? "admin"
            : _opt.BaseFolder.Trim().Trim('/').Replace('\\', '/');

        if (string.IsNullOrWhiteSpace(subFolder))
            return basePart;

        var segments = subFolder.Trim().Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries);
        var safe = new List<string>();
        foreach (var seg in segments)
        {
            var s = seg.Trim();
            if (s.Length == 0 || !SafeSegment.IsMatch(s))
                throw new ArgumentException(
                    "Tham số folder chỉ được chứa các đoạn [a-zA-Z0-9_-] tối đa 64 ký tự, phân tách bởi /.");
            safe.Add(s);
        }

        return safe.Count == 0 ? basePart : $"{basePart}/{string.Join("/", safe)}";
    }

    private enum UploadKind
    {
        Image,
        Raw
    }
}

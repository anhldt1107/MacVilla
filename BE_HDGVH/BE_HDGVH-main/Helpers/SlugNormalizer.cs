using System.Globalization;
using System.Text;

namespace BE_API.Helpers;

public static class SlugNormalizer
{
    /// <summary>Tạo slug ASCII đơn giản từ tên (chữ thường, gạch ngang, bỏ ký tự lạ).</summary>
    public static string FromName(string name)
    {
        var s = name.Trim().ToLowerInvariant();
        var sb = new StringBuilder(s.Length);
        foreach (var c in s.Normalize(NormalizationForm.FormD))
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc == UnicodeCategory.NonSpacingMark)
                continue;
            if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
                sb.Append(c);
            else if (c is ' ' or '-' or '_')
                sb.Append('-');
        }

        var slug = sb.ToString().Trim('-');
        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);

        return string.IsNullOrEmpty(slug) ? "danh-muc" : slug;
    }
}

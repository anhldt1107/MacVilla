using BE_API.Entities;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Domain;

public static class ContractCodes
{
    /// <summary>Sinh mã hợp đồng unique (tiền tố HD + ngày UTC + hậu tố ngẫu nhiên).</summary>
    public static async Task<string> GenerateUniqueAsync(
        IQueryable<Contract> contracts,
        CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < 30; attempt++)
        {
            var suffix = Random.Shared.Next(100_000, 999_999);
            var code = $"HD{DateTime.UtcNow:yyyyMMdd}{suffix}";
            var exists = await contracts.AsNoTracking().AnyAsync(c => c.ContractNumber == code, cancellationToken);
            if (!exists)
                return code;
        }

        throw new InvalidOperationException("Không sinh được mã hợp đồng.");
    }
}

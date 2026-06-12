using BE_API.Domain;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.ExceptionHandling;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class StoreB2BAuthService(
    IRepository<Customer> customerRepo,
    IJwtTokenService jwtTokenService,
    IGoogleIdTokenVerifier googleVerifier) : IStoreB2BAuthService
{
    public async Task<StoreB2BLoginResponseDto> RegisterAsync(
        StoreB2BRegisterDto dto,
        CancellationToken cancellationToken = default)
    {
        var phone = dto.Phone.Trim();
        if (phone.Length == 0)
            throw new ArgumentException("Số điện thoại không hợp lệ.");

        var email = dto.Email.Trim();
        if (email.Length == 0)
            throw new ArgumentException("Email không hợp lệ.");

        var companyName = dto.CompanyName.Trim();
        if (companyName.Length == 0)
            throw new ArgumentException("Tên công ty là bắt buộc.");

        if (await customerRepo.Get().AsNoTracking().AnyAsync(
                c => c.Phone != null && c.Phone.Trim() == phone,
                cancellationToken))
            throw new InvalidOperationException("Số điện thoại đã được đăng ký.");

        if (await customerRepo.Get().AsNoTracking()
                .AnyAsync(c => c.Email != null && c.Email.ToLower() == email.ToLowerInvariant(), cancellationToken))
            throw new InvalidOperationException("Email đã được đăng ký.");

        var entity = new Customer
        {
            CustomerType = CustomerTypes.B2B,
            FullName = dto.FullName.Trim(),
            Email = email.ToLowerInvariant(),
            Phone = phone,
            // PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PasswordHash = dto.Password,
            CompanyName = companyName,
            TaxCode = NormalizeNullable(dto.TaxCode),
            CompanyAddress = NormalizeNullable(dto.CompanyAddress),
            DebtBalance = 0,
            CreatedAt = DateTime.UtcNow
        };

        await customerRepo.AddAsync(entity, cancellationToken);
        await customerRepo.SaveChangesAsync(cancellationToken);

        return BuildLoginResponse(entity);
    }

    public async Task<StoreB2BLoginResponseDto> LoginAsync(
        StoreB2BLoginDto dto,
        CancellationToken cancellationToken = default)
    {
        var email = dto.Email.Trim();
        if (email.Length == 0 || string.IsNullOrEmpty(dto.Password))
            throw new AuthenticationFailedException();

        var emailLower = email.ToLowerInvariant();

        var customer = await customerRepo.Get()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.CustomerType == CustomerTypes.B2B
                     && c.PasswordHash != null
                     && c.PasswordHash.Length > 0
                     && c.Email != null
                     && c.Email.ToLower() == emailLower,
                cancellationToken);
        //Tạm comment đổi thành == vì đang test trên local
        // if (customer is null || !BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash))
        if (customer is null || dto.Password != customer.PasswordHash)
            throw new AuthenticationFailedException();

        return BuildLoginResponse(customer);
    }

    public async Task<StoreB2BProfileDto> GetProfileAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var c = await customerRepo.Get()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == customerId && x.CustomerType == CustomerTypes.B2B, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản doanh nghiệp");

        return MapProfile(c);
    }

    public async Task<StoreB2BProfileDto> UpdateProfileAsync(
        int customerId,
        StoreB2BUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await customerRepo.Get()
            .FirstOrDefaultAsync(x => x.Id == customerId && x.CustomerType == CustomerTypes.B2B, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản doanh nghiệp");

        var phone = dto.Phone.Trim();
        if (phone.Length == 0)
            throw new ArgumentException("Số điện thoại không hợp lệ.");

        var email = dto.Email.Trim();
        if (email.Length == 0)
            throw new ArgumentException("Email không hợp lệ.");

        var companyName = dto.CompanyName.Trim();
        if (companyName.Length == 0)
            throw new ArgumentException("Tên công ty là bắt buộc.");

        if (await customerRepo.Get().AsNoTracking()
                .AnyAsync(c => c.Id != customerId && c.Phone != null && c.Phone.Trim() == phone, cancellationToken))
            throw new InvalidOperationException("Số điện thoại đã được sử dụng.");

        if (await customerRepo.Get().AsNoTracking()
                .AnyAsync(c => c.Id != customerId && c.Email != null && c.Email.ToLower() == email.ToLowerInvariant(),
                    cancellationToken))
            throw new InvalidOperationException("Email đã được sử dụng.");

        entity.FullName = dto.FullName.Trim();
        entity.Email = email.ToLowerInvariant();
        entity.Phone = phone;
        entity.CompanyName = companyName;
        entity.TaxCode = NormalizeNullable(dto.TaxCode);
        entity.CompanyAddress = NormalizeNullable(dto.CompanyAddress);

        customerRepo.Update(entity);
        await customerRepo.SaveChangesAsync(cancellationToken);

        return MapProfile(entity);
    }

    public async Task<StoreB2BLoginResponseDto> GoogleSignInAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var payload = await googleVerifier.VerifyAsync(idToken, cancellationToken);
        var sub = payload.Subject;
        var emailRaw = payload.Email;
        if (string.IsNullOrWhiteSpace(emailRaw))
            throw new ArgumentException("Google không trả email cho tài khoản này.");

        var emailVerified = payload.EmailVerified;
        var emailLower = emailRaw.Trim().ToLowerInvariant();

        var byGoogle = await customerRepo.Get().AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.CustomerType == CustomerTypes.B2B && c.GoogleSubject == sub,
                cancellationToken);
        if (byGoogle != null)
            return BuildLoginResponse(byGoogle);

        var candidates = await customerRepo.Get().AsNoTracking()
            .Where(c =>
                c.CustomerType == CustomerTypes.B2B
                && c.Email != null
                && c.Email.ToLower() == emailLower)
            .ToListAsync(cancellationToken);

        if (candidates.Count > 1)
            throw new InvalidOperationException("Định danh email trùng trong hệ thống — vui lòng liên hệ hỗ trợ.");

        if (candidates.Count == 1)
        {
            if (!emailVerified)
                throw new ArgumentException("Email Google chưa được xác minh; không thể liên kết tài khoản.");

            var snap = candidates[0];
            if (!string.IsNullOrEmpty(snap.GoogleSubject) && !string.Equals(snap.GoogleSubject, sub, StringComparison.Ordinal))
                throw new InvalidOperationException("Tài khoản đã liên kết với một tài khoản Google khác.");

            var entity = await customerRepo.Get()
                    .FirstOrDefaultAsync(c => c.Id == snap.Id, cancellationToken)
                ?? throw new KeyNotFoundException("Không tìm thấy tài khoản doanh nghiệp");

            entity.GoogleSubject = sub;
            entity.GoogleEmailVerified = emailVerified;
            entity.GoogleLinkedAtUtc = DateTime.UtcNow;
            customerRepo.Update(entity);
            await customerRepo.SaveChangesAsync(cancellationToken);

            customerRepo.ClearChangeTracking();
            var fresh = await customerRepo.Get().AsNoTracking()
                .FirstAsync(c => c.Id == entity.Id, cancellationToken);
            return BuildLoginResponse(fresh);
        }

        var b2cBlocks = await customerRepo.Get().AsNoTracking().AnyAsync(
            c =>
                c.CustomerType == CustomerTypes.B2C
                && c.Email != null
                && c.Email.ToLower() == emailLower,
            cancellationToken);
        if (b2cBlocks)
            throw new InvalidOperationException(
                "Email này thuộc tài khoản khách cá nhân. Vui lòng chọn đăng nhập «Khách hàng cá nhân» hoặc đăng ký doanh nghiệp bằng email khác.");

        throw new InvalidOperationException(
            "Chưa có tài khoản đối tác cho email này. Hoàn thành đăng ký doanh nghiệp trước; sau đó đăng nhập Google để được liên kết tự động.");
    }

    private StoreB2BLoginResponseDto BuildLoginResponse(Customer c)
    {
        var (token, expires) = jwtTokenService.CreateCustomerAccessToken(c);
        return new StoreB2BLoginResponseDto
        {
            AccessToken = token,
            ExpiresAtUtc = expires,
            Customer = MapProfile(c)
        };
    }

    private static StoreB2BProfileDto MapProfile(Customer c) =>
        new()
        {
            Id = c.Id,
            CustomerType = c.CustomerType,
            FullName = c.FullName,
            Email = c.Email,
            Phone = c.Phone ?? string.Empty,
            CompanyName = c.CompanyName ?? string.Empty,
            TaxCode = c.TaxCode,
            CompanyAddress = c.CompanyAddress,
            DebtBalance = c.DebtBalance
        };

    private static string? NormalizeNullable(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

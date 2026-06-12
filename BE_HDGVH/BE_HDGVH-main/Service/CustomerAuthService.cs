using BE_API.Domain;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.ExceptionHandling;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class CustomerAuthService(
    IRepository<Customer> customerRepo,
    IJwtTokenService jwtTokenService,
    IGoogleIdTokenVerifier googleVerifier) : ICustomerAuthService
{
    public async Task<StoreCustomerLoginResponseDto> RegisterAsync(
        StoreCustomerRegisterDto dto,
        CancellationToken cancellationToken = default)
    {
        var phone = dto.Phone.Trim();
        if (phone.Length == 0)
            throw new ArgumentException("Số điện thoại không hợp lệ.");

        var email = dto.Email.Trim();
        if (email.Length == 0)
            throw new ArgumentException("Email không hợp lệ.");

        if (await customerRepo.Get().AsNoTracking().AnyAsync(
                c => c.Phone != null && c.Phone.Trim() == phone,
                cancellationToken))
            throw new InvalidOperationException("Số điện thoại đã được đăng ký.");

        if (await customerRepo.Get().AsNoTracking()
                .AnyAsync(c => c.Email != null && c.Email.ToLower() == email.ToLowerInvariant(), cancellationToken))
            throw new InvalidOperationException("Email đã được đăng ký.");

        var entity = new Customer
        {
            CustomerType = CustomerTypes.B2C,
            FullName = dto.FullName.Trim(),
            Email = email.ToLowerInvariant(),
            Phone = phone,
            // PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PasswordHash = dto.Password,
            DebtBalance = 0,
            CreatedAt = DateTime.UtcNow
        };

        await customerRepo.AddAsync(entity, cancellationToken);
        await customerRepo.SaveChangesAsync(cancellationToken);

        return BuildLoginResponse(entity);
    }

    public async Task<StoreCustomerLoginResponseDto> LoginAsync(
        StoreCustomerLoginDto dto,
        CancellationToken cancellationToken = default)
    {
        var email = dto.Email.Trim();
        if (email.Length == 0 || string.IsNullOrEmpty(dto.Password))
            throw new AuthenticationFailedException();

        var emailLower = email.ToLowerInvariant();

        var customer = await customerRepo.Get()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.CustomerType == CustomerTypes.B2C
                     && c.PasswordHash != null
                     && c.PasswordHash.Length > 0
                     && c.Email != null
                     && c.Email.ToLower() == emailLower,
                cancellationToken);
        //Tạm comment đổi thành  == vì đang test trên local
        // if (customer is null || !BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash))
        if (customer is null || dto.Password != customer.PasswordHash)
        // if (customer is null || !BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash))
            throw new AuthenticationFailedException();

        return BuildLoginResponse(customer);
    }

    public async Task<StoreCustomerProfileDto> GetProfileAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var c = await customerRepo.Get()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == customerId && x.CustomerType == CustomerTypes.B2C, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản");

        return MapProfile(c);
    }

    public async Task<StoreCustomerProfileDto> UpdateProfileAsync(
        int customerId,
        StoreCustomerUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await customerRepo.Get()
            .FirstOrDefaultAsync(x => x.Id == customerId && x.CustomerType == CustomerTypes.B2C, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản");

        var phone = dto.Phone.Trim();
        if (phone.Length == 0)
            throw new ArgumentException("Số điện thoại không hợp lệ.");

        var email = dto.Email.Trim();
        if (email.Length == 0)
            throw new ArgumentException("Email không hợp lệ.");

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

        customerRepo.Update(entity);
        await customerRepo.SaveChangesAsync(cancellationToken);

        return MapProfile(entity);
    }

    public async Task<StoreCustomerLoginResponseDto> GoogleSignInAsync(string idToken, CancellationToken cancellationToken = default)
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
                c => c.CustomerType == CustomerTypes.B2C && c.GoogleSubject == sub,
                cancellationToken);
        if (byGoogle != null)
            return BuildLoginResponse(byGoogle);

        var candidates = await customerRepo.Get().AsNoTracking()
            .Where(c =>
                c.CustomerType == CustomerTypes.B2C
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
                ?? throw new KeyNotFoundException("Không tìm thấy tài khoản");

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

        if (!emailVerified)
            throw new ArgumentException("Email Google chưa được xác minh; không thể tạo tài khoản.");

        var emailTaken = await customerRepo.Get().AsNoTracking()
            .AnyAsync(c => c.Email != null && c.Email.ToLower() == emailLower, cancellationToken);
        if (emailTaken)
            throw new InvalidOperationException(
                "Email này đã gắn với một tài khoản trong hệ thống (có thể doanh nghiệp). Hãy dùng đúng loại đăng nhập hoặc email khác.");

        var fullName = !string.IsNullOrWhiteSpace(payload.Name)
            ? payload.Name.Trim()
            : string.Join(
                    ' ',
                    new[] { payload.GivenName, payload.FamilyName }
                        .Where(static s => !string.IsNullOrWhiteSpace(s))
                        .Select(s => s.Trim()))
                .Trim();

        if (string.IsNullOrWhiteSpace(fullName))
            fullName = "Khách hàng";

        var newCust = new Customer
        {
            CustomerType = CustomerTypes.B2C,
            FullName = fullName,
            Email = emailLower,
            Phone = null,
            PasswordHash = null,
            GoogleSubject = sub,
            GoogleEmailVerified = true,
            GoogleLinkedAtUtc = DateTime.UtcNow,
            DebtBalance = 0,
            CreatedAt = DateTime.UtcNow
        };

        await customerRepo.AddAsync(newCust, cancellationToken);
        await customerRepo.SaveChangesAsync(cancellationToken);

        return BuildLoginResponse(newCust);
    }

    public async Task ChangePasswordAsync(
        int customerId,
        StoreCustomerChangePasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.OldPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            throw new ArgumentException("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.");

        if (dto.NewPassword.Length < 6)
            throw new ArgumentException("Mật khẩu mới tối thiểu 6 ký tự.");

        if (string.Equals(dto.OldPassword, dto.NewPassword, StringComparison.Ordinal))
            throw new InvalidOperationException("Mật khẩu mới phải khác mật khẩu hiện tại.");

        var entity = await customerRepo.Get()
            .FirstOrDefaultAsync(x => x.Id == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản");

        if (string.IsNullOrEmpty(entity.PasswordHash))
            throw new ArgumentException(
                "Tài khoản đăng nhập bằng Google không đặt mật khẩu. Vui lòng tiếp tục dùng Google hoặc liên hệ hỗ trợ để bổ sung mật khẩu.");

        if (entity.PasswordHash != dto.OldPassword)
        {
            throw new AuthenticationFailedException();
        }

        entity.PasswordHash = dto.NewPassword;
        customerRepo.Update(entity);
        await customerRepo.SaveChangesAsync(cancellationToken);
    }

    private StoreCustomerLoginResponseDto BuildLoginResponse(Customer c)
    {
        var (token, expires) = jwtTokenService.CreateCustomerAccessToken(c);
        return new StoreCustomerLoginResponseDto
        {
            AccessToken = token,
            ExpiresAtUtc = expires,
            Customer = MapProfile(c)
        };
    }

    private static StoreCustomerProfileDto MapProfile(Customer c) =>
        new()
        {
            Id = c.Id,
            CustomerType = c.CustomerType,
            FullName = c.FullName,
            Email = c.Email,
            Phone = c.Phone ?? string.Empty
        };
}

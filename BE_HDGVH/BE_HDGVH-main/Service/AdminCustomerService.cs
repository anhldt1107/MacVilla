using BE_API.Database;
using BE_API.Domain;
using BE_API.Dto.Admin;
using BE_API.Dto.Common;
using BE_API.Entities;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class AdminCustomerService(BeContext db) : IAdminCustomerService
{
    public async Task<PagedResultDto<AdminCustomerListItemDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? customerType = null,
        bool? hasDebt = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Customers
            .AsNoTracking()
            .Include(c => c.Orders)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(customerType))
        {
            query = query.Where(c => c.CustomerType == customerType);
        }

        if (hasDebt.HasValue)
        {
            query = hasDebt.Value
                ? query.Where(c => c.DebtBalance > 0)
                : query.Where(c => c.DebtBalance <= 0);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(c =>
                c.FullName.ToLower().Contains(searchLower) ||
                (c.Email != null && c.Email.ToLower().Contains(searchLower)) ||
                (c.Phone != null && c.Phone.Contains(searchLower)) ||
                (c.CompanyName != null && c.CompanyName.ToLower().Contains(searchLower)) ||
                (c.TaxCode != null && c.TaxCode.Contains(searchLower)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCustomerListItemDto
            {
                Id = c.Id,
                CustomerType = c.CustomerType,
                FullName = c.FullName,
                Email = c.Email,
                Phone = c.Phone,
                CompanyName = c.CompanyName,
                TaxCode = c.TaxCode,
                DebtBalance = c.DebtBalance,
                OrderCount = c.Orders.Count,
                TotalSpent = c.Orders
                    .Where(o => o.PaymentStatus == PaymentStatuses.Paid)
                    .Sum(o => o.PayableTotal),
                CreatedAt = c.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminCustomerListItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminCustomerDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers
            .AsNoTracking()
            .Include(c => c.Addresses)
            .Include(c => c.Orders)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {id}");

        return MapToDetailDto(customer);
    }

    public async Task<AdminCustomerDetailDto> CreateAsync(
        AdminCustomerCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Tên khách hàng không được để trống");

        if (string.IsNullOrWhiteSpace(dto.Phone))
            throw new ArgumentException("Số điện thoại không được để trống");

        if (string.IsNullOrWhiteSpace(dto.CustomerType))
            throw new ArgumentException("Loại khách hàng không được để trống");

        if (!CustomerTypes.IsValid(dto.CustomerType))
            throw new ArgumentException($"Loại khách hàng '{dto.CustomerType}' không hợp lệ. Chỉ chấp nhận: {string.Join(", ", CustomerTypes.All)}");

        var existingPhone = await db.Customers
            .AnyAsync(c => c.Phone == dto.Phone.Trim(), cancellationToken);
        if (existingPhone)
            throw new InvalidOperationException($"Số điện thoại {dto.Phone} đã được sử dụng");

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var existingEmail = await db.Customers
                .AnyAsync(c => c.Email != null && c.Email.ToLower() == dto.Email.Trim().ToLower(), cancellationToken);
            if (existingEmail)
                throw new InvalidOperationException($"Email {dto.Email} đã được sử dụng");
        }

        var normalizedType = CustomerTypes.All.First(t =>
            string.Equals(t, dto.CustomerType, StringComparison.OrdinalIgnoreCase));

        if (normalizedType == CustomerTypes.B2B)
        {
            if (string.IsNullOrWhiteSpace(dto.CompanyName))
                throw new ArgumentException("Tên công ty không được để trống cho khách B2B");
        }

        var customer = new Customer
        {
            CustomerType = normalizedType,
            FullName = dto.FullName.Trim(),
            Email = dto.Email?.Trim(),
            Phone = dto.Phone.Trim(),
            CompanyName = dto.CompanyName?.Trim(),
            TaxCode = dto.TaxCode?.Trim(),
            CompanyAddress = dto.CompanyAddress?.Trim(),
            DebtBalance = 0,
            CreatedAt = DateTime.UtcNow
        };

        await db.Customers.AddAsync(customer, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(customer.Id, cancellationToken);
    }

    public async Task<AdminCustomerDetailDto> UpdateAsync(
        int id,
        AdminCustomerUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {id}");

        if (dto.CustomerType != null)
        {
            if (!CustomerTypes.IsValid(dto.CustomerType))
                throw new ArgumentException($"Loại khách hàng '{dto.CustomerType}' không hợp lệ");

            customer.CustomerType = CustomerTypes.All.First(t =>
                string.Equals(t, dto.CustomerType, StringComparison.OrdinalIgnoreCase));
        }

        if (dto.FullName != null)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                throw new ArgumentException("Tên khách hàng không được để trống");
            customer.FullName = dto.FullName.Trim();
        }

        if (dto.Phone != null)
        {
            if (string.IsNullOrWhiteSpace(dto.Phone))
                throw new ArgumentException("Số điện thoại không được để trống");

            var existingPhone = await db.Customers
                .AnyAsync(c => c.Id != id && c.Phone == dto.Phone.Trim(), cancellationToken);
            if (existingPhone)
                throw new InvalidOperationException($"Số điện thoại {dto.Phone} đã được sử dụng");

            customer.Phone = dto.Phone.Trim();
        }

        if (dto.Email != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var existingEmail = await db.Customers
                    .AnyAsync(c => c.Id != id && c.Email != null && c.Email.ToLower() == dto.Email.Trim().ToLower(), cancellationToken);
                if (existingEmail)
                    throw new InvalidOperationException($"Email {dto.Email} đã được sử dụng");
            }
            customer.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        }

        if (dto.CompanyName != null)
            customer.CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName) ? null : dto.CompanyName.Trim();

        if (dto.TaxCode != null)
            customer.TaxCode = string.IsNullOrWhiteSpace(dto.TaxCode) ? null : dto.TaxCode.Trim();

        if (dto.CompanyAddress != null)
            customer.CompanyAddress = string.IsNullOrWhiteSpace(dto.CompanyAddress) ? null : dto.CompanyAddress.Trim();

        if (customer.CustomerType == CustomerTypes.B2B && string.IsNullOrWhiteSpace(customer.CompanyName))
            throw new ArgumentException("Tên công ty không được để trống cho khách B2B");

        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<PagedResultDto<AdminCustomerOrderHistoryDto>> GetOrderHistoryAsync(
        int customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var customerExists = await db.Customers.AnyAsync(c => c.Id == customerId, cancellationToken);
        if (!customerExists)
            throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {customerId}");

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.CustomerOrders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AdminCustomerOrderHistoryDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                CreatedAt = o.CreatedAt,
                OrderStatus = o.OrderStatus,
                PaymentStatus = o.PaymentStatus,
                PayableTotal = o.PayableTotal,
                LineCount = o.Items.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<AdminCustomerOrderHistoryDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminCustomerDebtDto> GetDebtInfoAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers
            .AsNoTracking()
            .Include(c => c.Orders)
            .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {customerId}");

        var paidOrders = customer.Orders
            .Where(o => o.PaymentStatus == PaymentStatuses.Paid)
            .ToList();

        var unpaidOrders = customer.Orders
            .Where(o => o.PaymentStatus != PaymentStatuses.Paid && o.OrderStatus != OrderStatuses.Cancelled)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new AdminCustomerDebtOrderDto
            {
                OrderId = o.Id,
                OrderCode = o.OrderCode,
                CreatedAt = o.CreatedAt,
                PayableTotal = o.PayableTotal,
                PaymentStatus = o.PaymentStatus
            })
            .ToList();

        return new AdminCustomerDebtDto
        {
            CustomerId = customer.Id,
            CustomerName = customer.FullName,
            CustomerType = customer.CustomerType,
            CompanyName = customer.CompanyName,
            DebtBalance = customer.DebtBalance,
            TotalInvoiced = customer.Orders
                .Where(o => o.OrderStatus != OrderStatuses.Cancelled)
                .Sum(o => o.PayableTotal),
            TotalPaid = paidOrders.Sum(o => o.PayableTotal),
            UnpaidOrders = unpaidOrders
        };
    }

    public async Task<AdminCustomerDetailDto> AdjustDebtAsync(
        int customerId,
        AdminCustomerAdjustDebtDto dto,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.FindAsync([customerId], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng với ID {customerId}");

        if (customer.CustomerType != CustomerTypes.B2B)
            throw new InvalidOperationException("Chỉ có thể điều chỉnh công nợ cho khách hàng B2B");

        if (dto.Amount == 0)
            throw new ArgumentException("Số tiền điều chỉnh phải khác 0");

        var newBalance = customer.DebtBalance + dto.Amount;
        if (newBalance < 0)
            throw new InvalidOperationException($"Số dư công nợ sau điều chỉnh không thể âm (hiện tại: {customer.DebtBalance:N0}, điều chỉnh: {dto.Amount:N0})");

        customer.DebtBalance = newBalance;
        await db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(customerId, cancellationToken);
    }

    public string[] GetCustomerTypes() => CustomerTypes.All;

    private static AdminCustomerDetailDto MapToDetailDto(Customer customer)
    {
        var paidOrders = customer.Orders
            .Where(o => o.PaymentStatus == PaymentStatuses.Paid)
            .ToList();

        return new AdminCustomerDetailDto
        {
            Id = customer.Id,
            CustomerType = customer.CustomerType,
            FullName = customer.FullName,
            Email = customer.Email,
            Phone = customer.Phone,
            CompanyName = customer.CompanyName,
            TaxCode = customer.TaxCode,
            CompanyAddress = customer.CompanyAddress,
            DebtBalance = customer.DebtBalance,
            CreatedAt = customer.CreatedAt,
            OrderCount = customer.Orders.Count,
            TotalSpent = paidOrders.Sum(o => o.PayableTotal),
            LastOrderDate = customer.Orders.MaxBy(o => o.CreatedAt)?.CreatedAt,
            Addresses = customer.Addresses
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.Id)
                .Select(a => new AdminCustomerAddressDto
                {
                    Id = a.Id,
                    ReceiverName = a.ReceiverName,
                    ReceiverPhone = a.ReceiverPhone,
                    AddressLine = a.AddressLine,
                    IsDefault = a.IsDefault
                })
                .ToList()
        };
    }
}

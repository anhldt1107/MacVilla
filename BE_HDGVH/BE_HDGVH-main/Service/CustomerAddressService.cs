using BE_API.Domain;
using BE_API.Dto.Store;
using BE_API.Entities;
using BE_API.Repository;
using BE_API.Service.IService;
using Microsoft.EntityFrameworkCore;

namespace BE_API.Service;

public class CustomerAddressService(
    IRepository<Customer> customerRepo,
    IRepository<CustomerAddress> addressRepo,
    IRepository<CustomerOrder> orderRepo) : ICustomerAddressService
{
    public async Task<List<StoreAddressDto>> ListAsync(int customerId, CancellationToken cancellationToken = default)
    {
        await EnsureStoreCustomerExistsAsync(customerId, cancellationToken);

        return await addressRepo.Get()
            .AsNoTracking()
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.Id)
            .Select(a => Map(a))
            .ToListAsync(cancellationToken);
    }

    public async Task<StoreAddressDto> CreateAsync(
        int customerId,
        StoreAddressCreateDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureStoreCustomerExistsAsync(customerId, cancellationToken);

        var count = await addressRepo.Get().AsNoTracking().CountAsync(a => a.CustomerId == customerId, cancellationToken);
        var hasDefault = await addressRepo.Get().AsNoTracking()
            .AnyAsync(a => a.CustomerId == customerId && a.IsDefault, cancellationToken);
        var isDefault = count == 0 || dto.IsDefault || !hasDefault;

        if (isDefault)
            await ClearDefaultAsync(customerId, cancellationToken);

        var entity = new CustomerAddress
        {
            CustomerId = customerId,
            ReceiverName = dto.ReceiverName.Trim(),
            ReceiverPhone = dto.ReceiverPhone.Trim(),
            AddressLine = dto.AddressLine.Trim(),
            IsDefault = isDefault
        };

        await addressRepo.AddAsync(entity, cancellationToken);
        await addressRepo.SaveChangesAsync(cancellationToken);

        return Map(entity);
    }

    public async Task<StoreAddressDto> UpdateAsync(
        int customerId,
        int addressId,
        StoreAddressUpdateDto dto,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetOwnedAsync(customerId, addressId, cancellationToken);
        var wasDefault = entity.IsDefault;

        entity.ReceiverName = dto.ReceiverName.Trim();
        entity.ReceiverPhone = dto.ReceiverPhone.Trim();
        entity.AddressLine = dto.AddressLine.Trim();

        if (dto.IsDefault)
        {
            await ClearDefaultAsync(customerId, cancellationToken);
            entity.IsDefault = true;
        }
        else if (wasDefault)
        {
            var next = await addressRepo.Get()
                .Where(a => a.CustomerId == customerId && a.Id != addressId)
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (next is null)
                entity.IsDefault = true;
            else
            {
                entity.IsDefault = false;
                await ClearDefaultAsync(customerId, cancellationToken);
                next.IsDefault = true;
                addressRepo.Update(next);
            }
        }
        else
            entity.IsDefault = false;

        addressRepo.Update(entity);
        await addressRepo.SaveChangesAsync(cancellationToken);

        return Map(entity);
    }

    public async Task DeleteAsync(int customerId, int addressId, CancellationToken cancellationToken = default)
    {
        var entity = await GetOwnedAsync(customerId, addressId, cancellationToken);

        var usedInOrder = await orderRepo.Get()
            .AsNoTracking()
            .AnyAsync(o => o.ShippingAddressId == addressId, cancellationToken);
        if (usedInOrder)
            throw new InvalidOperationException("Không thể xóa địa chỉ đã được dùng trong đơn hàng.");

        var wasDefault = entity.IsDefault;

        addressRepo.Delete(entity);
        await addressRepo.SaveChangesAsync(cancellationToken);

        if (wasDefault)
        {
            var next = await addressRepo.Get()
                .Where(a => a.CustomerId == customerId)
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (next is not null)
            {
                next.IsDefault = true;
                addressRepo.Update(next);
                await addressRepo.SaveChangesAsync(cancellationToken);
            }
        }
    }

    public async Task<StoreAddressDto> SetDefaultAsync(
        int customerId,
        int addressId,
        CancellationToken cancellationToken = default)
    {
        var entity = await GetOwnedAsync(customerId, addressId, cancellationToken);

        await ClearDefaultAsync(customerId, cancellationToken);
        entity.IsDefault = true;
        addressRepo.Update(entity);
        await addressRepo.SaveChangesAsync(cancellationToken);

        return Map(entity);
    }

    private async Task EnsureStoreCustomerExistsAsync(int customerId, CancellationToken cancellationToken)
    {
        var ok = await customerRepo.Get().AsNoTracking()
            .AnyAsync(
                c => c.Id == customerId &&
                     (c.CustomerType == CustomerTypes.B2C || c.CustomerType == CustomerTypes.B2B),
                cancellationToken);
        if (!ok)
            throw new KeyNotFoundException("Không tìm thấy tài khoản");
    }

    private async Task<CustomerAddress> GetOwnedAsync(int customerId, int addressId, CancellationToken cancellationToken)
    {
        var entity = await addressRepo.Get()
            .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == customerId, cancellationToken);
        return entity ?? throw new KeyNotFoundException("Không tìm thấy địa chỉ");
    }

    private async Task ClearDefaultAsync(int customerId, CancellationToken cancellationToken)
    {
        var defaults = await addressRepo.Get()
            .Where(a => a.CustomerId == customerId && a.IsDefault)
            .ToListAsync(cancellationToken);
        foreach (var a in defaults)
        {
            a.IsDefault = false;
            addressRepo.Update(a);
        }

        if (defaults.Count > 0)
            await addressRepo.SaveChangesAsync(cancellationToken);
    }

    private static StoreAddressDto Map(CustomerAddress a) =>
        new()
        {
            Id = a.Id,
            ReceiverName = a.ReceiverName,
            ReceiverPhone = a.ReceiverPhone,
            AddressLine = a.AddressLine,
            IsDefault = a.IsDefault
        };
}

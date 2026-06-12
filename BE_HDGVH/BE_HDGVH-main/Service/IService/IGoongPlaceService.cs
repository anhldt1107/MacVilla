using BE_API.Dto.Store;

namespace BE_API.Service.IService;

public interface IGoongPlaceService
{
    /// <summary>Gợi ý địa chỉ qua Goong Autocomplete V2.</summary>
    Task<GoongAutocompleteResultDto> AutocompleteAsync(
        string input,
        string? location,
        int? limit,
        CancellationToken cancellationToken = default);
}

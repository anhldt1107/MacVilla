namespace BE_API.Dto.Store;

public class GoongAutocompleteResultDto
{
    public List<GoongAutocompletePredictionDto> Predictions { get; set; } = [];
}

public class GoongAutocompletePredictionDto
{
    public string Description { get; set; } = string.Empty;

    public string PlaceId { get; set; } = string.Empty;

    public string MainText { get; set; } = string.Empty;

    public string SecondaryText { get; set; } = string.Empty;

    public GoongCompoundDto? Compound { get; set; }
}

public class GoongCompoundDto
{
    public string? Commune { get; set; }

    public string? Province { get; set; }
}

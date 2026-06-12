using System.Text.Json.Nodes;

namespace BE_API.Service.Ai;

public interface IAiToolRegistry
{
    IReadOnlyList<IAiTool> GetTools(AiActorScope role);
    IAiTool? GetTool(string name, AiActorScope role);
    List<JsonObject> BuildFunctionDeclarations(AiActorScope role);
}

public class AiToolRegistry(IEnumerable<IAiTool> tools) : IAiToolRegistry
{
    private readonly List<IAiTool> _tools = tools.ToList();

    public IReadOnlyList<IAiTool> GetTools(AiActorScope role)
        => _tools.Where(t => t.Scope.Allows(role)).ToList();

    public IAiTool? GetTool(string name, AiActorScope role)
        => _tools.FirstOrDefault(t => t.Scope.Allows(role)
                                      && string.Equals(t.Name, name, StringComparison.OrdinalIgnoreCase));

    public List<JsonObject> BuildFunctionDeclarations(AiActorScope role)
    {
        var list = new List<JsonObject>();
        foreach (var t in GetTools(role))
        {
            list.Add(new JsonObject
            {
                ["name"] = t.Name,
                ["description"] = t.Description,
                ["parameters"] = t.ParametersSchema.DeepClone()
            });
        }
        return list;
    }
}

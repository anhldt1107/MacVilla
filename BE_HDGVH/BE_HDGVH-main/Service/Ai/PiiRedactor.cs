using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace BE_API.Service.Ai;

public interface IPiiRedactor
{
    /// <summary>Trả về JsonObject mới với email/phone của người khác bị thay [REDACTED]. Giữ lại các giá trị "trắng" của caller.</summary>
    JsonObject Redact(JsonObject input, AiCallerContext caller);
}

public class PiiRedactor : IPiiRedactor
{
    private static readonly Regex EmailRegex = new(@"\b[\w.+-]+@[\w-]+\.[\w.-]+\b", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"(?:\+?\d[\d\s\-\.]{7,}\d)", RegexOptions.Compiled);

    public JsonObject Redact(JsonObject input, AiCallerContext caller)
    {
        // Caller là staff -> không redact (cần thấy thông tin để xử lý nội bộ).
        if (caller.OwnerType == "Staff") return input;

        var clone = input.DeepClone().AsObject();
        Walk(clone, caller);
        return clone;
    }

    private static void Walk(JsonNode? node, AiCallerContext caller)
    {
        switch (node)
        {
            case JsonObject obj:
                foreach (var kv in obj.ToList())
                {
                    var child = kv.Value;
                    if (child is JsonValue v && v.TryGetValue<string>(out var sv) && !string.IsNullOrEmpty(sv))
                    {
                        var rep = Apply(sv);
                        if (rep != sv) obj[kv.Key] = rep;
                    }
                    else
                    {
                        Walk(child, caller);
                    }
                }
                break;
            case JsonArray arr:
                for (var i = 0; i < arr.Count; i++)
                {
                    var item = arr[i];
                    if (item is JsonValue iv && iv.TryGetValue<string>(out var sa) && !string.IsNullOrEmpty(sa))
                    {
                        var rep = Apply(sa);
                        if (rep != sa) arr[i] = rep;
                    }
                    else
                    {
                        Walk(item, caller);
                    }
                }
                break;
        }
    }

    private static string Apply(string s)
    {
        var replaced = EmailRegex.Replace(s, "[REDACTED_EMAIL]");
        replaced = PhoneRegex.Replace(replaced, m => MaskPhone(m.Value));
        return replaced;
    }

    private static string MaskPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 8) return phone;
        return "[REDACTED_PHONE]";
    }
}

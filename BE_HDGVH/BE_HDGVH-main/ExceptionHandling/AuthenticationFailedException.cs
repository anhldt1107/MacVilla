namespace BE_API.ExceptionHandling;

/// <summary>
/// Sai mật khẩu, không tồn tại user, hoặc tài khoản không hoạt động — trả 401, không phân biệt lý do (chống dò user).
/// </summary>
public sealed class AuthenticationFailedException : Exception
{
    public AuthenticationFailedException(string message = "Tên đăng nhập hoặc mật khẩu không đúng.")
        : base(message)
    {
    }
}

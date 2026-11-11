using System.Security.Cryptography;
using System.Text;

namespace AppointmentSlots.Api.Application;

public sealed class CoordinatorCredentials
{
    private readonly byte[] passwordHash;

    public CoordinatorCredentials(string username, string password)
    {
        Username = username.Trim();
        passwordHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
    }

    public string Username { get; }

    public bool IsValid(string username, string password)
    {
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return string.Equals(username.Trim(), Username, StringComparison.OrdinalIgnoreCase)
            && CryptographicOperations.FixedTimeEquals(passwordHash, suppliedHash);
    }
}

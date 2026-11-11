namespace AppointmentSlots.Api.Application;

public static class AppointmentValidation
{
    public static string RequireText(string value, string fieldName, int minLength = 1, int maxLength = int.MaxValue)
    {
        var normalized = value.Trim();

        if (normalized.Length < minLength)
        {
            throw new ApiException(400, $"{fieldName} must be at least {minLength} characters.");
        }

        if (normalized.Length > maxLength)
        {
            throw new ApiException(400, $"{fieldName} must be no more than {maxLength} characters.");
        }

        return normalized;
    }

    public static string RequireEmail(string email)
    {
        var normalized = email.Trim();

        if (!normalized.Contains('@'))
        {
            throw new ApiException(400, "Please provide a valid email address.");
        }

        return normalized.ToLowerInvariant();
    }

    public static DateTimeOffset ToUtc(DateTimeOffset value) => value.ToUniversalTime();

    public static void EnsureFutureWindow(DateTimeOffset start, DateTimeOffset end, DateTimeOffset now)
    {
        if (start <= now)
        {
            throw new ApiException(400, "An appointment must start in the future.");
        }

        if (end <= start)
        {
            throw new ApiException(400, "The end time must be later than the start time.");
        }
    }
}

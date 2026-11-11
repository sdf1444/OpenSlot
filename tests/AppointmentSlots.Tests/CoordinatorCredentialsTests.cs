using AppointmentSlots.Api.Application;
using Xunit;

namespace AppointmentSlots.Tests;

public sealed class CoordinatorCredentialsTests
{
    private readonly CoordinatorCredentials credentials =
        new("coordinator", "a-unique-test-password");

    [Fact]
    public void IsValid_accepts_matching_credentials_case_insensitively_for_username()
    {
        Assert.True(credentials.IsValid(" Coordinator ", "a-unique-test-password"));
    }

    [Theory]
    [InlineData("other", "a-unique-test-password")]
    [InlineData("coordinator", "incorrect-password")]
    public void IsValid_rejects_nonmatching_credentials(string username, string password)
    {
        Assert.False(credentials.IsValid(username, password));
    }
}

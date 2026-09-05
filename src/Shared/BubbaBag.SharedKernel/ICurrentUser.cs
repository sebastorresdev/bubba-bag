using System;
using System.Collections.Generic;

namespace BubbaBag.SharedKernel;

public interface ICurrentUser
{
    Guid Id { get; }
    string Email { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsAuthenticated { get; }
}

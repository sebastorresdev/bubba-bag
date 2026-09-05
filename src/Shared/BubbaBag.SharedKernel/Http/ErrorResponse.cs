using System;
using System.Collections.Generic;

namespace BubbaBag.SharedKernel.Http;

public class ErrorResponse
{
    public int Status { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public IDictionary<string, string[]>? Errors { get; set; }
    public string? TraceId { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    public ErrorResponse() { }

    public ErrorResponse(int status, string title, string detail, IDictionary<string, string[]>? errors = null, string? traceId = null)
    {
        Status = status;
        Title = title;
        Detail = detail;
        Errors = errors;
        TraceId = traceId;
        TimestampUtc = DateTime.UtcNow;
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using FluentValidation.Results;

namespace BubbaBag.SharedKernel.Exceptions;

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("Uno o más errores de validación han ocurrido.")
    {
        Errors = errors;
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base("Uno o más errores de validación han ocurrido.")
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(
                failureGroup => ToCamelCase(failureGroup.Key), 
                failureGroup => failureGroup.ToArray()
            );
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str) || char.IsLower(str[0]))
            return str;

        return char.ToLowerInvariant(str[0]) + str.Substring(1);
    }
}

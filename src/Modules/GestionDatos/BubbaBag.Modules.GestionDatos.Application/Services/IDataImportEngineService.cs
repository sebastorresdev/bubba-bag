using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.GestionDatos.Application.Dtos;

namespace BubbaBag.Modules.GestionDatos.Application.Services;

public interface IDataImportEngineService
{
    Task<FilePreviewResultDto> PreviewFileAsync(
        Stream stream,
        string fileName,
        PreviewFileRequest request,
        CancellationToken cancellationToken = default);

    Task<DataImportJobDto> ExecuteImportAsync(
        Stream stream,
        string fileName,
        ExecuteImportRequestDto request,
        string currentUser,
        CancellationToken cancellationToken = default);

    Task<List<DataImportJobDto>> GetRecentJobsAsync(
        int limit = 50,
        CancellationToken cancellationToken = default);

    Task<DataImportJobDto?> GetJobByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteJobAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}


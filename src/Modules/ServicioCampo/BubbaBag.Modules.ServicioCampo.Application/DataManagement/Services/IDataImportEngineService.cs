using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using BubbaBag.Modules.ServicioCampo.Application.DataManagement.Dtos;

namespace BubbaBag.Modules.ServicioCampo.Application.DataManagement.Services;

public interface IDataImportEngineService
{
    Task<FilePreviewResultDto> PreviewFileAsync(Stream stream, string fileName, PreviewFileRequest request, CancellationToken cancellationToken = default);
    Task<DataImportJobDto> ExecuteImportAsync(Stream stream, string fileName, ExecuteImportRequestDto request, string currentUser, CancellationToken cancellationToken = default);
    Task<List<DataImportJobDto>> GetRecentJobsAsync(int limit = 50, CancellationToken cancellationToken = default);
    Task<DataImportJobDto?> GetJobByIdAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task<bool> DeleteJobAsync(Guid jobId, CancellationToken cancellationToken = default);
}

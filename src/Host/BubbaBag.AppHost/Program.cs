var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .AddDatabase("sqldb");

var api = builder.AddProject<Projects.BubbaBag_Api>("api")
    .WithReference(postgres)
    .WaitFor(postgres);

builder.AddNpmApp("frontend", "../../../bubbabag-client", "start")
    .WithReference(api)
    .WithHttpEndpoint(port: 4201, targetPort: 4200, env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();

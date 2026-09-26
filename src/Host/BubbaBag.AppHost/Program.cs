var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .AddDatabase("sqldb");

var api = builder.AddProject<Projects.BubbaBag_Api>("api")
    .WithReference(postgres)
    .WaitFor(postgres);

// Cliente React (skvia-client)
builder.AddNpmApp("react-client", "../../../skvia-client", "dev")
    .WithReference(api)
    .WithHttpEndpoint(port: 4301, targetPort: 4300, env: "PORT")
    .WithExternalHttpEndpoints();


builder.Build().Run();

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .AddDatabase("sqldb");

var jwtSecret = builder.AddParameter("jwt-secret", secret: true);

var api = builder.AddProject<Projects.BubbaBag_Api>("api")
    .WithReference(postgres)
    .WithEnvironment("JwtSettings__Secret", jwtSecret)
    .WaitFor(postgres);

// Cliente React (skvia-client)
builder.AddNpmApp("react-client", "../../../skvia-client", "dev")
    .WithReference(api)
    .WithHttpEndpoint(port: 4301, targetPort: 4300, env: "PORT")
    .WithExternalHttpEndpoints();


builder.Build().Run();

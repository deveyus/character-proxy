{ dockerTools, deno, character-proxy-src }:

dockerTools.streamLayeredImage {
  name = "character-proxy";
  tag = "latest";

  contents = [
    deno
    character-proxy-src
  ];

  config = {
    Entrypoint = [
      "deno"
      "run"
      "--allow-net" # Required for ESI, Database, and Server Binding
      "--allow-env=PORT,WORKER_COUNT,DATABASE_URL,MASTER_KEY,LOG_FORMAT"
      "--allow-read=/app"
      "/app/api/src/main.ts"
    ];
    WorkingDir = "/app";
    ExposedPorts = {
      "4321/tcp" = { };
    };
    Env = [
      "PORT=4321"
      "WORKER_COUNT=1"
      "LOG_FORMAT=json"
    ];
    Labels = {
      "org.opencontainers.image.source" = "https://github.com/deveyus/character-proxy";
      "org.opencontainers.image.description" = "Resilient enriched cache and discovery engine for EVE Online";
      "org.opencontainers.image.licenses" = "MIT";
    };
  };
}
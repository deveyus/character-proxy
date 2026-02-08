{ dockerTools, deno, character-proxy-src }:

dockerTools.buildLayeredImage {
  name = "character-proxy";
  tag = "latest";

  contents = [
    deno
    character-proxy-src
  ];

  config = {
    # Entrypoint will be refined in the next task
    Entrypoint = [ "deno" "run" ];
    WorkingDir = "/app";
    ExposedPorts = {
      "4321/tcp" = { };
    };
  };
}

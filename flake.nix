{
  description = "Character Proxy Development Environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        character-proxy-src = pkgs.callPackage ./nix/build.nix { };
      in
      {
        packages = {
          default = character-proxy-src;
          container = pkgs.callPackage ./nix/docker.nix {
            inherit character-proxy-src;
            deno = pkgs.deno;
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            gemini-cli
            jq
            nodejs
            deno
            postgresql
            zip
          ];

          shellHook = ''
            export ANTIGRAVITY_CLI_ALIAS=antigravity
            echo "Welcome to the Character Proxy dev shell!"
            if [ -z "$GEMINI_API_KEY" ]; then
              echo "⚠️  Warning: GEMINI_API_KEY is not set. The gemini cli may not work."
              echo "Export it or use a .env file."
            else
              echo "✅ GEMINI_API_KEY is set."
            fi
            
            # Postgres Configuration
            export PGDATA="$PWD/.nix/postgres_data"
            export PGHOST="$PWD/.nix/postgres_run"
            mkdir -p "$PGHOST"

            if [ ! -d "$PGDATA" ]; then
              echo "Initializing PostgreSQL..."
              initdb -D "$PGDATA" --no-locale --encoding=UTF8 > /dev/null
              echo "✅ PostgreSQL initialized."
            fi

            # Helper functions for DB management
            start_db() {
              pg_ctl start -l "$PGDATA/logfile" -o "-k $PGHOST"
            }
            stop_db() {
              pg_ctl stop
            }

            if ! pg_ctl status > /dev/null 2>&1; then
               echo "ℹ️  PostgreSQL is not running. Starting it now..."
               start_db
               # Create default db if likely first run
               if ! psql -lqt | cut -d \| -f 1 | grep -qw "character_proxy"; then
                  echo "Creating default database 'character_proxy'..."
                  createdb -h "$PGHOST" character_proxy
               fi
            else
               echo "✅ PostgreSQL is running."
            fi

            echo "Environment ready."
          '';
        };
      }
    );
}
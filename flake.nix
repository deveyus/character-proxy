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
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            gemini-cli
            jq
            nodejs
            # Add other tools here (e.g., python3) as the project evolves
          ];

          shellHook = ''
            echo "Welcome to the Character Proxy dev shell!"
            if [ -z "$GEMINI_API_KEY" ]; then
              echo "⚠️  Warning: GEMINI_API_KEY is not set. The gemini cli may not work."
              echo "Export it or use a .env file."
            else
              echo "✅ GEMINI_API_KEY is set."
            fi
            
            # Check for Conductor (this is a guess at the command/check)
            echo "ℹ️  Gemini Conductor is an extension. If not installed, you may need to run an installation command or set up the specific markdown files."
            echo "   Node.js is included if you need to install it via npm."
          '';
        };
      }
    );
}

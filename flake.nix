{
  description = "Songbook App Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
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
            nodejs_20
            nodePackages.npm
            nodePackages.pnpm
            git
            postgresql_15
          ];

          shellHook = ''
            echo "🎵 Songbook Development Environment"
            echo "Node.js: $(node --version)"
            echo "npm: $(npm --version)"
            echo "Git: $(git --version)"
            echo ""
            echo "Ready to develop the songbook app!"
          '';
        };
      });
}
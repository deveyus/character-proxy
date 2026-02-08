{ stdenv, lib }:

stdenv.mkDerivation {
  pname = "character-proxy-src";
  version = "1.0.0";

  src = lib.cleanSource ./..;

  installPhase = ''
    mkdir -p $out/app
    cp -r api deno.json deno.lock $out/app/
  '';

  meta = with lib; {
    description = "Character Proxy source files for containerization";
    license = licenses.mit;
  };
}

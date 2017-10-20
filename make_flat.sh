
#!/usr/bin/env bash
solidity_flattener --solc-paths=zeppelin-solidity=$(pwd)/node_modules/zeppelin-solidity/ contracts/PolyMathTokenOffering.sol --out flat_ico_poly.sol
solidity_flattener --solc-paths=zeppelin-solidity=$(pwd)/node_modules/zeppelin-solidity/ contracts/PolyMathToken.sol --out flat_token_poly.sol
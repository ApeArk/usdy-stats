import fs from "fs";
import path from "path";

import {
  OUTPUT_DIR
} from "./constants";
import { fetchPortfolio } from "./fetchPortfolio";

// NOTE: taking this address for testing purposes
const userAddress = process.env.USER_ADDRESS || "0x7bca5eb262f16AF84F4f3c2431b9Bfaa533bEe75";

const panic = <T>(message: string): T => {
  throw new Error(message);
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line
type Tree = Record<string, string | Tree>

const writeTree = (parentDir: string, tree: Tree) => {
  if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir);

  for (const [k, v] of Object.entries(tree)) {
    const prefix = path.join(parentDir, k);

    if (typeof v === "string") {
      fs.writeFileSync(`${prefix}.txt`, v);
    } else {
      writeTree(prefix, v);
    }
  }
};

const main = async () => {
  if (!userAddress) {
    panic("USER_ADDRESS is not set");
    return;
  }

  const data = await fetchPortfolio(userAddress);
  fs.writeFileSync(path.join(OUTPUT_DIR, "stats.json"), JSON.stringify(data, null, 2));
  console.dir(data);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

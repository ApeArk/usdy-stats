import fs from "fs";
import path from "path";

import {
  OUTPUT_DIR
} from "./constants";
import { fetchPortfolio } from "./fetchPortfolio";

// NOTE: taking this address for testing purposes
const userAddress = process.env.USER_ADDRESS || "0x2ba553d9f990a3b66b03b2dc0d030dfc1c061036";

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

  const accountPortfolio = await fetchPortfolio(userAddress);
  const data = accountPortfolio;
  fs.writeFileSync(path.join(OUTPUT_DIR, "stats.json"), JSON.stringify(data, null, 2));
  console.dir(data);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

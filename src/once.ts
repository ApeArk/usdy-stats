import fs from "fs";
import path from "path";

import {
  OUTPUT_DIR
} from "./constants";

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

// TODO: fetch data from hyperliquid API
const data = {
  "test": "123",
}

fs.writeFileSync(path.join(OUTPUT_DIR, "test.json"), JSON.stringify(data, null, 2));
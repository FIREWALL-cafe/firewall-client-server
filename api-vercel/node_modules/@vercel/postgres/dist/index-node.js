import {
  VercelClient,
  VercelPool,
  createClient,
  createPool,
  db,
  postgresConnectionString,
  sql
} from "./chunk-VGUHM5WG.js";

// src/index-node.ts
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
if (neonConfig) {
  neonConfig.webSocketConstructor = ws;
}
export {
  VercelClient,
  VercelPool,
  createClient,
  createPool,
  db,
  postgresConnectionString,
  sql
};
//# sourceMappingURL=index-node.js.map
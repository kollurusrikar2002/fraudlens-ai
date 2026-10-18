import { corpusErrors } from "../src/pipeline/run.ts";

const errors = corpusErrors();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("16 cases grounded");

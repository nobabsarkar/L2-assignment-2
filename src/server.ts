import app from "./app";
import config from "./config";
import { intoDB } from "./db";

const main = () => {
  intoDB();
  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`);
  });
};

main();

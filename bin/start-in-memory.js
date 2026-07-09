const { MongoMemoryServer } = require("mongodb-memory-server");
const { execSync } = require("child_process");

(async () => {
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_key_for_local_dev_only";
    process.env.PORT = process.env.PORT || "3000";

    console.log("=========================================");
    console.log("In-memory MongoDB started at:", uri);
    console.log("=========================================");
    
    // Seed the database
    console.log("Seeding database...");
    execSync("node bin/seed.js", { stdio: "inherit", env: process.env });
    
    console.log("Starting server...");
    // Require index.js to start the Express app in this process
    require("../index.js");
  } catch (error) {
    console.error("Failed to start in-memory server:", error);
    process.exit(1);
  }
})();

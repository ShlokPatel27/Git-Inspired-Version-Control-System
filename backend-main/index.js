process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const mainRouter = require("./routes/main.router");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(cors({ origin: "*" }));

// Cache MongoDB connection across Vercel serverless invocations
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error("MONGODB_URI is not set in environment variables!");
    return;
  }
  try {
    const db = await mongoose.connect(mongoURI);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("Unable to connect to MongoDB: ", err);
  }
};

// Middleware to ensure DB is connected for HTTP requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/", mainRouter);

function startServer() {
  const port = process.env.PORT || 3000;
  connectDB();

  let user = "test";
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (userID) => {
      user = userID;
      socket.join(userID);
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
  });
}

// Only execute yargs CLI parser if command line arguments are provided
if (process.argv.length > 2) {
  yargs(hideBin(process.argv))
    .command("start", "Starts a new server", {}, startServer)
    .command("init", "Initialise a new repository", {}, initRepo)
    .command(
      "add <file>",
      "Add a file to the repository",
      (yargs) => {
        yargs.positional("file", {
          describe: "File to add to the staging area",
          type: "string",
        });
      },
      (argv) => {
        addRepo(argv.file);
      }
    )
    .command(
      "commit <message>",
      "Commit the staged files",
      (yargs) => {
        yargs.positional("message", {
          describe: "Commit message",
          type: "string",
        });
      },
      (argv) => {
        commitRepo(argv.message);
      }
    )
    .command("push", "Push commits to S3", {}, pushRepo)
    .command("pull", "Pull commits from S3", {}, pullRepo)
    .command(
      "revert <commitID>",
      "Revert to a specific commit",
      (yargs) => {
        yargs.positional("commitID", {
          describe: "Comit ID to revert to",
          type: "string",
        });
      },
      (argv) => {
        revertRepo(argv.commitID);
      }
    )
    .demandCommand(1, "You need at least one command")
    .help().argv;
}

module.exports = app;

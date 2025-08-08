const express = require("express");
const http = require("http");
const connectDB = require('./src/config/database.js');
const cors = require('cors');
const routes = require('./src/routes/index.js');
const app = express();
const port = 3004
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
connectDB();
routes(app);
app.get("/", (req, res) => {
        res.send("Hello World!, Mr. Anil Photography Backend");
});
server.listen(port, async () => {
    console.log(`app is running on port`, port)
});
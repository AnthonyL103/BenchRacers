"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const dbconfig_1 = require("./src/database/dbconfig");
const auth_1 = __importDefault(require("./src/database/routes/auth"));
const garage_1 = __importDefault(require("./src/database/routes/garage"));
const admin_1 = __importDefault(require("./src/database/routes/admin"));

(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/users', auth_1.default);
app.use('/api/garage', garage_1.default);
app.use('/api/admin', admin_1.default);
const PORT = process.env.PORT || 3000;
app.get('/health', (req, res) => {
    res.status(200).send('healthy');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
process.on('SIGINT', () => {
    console.log('Shutting down gracefully');
    dbconfig_1.pool.end();
    process.exit(0);
});

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initializeDatabase = initializeDatabase;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Enable multiple statements
};
// Create connection poolff
const pool = promise_1.default.createPool(dbConfig);
exports.pool = pool;
// Function to initialize database
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting database initialization...');
            // Read the SQL script
            const sqlScript = fs_1.default.readFileSync(path_1.default.join(__dirname, './ddl.sql'), 'utf8');
            // Get a connection from the pool
            const connection = yield pool.getConnection();
            try {
                console.log('Executing SQL script...');
                yield connection.query(sqlScript);
                console.log('Database schema created successfully!');
                return true;
            }
            catch (error) {
                console.error('Error executing SQL script:', error);
                return false;
            }
            finally {
                // Release the connection back to the pool
                connection.release();
            }
        }
        catch (error) {
            console.error('Database initialization failed:', error);
            return false;
        }
    });
}
// Test connection function
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connection = yield pool.getConnection();
            console.log('Connected to MySQL RDS successfully!');
            connection.release();
            return true;
        }
        catch (error) {
            console.error('Failed to connect to MySQL RDS:', error);
            return false;
        }
    });
}

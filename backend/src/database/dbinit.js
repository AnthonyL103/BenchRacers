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
Object.defineProperty(exports, "__esModule", { value: true });
const dbconfig_1 = require("./dbconfig");
function initialize() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connected = yield (0, dbconfig_1.testConnection)();
            if (!connected) {
                console.error('Failed to connect to RDS. Please check your credentials and network.');
                process.exit(1);
            }
            console.log('Connection to RDS successful. Initializing database schema...');
            const initialized = yield (0, dbconfig_1.initializeDatabase)();
            if (initialized) {
                console.log('Database schema initialized successfully!');
            }
            else {
                console.error('Failed to initialize database schema.');
                process.exit(1);
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Unexpected error during initialization:', error);
            process.exit(1);
        }
    });
}
initialize();

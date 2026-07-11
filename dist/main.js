"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.enableCors();
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`NestJS server is running on: http://localhost:${port}`);
    try {
        const billingDir = path_1.default.resolve(process.cwd(), '../billing_service');
        console.log(`Starting independent Billing Microservice in: ${billingDir}`);
        const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const billingProcess = (0, child_process_1.spawn)(cmd, ['run', 'start'], {
            cwd: billingDir,
            stdio: 'inherit',
            shell: true,
        });
        billingProcess.on('error', (err) => {
            console.error('Failed to start billing microservice child process:', err);
        });
    }
    catch (err) {
        console.error('Error during starting billing microservice:', err);
    }
}
bootstrap().catch((err) => {
    console.error('Error starting NestJS application:', err);
});
//# sourceMappingURL=main.js.map
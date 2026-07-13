"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.enableCors();
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`NestJS server is running on: http://localhost:${port}`);
    console.log('billing_service is managed independently by Docker (porta 3001).');
}
bootstrap().catch((err) => {
    console.error('Error starting NestJS application:', err);
});
//# sourceMappingURL=main.js.map
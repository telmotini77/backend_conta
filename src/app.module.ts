import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { AssetsModule } from './assets/assets.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { AccountingModule } from './accounting/accounting.module';
import { CategoriesModule } from './categories/categories.module';
import { EmployeesModule } from './employees/employees.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    AssetsModule,
    InvoicesModule,
    PurchasesModule,
    ReconciliationModule,
    AccountingModule,
    CategoriesModule,
    EmployeesModule,
    CompaniesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

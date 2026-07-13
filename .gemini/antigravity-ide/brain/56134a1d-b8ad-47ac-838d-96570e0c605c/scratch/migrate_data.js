// Adicionar el path de node_modules del backend para que Node.js resuelva Prisma Client
module.paths.push('c:\\Users\\USUARIO\\Documents\\sisteConta\\backend_conta\\node_modules');

const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://adminconta:local_password_123@localhost:5432/sisteconta?sslmode=disable"
    }
  }
});

const renderPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://aura_db_l6oz_user:FPHL1qtSnbR8SDKI9HPNw4NdFsSJFLA4@dpg-d9altoe7r5hc73efpro0-a.oregon-postgres.render.com/aura_db_l6oz?sslmode=require"
    }
  }
});

async function run() {
  try {
    console.log("Iniciando migración de datos a la base de datos de Render...");

    // 1. Users
    console.log("Copiando tabla: User...");
    const users = await localPrisma.user.findMany();
    console.log(`-> Encontrados ${users.length} usuarios.`);
    for (const record of users) {
      await renderPrisma.user.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 2. Employees
    console.log("Copiando tabla: Employee...");
    const employees = await localPrisma.employee.findMany();
    console.log(`-> Encontrados ${employees.length} empleados.`);
    for (const record of employees) {
      await renderPrisma.employee.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 3. Categories
    console.log("Copiando tabla: Category...");
    const categories = await localPrisma.category.findMany();
    console.log(`-> Encontradas ${categories.length} categorías.`);
    for (const record of categories) {
      await renderPrisma.category.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 4. Products
    console.log("Copiando tabla: Product...");
    const products = await localPrisma.product.findMany();
    console.log(`-> Encontrados ${products.length} productos.`);
    for (const record of products) {
      await renderPrisma.product.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 5. KardexTransactions
    console.log("Copiando tabla: KardexTransaction...");
    const kts = await localPrisma.kardexTransaction.findMany();
    console.log(`-> Encontradas ${kts.length} transacciones de Kárdex.`);
    for (const record of kts) {
      await renderPrisma.kardexTransaction.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 6. Assets
    console.log("Copiando tabla: Asset...");
    const assets = await localPrisma.asset.findMany();
    console.log(`-> Encontrados ${assets.length} activos fijos.`);
    for (const record of assets) {
      await renderPrisma.asset.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 7. DepreciationEntries
    console.log("Copiando tabla: DepreciationEntry...");
    const deps = await localPrisma.depreciationEntry.findMany();
    console.log(`-> Encontrados ${deps.length} registros de depreciación.`);
    for (const record of deps) {
      await renderPrisma.depreciationEntry.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 8. Invoices
    console.log("Copiando tabla: Invoice...");
    const invoices = await localPrisma.invoice.findMany();
    console.log(`-> Encontradas ${invoices.length} facturas emitidas.`);
    for (const record of invoices) {
      await renderPrisma.invoice.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 9. Purchases
    console.log("Copiando tabla: Purchase...");
    const purchases = await localPrisma.purchase.findMany();
    console.log(`-> Encontradas ${purchases.length} compras/proveedores.`);
    for (const record of purchases) {
      await renderPrisma.purchase.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 10. Withholdings
    console.log("Copiando tabla: Withholding...");
    const withholdings = await localPrisma.withholding.findMany();
    console.log(`-> Encontradas ${withholdings.length} retenciones.`);
    for (const record of withholdings) {
      await renderPrisma.withholding.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 11. CashTransactions
    console.log("Copiando tabla: CashTransaction...");
    const cts = await localPrisma.cashTransaction.findMany();
    console.log(`-> Encontradas ${cts.length} transacciones de caja.`);
    for (const record of cts) {
      await renderPrisma.cashTransaction.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 12. JournalEntries
    console.log("Copiando tabla: JournalEntry...");
    const jes = await localPrisma.journalEntry.findMany();
    console.log(`-> Encontrados ${jes.length} asientos del Libro Diario.`);
    for (const record of jes) {
      await renderPrisma.journalEntry.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    // 13. JournalEntryLines
    console.log("Copiando tabla: JournalEntryLine...");
    const jels = await localPrisma.journalEntryLine.findMany();
    console.log(`-> Encontradas ${jels.length} líneas de asientos contables.`);
    for (const record of jels) {
      await renderPrisma.journalEntryLine.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
    }

    console.log("\n¡Migración completada con éxito!");
  } catch (error) {
    console.error("Error durante la migración de datos:", error);
  } finally {
    await localPrisma.$disconnect();
    await renderPrisma.$disconnect();
  }
}

run();

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAssetDto } from './dto/assets.dto';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private accountingService: AccountingService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.asset.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async create(userId: string, dto: CreateAssetDto) {
    if (dto.value <= 0) {
      throw new BadRequestException(
        'El valor de adquisición debe ser mayor a 0.',
      );
    }
    if (dto.residualValue >= dto.value) {
      throw new BadRequestException(
        'El valor residual no puede ser mayor o igual al valor de adquisición.',
      );
    }
    return this.prisma.asset.create({
      data: {
        name: dto.name,
        value: Number(dto.value),
        residualValue: Number(dto.residualValue),
        yearsOfLife: Number(dto.yearsOfLife),
        userId,
      },
    });
  }

  async getDepreciations(userId: string) {
    return this.prisma.depreciationEntry.findMany({
      where: {
        asset: { userId },
      },
      include: {
        asset: true,
      },
      orderBy: { period: 'desc' },
    });
  }

  async generateMonthlyDepreciations(userId: string, period: string) {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException(
        'Formato de período inválido. Debe ser AAAA-MM.',
      );
    }

    const assets = await this.prisma.asset.findMany({
      where: { userId },
    });

    const generated = [];

    for (const asset of assets) {
      // Check if depreciation already generated for this asset and period
      const existing = await this.prisma.depreciationEntry.findFirst({
        where: {
          assetId: asset.id,
          period,
        },
      });

      if (existing) {
        continue; // skip if already depreciated for this month
      }

      const depreciableValue = asset.value - asset.residualValue;
      if (depreciableValue <= 0) continue;

      // monthlyDepreciation = (value - residual) / (years * 12)
      const monthlyAmount = Number(
        (depreciableValue / (asset.yearsOfLife * 12)).toFixed(2),
      );

      const entry = await this.prisma.depreciationEntry.create({
        data: {
          assetId: asset.id,
          amount: monthlyAmount,
          period,
        },
        include: {
          asset: true,
        },
      });

      // Generate depreciation accounting journal entry
      try {
        await this.accountingService.createAutomaticEntry(userId, {
          type: 'DEPRECIATION',
          description: `Depreciación Mensual Activo [${asset.name}] Período ${period}`,
          date: new Date(),
          lines: [
            {
              accountCode: '5.01.02',
              accountName: 'Gasto Depreciación Activos Fijos',
              debit: monthlyAmount,
              credit: 0,
            },
            {
              accountCode: '1.02.01',
              accountName: 'Depreciación Acumulada Activos Fijos',
              debit: 0,
              credit: monthlyAmount,
            },
          ],
        });
      } catch (err) {
        console.error('Failed to log automatic depreciation journal entry:', err);
      }

      generated.push(entry);
    }

    return generated;
  }
}

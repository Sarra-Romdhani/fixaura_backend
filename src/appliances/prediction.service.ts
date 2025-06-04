import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class PredictionService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService
  ) {}

  async predict(applianceData: any) {
    const mlServiceUrl = this.configService.get('ML_SERVICE_URL') || 'http://127.0.0.1:5000';
    const data = this.prepareFeatures(applianceData);

    console.log('Prediction request to:', `${mlServiceUrl}/predict`, 'with data:', data);

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ status: string; confidence: number }>(
          `${mlServiceUrl}/predict`,
          data
        ).pipe(
          catchError((error: AxiosError) => {
            console.error('ML Service error:', error.message, error.code, error.config);
            throw new Error(`ML Service error: ${error.message}`);
          })
        )
      );

      return {
        status: response.data.status,
        confidence: response.data.confidence,
        nextCheckDate: this.calculateNextCheckDate(response.data.status),
      };
    } catch (error) {
      console.error('Prediction failed:', error);
      return this.fallbackPrediction(data);
    }
  }

  private prepareFeatures(data: any) {
    if (!data.purchaseDate || !data.brand || data.breakdownCount == null) {
      throw new Error('Missing required fields: purchaseDate, brand, or breakdownCount');
    }

    return {
      age_months: this.calculateAgeInMonths(data.purchaseDate),
      breakdowns: data.breakdownCount,
      brand: data.brand,
      maintenance_age: data.lastMaintenanceDate
        ? this.calculateAgeInMonths(data.lastMaintenanceDate)
        : data.age_months || 0,
    };
  }

  private calculateAgeInMonths(date: string): number {
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  }

  private calculateNextCheckDate(status: string): string {
    const now = new Date();
    let nextDate: Date;
    switch (status) {
      case 'critical':
        nextDate = new Date(now.setDate(now.getDate() + 7));
        break;
      case 'warning':
        nextDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      default:
        nextDate = new Date(now.setMonth(now.getMonth() + 6));
    }
    return nextDate.toISOString();
  }

  fallbackPrediction(data: any) {
    return {
      status: data.breakdowns > 3 ? 'warning' : 'good',
      confidence: 75,
      nextCheckDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
// src/common/dto/api-response.dto.ts
import { IsBoolean, IsString } from 'class-validator';

export class ApiResponseDto<T> {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  data: T | null;

  meta: {
    timestamp: string;
    requestId: string;
  };

  error?: {
    code: string;
    details?: any[];
  };

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, {
      ...partial,
      meta: {
        timestamp: new Date().toISOString(),
        // requestId: (Math.random() + 1).toString(36).substring(7),
      },
    });
  }
}
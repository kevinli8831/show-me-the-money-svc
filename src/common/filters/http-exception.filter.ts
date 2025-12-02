// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';

/**
 * 全局 HTTP Exception Filter
 * 
 * 自動將所有 HTTP exceptions 轉換成統一嘅 ApiResponseDto 格式
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 提取錯誤訊息同詳情
    let message = exception.message;
    let details: any[] | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || message;

      // 如果 message 係 array (validation errors),提取第一個作為主訊息
      if (Array.isArray(message)) {
        details = message;
        message = message[0] || 'Validation failed';
      }
    }

    // 生成錯誤代碼
    const errorCode = this.getErrorCode(status);

    // 創建統一嘅錯誤 response
    const errorResponse = new ApiResponseDto({
      success: false,
      message,
      data: null,
      error: {
        code: errorCode,
        details,
      },
    });

    response.status(status).json(errorResponse);
  }

  /**
   * 根據 HTTP status code 生成錯誤代碼
   */
  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }
}

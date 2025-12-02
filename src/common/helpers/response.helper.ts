// src/common/helpers/response.helper.ts
import { ApiResponseDto } from '../dto/api-response.dto';

/**
 * 格式化成功 Response
 * 
 * @param data - 要返回嘅數據
 * @param message - 成功訊息 (optional)
 * @returns ApiResponseDto<T>
 * 
 * 例子:
 * return formatSuccessResponse(activity, '成功創建 Activity');
 */
export function formatSuccessResponse<T>(
  data: T,
  message: string = '操作成功',
): ApiResponseDto<T> {
  return new ApiResponseDto({
    success: true,
    message,
    data,
    error: undefined,
  });
}

/**
 * 格式化錯誤 Response
 * 
 * @param message - 錯誤訊息
 * @param code - 錯誤代碼
 * @param details - 錯誤詳情 (optional)
 * @returns ApiResponseDto<null>
 * 
 * 例子:
 * return formatErrorResponse('Activity 唔存在', 'ACTIVITY_NOT_FOUND');
 */
export function formatErrorResponse(
  message: string,
  code: string,
  details?: any[],
): ApiResponseDto<null> {
  return new ApiResponseDto({
    success: false,
    message,
    data: null,
    error: {
      code,
      details,
    },
  });
}

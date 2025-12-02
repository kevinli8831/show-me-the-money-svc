import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    // Generate Request ID
    const requestId = (Math.random() + 1).toString(36).substring(7);
    request.requestId = requestId; // Attach to request object

    // Log Request Details
    if (!!body && Object.keys(body).length > 0) {
      this.logger.debug(`[${requestId}] Body: ${JSON.stringify(body)}`);
    }
    if (!!query && Object.keys(query).length > 0) {
      this.logger.debug(`[${requestId}] Query: ${JSON.stringify(query)}`);
    }
    if (!!params && Object.keys(params).length > 0) {
      this.logger.debug(`[${requestId}] Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const delay = Date.now() - now;

        // Inject requestId into response meta if it exists
        if (data && typeof data === 'object' && data.meta) {
          data.meta.requestId = requestId;
        }

        this.logger.log(`[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms`);
      }),
    );
  }
}

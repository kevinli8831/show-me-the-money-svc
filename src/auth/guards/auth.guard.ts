// auth.guard.ts （關鍵！optional JWT）
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 就算冇 JWT 都畀過，只係 req.user = undefined
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    // 冇 token 或驗證失敗 → user = null
    return user || null;
  }
}
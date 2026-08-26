import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired");
      }
      if (info?.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Invalid token");
      }
      if (info?.name === "NotBeforeError") {
        throw new UnauthorizedException("Token not yet active");
      }
      throw err || new UnauthorizedException("Authentication required");
    }
    return user;
  }
}

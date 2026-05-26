import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map
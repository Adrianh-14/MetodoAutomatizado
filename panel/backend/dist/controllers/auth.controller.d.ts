import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class AuthController {
    login(req: Request, res: Response): Promise<void>;
    refresh(req: Request, res: Response): Promise<void>;
    getMe(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map
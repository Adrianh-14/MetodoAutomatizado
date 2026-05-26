import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class FacebookController {
    submitAttempt(req: Request, res: Response): Promise<void>;
    getAttempts(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCountries(req: AuthenticatedRequest, res: Response): Promise<void>;
    download(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=facebook.controller.d.ts.map
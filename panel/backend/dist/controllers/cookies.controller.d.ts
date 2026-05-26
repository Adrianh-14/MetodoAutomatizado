import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class CookiesController {
    list(req: AuthenticatedRequest, res: Response): Promise<void>;
    upload(req: AuthenticatedRequest, res: Response): Promise<void>;
    download(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCountries(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=cookies.controller.d.ts.map
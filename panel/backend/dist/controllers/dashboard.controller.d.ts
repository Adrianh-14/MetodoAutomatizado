import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class DashboardController {
    getStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    getCountries(req: AuthenticatedRequest, res: Response): Promise<void>;
    getRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dashboard.controller.d.ts.map
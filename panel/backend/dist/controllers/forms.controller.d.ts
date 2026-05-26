import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class FormsController {
    createForm(req: AuthenticatedRequest, res: Response): Promise<void>;
    getForms(req: AuthenticatedRequest, res: Response): Promise<void>;
    getResponses(req: AuthenticatedRequest, res: Response): Promise<void>;
    submitForm(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=forms.controller.d.ts.map
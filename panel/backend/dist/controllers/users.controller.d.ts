import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class UsersController {
    getUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    createUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    toggleBlock(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteUser(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=users.controller.d.ts.map
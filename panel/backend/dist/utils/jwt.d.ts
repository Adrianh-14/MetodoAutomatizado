import { AuthPayload } from '../types';
export declare function generateAccessToken(payload: AuthPayload): string;
export declare function generateRefreshToken(payload: AuthPayload): string;
export declare function verifyAccessToken(token: string): AuthPayload;
export declare function verifyRefreshToken(token: string): AuthPayload;
//# sourceMappingURL=jwt.d.ts.map
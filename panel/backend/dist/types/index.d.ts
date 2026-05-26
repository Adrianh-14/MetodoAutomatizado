import { Request } from 'express';
export interface AuthPayload {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthPayload;
}
export interface PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
    country?: string;
    status?: string;
}
export interface DownloadRequest {
    quantity: number;
    countryCode?: string;
}
export interface BulkUploadRequest {
    cookies: string[];
    countryCode: string;
    countryName: string;
}
export interface DashboardStats {
    totalCookies: number;
    totalCountries: number;
    todayCookies: number;
    downloadedCookies: number;
    availableCookies: number;
}
export interface CountryStats {
    countryCode: string;
    countryName: string;
    total: number;
    available: number;
    downloaded: number;
}
//# sourceMappingURL=index.d.ts.map
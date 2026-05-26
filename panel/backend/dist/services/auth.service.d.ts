export declare class AuthService {
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            tenant: {
                id: string;
                name: string;
                slug: string;
            };
        };
    }>;
    refresh(refreshTokenStr: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map
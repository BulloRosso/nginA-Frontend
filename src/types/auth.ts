export interface AuthError extends Error {
    name: string;
    response?: {
        data: {
            detail: {
                code: string;
                message: string;
            }
        }
    };
}
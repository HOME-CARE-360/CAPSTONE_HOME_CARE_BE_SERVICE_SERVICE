

export type ZodFormattedErrorItem = {
    code: string;
    message: string;
    path: string;
};

export type ErrorResponse = {
    message: ZodFormattedErrorItem;
    error: string;
    statusCode: number;
};
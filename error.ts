import { getCustomerByUserId, updateUserAndCustomerProfile } from '../services/customer.service';
import { UpdateUserAndCustomerProfileDto } from '../schemas/customer.schema';
import { changeUserPassword } from '../services/user.service';
import { ChangePasswordDto } from '../schemas/user.schema';
import { AppError } from '../handlers/error';
import { TCPResponse } from '../interfaces/tcp-response.interface';

export async function handleTCPRequest(payload: any): Promise<TCPResponse> {
    const { type, userId, data } = payload;

    try {
        let responseData: any;
        let message = '';
        let statusCode = 200;

        switch (type) {
            case 'GET_CUSTOMER':
                responseData = await getCustomerByUserId(userId);
                message = 'Customer retrieved successfully';
                break;

            case 'UPDATE_CUSTOMER':
                responseData = await updateUserAndCustomerProfile(userId, data as UpdateUserAndCustomerProfileDto);
                message = 'Customer updated successfully';
                break;

            case 'CHANGE_PASSWORD':
                responseData = await changeUserPassword(userId, data as ChangePasswordDto);
                message = 'Password changed successfully';
                break;

            default:
                return {
                    success: false,
                    code: 'UNKNOWN_REQUEST_TYPE',
                    message: 'Unknown request type',
                    statusCode: 400,
                    data: null,
                    timestamp: new Date().toISOString(),
                };
        }

        return {
            success: true,
            code: 'SUCCESS',
            message,
            statusCode,
            data: responseData,
            timestamp: new Date().toISOString(),
        };
    } catch (err) {
        console.error('handleTCPRequest ERROR:', err);

        if (err instanceof AppError) {
            return {
                success: false,
                code: err.code,
                message: err.message,
                statusCode: err.statusCode || 400,
                data: null,
                timestamp: new Date().toISOString(),
            };
        }

        return {
            success: false,
            code: 'INTERNAL_SERVER_ERROR',
            message: err instanceof Error ? err.message : 'An unexpected error occurred',
            statusCode: 500,
            data: null,
            timestamp: new Date().toISOString(),
        };
    }
}

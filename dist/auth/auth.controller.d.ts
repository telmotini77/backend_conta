import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
interface RequestWithUser {
    user: {
        id: string;
        email: string;
        name: string;
        ruc: string;
    };
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signup(dto: SignupDto): Promise<{
        id: string;
        email: string;
        name: string;
        ruc: string;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            ruc: string;
        };
        accessToken: string;
    }>;
    getProfile(req: RequestWithUser): {
        id: string;
        email: string;
        name: string;
        ruc: string;
    };
}
export {};

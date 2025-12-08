import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    async signup(@Body() body: any) {
        return this.authService.signup(body.email, body.password);
    }

    @Post('login')
    async login(@Body() body: any) {
        const result = await this.authService.login(body.email, body.password);
        if (!result) throw new UnauthorizedException('Invalid credentials');
        return result;
    }

    @Post('refresh')
    async refresh(@Body() body: any) {
        return this.authService.refresh(body.refreshToken);
    }
}

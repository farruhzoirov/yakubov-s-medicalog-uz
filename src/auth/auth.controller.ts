import { Body, Controller,  HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() authDto: AuthDto) {
      const jwtToken = await this.authService.login(authDto);
      return {
        success: true,
        message: 'Logged in successfully',
        token: jwtToken,
      } 
    } 
}

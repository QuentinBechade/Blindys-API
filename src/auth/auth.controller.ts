import {
    Controller,
    Post,
    Body,
    Logger,
    InternalServerErrorException,
    UseGuards,
    Request, Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {ApiBearerAuth, ApiOkResponse, ApiTags} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { AuthEntity } from './entities/auth.entity';
import {AuthGuard} from "./auth.guard";

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiOkResponse({ description: 'Login', type: LoginDto })
    async login(@Body() { email, password }: LoginDto) {
        try {
            // Authentifier l'utilisateur et générer un token d'accès
            const user = await this.authService.login(email, password);
            this.logger.log(`L'utilisateur ${email} c'est connecté avec succès`);
            return new AuthEntity(user);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    @Post('register')
    @ApiOkResponse({ description: 'Register', type: RegisterDto })
    async register(@Body() registerDtp: RegisterDto) {
        try {
            const user = await this.authService.register(registerDtp);
            this.logger.log(`L'utilisateur ${user.email} est inscrit`);
            return {
                statusCode: 201,
                statusMessage: `L'utilisateur ${user.email} est inscrit`,
            };
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    @Post('logout')
    @ApiOkResponse({ description: 'Logout' })
    async logout(@Body() user: { id: string }) {
        try {
            this.logger.log(`Déconnexion de l'utilisateur`);
            return await this.authService.logout(user.id);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    @UseGuards(AuthGuard)
    @Post('refresh-access-token')
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Refresh token' })
    async refreshToken(@Request() req) {
        try {
            this.logger.log(`Rafraîchissement du token d'accès`);
            return await this.authService.refreshAccessToken(req.user);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

}

// test add azur
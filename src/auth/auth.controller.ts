import {
    Controller,
    Post,
    Body,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { AuthEntity } from './entities/auth.entity';

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

    @Post('refresh-access-token')
    @ApiOkResponse({ description: 'Refresh token' })
    async refreshToken(@Body() token: { accessToken: string }) {
        try {
            this.logger.log(`Rafraîchissement du token d'accès`);
            return await this.authService.refreshAccessToken(token.accessToken);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }
}

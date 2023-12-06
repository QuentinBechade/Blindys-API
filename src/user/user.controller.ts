import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    UseGuards,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
//import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('users')
@ApiTags('users')
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {}

    @Post()
    @ApiBearerAuth()
    @ApiCreatedResponse({ description: 'Create user', type: UserEntity })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
        try {
            this.logger.log(
                `User : Création de l'utilisateur ${createUserDto.email}`,
            );
            return new UserEntity(await this.userService.create(createUserDto));
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    /**
     * Retrieves all users
     */
    @Get()
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Get all users', type: [UserEntity] })
    async findAllUsers() {
        try {
            const users = await this.userService.findAll();
            this.logger.log(`USERS: Récupération de tous les utilisateurs`);
            return users.map((user) => new UserEntity(user));
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Get user by id', type: UserEntity })
    findOneUser(@Param('id') id: string) {
        try {
            this.logger.log(`USER: Récupération de l'utilisateur ${id}`);
            return this.userService.findOne(id);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    @Put(':id')
    // @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Update user', type: UserEntity })
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        try {
            this.logger.log(`USER: Mise à jour de l'utilisateur ${id}`);
            return this.userService.update(id, updateUserDto);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }

    @Delete(':id')
    // @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Delete user', type: UserEntity })
    removeUser(@Param('id') id: string) {
        try {
            this.logger.log(`USER: Suppression de l'utilisateur ${id}`);
            return this.userService.remove(id);
        } catch (e) {
            this.logger.error(` ${e.message}`);
            throw new InternalServerErrorException(e.message);
        }
    }
}

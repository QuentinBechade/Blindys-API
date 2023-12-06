import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
//import { hashPassword } from '../utils/auth';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    /**
     * @description Create a new user
     * @param createUserDto Information needed to create a new user.
     * @returns {Promise<UserEntity>} The user created
     */
    async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        createUserDto.password = await hashPassword(createUserDto.password);
        return this.prisma.user.create({
            data: {
                ...createUserDto,
                role: ['USER'], // set default role to user (will be changed later)
            },
        });
    }

    /**
     * @description Retrieves the API secret key for a user specified by its ID.
     * @param userId The ID of the user
     * @returns {Promise<{secret: string}>} The API secret key
     */
    async getApiSecretKeyByUserId(userId: string): Promise<{ secret: string }> {
        return this.prisma.userApiKey.findFirst({
            where: {
                userId: userId,
            },
            select: {
                secret: true,
            },
        });
    }

    /**
     * @description Retrieves the API secret key .
     * @param field
     * @param value
     * @param options
     * @returns {Promise<{secret: string}>} The API secret key
     */
    async getApiKeyByField(field: string, value: string, options: any) {
        const validFields = ['userId', 'secret'];
        if (!validFields.includes(field)) {
            throw new Error(`Invalid field: ${field}`);
        }

        const whereClause: { [key: string]: string } = {};
        whereClause[field] = value;

        return this.prisma.userApiKey.findFirst({
            where: whereClause,
            select: options,
        });
    }

    /**
     * @description Check if the api key exists if so, select otherwise raise an error
     * @param apiKey
     */
    async isApiKeyExists(apiKey: string) {
        const api_key = await this.getApiKeyByField('secret', apiKey, {
            secret: true,
        });
        if (!api_key) {
            throw new NotFoundException(`Api key with secret ${apiKey} not found`);
        }
        return api_key;
    }

    async getApiSecretKey(apiKey: string): Promise<{ secret: string }> {
        return this.prisma.userApiKey.findFirst({
            where: {
                secret: apiKey,
            },
            select: {
                secret: true,
            },
        });
    }

    // async getApiSecretKeyByUserIds(id: string): Promise<{ secret: string }> {
    //
    //     const cachedApiKey = await this.cacheManager.get(`api_key`) as { secret: string };
    //     if (Object.keys(cachedApiKey).length > 0) {
    //         return cachedApiKey;
    //     }
    //
    //     const api_key: { secret: string } = await this.prisma.userApiKey.findFirst({
    //         where: {
    //             userId: id,
    //         },
    //         select: {
    //             secret: true,
    //         },
    //     });
    //     if (!api_key) {
    //         return null;
    //     }
    //     await this.cacheManager.set(`api_key`, api_key, 30000);
    //     return api_key;
    // }

    /**
     * @description Creates a new API secret key for a user specified by its ID.
     * @param id The ID of the user
     * @returns {Promise<{secret: string}>} The API secret key
     */
    async createApiSecretKey(id: string): Promise<{ secret: string }> {
        const apiKey: string = generateApiKey({ method: 'string' }).toString();
        // Save refresh token in database
        return this.prisma.userApiKey.create({
            data: {
                secret: apiKey,
                userId: id,
            },
            select: {
                secret: true,
            },
        });
    }

    /**
     * @description Retrieves the API secret key for a user specified by its ID, or creates it if it doesn't exist.
     * @param id The ID of the user
     * @return {Promise<{secret: string}>} The API secret key
     */
    async getOrCreateApiSecretKey(id: string): Promise<{ secret: string }> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException("L'utilisateur n'existe pas");
        }
        if (!user.stripeCustomerId) {
            throw new NotFoundException("L'utilisateur n' est pas abonné à un plan");
        }
        const secret = await this.getApiSecretKeyByUserId(id);

        if (!secret) {
            return await this.createApiSecretKey(id);
        }
        return secret;
    }

    /**
     * @description Retrieves all users with a specific selection of fields
     * @returns {Promise<{id: string, firstName: string, lastName: string, email:string}[]>} The users
     */
    findAll(): Promise<
        { id: string; firstName: string; lastName: string; email: string }[]
        > {
        return this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
            orderBy: { firstName: 'asc' },
        });
    }

    /**
     * @description Retrieves a user by its ID
     * @param id The ID of the user
     * @returns {Promise<{id: string, firstName: string, lastName: string, email:string, stripeCustomerId: string}>} The user
     */
    async findOne(id: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        stripeCustomerId: string;
    }> {
        return this.prisma.user.findUnique({
            where: {
                id: id,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                stripeCustomerId: true,
            },
        });
    }

    /**
     * @description Updates the Stripe customer ID of a user
     * @param data The data to update
     * @returns {Promise<{id: string, firstName: string, lastName: string, email:string}>} The user
     */
    async updateStripeCustomerId(data: any) {
        const { id, stripeCustomerId } = data;
        return this.prisma.user.update({
            where: {
                id,
            },
            data: {
                stripeCustomerId,
            },
        });
    }

    findOneByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email: email,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                password: true,
                role: true,
            },
        });
    }

    public async findOneByField(field: string, value: string, options: any) {
        const validFields = ['id', 'username', 'email'];
        if (!validFields.includes(field)) {
            throw new Error(`Invalid field: ${field}`);
        }

        const whereClause: { [key: string]: string } = {};
        whereClause[field] = value;

        return this.prisma.user.findUnique({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            where: whereClause,
            select: options,
        });
    }

    /**
     * @description Updates a user
     * @param id The ID of the user
     * @param updateUserDto The data to update
     * @returns {Promise<{id: string, firstName: string, lastName: string, email:string}>} The user
     */
    async update(
        id: string,
        updateUserDto: UpdateUserDto,
    ): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }> {
        updateUserDto.password = await hashPassword(updateUserDto.password);
        return this.prisma.user.update({
            where: {
                id,
            },
            data: updateUserDto,
        });
    }

    /**
     * @description Deletes a user
     * @param id
     * @returns {Promise<{id: string, firstName: string, lastName: string, email:string}>} The user
     */
    remove(id: string) {
        return this.prisma.user.delete({
            where: {
                id,
            },
        });
    }

    /**
     * @description Subscribes a user to a plan
     * @param lookupKey The lookup key to retrieve the price associated with a plan
     * @param userId The ID of the user
     * @returns {Promise<string>} The URL of the payment session
     */
    async subscribeUserToPlan(
        lookupKey: string,
        userId: string,
    ): Promise<{ paymentUrl: string }> {
        const userInfo = await this.findOne(userId);
        const {
            url,
            user: customer,
            shouldUpdateUser,
        } = await this.paymentService.generateSubscriptionPaymentSession(
            userInfo,
            lookupKey,
        );
        if (shouldUpdateUser) {
            await this.updateStripeCustomerId(customer);
        }

        return {
            paymentUrl: url,
        };
    }
}

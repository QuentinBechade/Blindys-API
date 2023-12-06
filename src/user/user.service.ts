import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../utils/auth';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @description Create a new user
   * @param createUserDto Information needed to create a new user.
   * @returns {Promise<UserEntity>} The user created
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    createUserDto.password = await hashPassword(createUserDto.password);
    return this.prisma.user.create({
      data: {
        ...createUserDto, // set default role to user (will be changed later)
      },
    });
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
}

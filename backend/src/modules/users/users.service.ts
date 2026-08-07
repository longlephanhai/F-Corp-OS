import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Like, Repository } from 'typeorm';
import { getHashPassword } from 'helper';
import { compareSync } from 'bcryptjs';
import { Role } from 'modules/roles/entities/role.entity';
import { IUser } from 'common/types/user.interface';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Role) private rolesRepository: Repository<Role>
  ) { }

  findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: {
        role: {
          permissions: true,
        },
      },
    })
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  updateUserToken = async (refreshToken: string, id: string) => {
    return this.usersRepository.update({
      id: id
    }, {
      refreshToken: refreshToken
    })
  }

  findUserByToken = async (refreshToken: string) => {
    return await this.usersRepository.findOne({
      where: { refreshToken },
      relations: {
        role: {
          permissions: true
        },
      },
    })
  }


  async create(createUserDto: CreateUserDto, user: IUser) {
    const { email, password, fullName, role_id } = createUserDto;

    const isExist = await this.usersRepository.findOne({
      where: { email },
    });

    if (isExist) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = getHashPassword(password);

    const userRole = await this.rolesRepository.findOne({
      where: { id: role_id }
    });

    if (!userRole) {
      throw new BadRequestException(`Role with id "${role_id}" does not exist`);
    }

    const newUser = await this.usersRepository.save({
      email,
      password: hashedPassword,
      fullName,
      role: userRole,
      createdBy: {
        id: user.id,
        email: user.email
      }
    });

    return newUser;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);
    // console.log('filter', filter);
    // console.log('sort', sort);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const result = await this.usersRepository.find({
      where: {
        ...filter,
        fullName: Like('%' + filter.fullName + '%')
      },
      skip: offset,
      take: defaultLimit,
      order: sort,
      select: {
        id: true,
        email: true,
        fullName: true,
      },
      relations: {
        role: {
          permissions: true
        }
      }
    });

    return {
      meta: {
        currentPage: +currentPage,
        pageSize: +limit,
        pages: result.length,
        total: Math.ceil(result.length / +limit)
      },
      result
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


}

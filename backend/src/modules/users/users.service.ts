import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getHashPassword } from 'helper';
import { compareSync } from 'bcryptjs';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) { }

  findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      // relations: ['role', 'role.permissions'],
    })
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }


  async create(createUserDto: CreateUserDto) {
    const { email, password, fullName } = createUserDto;

    const isExist = await this.usersRepository.findOne({
      where: { email },
    });

    if (isExist) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = getHashPassword(password);

    const newUser = await this.usersRepository.save({
      email,
      password: hashedPassword,
      fullName,
    });

    return newUser;

  }

  findAll() {
    return `This action returns all users`;
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

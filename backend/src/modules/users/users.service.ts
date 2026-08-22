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
import { TITLE_COST_RATE } from 'common/constants/cost-rate.constant';
import { TitleType, UserStatusType } from 'common/enum/user.enum';
import * as XLSX from 'xlsx';

interface ImportUserRow {
  fullName?: string;
  email?: string;
  role?: string; // tên role, ví dụ "HR", "ADMIN"
  title?: string; // JUNIOR_DEV, SENIOR_DEV, PM, HR
  status?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Role) private rolesRepository: Repository<Role>,
  ) {}

  findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: {
        role: {
          permissions: true,
        },
      },
    });
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  updateUserToken = async (refreshToken: string, id: string) => {
    return this.usersRepository.update(
      {
        id: id,
      },
      {
        refreshToken: refreshToken,
      },
    );
  };

  findUserByToken = async (refreshToken: string) => {
    return await this.usersRepository.findOne({
      where: { refreshToken },
      relations: {
        role: {
          permissions: true,
        },
      },
    });
  };

  async create(createUserDto: CreateUserDto, user: IUser) {
    const { email, password, fullName, role_id, title, status } = createUserDto;

    const isExist = await this.usersRepository.findOne({
      where: { email },
    });

    if (isExist) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = getHashPassword(password);

    const userRole = await this.rolesRepository.findOne({
      where: { id: role_id },
    });

    if (!userRole) {
      throw new BadRequestException(`Role with id "${role_id}" does not exist`);
    }

    const costRate = TITLE_COST_RATE[title];
    console.log(user.id, user.email);

    const newUser = await this.usersRepository.save({
      ...createUserDto,
      email,
      password: hashedPassword,
      fullName,
      role: userRole,
      title,
      costRate,
      status: status || UserStatusType.AVAILABLE,
      createdBy: {
        id: user.id,
        email: user.email,
      },
    });

    return newUser;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);
    // console.log('filter', filter);
    // console.log('sort', sort);
    delete filter.current;
    delete filter.pageSize;

    const search = filter.search;
    delete filter.search;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .withDeleted();

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const likeFields = ['email', 'fullName'];

    Object.keys(filter).forEach((key) => {
      if (likeFields.includes(key)) {
        queryBuilder.andWhere(`user.${key} LIKE :${key}`, {
          [key]: `%${filter[key]}%`,
        });
      } else {
        queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filter[key] });
      }
    });

    if (filter.role_id) {
      queryBuilder.andWhere('role.id = :role_id', { role_id: filter.role_id });
    }

    if (sort && typeof sort === 'object') {
      Object.entries(sort).forEach(([key, value]) => {
        queryBuilder.addOrderBy(`user.${key}`, value === -1 ? 'DESC' : 'ASC');
      });
    }
    const [result, totalItems] = await queryBuilder
      .skip(offset)
      .take(defaultLimit)
      .getManyAndCount();

    return {
      meta: {
        currentPage: +currentPage,
        pageSize: +limit,
        pages: Math.ceil(totalItems / defaultLimit),
        total: totalItems,
      },
      result,
    };
  }

  async countUser() {
    const total = await this.usersRepository.count();
    return { total };
  }

  async countDisableAccount() {
    const total = await this.usersRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.isDeleted = :isDeleted', { isDeleted: true })
      .getCount();

    return { total };
  }
  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: IUser) {
    const existUser = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!existUser) {
      throw new BadRequestException(`User with id "${id}" not found`);
    }

    const { email, fullName, role_id, title, status } = updateUserDto;

    if (email && email !== existUser.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email },
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
      existUser.email = email;
    }

    if (fullName) existUser.fullName = fullName;

    if (role_id) {
      const role = await this.rolesRepository.findOne({
        where: { id: role_id },
      });
      if (!role) {
        throw new BadRequestException(
          `Role with id "${role_id}" does not exist`,
        );
      }
      existUser.role = role;
    }

    if (title) {
      existUser.title = title;
      existUser.costRate = TITLE_COST_RATE[title];
    }

    if (status) existUser.status = status;

    existUser.updatedBy = { id: user.id, email: user.email };

    await this.usersRepository.save(existUser);

    return { message: 'Updated successfully' };
  }

  async remove(id: string, user: IUser) {
    const existUser = await this.usersRepository.findOne({
      where: { id },
    });
    console.log(`User with id "${id}" `);
    console.log(`User with id "${user.fullName}" `);
    if (!existUser) {
      throw new BadRequestException(`User with id "${id}" not found`);
    }

    await this.usersRepository.update(
      { id },
      {
        isDeleted: true,
        deletedBy: {
          id: user.id,
          email: user.email,
        },
      },
    );

    await this.usersRepository.softDelete(id);

    return {
      message: `User "${id}" deleted successfully`,
    };
  }

  async restore(id: string, user: IUser) {
    const existUser = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true, // cần bật, vì user đã bị soft-delete nên find() mặc định sẽ không thấy
    });

    if (!existUser) {
      throw new BadRequestException(`User with id "${id}" not found`);
    }

    await this.usersRepository.update(
      { id },
      {
        isDeleted: false,
        deletedBy: undefined,
        updatedBy: { id: user.id, email: user.email },
      },
    );

    await this.usersRepository.restore(id);

    return {
      message: `User "${id}" restored successfully`,
    };
  }

  // Lấy danh sách lính do PM quản lý
  async getMyTeam(managerId: string) {
    return await this.usersRepository.find({
      where: { managerId, isDeleted: false },
      relations: {
        userSkills: {
          skill: true,
          evidences: true,
        },
      },
    });
  }

  async importUsers(file: Express.Multer.File, user: IUser) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: ImportUserRow[] = XLSX.utils.sheet_to_json(sheet);

    const DEFAULT_PASSWORD = '123456';
    const errors: { row: number; message: string }[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = rows[i];
      try {
        if (!row.fullName || !row.email || !row.role || !row.title) {
          throw new Error('Thiếu fullName / email / role / title');
        }

        const existed = await this.usersRepository.findOne({
          where: { email: row.email },
        });
        if (existed) {
          throw new Error(`Email "${row.email}" đã tồn tại`);
        }

        const userRole = await this.rolesRepository.findOne({
          where: { name: row.role },
        });
        if (!userRole) {
          throw new Error(`Role "${row.role}" không tồn tại`);
        }

        const rawTitle = row.title as string;
        if (!Object.values(TitleType).includes(rawTitle as TitleType)) {
          throw new Error(`Title "${row.title}" không hợp lệ`);
        }
        const title: TitleType = rawTitle as TitleType;
        const costRate = TITLE_COST_RATE[title];

        const hashedPassword = getHashPassword(DEFAULT_PASSWORD);

        await this.usersRepository.save({
          fullName: row.fullName,
          email: row.email,
          password: hashedPassword,
          role: userRole,
          title,
          costRate,
          status: (row.status as UserStatusType) || UserStatusType.AVAILABLE,
          createdBy: { id: user.id, email: user.email },
        });

        successCount++;
      } catch (err: any) {
        errors.push({ row: rowNumber, message: err.message });
      }
    }

    return {
      total: rows.length,
      successCount,
      failCount: errors.length,
      errors,
    };
  }
}

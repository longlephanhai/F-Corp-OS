import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm';
import { IUser } from 'common/types/user.interface';

@Injectable()
export class PermissionsService {

  constructor(
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>
  ) { }

  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const { description, api_path, method, module } = createPermissionDto;

    const isExist = await this.permissionRepository.findOne({
      where: { api_path, method }
    })

    if (isExist) {
      throw new BadRequestException(`Permission with api_path "${api_path}" and method "${method}" already exists`);
    }

    const newPermission = await this.permissionRepository.save({
      description,
      api_path,
      method,
      module,
      createdBy: {
        id: user.id,
        email: user.email
      }
    });
    return newPermission;
  } 

  async countPermissions() {
    const total = await this.permissionRepository.count();
    return { total };
  }

  async findAll() {
    return this.permissionRepository.find({
        select: { id: true, description: true, api_path: true, method: true, module: true },
        order: { module: 'ASC', method: 'ASC' }
    });
}

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto, user: IUser) {
    const existPermission = await this.permissionRepository.findOne({ where: { id } });
    if (!existPermission) {
        throw new BadRequestException(`Permission with id "${id}" not found`);
    }

    await this.permissionRepository.update(
        { id },
        {
            ...updatePermissionDto,
            updatedBy: { id: user.id, email: user.email }
        }
    );

    return { message: 'Updated successfully' };
}

  async remove(id: string, user: IUser) {
    const existPermission = await this.permissionRepository.findOne({ where: { id } });
    if (!existPermission) {
        throw new BadRequestException(`Permission with id "${id}" not found`);
    }

    await this.permissionRepository.update(
        { id },
        {
            isDeleted: true,
            deletedBy: { id: user.id, email: user.email }
        }
    );

    await this.permissionRepository.softDelete(id);

    return { message: `Permission "${id}" deleted successfully` };
}
}

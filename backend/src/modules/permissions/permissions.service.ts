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

  findAll() {
    return `This action returns all permissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}

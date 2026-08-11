import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { In, Repository } from 'typeorm';
import { IUser } from 'common/types/user.interface';

@Injectable()
export class RolesService {

  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>
  ) { }

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const { name, description, permissions: permissionIds } = createRoleDto;

    const isExist = await this.roleRepository.findOne({
      where: { name }
    })
    if (isExist) {
      throw new BadRequestException(`Role with name "${name}" already exists`);
    }

    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds)
    })

    const newRole = this.roleRepository.create({
      name,
      description,
      permissions,
      createdBy:{
        id: user.id,
        email: user.email
      }
    });

    return await this.roleRepository.save(newRole);

  }

  async findAll() {
    return this.roleRepository.find({
        select: { id: true, name: true, description: true }
    });
}

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id: id },
      relations: { permissions: true },
      select: {
        id: true,
        name: true,
        description: true
      }
    })
    if (!role){
      throw new BadRequestException(`Role with id "${id}" not found`);
    }
    return role;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}

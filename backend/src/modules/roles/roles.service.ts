import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class RolesService {

  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>
  ) { }

  async create(createRoleDto: CreateRoleDto) {
    const { description, permissions: permissionIds } = createRoleDto;

    const isExist = await this.roleRepository.findOne({
      where: { description }
    })
    if (isExist) {
      throw new BadRequestException(`Role with description "${description}" already exists`);
    }

    const permissions = await this.permissionRepository.findBy({
      id: In(permissionIds)
    })

    const newRole = this.roleRepository.create({
      description,
      permissions
    });

    return await this.roleRepository.save(newRole);

  }

  findAll() {
    return `This action returns all roles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}

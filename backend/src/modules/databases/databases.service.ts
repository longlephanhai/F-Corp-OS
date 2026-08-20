import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { Role } from 'modules/roles/entities/role.entity';
import { User } from 'modules/users/entities/user.entity';
import { UsersService } from 'modules/users/users.service';
import { Repository } from 'typeorm';
import { INITIAL_PERMISSIONS } from './init';
import { getHashPassword } from 'helper';

@Injectable()
export class DatabasesService implements OnModuleInit {

    private readonly logger = new Logger(DatabasesService.name);

    constructor(
        @InjectRepository(User) private userepository: Repository<User>,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
        private readonly configService: ConfigService
    ) { }

    async onModuleInit() {
        const isInit = this.configService.get<boolean>("INIT_DATABASE");

        if (isInit) {
            const countUser = await this.userepository.count();
            const countRole = await this.roleRepository.count();
            const countPermission = await this.permissionRepository.count();

            if (countPermission === 0) {
                await this.permissionRepository.insert(INITIAL_PERMISSIONS);
            }

            if (countRole === 0) {
                const permissions = await this.permissionRepository.find({
                    select: {
                        id: true
                    }
                });
                await this.roleRepository.save({
                    name: "ADMIN",
                    description: "Có toàn bộ quyền của hệ thống",
                    permissions: permissions.map(permission => ({ id: permission.id })),
                })
                await this.roleRepository.save({
                    name: "HR",
                    description: "Có toàn bộ quyền của hệ thống",
                    permissions: permissions.map(permission => ({ id: permission.id })),
                })
                await this.roleRepository.save({
                    name: "PM",
                    description: "Có toàn bộ quyền của hệ thống",
                    permissions: permissions.map(permission => ({ id: permission.id })),
                })
                await this.roleRepository.save({
                    name: "DEVELOPER",
                    description: "Có toàn bộ quyền của hệ thống",
                    permissions: permissions.map(permission => ({ id: permission.id })),
                })
            }

            if (countUser === 0) {
                // admin
                const adminRole = await this.roleRepository.findOne({
                    where: { name: "ADMIN" },
                    select: {
                        id: true
                    }
                });
                const initPassword = this.configService.get<string>("INIT_PASSWORD", "") ?? "";
                await this.userepository.insert({
                    email: "admin@gmail.com",
                    password: getHashPassword(initPassword),
                    fullName: "Admin",
                    role: adminRole ? { id: adminRole.id } : undefined,
                })
                // hr
                const hrRole = await this.roleRepository.findOne({
                    where: { name: "HR" },
                    select: {
                        id: true
                    }
                });
                await this.userepository.insert({
                    email: "hr@gmail.com",
                    password: getHashPassword(initPassword),
                    fullName: "HR",
                    role: hrRole ? { id: hrRole.id } : undefined,
                })
                // pm
                const pmRole = await this.roleRepository.findOne({
                    where: { name: "PM" },
                    select: {
                        id: true
                    }
                });
                await this.userepository.insert({
                    email: "pm@gmail.com",
                    password: getHashPassword(initPassword),
                    fullName: "PM",
                    role: pmRole ? { id: pmRole.id } : undefined,
                })
                // developer
                const developerRole = await this.roleRepository.findOne({
                    where: { name: "DEVELOPER" },
                    select: {
                        id: true
                    }
                });
                await this.userepository.insert({
                    email: "developer@gmail.com",
                    password: getHashPassword(initPassword),
                    fullName: "Developer",
                    role: developerRole ? { id: developerRole.id } : undefined,
                })
            }

            if (countUser > 0 && countRole > 0 && countPermission > 0) {
                this.logger.log("Database has been initialized before, skipping initialization.");
            }
        }
    }

}

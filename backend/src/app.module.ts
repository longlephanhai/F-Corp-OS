import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { User } from 'modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { Role } from 'modules/roles/entities/role.entity';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { Permission } from 'modules/permissions/entities/permission.entity';
import { DatabasesModule } from './modules/databases/databases.module';
import { SkillsModule } from './modules/skills/skills.module';
import { UserSkillModule } from './modules/user_skill/user_skill.module';
import { Skill } from 'modules/skills/entities/skill.entity';
import { UserSkill } from 'modules/user_skill/entities/user_skill.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT', 3306),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [Skill, UserSkill, User, Role, Permission],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    DatabasesModule,
    SkillsModule,
    UserSkillModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

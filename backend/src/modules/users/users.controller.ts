import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ResponseMessage,
  User,
  SkipCheckPermission,
} from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';

@SkipCheckPermission()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('User created successfully')
  create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    console.log(user);
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @ResponseMessage('Get Users with Pagination')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.usersService.findAll(+currentPage, +limit, qs);
  }

  @Get('count')
  @ResponseMessage('Count users successfully')
  countUser() {
    return this.usersService.countUser();
  }

   @Get('count-disable-account')
  @ResponseMessage('Count users successfully')
  countDisableAccount() {
      return this.usersService.countDisableAccount();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage('User updated successfully')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() user: IUser,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.remove(id, user);
  }

  @Patch(':id/restore')
  @ResponseMessage('User restored successfully')
  restore(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.restore(id, user);
  }

  @Get('pm/my-team')
  async getMyTeam() {
    // Tạm thời hardcode ID của PM (ví dụ ID: '2ff0de6e-2759-4d11-aab7-42ca161f2933')
    // Thực tế sẽ dùng: const managerId = req.user.id;
    const managerId = '2ff0de6e-2759-4d11-aab7-42ca161f2933';
    const data = await this.usersService.getMyTeam(managerId);
    return { statusCode: 200, message: 'Lấy My Team thành công', data };
  }
}

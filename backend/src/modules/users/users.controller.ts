import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseMessage, User } from 'decorator/customize';
import type { IUser } from 'common/types/user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ResponseMessage('User created successfully')
  create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    console.log(user);
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @ResponseMessage('Get Users with Pagination')
  findAll(
    @Query("current") currentPage: string,
    @Query("pageSize") limit: string,
    @Query() qs: string,
  ) {
    return this.usersService.findAll(+currentPage, +limit, qs);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ResponseMessage('User updated successfully')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
      return this.usersService.update(id, updateUserDto, user);
  }
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @User() user: IUser,
  ) {
    return this.usersService.remove(id, user);
  }

  @Patch(':id/restore')
  @ResponseMessage('User restored successfully')
  restore(@Param('id') id: string, @User() user: IUser) {
      return this.usersService.restore(id, user);
  }
}

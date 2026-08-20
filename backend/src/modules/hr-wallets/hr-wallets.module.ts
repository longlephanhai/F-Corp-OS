import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'modules/users/entities/user.entity';
import { TransactionHistory } from './entities/transaction-history.entity';
import { Wallet } from './entities/wallet.entity';
import { HrWalletsController } from './hr-wallets.controller';
import { HrWalletsService } from './hr-wallets.service';

/**
 * HrWalletsModule — khai báo DI và import/export cho phân hệ ví F-Token.
 * Đăng ký Wallet và TransactionHistory vào TypeORM để tạo bảng tương ứng.
 */
@Module({
  imports: [
    // Đăng ký User entity để HrWalletsService có thể truy vấn thông tin nhân viên
    TypeOrmModule.forFeature([Wallet, TransactionHistory, User]),
  ],
  controllers: [HrWalletsController],
  providers: [HrWalletsService],
  exports: [HrWalletsService],
})
export class HrWalletsModule {}

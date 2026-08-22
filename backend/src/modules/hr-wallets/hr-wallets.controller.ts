import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { IUser } from 'common/types/user.interface';
import { ResponseMessage, User } from 'decorator/customize';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { HrWalletsService } from './hr-wallets.service';

/**
 * HrWalletsController — điểm nhận request cho phân hệ ví F-Token.
 * Controller chỉ nhận request, gọi service và trả kết quả — KHÔNG chứa business logic.
 */
@Controller('hr-wallets')
export class HrWalletsController {
  constructor(private readonly hrWalletsService: HrWalletsService) {}

  /**
   * POST /api/v1/hr-wallets/transaction
   * Xử lý một giao dịch F-Token (thưởng / phạt / chuyển) cho một nhân viên.
   * Nếu nhân viên chưa có ví, hệ thống sẽ tự động khởi tạo ví mới.
   * Toàn bộ thao tác được bọc trong một DB transaction để đảm bảo tính nguyên tử.
   *
   */
  @Post('transaction')
  @ResponseMessage('Giao dịch F-Token thực hiện thành công')
  processTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @User() user: IUser,
  ) {
    return this.hrWalletsService.processTransaction(createTransactionDto, user);
  }

  /**
   * GET /api/v1/hr-wallets/my-wallet
   * Lấy thông tin ví F-Token của người dùng hiện tại
   */
  @Get('my-wallet')
  @ResponseMessage('Lấy thông tin ví F-Token thành công')
  getMyWallet(@User() user: IUser) {
    return this.hrWalletsService.getMyWallet(user.id);
  }

  /**
   * GET /api/v1/hr-wallets/my-transactions
   * Lấy lịch sử giao dịch của ví F-Token của người dùng hiện tại
   */
  @Get('my-transactions')
  @ResponseMessage('Lấy lịch sử giao dịch thành công')
  getMyTransactions(@User() user: IUser, @Query() query: any) {
    return this.hrWalletsService.getMyTransactions(user.id, query);
  }

  /**
   * GET /api/v1/hr-wallets
   * Lấy danh sách tất cả các ví (dành cho HR/Admin)
   */
  @Get()
  @ResponseMessage('Lấy danh sách tất cả ví F-Token thành công')
  getAllWallets(@Query() query: any) {
    return this.hrWalletsService.getAllWallets(query);
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType, WalletStatus } from 'common/enum/hr-wallet.enum';
import type { IUser } from 'common/types/user.interface';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetWalletTransactionsDto } from './dto/get-wallet-transactions.dto';
import { TransactionHistory } from './entities/transaction-history.entity';
import { Wallet } from './entities/wallet.entity';
import { User } from 'modules/users/entities/user.entity';
/**
 * HrWalletsService — chứa toàn bộ business logic cho phân hệ ví F-Token.
 * Được inject vào Controller và các Service khác có nhu cầu thao tác ví.
 */
@Injectable()
export class HrWalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    @InjectRepository(TransactionHistory)
    private readonly transactionHistoryRepository: Repository<TransactionHistory>,

    /**
     * DataSource được inject để tạo QueryRunner, đảm bảo tính nguyên tử (atomicity)
     * khi cập nhật Wallet balance và tạo TransactionHistory trong cùng một transaction DB.
     */
    private readonly dataSource: DataSource,
  ) { }
  private async lockEmployeeForWallet(
    manager: EntityManager,
    employeeId: string,
  ): Promise<User> {
    const employee = await manager
      .createQueryBuilder(User, 'employee')
      .setLock('pessimistic_write')
      .where('employee.id = :employeeId', {
        employeeId,
      })
      .andWhere('employee.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .getOne();

    if (!employee) {
      throw new NotFoundException(
        `Không tìm thấy nhân viên với id "${employeeId}".`,
      );
    }

    return employee;
  }
  /**
   * Xử lý một giao dịch F-Token (REWARD / PENALTY / TRANSFER) một cách an toàn.
   *
   * Luồng thực hiện (trong một DB Transaction):
   *  1. Tìm Wallet theo employeeId → nếu chưa có, tự tạo mới với balance = 0.
   *  2. Tính toán số dư mới dựa theo loại giao dịch.
   *  3. Lưu Wallet đã cập nhật qua queryRunner.manager.
   *  4. Tạo và lưu TransactionHistory qua queryRunner.manager.
   *  5. Commit — hoặc Rollback nếu có lỗi xảy ra ở bất kỳ bước nào.
   *
   * @param dto  - Dữ liệu giao dịch đã được validate bởi class-validator.
   * @param user - Thông tin người dùng hiện tại (từ JWT), dùng để ghi audit field.
   * @returns    Đối tượng TransactionHistory vừa được tạo.
   */
  async processTransaction(
    dto: CreateTransactionDto,
    user: IUser,
  ): Promise<TransactionHistory> {
    if (dto.type === TransactionType.TRANSFER) {
      throw new BadRequestException(
        'TRANSFER chưa được hỗ trợ. Giao dịch thủ công chỉ cho phép REWARD hoặc PENALTY.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /*
       * Lock theo employee trước khi đọc/tạo Wallet.
       *
       * Không lock trực tiếp Wallet ngay từ đầu vì employee
       * có thể chưa có Wallet để lock.
       */
      const employee = await this.lockEmployeeForWallet(
        queryRunner.manager,
        dto.employeeId,
      );

      const auditUser = {
        id: user?.id ?? '',
        email: user?.email ?? '',
      };

      // --- Bước 1: Tìm hoặc tạo Wallet ---
      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: {
          employee: {
            id: dto.employeeId,
          },
          isDeleted: false,
        },
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          employee,
          balance: 0,
          status: WalletStatus.ACTIVE,
          createdBy: auditUser,
          updatedBy: auditUser,
        });

        wallet = await queryRunner.manager.save(
          Wallet,
          wallet,
        );
      }

      // --- Bước 2: Kiểm tra trạng thái Wallet ---
      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new BadRequestException(
          `Ví của nhân viên này đang ở trạng thái "${wallet.status}" và không thể thực hiện giao dịch.`,
        );
      }

      // --- Bước 3: Tính balance mới ---
      const currentBalance = Number(wallet.balance);
      const amount = Number(dto.amount);

      let newBalance: number;

      if (dto.type === TransactionType.REWARD) {
        newBalance = currentBalance + amount;
      } else {
        // PENALTY
        if (currentBalance < amount) {
          throw new BadRequestException(
            `Số dư không đủ. Số dư hiện tại: ${currentBalance} F-Token, yêu cầu trừ: ${amount} F-Token.`,
          );
        }

        newBalance = currentBalance - amount;
      }

      // --- Bước 4: Update Wallet ---
      wallet.balance = newBalance;
      wallet.updatedBy = auditUser;

      await queryRunner.manager.save(
        Wallet,
        wallet,
      );

      // --- Bước 5: Transaction History ---
      const history = queryRunner.manager.create(
        TransactionHistory,
        {
          amount: dto.amount,
          type: dto.type,
          reason: dto.reason,
          referenceId:
            dto.referenceId ?? undefined,
          wallet,
          createdBy: auditUser,
          updatedBy: auditUser,
        },
      );

      const savedHistory =
        await queryRunner.manager.save(
          TransactionHistory,
          history,
        );

      await queryRunner.commitTransaction();

      return savedHistory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Xử lý phần thưởng F-Token cho nhân viên (Idempotency + dùng chung Manager).
   * Đảm bảo tính nhất quán dữ liệu bằng cách sử dụng chung EntityManager từ transaction cha.
   *
   * @param employeeId UUID của nhân viên
   * @param amount Số lượng F-Token thưởng
   * @param referenceId ID của bản ghi đánh giá (để kiểm tra idempotency)
   * @param manager EntityManager đang nằm trong 1 Transaction
   * @param userId ID của người duyệt (dùng cho audit field)
   */
  async processRewardWithManager(
    employeeId: string,
    amount: number,
    referenceId: string,
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const auditUser = {
      id: userId,
      email: '',
    };

    /*
     * Lock employee trước.
     *
     * Điều này serialize mọi thao tác Wallet của cùng
     * một employee, kể cả trường hợp Wallet chưa tồn tại.
     */
    const employee = await this.lockEmployeeForWallet(
      manager,
      employeeId,
    );

    /*
     * Sau khi đã lấy lock mới kiểm tra idempotency.
     *
     * Nếu transaction khác vừa tạo reward cùng referenceId,
     * transaction hiện tại sẽ thấy transaction đó sau khi
     * lock được giải phóng.
     */
    const existingTx = await manager.findOne(
      TransactionHistory,
      {
        where: {
          referenceId,
          type: TransactionType.REWARD,
          isDeleted: false,
        },
      },
    );

    if (existingTx) {
      return;
    }

    // --- Tìm hoặc tạo Wallet ---
    let wallet = await manager.findOne(Wallet, {
      where: {
        employee: {
          id: employeeId,
        },
        isDeleted: false,
      },
    });

    if (!wallet) {
      wallet = manager.create(Wallet, {
        employee,
        balance: 0,
        status: WalletStatus.ACTIVE,
        createdBy: auditUser,
        updatedBy: auditUser,
      });

      wallet = await manager.save(
        Wallet,
        wallet,
      );
    }

    // --- Update balance ---
    wallet.balance =
      Number(wallet.balance) + Number(amount);

    wallet.updatedBy = auditUser;

    await manager.save(
      Wallet,
      wallet,
    );

    // --- Transaction History ---
    const history = manager.create(
      TransactionHistory,
      {
        amount,
        type: TransactionType.REWARD,
        reason: 'Thưởng đánh giá năng lực',
        referenceId,
        wallet,
        createdBy: auditUser,
        updatedBy: auditUser,
      },
    );

    await manager.save(
      TransactionHistory,
      history,
    );
  }

  /**
   * Lấy thông tin ví F-Token của người dùng hiện tại
   */
  async getMyWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { employee: { id: userId }, isDeleted: false },
      relations: { employee: true },
    });

    if (!wallet) {
      throw new NotFoundException('Không tìm thấy ví F-Token của bạn.');
    }
    return wallet;
  }

  /**
   * Lấy lịch sử giao dịch của ví F-Token của người dùng hiện tại
   */
  async getMyTransactions(userId: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const wallet = await this.getMyWallet(userId);

    const [result, total] = await this.transactionHistoryRepository.findAndCount({
      where: { wallet: { id: wallet.id }, isDeleted: false },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        currentPage: Number(page),
        pageSize: Number(limit),
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  }

  /**
   * Lấy lịch sử giao dịch F-Token toàn hệ thống dành cho HR.
   * Hỗ trợ phân trang và lọc theo nhân viên / loại giao dịch.
   */
  async getAllTransactions(
    query: GetWalletTransactionsDto,
  ) {
    const {
      page = 1,
      limit = 10,
      employeeId,
      type,
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder =
      this.transactionHistoryRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect(
          'transaction.wallet',
          'wallet',
        )
        .leftJoinAndSelect(
          'wallet.employee',
          'employee',
        )
        .where('transaction.isDeleted = :isDeleted', {
          isDeleted: false,
        });

    if (employeeId) {
      queryBuilder.andWhere(
        'employee.id = :employeeId',
        {
          employeeId,
        },
      );
    }

    if (type) {
      queryBuilder.andWhere(
        'transaction.type = :type',
        {
          type,
        },
      );
    }

    queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [result, total] =
      await queryBuilder.getManyAndCount();

    return {
      meta: {
        currentPage: Number(page),
        pageSize: Number(limit),
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  }

  /**
   * Lấy danh sách tất cả các ví (dành cho HR/Admin)
   */
  async getAllWallets(query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [result, total] = await this.walletRepository.findAndCount({
      where: { isDeleted: false },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        currentPage: Number(page),
        pageSize: Number(limit),
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  }
}

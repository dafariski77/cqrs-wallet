import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
  Logger,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  ADD_WALLET_CMD,
  GET_PORTFOLIO_QUERY,
  GET_TRANSACTIONS_QUERY,
  AddWalletDto,
  USER_WALLET_SERVICE,
  ANALYTICS_SERVICE,
} from '@shared/index';

class AddWalletRequest {
  userId: string;
  address: string;
  chainType: 'ETHEREUM' | 'POLYGON' | 'SOLANA';
}

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    @Inject(USER_WALLET_SERVICE)
    private readonly userWalletClient: ClientProxy,
    @Inject(ANALYTICS_SERVICE)
    private readonly analyticsClient: ClientProxy,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * POST /api/v1/wallets
   * Register a new wallet for tracking.
   */
  @Post('wallets')
  async addWallet(@Body() body: AddWalletRequest) {
    this.logger.log(
      `POST /wallets => userId=${body.userId}, address=${body.address}`,
    );
    const dto: AddWalletDto = {
      userId: body.userId,
      address: body.address,
      chainType: body.chainType,
    };
    return lastValueFrom(this.userWalletClient.send(ADD_WALLET_CMD, dto));
  }

  /**
   * GET /api/v1/portfolio/:userId
   * Get portfolio summary for a user.
   */
  @Get('portfolio/:userId')
  async getPortfolio(@Param('userId') userId: string) {
    this.logger.log(`GET /portfolio/${userId}`);
    return lastValueFrom(
      this.analyticsClient.send(GET_PORTFOLIO_QUERY, { userId }),
    );
  }

  /**
   * GET /api/v1/transactions/:userId
   * Get paginated, filterable transaction history for a user.
   */
  @Get('transactions/:userId')
  async getTransactions(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ) {
    this.logger.log(
      `GET /transactions/${userId}?page=${page}&limit=${limit}&type=${type}`,
    );
    return lastValueFrom(
      this.analyticsClient.send(GET_TRANSACTIONS_QUERY, {
        userId,
        page,
        limit,
        type,
      }),
    );
  }
}

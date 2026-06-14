import { Controller, Get } from '@nestjs/common';
import { IndexerServiceService } from './indexer-service.service';

@Controller()
export class IndexerServiceController {
  constructor(private readonly indexerServiceService: IndexerServiceService) {}

  @Get()
  getHello(): string {
    return this.indexerServiceService.getHello();
  }
}

import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Roles(Role.ADMIN)
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('clients/:id/subscriptions')
  findByClient(@Param('id') clientId: string) {
    return this.subscriptionsService.findByClient(clientId);
  }

  @Post('clients/:id/subscriptions')
  createForClient(
    @Param('id') clientId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createForClient(clientId, createSubscriptionDto);
  }

  @Put('subscriptions/:id')
  update(
    @Param('id') subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(subscriptionId, updateSubscriptionDto);
  }
}

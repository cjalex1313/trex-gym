import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { OutstandingPaymentItem, PaymentsService } from './payments.service';

@Roles(Role.ADMIN)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments/outstanding')
  findOutstanding(): Promise<OutstandingPaymentItem[]> {
    return this.paymentsService.findOutstanding();
  }

  @Get('subscriptions/:id/payments')
  findBySubscription(@Param('id') subscriptionId: string) {
    return this.paymentsService.findBySubscription(subscriptionId);
  }

  @Post('subscriptions/:id/payments')
  createForSubscription(
    @Param('id') subscriptionId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createForSubscription(subscriptionId, createPaymentDto);
  }

  @Get('clients/:id/payments')
  findByClient(@Param('id') clientId: string) {
    return this.paymentsService.findByClient(clientId);
  }

  @Put('payments/:id')
  update(@Param('id') paymentId: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(paymentId, updatePaymentDto);
  }

  @Delete('payments/:id')
  delete(@Param('id') paymentId: string) {
    return this.paymentsService.delete(paymentId);
  }
}

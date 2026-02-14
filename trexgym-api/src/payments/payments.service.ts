import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Subscription, SubscriptionDocument } from '../subscriptions/schemas/subscription.schema';

export interface OutstandingPaymentItem {
  subscriptionId: string;
  clientId: string;
  clientName: string;
  planType: string;
  planName?: string | null;
  endDate: Date;
  totalPrice: number;
  totalPaid: number;
  outstandingAmount: number;
  currency: string;
  lastPaymentDate?: Date;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
  ) {}

  async findBySubscription(subscriptionId: string) {
    this.assertValidObjectId(subscriptionId, 'Invalid subscription id');
    await this.assertSubscriptionExists(subscriptionId);

    return this.paymentModel
      .find({ subscriptionId })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async createForSubscription(subscriptionId: string, createPaymentDto: CreatePaymentDto) {
    this.assertValidObjectId(subscriptionId, 'Invalid subscription id');

    const subscription = await this.subscriptionModel
      .findById(subscriptionId)
      .lean()
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const paymentDate = new Date(createPaymentDto.paymentDate);
    this.assertValidDate(paymentDate);

    const payment = await this.paymentModel.create({
      subscriptionId,
      clientId: subscription.clientId,
      amount: createPaymentDto.amount,
      paymentDate,
      method: createPaymentDto.method,
      notes: createPaymentDto.notes ?? null,
    });

    return payment.toObject();
  }

  async update(paymentId: string, updatePaymentDto: UpdatePaymentDto) {
    this.assertValidObjectId(paymentId, 'Invalid payment id');

    const paymentDate = updatePaymentDto.paymentDate
      ? new Date(updatePaymentDto.paymentDate)
      : undefined;

    if (paymentDate) {
      this.assertValidDate(paymentDate);
    }

    const payment = await this.paymentModel
      .findByIdAndUpdate(
        paymentId,
        {
          ...updatePaymentDto,
          ...(paymentDate ? { paymentDate } : undefined),
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .lean()
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async delete(paymentId: string) {
    this.assertValidObjectId(paymentId, 'Invalid payment id');

    const payment = await this.paymentModel.findByIdAndDelete(paymentId).lean().exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      deleted: true,
      id: paymentId,
    };
  }

  async findByClient(clientId: string) {
    this.assertValidObjectId(clientId, 'Invalid client id');
    await this.assertClientExists(clientId);

    return this.paymentModel
      .find({ clientId })
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async findOutstanding(): Promise<OutstandingPaymentItem[]> {
    const items = await this.subscriptionModel
      .aggregate<OutstandingPaymentItem>([
        {
          $match: {
            status: { $in: ['active', 'expired'] },
          },
        },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'subscriptionId',
            as: 'payments',
          },
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client',
          },
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $addFields: {
            totalPaid: {
              $sum: '$payments.amount',
            },
            lastPaymentDate: {
              $max: '$payments.paymentDate',
            },
          },
        },
        {
          $addFields: {
            totalPaid: {
              $ifNull: ['$totalPaid', 0],
            },
            outstandingAmount: {
              $subtract: ['$price', { $ifNull: ['$totalPaid', 0] }],
            },
          },
        },
        {
          $match: {
            outstandingAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            subscriptionId: { $toString: '$_id' },
            clientId: { $toString: '$clientId' },
            clientName: {
              $concat: ['$client.firstName', ' ', '$client.lastName'],
            },
            planType: '$planType',
            planName: '$planName',
            endDate: '$endDate',
            totalPrice: '$price',
            totalPaid: '$totalPaid',
            outstandingAmount: '$outstandingAmount',
            currency: '$currency',
            lastPaymentDate: '$lastPaymentDate',
          },
        },
        {
          $sort: {
            endDate: 1,
            clientName: 1,
          },
        },
      ])
      .exec();

    return items;
  }

  private async assertSubscriptionExists(subscriptionId: string) {
    const subscription = await this.subscriptionModel
      .findById(subscriptionId)
      .select('_id')
      .lean()
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
  }

  private async assertClientExists(clientId: string) {
    const client = await this.clientModel.findById(clientId).select('_id').lean().exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private assertValidObjectId(id: string, message: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(message);
    }
  }

  private assertValidDate(date: Date) {
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid payment date');
    }
  }
}

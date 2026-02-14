import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Client,
  ClientDocument,
  ClientStatus,
} from '../clients/schemas/client.schema';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  CurrencyCode,
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
  ) {}

  async findByClient(clientId: string) {
    this.assertValidObjectId(clientId, 'Invalid client id');
    await this.assertClientExists(clientId);

    return this.subscriptionModel
      .find({ clientId })
      .sort({ startDate: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async createForClient(clientId: string, createSubscriptionDto: CreateSubscriptionDto) {
    this.assertValidObjectId(clientId, 'Invalid client id');
    await this.assertClientExists(clientId);

    const startDate = new Date(createSubscriptionDto.startDate);
    const endDate = new Date(createSubscriptionDto.endDate);
    this.assertDateRange(startDate, endDate);

    const subscription = await this.subscriptionModel.create({
      clientId,
      planType: createSubscriptionDto.planType,
      planName: createSubscriptionDto.planName ?? null,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      price: createSubscriptionDto.price,
      currency: createSubscriptionDto.currency ?? CurrencyCode.RON,
      notes: createSubscriptionDto.notes ?? null,
    });

    await this.clientModel
      .findByIdAndUpdate(clientId, {
        status: ClientStatus.ACTIVE,
      })
      .exec();

    return subscription.toObject();
  }

  async update(subscriptionId: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    this.assertValidObjectId(subscriptionId, 'Invalid subscription id');

    const existingSubscription = await this.subscriptionModel
      .findById(subscriptionId)
      .lean()
      .exec();

    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    const startDate = new Date(
      updateSubscriptionDto.startDate ?? existingSubscription.startDate,
    );
    const endDate = new Date(
      updateSubscriptionDto.endDate ?? existingSubscription.endDate,
    );
    this.assertDateRange(startDate, endDate);

    const subscription = await this.subscriptionModel
      .findByIdAndUpdate(
        subscriptionId,
        {
          ...updateSubscriptionDto,
          ...(updateSubscriptionDto.startDate ? { startDate } : undefined),
          ...(updateSubscriptionDto.endDate ? { endDate } : undefined),
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .lean()
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async findOne(subscriptionId: string) {
    this.assertValidObjectId(subscriptionId, 'Invalid subscription id');

    const subscription = await this.subscriptionModel
      .findById(subscriptionId)
      .lean()
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  private async assertClientExists(clientId: string) {
    const client = await this.clientModel.findById(clientId).lean().exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private assertValidObjectId(id: string, message: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(message);
    }
  }

  private assertDateRange(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date values');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }
  }
}

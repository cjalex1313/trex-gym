import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ClientDocument, ClientStatus } from '../clients/schemas/client.schema';
import { SubscriptionDocument, SubscriptionStatus } from './schemas/subscription.schema';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let subscriptionsService: SubscriptionsService;

  const subscriptionModel = {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  } as unknown as Model<SubscriptionDocument>;

  const clientModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  } as unknown as Model<ClientDocument>;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionsService = new SubscriptionsService(subscriptionModel, clientModel);
  });

  it('lists subscriptions by client', async () => {
    const clientFindExec = jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860ea' });
    const clientFindChain = {
      lean: jest.fn().mockReturnThis(),
      exec: clientFindExec,
    };

    const findExec = jest.fn().mockResolvedValue([{ _id: 'sub-1' }]);
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: findExec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(clientFindChain);
    (subscriptionModel.find as jest.Mock).mockReturnValue(findChain);

    const result = await subscriptionsService.findByClient('507f191e810c19729de860ea');

    expect(result).toEqual([{ _id: 'sub-1' }]);
    expect(subscriptionModel.find).toHaveBeenCalledWith({
      clientId: '507f191e810c19729de860ea',
    });
  });

  it('creates subscription and activates client', async () => {
    const clientFindExec = jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860ea' });
    const clientFindChain = {
      lean: jest.fn().mockReturnThis(),
      exec: clientFindExec,
    };

    const clientUpdateExec = jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860ea' });
    const clientUpdateChain = {
      exec: clientUpdateExec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(clientFindChain);
    (clientModel.findByIdAndUpdate as jest.Mock).mockReturnValue(clientUpdateChain);
    (subscriptionModel.create as jest.Mock).mockResolvedValue({
      toObject: () => ({ _id: 'sub-1', status: SubscriptionStatus.ACTIVE }),
    });

    const result = await subscriptionsService.createForClient(
      '507f191e810c19729de860ea',
      {
        planType: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        price: 200,
      },
    );

    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(clientModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      {
        status: ClientStatus.ACTIVE,
      },
    );
  });

  it('throws not found when creating for missing client', async () => {
    const clientFindExec = jest.fn().mockResolvedValue(null);
    const clientFindChain = {
      lean: jest.fn().mockReturnThis(),
      exec: clientFindExec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(clientFindChain);

    await expect(
      subscriptionsService.createForClient('507f191e810c19729de860ea', {
        planType: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-02-01',
        price: 200,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws bad request for invalid date range', async () => {
    const clientFindExec = jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860ea' });
    const clientFindChain = {
      lean: jest.fn().mockReturnThis(),
      exec: clientFindExec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(clientFindChain);

    await expect(
      subscriptionsService.createForClient('507f191e810c19729de860ea', {
        planType: 'monthly',
        startDate: '2026-03-01',
        endDate: '2026-02-01',
        price: 200,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates subscription', async () => {
    const findByIdExec = jest.fn().mockResolvedValue({
      _id: '507f191e810c19729de860eb',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-02-01'),
    });
    const findByIdChain = {
      lean: jest.fn().mockReturnThis(),
      exec: findByIdExec,
    };

    const updateExec = jest.fn().mockResolvedValue({
      _id: '507f191e810c19729de860eb',
      status: SubscriptionStatus.CANCELLED,
    });
    const updateChain = {
      lean: jest.fn().mockReturnThis(),
      exec: updateExec,
    };

    (subscriptionModel.findById as jest.Mock).mockReturnValue(findByIdChain);
    (subscriptionModel.findByIdAndUpdate as jest.Mock).mockReturnValue(updateChain);

    const result = await subscriptionsService.update('507f191e810c19729de860eb', {
      status: SubscriptionStatus.CANCELLED,
    });

    expect(result).toEqual({
      _id: '507f191e810c19729de860eb',
      status: SubscriptionStatus.CANCELLED,
    });
  });

  it('throws not found when subscription update target is missing', async () => {
    const findByIdExec = jest.fn().mockResolvedValue(null);
    const findByIdChain = {
      lean: jest.fn().mockReturnThis(),
      exec: findByIdExec,
    };

    (subscriptionModel.findById as jest.Mock).mockReturnValue(findByIdChain);

    await expect(
      subscriptionsService.update('507f191e810c19729de860eb', {
        status: SubscriptionStatus.CANCELLED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

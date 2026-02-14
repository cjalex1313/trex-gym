import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ClientDocument } from '../clients/schemas/client.schema';
import { PaymentDocument, PaymentMethod } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';
import { SubscriptionDocument } from '../subscriptions/schemas/subscription.schema';

describe('PaymentsService', () => {
  let paymentsService: PaymentsService;

  const paymentModel = {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  } as unknown as Model<PaymentDocument>;

  const subscriptionModel = {
    findById: jest.fn(),
    aggregate: jest.fn(),
  } as unknown as Model<SubscriptionDocument>;

  const clientModel = {
    findById: jest.fn(),
  } as unknown as Model<ClientDocument>;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentsService = new PaymentsService(paymentModel, subscriptionModel, clientModel);
  });

  it('creates a payment for subscription', async () => {
    const subscriptionExec = jest.fn().mockResolvedValue({
      _id: '507f191e810c19729de860eb',
      clientId: '507f191e810c19729de860ea',
    });
    const subscriptionChain = {
      lean: jest.fn().mockReturnThis(),
      exec: subscriptionExec,
    };

    (subscriptionModel.findById as jest.Mock).mockReturnValue(subscriptionChain);
    (paymentModel.create as jest.Mock).mockResolvedValue({
      toObject: () => ({ _id: 'payment-1', amount: 100 }),
    });

    const result = await paymentsService.createForSubscription(
      '507f191e810c19729de860eb',
      {
        amount: 100,
        paymentDate: '2026-02-01',
        method: PaymentMethod.CASH,
      },
    );

    expect(result).toEqual({ _id: 'payment-1', amount: 100 });
    expect(paymentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: '507f191e810c19729de860eb',
        clientId: '507f191e810c19729de860ea',
      }),
    );
  });

  it('throws bad request when listing payments with invalid subscription id', async () => {
    await expect(paymentsService.findBySubscription('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws not found when listing payments for missing client', async () => {
    const clientExec = jest.fn().mockResolvedValue(null);
    const clientChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: clientExec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(clientChain);

    await expect(
      paymentsService.findByClient('507f191e810c19729de860ea'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates payment by id', async () => {
    const updateExec = jest.fn().mockResolvedValue({ _id: 'payment-1', amount: 120 });
    const updateChain = {
      lean: jest.fn().mockReturnThis(),
      exec: updateExec,
    };

    (paymentModel.findByIdAndUpdate as jest.Mock).mockReturnValue(updateChain);

    const result = await paymentsService.update('507f191e810c19729de860ec', {
      amount: 120,
    });

    expect(result).toEqual({ _id: 'payment-1', amount: 120 });
  });

  it('deletes payment and returns confirmation payload', async () => {
    const deleteExec = jest.fn().mockResolvedValue({ _id: 'payment-1' });
    const deleteChain = {
      lean: jest.fn().mockReturnThis(),
      exec: deleteExec,
    };

    (paymentModel.findByIdAndDelete as jest.Mock).mockReturnValue(deleteChain);

    const result = await paymentsService.delete('507f191e810c19729de860ed');

    expect(result).toEqual({
      deleted: true,
      id: '507f191e810c19729de860ed',
    });
  });

  it('returns outstanding payment items', async () => {
    const aggregateExec = jest.fn().mockResolvedValue([
      {
        subscriptionId: 'sub-1',
        clientId: 'client-1',
        clientName: 'Alex Popescu',
        outstandingAmount: 80,
      },
    ]);

    (subscriptionModel.aggregate as jest.Mock).mockReturnValue({
      exec: aggregateExec,
    });

    const result = await paymentsService.findOutstanding();

    expect(result).toEqual([
      {
        subscriptionId: 'sub-1',
        clientId: 'client-1',
        clientName: 'Alex Popescu',
        outstandingAmount: 80,
      },
    ]);
  });
});

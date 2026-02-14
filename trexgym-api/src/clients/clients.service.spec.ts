import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ClientsService } from './clients.service';
import { ClientDocument, ClientStatus } from './schemas/client.schema';

describe('ClientsService', () => {
  let clientsService: ClientsService;

  const clientModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  } as unknown as Model<ClientDocument>;

  beforeEach(() => {
    jest.clearAllMocks();
    clientsService = new ClientsService(clientModel);
  });

  it('creates client and returns generated pin', async () => {
    (clientModel.create as jest.Mock).mockResolvedValue({
      toObject: () => ({
        _id: 'client-1',
        firstName: 'Alex',
        lastName: 'Popescu',
        email: 'alex@trexgym.local',
        phone: '+40740000001',
        status: ClientStatus.INVITED,
        pinHash: 'hashed-pin',
      }),
    });

    const result = await clientsService.create({
      firstName: 'Alex',
      lastName: 'Popescu',
      email: 'alex@trexgym.local',
      phone: '+40740000001',
    });

    expect(result.generatedPin).toHaveLength(6);
    expect(result.client).not.toHaveProperty('pinHash');
  });

  it('throws conflict on duplicate email create', async () => {
    (clientModel.create as jest.Mock).mockRejectedValue({ code: 11000 });

    await expect(
      clientsService.create({
        firstName: 'Alex',
        lastName: 'Popescu',
        email: 'alex@trexgym.local',
        phone: '+40740000001',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws bad request on invalid id', async () => {
    await expect(clientsService.findOne('invalid-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists clients with pagination', async () => {
    const execFind = jest.fn().mockResolvedValue([{ _id: 'client-1' }]);
    const findChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: execFind,
    };

    const execCount = jest.fn().mockResolvedValue(1);
    const countChain = {
      exec: execCount,
    };

    (clientModel.find as jest.Mock).mockReturnValue(findChain);
    (clientModel.countDocuments as jest.Mock).mockReturnValue(countChain);

    const result = await clientsService.findAll({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(findChain.skip).toHaveBeenCalledWith(0);
  });

  it('returns client by id', async () => {
    const exec = jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860ea' });
    const findByIdChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(findByIdChain);

    const result = await clientsService.findOne('507f191e810c19729de860ea');

    expect(result).toEqual({ _id: '507f191e810c19729de860ea' });
  });

  it('throws not found when client id is missing', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const findByIdChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec,
    };

    (clientModel.findById as jest.Mock).mockReturnValue(findByIdChain);

    await expect(
      clientsService.findOne('507f191e810c19729de860ea'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a client', async () => {
    const exec = jest.fn().mockResolvedValue({
      _id: '507f191e810c19729de860ea',
      status: ClientStatus.ACTIVE,
    });
    const updateChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec,
    };

    (clientModel.findByIdAndUpdate as jest.Mock).mockReturnValue(updateChain);

    const result = await clientsService.update('507f191e810c19729de860ea', {
      status: ClientStatus.ACTIVE,
    });

    expect(result).toEqual({
      _id: '507f191e810c19729de860ea',
      status: ClientStatus.ACTIVE,
    });
  });

  it('suspends a client', async () => {
    const updateSpy = jest
      .spyOn(clientsService, 'update')
      .mockResolvedValue({
        _id: '507f191e810c19729de860ea',
        status: ClientStatus.SUSPENDED,
      } as never);

    await clientsService.suspend('507f191e810c19729de860ea');

    expect(updateSpy).toHaveBeenCalledWith('507f191e810c19729de860ea', {
      status: ClientStatus.SUSPENDED,
    });
  });
});

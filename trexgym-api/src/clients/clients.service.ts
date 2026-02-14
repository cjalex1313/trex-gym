import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcryptjs';
import { isValidObjectId, Model } from 'mongoose';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client, ClientDocument, ClientStatus } from './schemas/client.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const generatedPin = this.generatePin();
    const pinHash = await hash(generatedPin, 10);

    try {
      const client = await this.clientModel.create({
        ...createClientDto,
        email: createClientDto.email.toLowerCase(),
        pinHash,
        status: createClientDto.status ?? ClientStatus.INVITED,
      });

      const { pinHash: _pinHash, ...payload } = client.toObject();

      return {
        client: payload,
        generatedPin,
      };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        throw new ConflictException('Client email already exists');
      }

      throw error;
    }
  }

  async findAll(listClientsDto: ListClientsDto) {
    const page = listClientsDto.page ?? 1;
    const limit = listClientsDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = {};

    if (listClientsDto.search) {
      const regex = new RegExp(listClientsDto.search, 'i');
      filters.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.clientModel
        .find(filters)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-pinHash')
        .lean()
        .exec(),
      this.clientModel.countDocuments(filters).exec(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    this.assertValidObjectId(id);

    const client = await this.clientModel.findById(id).select('-pinHash').lean().exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async findByEmail(email: string) {
    return this.clientModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    this.assertValidObjectId(id);

    const payload = {
      ...updateClientDto,
      ...(updateClientDto.email
        ? { email: updateClientDto.email.toLowerCase() }
        : undefined),
    };

    try {
      const client = await this.clientModel
        .findByIdAndUpdate(id, payload, {
          returnDocument: 'after',
          runValidators: true,
        })
        .select('-pinHash')
        .lean()
        .exec();

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      return client;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        throw new ConflictException('Client email already exists');
      }

      throw error;
    }
  }

  async suspend(id: string) {
    return this.update(id, { status: ClientStatus.SUSPENDED });
  }

  private assertValidObjectId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid client id');
    }
  }

  private generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

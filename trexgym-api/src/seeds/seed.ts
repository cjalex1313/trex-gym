import { hash } from 'bcryptjs';
import { MongoClient } from 'mongodb';

type ClientStatus = 'active' | 'inactive' | 'suspended' | 'invited';

async function runSeed() {
  const mongoUri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/trexgym';
  const dbName = process.env.MONGO_DB_NAME ?? 'trexgym';

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@trexgym.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const admins = db.collection('admins');
    const clients = db.collection('clients');

    await admins.createIndex({ email: 1 }, { unique: true });
    await clients.createIndex({ email: 1 }, { unique: true });
    await clients.createIndex({ qrToken: 1 }, { unique: true, sparse: true });
    await clients.createIndex({ status: 1 });

    const existingAdmin = await admins.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const passwordHash = await hash(adminPassword, 10);
      await admins.insertOne({
        email: adminEmail,
        passwordHash,
        firstName: 'Default',
        lastName: 'Admin',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created default admin: ${adminEmail}`);
    } else {
      console.log(`Default admin already exists: ${adminEmail}`);
    }

    const sampleClients: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      status: ClientStatus;
    }> = [
      {
        firstName: 'Alex',
        lastName: 'Popescu',
        email: 'alex.popescu@sample.local',
        phone: '+40740000001',
        status: 'active',
      },
      {
        firstName: 'Maria',
        lastName: 'Ionescu',
        email: 'maria.ionescu@sample.local',
        phone: '+40740000002',
        status: 'inactive',
      },
      {
        firstName: 'Vlad',
        lastName: 'Georgescu',
        email: 'vlad.georgescu@sample.local',
        phone: '+40740000003',
        status: 'invited',
      },
    ];

    let insertedClients = 0;

    for (const sampleClient of sampleClients) {
      const exists = await clients.findOne({ email: sampleClient.email });
      if (!exists) {
        const pinHash = await hash('123456', 10);
        await clients.insertOne({
          ...sampleClient,
          pinHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        insertedClients += 1;
      }
    }

    console.log(`Inserted ${insertedClients} sample client(s)`);
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed', error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

void runSeed();

import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDatabase(dbName?: string): Promise<Db> {
  const clientPromise = getClientPromise();
  const mongoClient = await clientPromise;
  return mongoClient.db(dbName);
}

export async function checkConnection(): Promise<boolean> {
  try {
    const clientPromise = getClientPromise();
    const mongoClient = await clientPromise;
    await mongoClient.db().admin().ping();
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

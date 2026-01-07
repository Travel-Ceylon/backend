import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Stays from '../models/Stays.js';
import Room from '../models/Room.js';

const MONGO = process.env.MONGO_URL;

if (!MONGO) {
  console.error('MONGO_URL is not set. Set it in .env before running the script.');
  process.exit(1);
}

async function connect() {
  await mongoose.connect(MONGO);
}

async function migrate() {
  await connect();
  console.log('Connected to DB for migration');

  const stays = await Stays.find({}).lean();
  console.log(`Found ${stays.length} stays`);

  let updatedCount = 0;
  let createdRooms = 0;

  for (const stay of stays) {
    const originalRooms = Array.isArray(stay.rooms) ? stay.rooms : [];
    const newRoomIds = [];

    for (const r of originalRooms) {
      if (!r) continue;

      // Case: already an ObjectId or hex string
      if (typeof r === 'string' && mongoose.Types.ObjectId.isValid(r)) {
        newRoomIds.push(r);
        continue;
      }

      if (r instanceof mongoose.Types.ObjectId) {
        newRoomIds.push(String(r));
        continue;
      }

      // Case: wrapper like { room: ObjectId }
      if (r.room && (typeof r.room === 'string' || r.room instanceof mongoose.Types.ObjectId)) {
        const val = String(r.room);
        if (mongoose.Types.ObjectId.isValid(val)) {
          newRoomIds.push(val);
          continue;
        }
      }

      // Case: object with _id field that is an id
      if (r._id && mongoose.Types.ObjectId.isValid(String(r._id))) {
        // if this object also contains room fields, it's ambiguous; prefer to reference by _id
        newRoomIds.push(String(r._id));
        continue;
      }

      // Case: embedded room document (has roomType/price/etc) -> create Room doc
      const looksLikeRoom = r.roomType || r.price || r.maxGuest || r.bedType || r.facilites || r.images || r.image;
      if (looksLikeRoom) {
        const roomObj = {
          roomType: r.roomType || 'Room',
          price: Number(r.price) || 0,
          maxGuest: Number(r.maxGuest) || 1,
          bedType: r.bedType || '',
          facilites: r.facilites || { AC: false, WIFI: false },
          images: Array.isArray(r.images) ? r.images : (r.image ? [r.image] : [])
        };

        try {
          const created = await Room.create(roomObj);
          newRoomIds.push(String(created._id));
          createdRooms++;
        } catch (err) {
          console.error('Failed to create room for stay', stay._id, err.message);
        }

        continue;
      }

      // Unknown shape: skip
    }

    // Deduplicate and validate ids
    const uniqueIds = [...new Set(newRoomIds.map(String))].filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => mongoose.Types.ObjectId(id));

    // Compare with existing stay.rooms; if different, update
    const existingIds = Array.isArray(stay.rooms) ? stay.rooms.map(String) : [];
    const newIdsStr = uniqueIds.map(String);
    const needUpdate = existingIds.length !== newIdsStr.length || !existingIds.every(id => newIdsStr.includes(id));

    if (needUpdate) {
      await Stays.updateOne({ _id: stay._id }, { $set: { rooms: uniqueIds } });
      updatedCount++;
      console.log(`Updated stay ${stay._id}: ${uniqueIds.length} rooms`);
    }
  }

  console.log(`Migration complete. Stays processed: ${stays.length}, stays updated: ${updatedCount}, new Room docs created: ${createdRooms}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

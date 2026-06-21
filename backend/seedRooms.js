const mongoose = require('mongoose')
require('dotenv').config({ path: './.env' })
const RoomType = require('./src/models/roomTypeModel')
const Room = require('./src/models/roomModel')
const connectDB = require('./src/dbConnect')

const seedRooms = async () => {
  await connectDB()
  const roomTypes = await RoomType.find()
  for (const rt of roomTypes) {
    const existing = await Room.countDocuments({ roomType: rt._id })
    if (existing === 0) {
      console.log(`Seeding 5 rooms for ${rt.name}...`)
      for (let i = 1; i <= 5; i++) {
        await Room.create({
          roomNumber: `${rt.name.substring(0,3).toUpperCase()}-${100 + i}`,
          branch: rt.branch,
          roomType: rt._id,
          status: 'available',
          floor: 1
        })
      }
    }
  }
  console.log('Done seeding rooms!')
  process.exit(0)
}

seedRooms()

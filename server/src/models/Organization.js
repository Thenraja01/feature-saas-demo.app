import mongoose  from 'mongoose'

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);
const Organization =mongoose.model('Organization',organizationSchema)
export default Organization;
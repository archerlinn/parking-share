import mongoose, { Document, Schema } from "mongoose";

export interface IParkingLot extends Document {
  owner: Schema.Types.ObjectId;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  instructions: string;
  photoUrl?: string;
  isAvailable: boolean;
  pricePerHour: number;
  amenities: string[];
}

const ParkingLotSchema = new Schema<IParkingLot>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "United States",
      },
      coordinates: {
        latitude: {
          type: Number,
          required: [true, "Latitude is required"],
        },
        longitude: {
          type: Number,
          required: [true, "Longitude is required"],
        },
      },
    },
    instructions: {
      type: String,
      required: [true, "Instructions are required"],
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: 0,
    },
    amenities: [{
      type: String,
      trim: true,
    }],
  },
  { timestamps: true }
);

export default mongoose.models.ParkingLot || mongoose.model<IParkingLot>("ParkingLot", ParkingLotSchema); 
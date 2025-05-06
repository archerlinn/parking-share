import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  parkingLot: Schema.Types.ObjectId;
  renter: Schema.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: "pending" | "confirmed" | "declined" | "paid" | "completed" | "cancelled";
  totalPrice: number;
}

const BookingSchema = new Schema<IBooking>(
  {
    parkingLot: {
      type: Schema.Types.ObjectId,
      ref: "ParkingLot",
      required: [true, "Parking lot is required"],
    },
    renter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Renter is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "paid", "completed", "cancelled"],
      default: "pending",
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema); 
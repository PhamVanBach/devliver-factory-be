import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  apartment: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
    default: "United States",
  },
  phone: {
    type: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ["customer", "vendor", "admin"],
    default: "customer",
  },
  addresses: [addressSchema],
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
  },
  profileImage: {
    type: String,
  },
  favoriteProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  isVendor: {
    type: Boolean,
    default: false,
  },
  vendorInfo: {
    businessName: {
      type: String,
    },
    businessAddress: {
      type: String,
    },
    businessDescription: {
      type: String,
    },
    businessLogo: {
      type: String,
    },
    businessPhone: {
      type: String,
    },
    businessEmail: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
    sms: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to safely expose user data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  user.id = user._id;
  delete user._id;
  delete user.__v;
  return user;
};

export default mongoose.model("User", userSchema);

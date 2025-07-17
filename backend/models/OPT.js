const mongoose = require("mongoose");

const optSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    receipt: {
      url: String,
      status: {
        type: String,
        enum: ["unsubmitted", "pending", "rejected", "approval"],
        default: "unsubmitted",
      },
    },
    ead: {
      url: String,
      status: {
        type: String,
        enum: ["unsubmitted", "pending", "rejected", "approval"],
        default: "unsubmitted",
      },
    },
    i983: {
      url: String,
      status: {
        type: String,
        enum: ["unsubmitted", "pending", "rejected", "approval"],
        default: "unsubmitted",
      },
    },
    i20: {
      url: String,
      status: {
        type: String,
        enum: ["unsubmitted", "pending", "rejected", "approval"],
        default: "unsubmitted",
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OPT", optSchema);

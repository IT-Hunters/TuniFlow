const UserLogs = require("../model/UserLogs");

async function getDailyLogins(req, res) {
  try {
    const logs = await UserLogs.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$login_time" } },
          total_users: { $addToSet: "$user_id" },
        },
      },
      {
        $project: {
          _id: 0,
          login_date: "$_id",
          total_users: { $size: "$total_users" },
        },
      },
      { $sort: { login_date: 1 } },
    ]);

    return res.status(200).json({ logs });
  } catch (error) {
    console.error("Aggregation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function createLog(userId) {
  try {
    const newLog = new UserLogs({
      user_id: userId,
      login_time: new Date(),
    });

    await newLog.save();
    return { message: "Log created successfully" };
  } catch (error) {
    console.error("Error creating log:", error);
    throw new Error("Error creating log");
  }
}

module.exports = { getDailyLogins, createLog };
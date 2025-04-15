const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Objectif = require('../model/Objectif');
const Project = require('../model/Project');
const BusinessOwner = require('../model/BusinessOwner'); // Use the BusinessOwner model

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'assilhammami36@gmail.com',
    pass: process.env.EMAIL_PASS || 'yipe puvz yqxu rnja',
  },
});

const sendProgressNotification = async (objectif, userEmail, progress) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'assilhammami36@gmail.com',
    to: userEmail,
    subject: `Milestone Reached: ${objectif.name}`,
    text: `Dear User,\n\nThe objective "${objectif.name}" has reached ${progress}% progress! Keep up the good work.\n\nBest regards,\nYour App Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Sent ${progress}% progress notification for objective ${objectif._id} to ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send ${progress}% progress notification for objective ${objectif._id}:`, error);
  }
};

const sendDueSoonNotification = async (objectif, userEmail, daysUntilDue) => {
  const dueDate = new Date(objectif.datefin);
  const mailOptions = {
    from: process.env.EMAIL_USER || 'assilhammami36@gmail.com',
    to: userEmail,
    subject: `Reminder: ${objectif.name} Due Soon`,
    text: `Dear User,\n\nThe objective "${objectif.name}" is due on ${dueDate.toLocaleDateString()}. Only ${daysUntilDue} days left!\n\nPlease take action to complete it.\n\nBest regards,\nYour App Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Sent due-soon notification for objective ${objectif._id} to ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send due-soon notification for objective ${objectif._id}:`, error);
  }
};

// Extract the notification logic into a separate function for manual testing
const runNotificationJob = async () => {
  console.log('⏰ Running notification job...');

  try {
    // Fetch only InProgress objectives
    const objectives = await Objectif.find({ status: 'InProgress' }).populate({
      path: 'project',
      populate: { path: 'businessOwner', model: 'BusinessOwner' },
    });

    console.log(`🔍 Found ${objectives.length} InProgress objectives`);

    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

    for (const objective of objectives) {
      // Fetch the project owner (businessOwner) from the project
      const user = objective.project?.businessOwner;
      if (!user || !user.email) {
        console.log(`⚠️ No valid user/email found for objective ${objective._id}`);
        continue;
      }

      console.log(`📋 Processing objective ${objective._id} for user ${user.email}`);

      const dueDate = new Date(objective.datefin);
      const timeUntilDue = dueDate - new Date();
      const daysUntilDue = Math.ceil(timeUntilDue / (24 * 60 * 60 * 1000));

      // Check for progress milestones (50%, 70%, 90%)
      const milestones = [50, 70, 90];
      for (const milestone of milestones) {
        if (objective.progress >= milestone) {
          const notifiedField = `notified${milestone}Percent`;
          if (!objective[notifiedField]) {
            await sendProgressNotification(objective, user.email, milestone);
            await Objectif.updateOne(
              { _id: objective._id },
              { $set: { [notifiedField]: true } }
            );
          } else {
            console.log(`ℹ️ ${milestone}% notification already sent for objective ${objective._id}`);
          }
        }
      }

      // Check if due date is within 3 days
      if (timeUntilDue <= threeDaysInMs && timeUntilDue > 0 && !objective.notifiedDueSoon) {
        await sendDueSoonNotification(objective, user.email, daysUntilDue);
        await Objectif.updateOne(
          { _id: objective._id },
          { $set: { notifiedDueSoon: true } }
        );
      } else if (objective.notifiedDueSoon) {
        console.log(`ℹ️ Due-soon notification already sent for objective ${objective._id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in notification job:', error);
  }
};

const startNotificationJob = () => {
  console.log('🔔 Starting notification job setup...');

  // Schedule the job to run daily at midnight
  cron.schedule('* * * * *', async () => {
    await runNotificationJob();
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('🔔 Notification job scheduled to run daily at midnight');
};

// Expose the runNotificationJob function for manual testing
module.exports = { startNotificationJob, runNotificationJob };
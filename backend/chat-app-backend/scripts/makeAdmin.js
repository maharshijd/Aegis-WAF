// Run: node scripts/makeAdmin.js <email_or_username>
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const User = require('../models/User');

const target = process.argv[2];
if (!target) { console.error('Usage: node scripts/makeAdmin.js <email_or_username>'); process.exit(1); }

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ $or: [{ email: target }, { username: target }] });
    if (!user) { console.error(`User "${target}" not found`); process.exit(1); }
    user.isAdmin = true;
    await user.save();
    console.log(`✅ ${user.username} (${user.email}) is now an admin!`);
    process.exit(0);
})();

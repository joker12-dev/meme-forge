const { sequelize, User } = require('../models');

async function showUsers() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll();
    console.log('Users tablosu kayıtları:');
    users.forEach(u => {
      console.log({
        id: u.id,
        walletAddress: u.walletAddress,
        username: u.username,
        profileImage: u.profileImage,
        bio: u.bio,
        socialLinks: u.socialLinks,
        totalTokensCreated: u.totalTokensCreated,
        isVerified: u.isVerified,
        voteCount: u.voteCount,
        trustScore: u.trustScore,
        followers: u.followers,
        following: u.following,
        avgRating: u.avgRating,
        successfulLaunches: u.successfulLaunches,
        badges: u.badges,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      });
    });
    process.exit(0);
  } catch (err) {
    console.error('Hata:', err);
    process.exit(1);
  }
}

showUsers();

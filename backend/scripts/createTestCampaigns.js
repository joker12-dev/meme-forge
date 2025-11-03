require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Campaign = require('../models/Campaign');
const { sequelize } = require('../config/database');

const createTestCampaigns = async () => {
  console.log('🔄 Creating test campaigns...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Create test campaigns
    const campaigns = [
      {
        title: 'Special Token Launch Promotion',
        slug: 'special-token-launch-2025',
        description: 'Get ready for the biggest token launch of 2025! Early adopters get exclusive rewards.',
        category: 'Launch',
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=200&fit=crop',
        ctaLink: 'https://example.com/launch',
        ctaText: 'Join Launch',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
        featured: true,
        isActive: true,
        priority: 10,
        views: 1250,
        clicks: 89
      },
      {
        title: 'Community Airdrop Event - Win Big!',
        slug: 'community-airdrop-2025',
        description: 'Participate in our massive community airdrop. $50,000 worth of tokens to be distributed!',
        category: 'Airdrop',
        bannerUrl: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=800&h=200&fit=crop',
        ctaLink: 'https://example.com/airdrop',
        ctaText: 'Claim Airdrop',
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'active',
        featured: true,
        isActive: true,
        priority: 9,
        views: 890,
        clicks: 156
      },
      {
        title: 'Staking Rewards Program - Up to 150% APY',
        slug: 'staking-rewards-2025',
        description: 'Stake your tokens and earn passive income with our high-yield staking program.',
        category: 'Staking',
        bannerUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=200&fit=crop',
        ctaLink: 'https://example.com/staking',
        ctaText: 'Start Staking',
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'active',
        featured: false,
        isActive: true,
        priority: 8,
        views: 567,
        clicks: 45
      },
      {
        title: 'Trading Competition - $10K Prize Pool',
        slug: 'trading-competition-2025',
        description: 'Compete with other traders and win a share of $10,000 prize pool. Top 100 winners!',
        category: 'Competition',
        bannerUrl: 'https://images.unsplash.com/photo-1642790595397-7047dc98fa72?w=800&h=200&fit=crop',
        ctaLink: 'https://example.com/competition',
        ctaText: 'Enter Now',
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        status: 'active',
        featured: false,
        isActive: true,
        priority: 7,
        views: 423,
        clicks: 67
      },
      {
        title: 'NFT Collection Mint - Limited Edition',
        slug: 'nft-collection-mint-2025',
        description: 'Mint exclusive NFTs from our limited collection. Only 1000 pieces available!',
        category: 'NFT',
        bannerUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=200&fit=crop',
        ctaLink: 'https://example.com/nft-mint',
        ctaText: 'Mint NFT',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'active',
        featured: true,
        isActive: true,
        priority: 9,
        views: 2100,
        clicks: 234
      }
    ];

    // Delete existing test campaigns
    await Campaign.destroy({ where: {} });
    console.log('🗑️  Cleared existing campaigns\n');

    // Create new campaigns
    for (const campaign of campaigns) {
      await Campaign.create(campaign);
      console.log(`✅ Created: ${campaign.title}`);
    }

    console.log('\n✨ Test campaigns created successfully!');
    console.log(`📊 Total campaigns: ${campaigns.length}\n`);

    // Show created campaigns
    const created = await Campaign.findAll({
      order: [['priority', 'DESC']]
    });

    console.log('📋 Campaign List:');
    created.forEach(c => {
      console.log(`  - ${c.title} (${c.status}, featured: ${c.featured})`);
    });

  } catch (error) {
    console.error('❌ Error creating campaigns:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  createTestCampaigns();
}

module.exports = createTestCampaigns;

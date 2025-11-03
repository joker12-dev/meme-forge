const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Post Model
 * Launch postları ve kullanıcı updateleri için
 * Yorumlar, like'lar, geri sayım, live counter
 */
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Post içeriği
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true, // Cloudinary URL
    defaultValue: null
  },
  
  // Creator info
  creatorAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'walletAddress'
    }
  },
  
  // Post türü
  postType: {
    type: DataTypes.ENUM('launch', 'update', 'announcement'),
    defaultValue: 'announcement'
  },
  
  // Launch countdown (eğer launch post'u ise)
  launchTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // İlişkili token (eğer launch post'u ise)
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: true
    // Foreign key olmadan, manual olarak token address'ini sakla
  },
  
  // Engagement metrikleri
  likes: {
    type: DataTypes.JSONB,
    defaultValue: [], // Liked by user addresses: ['0x...', '0x...']
    comment: 'Array of wallet addresses who liked this post'
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shareCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Social Links
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegram: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discord: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Status
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Tags
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Edited info
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  editHistory: {
    type: DataTypes.JSONB,
    defaultValue: [] // [{editedAt, previousContent}, ...]
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Posts',
  timestamps: true
});

/**
 * Comment Model
 * Post'ların altındaki yorumlar
 */
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Comment içeriği
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  // İlişkiler
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  
  authorAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'walletAddress'
    }
  },
  
  // Reply to another comment (null if top-level)
  replyToCommentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  
  // Comment metrikleri
  likes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of wallet addresses who liked this comment'
  },
  
  // Edited info
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Deleted/hidden
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Comments',
  timestamps: true
});

/**
 * Post Like - Join table for many-to-many likes
 */
const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'walletAddress',
      onDelete: 'CASCADE'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'PostLikes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['postId', 'userAddress']
    }
  ]
});

/**
 * Comment Like
 */
const CommentLike = sequelize.define('CommentLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Comments',
      key: 'id',
      onDelete: 'CASCADE'
    }
  },
  userAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'walletAddress',
      onDelete: 'CASCADE'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CommentLikes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['commentId', 'userAddress']
    }
  ]
});

// Associations - Diğerleri index.js'de setup edilecek
Post.hasMany(Comment, {
  foreignKey: 'postId',
  as: 'comments',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post'
});

Comment.hasMany(Comment, {
  foreignKey: 'replyToCommentId',
  as: 'replies',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Comment, {
  foreignKey: 'replyToCommentId',
  as: 'parentComment'
});

Post.hasMany(PostLike, {
  foreignKey: 'postId',
  as: 'postLikes',
  onDelete: 'CASCADE'
});

PostLike.belongsTo(Post, {
  foreignKey: 'postId'
});

Comment.hasMany(CommentLike, {
  foreignKey: 'commentId',
  as: 'commentLikes',
  onDelete: 'CASCADE'
});

CommentLike.belongsTo(Comment, {
  foreignKey: 'commentId'
});

module.exports = {
  Post,
  Comment,
  PostLike,
  CommentLike
};

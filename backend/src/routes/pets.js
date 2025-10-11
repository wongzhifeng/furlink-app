const express = require('express');
const router = express.Router();
const { Pet, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/pets/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

/**
 * 宠物管理路由 - 基于道德经"道法自然"理念
 * 提供宠物档案的完整生命周期管理
 */

// 创建宠物档案 - 优化152: 增强输入验证和错误处理
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const {
      name,
      species,
      breed,
      age,
      weight,
      gender,
      color,
      specialMarks = [],
      personality = [],
      emergencyContacts = []
    } = req.body;

    // 输入验证
    if (!name || !species) {
      return res.status(400).json({
        success: false,
        message: '宠物姓名和种类不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
      return res.status(400).json({
        success: false,
        message: '宠物姓名长度必须在1-20字符之间',
        timestamp: new Date().toISOString()
      });
    }

    const validSpecies = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'];
    if (!validSpecies.includes(species)) {
      return res.status(400).json({
        success: false,
        message: '无效的宠物种类',
        timestamp: new Date().toISOString()
      });
    }

    if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 30)) {
      return res.status(400).json({
        success: false,
        message: '年龄必须在0-30之间',
        timestamp: new Date().toISOString()
      });
    }

    if (weight !== undefined && (typeof weight !== 'number' || weight < 0 || weight > 200)) {
      return res.status(400).json({
        success: false,
        message: '体重必须在0-200公斤之间',
        timestamp: new Date().toISOString()
      });
    }

    const validGenders = ['male', 'female', 'unknown'];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: '无效的性别选项',
        timestamp: new Date().toISOString()
      });
    }

    // 检查用户宠物数量限制
    const user = await User.findById(userId);
    const currentPetCount = await Pet.countDocuments({ ownerId: userId });
    if (currentPetCount >= user.serviceLimits.maxPets) {
      return res.status(400).json({
        success: false,
        message: `已达到宠物数量上限 (${user.serviceLimits.maxPets})`,
        timestamp: new Date().toISOString()
      });
    }

    // 创建宠物档案
    const pet = new Pet({
      name: name.trim(),
      species,
      breed: breed?.trim(),
      age,
      weight,
      gender,
      color: color?.trim(),
      specialMarks,
      personality,
      emergencyContacts,
      ownerId: userId,
      status: 'normal'
    });

    await pet.save();

    // 更新用户宠物统计
    await user.addPet();

    res.status(201).json({
      success: true,
      message: '宠物档案创建成功',
      data: {
        petId: pet._id,
        name: pet.name,
        species: pet.species,
        status: pet.status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('创建宠物档案失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建宠物档案失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户宠物列表 - 优化153: 增强输入验证和错误处理
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const { status, species } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 输入验证
    if (page < 1 || page > 1000) {
      return res.status(400).json({
        success: false,
        message: '页码必须在1-1000之间',
        timestamp: new Date().toISOString()
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: '每页数量必须在1-100之间',
        timestamp: new Date().toISOString()
      });
    }

    // 构建查询条件
    const query = { ownerId: userId };
    if (status) {
      const validStatuses = ['normal', 'lost', 'found', 'emergency', 'medical_attention'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态参数',
          timestamp: new Date().toISOString()
        });
      }
      query.status = status;
    }

    if (species) {
      const validSpecies = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'];
      if (!validSpecies.includes(species)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物种类参数',
          timestamp: new Date().toISOString()
        });
      }
      query.species = species;
    }

    // 查询宠物列表
    const skip = (page - 1) * limit;
    const pets = await Pet.find(query)
      .select('-healthRecords -responses')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Pet.countDocuments(query);

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取宠物列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取宠物列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取宠物详情 - 优化154: 增强输入验证和错误处理
router.get('/:petId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { petId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限访问此宠物档案',
        timestamp: new Date().toISOString()
      });
    }

    // 增加查看统计
    pet.viewCount += 1;
    await pet.save();

    res.json({
      success: true,
      data: pet,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取宠物详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取宠物详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新宠物档案 - 优化155: 增强输入验证和错误处理
router.put('/:petId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { petId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此宠物档案',
        timestamp: new Date().toISOString()
      });
    }

    const {
      name,
      breed,
      age,
      weight,
      gender,
      color,
      specialMarks,
      personality,
      emergencyContacts
    } = req.body;

    // 更新字段
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
        return res.status(400).json({
          success: false,
          message: '宠物姓名长度必须在1-20字符之间',
          timestamp: new Date().toISOString()
        });
      }
      pet.name = name.trim();
    }

    if (breed !== undefined) pet.breed = breed?.trim();
    if (age !== undefined) {
      if (typeof age !== 'number' || age < 0 || age > 30) {
        return res.status(400).json({
          success: false,
          message: '年龄必须在0-30之间',
          timestamp: new Date().toISOString()
        });
      }
      pet.age = age;
    }

    if (weight !== undefined) {
      if (typeof weight !== 'number' || weight < 0 || weight > 200) {
        return res.status(400).json({
          success: false,
          message: '体重必须在0-200公斤之间',
          timestamp: new Date().toISOString()
        });
      }
      pet.weight = weight;
    }

    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'unknown'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: '无效的性别选项',
          timestamp: new Date().toISOString()
        });
      }
      pet.gender = gender;
    }

    if (color !== undefined) pet.color = color?.trim();
    if (specialMarks !== undefined) pet.specialMarks = specialMarks;
    if (personality !== undefined) pet.personality = personality;
    if (emergencyContacts !== undefined) pet.emergencyContacts = emergencyContacts;

    await pet.save();

    res.json({
      success: true,
      message: '宠物档案更新成功',
      data: {
        petId: pet._id,
        name: pet.name,
        updatedAt: pet.updatedAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('更新宠物档案失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '更新宠物档案失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 上传宠物照片 - 优化156: 增强输入验证和错误处理
router.post('/:petId/photos', authMiddleware, upload.array('photos', 5), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { petId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的照片',
        timestamp: new Date().toISOString()
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限为此宠物上传照片',
        timestamp: new Date().toISOString()
      });
    }

    // 检查照片数量限制
    if (pet.photos.length + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: '宠物照片总数不能超过10张',
        timestamp: new Date().toISOString()
      });
    }

    // 添加照片到宠物档案
    const photoTypes = ['profile', 'side', 'front', 'back', 'detail'];
    req.files.forEach((file, index) => {
      pet.photos.push({
        url: `/uploads/pets/${file.filename}`,
        type: photoTypes[index % photoTypes.length],
        uploadedAt: new Date()
      });
    });

    await pet.save();

    res.json({
      success: true,
      message: `成功上传 ${req.files.length} 张照片`,
      data: {
        petId: pet._id,
        photosCount: pet.photos.length,
        uploadedPhotos: req.files.map(file => ({
          filename: file.filename,
          url: `/uploads/pets/${file.filename}`
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('上传宠物照片失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '上传宠物照片失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除宠物档案 - 优化157: 增强输入验证和错误处理
router.delete('/:petId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { petId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此宠物档案',
        timestamp: new Date().toISOString()
      });
    }

    // 检查是否有活跃的紧急警报
    const activeAlerts = await EmergencyAlert.countDocuments({
      petId: petId,
      status: 'active'
    });

    if (activeAlerts > 0) {
      return res.status(400).json({
        success: false,
        message: '该宠物有活跃的紧急警报，无法删除档案',
        timestamp: new Date().toISOString()
      });
    }

    // 删除宠物档案
    await Pet.findByIdAndDelete(petId);

    // 更新用户宠物统计
    const user = await User.findById(userId);
    await user.removePet();

    res.json({
      success: true,
      message: '宠物档案删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('删除宠物档案失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '删除宠物档案失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 标记宠物为走失 - 优化158: 增强输入验证和错误处理
router.post('/:petId/mark-lost', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { petId } = req.params;
    const { location } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限标记此宠物为走失',
        timestamp: new Date().toISOString()
      });
    }

    // 更新宠物状态和位置
    await pet.markAsLost();
    if (location) {
      await pet.updateLocation(
        location.latitude,
        location.longitude,
        location.address
      );
    }

    res.json({
      success: true,
      message: '宠物已标记为走失',
      data: {
        petId: pet._id,
        status: pet.status,
        lastKnownLocation: pet.lastKnownLocation
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('标记宠物走失失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '标记宠物走失失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 标记宠物为找到 - 优化159: 增强输入验证和错误处理
router.post('/:petId/mark-found', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { petId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: '宠物不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限标记此宠物为找到',
        timestamp: new Date().toISOString()
      });
    }

    // 更新宠物状态
    await pet.markAsFound();

    res.json({
      success: true,
      message: '宠物已标记为找到',
      data: {
        petId: pet._id,
        status: pet.status,
        updatedAt: pet.updatedAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('标记宠物找到失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '标记宠物找到失败',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

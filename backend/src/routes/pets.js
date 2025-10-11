// FurLink 宠物管理路由
// 简化版本，专注于基础API功能

import express from 'express';

const router = express.Router();

/**
 * 宠物管理API - 宠物紧急寻回平台
 * 提供基础的宠物管理功能
 */

// 获取宠物列表
router.get('/', async (req, res) => {
  try {
    // 模拟宠物数据
    const pets = [
      {
        _id: 'pet_1',
        name: '小金',
        species: 'dog',
        breed: '金毛',
        age: 3,
        color: '金色',
        photos: ['https://example.com/photo1.jpg'],
        microchipId: '123456789012345',
        ownerId: 'user_1',
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        _id: 'pet_2',
        name: '橘橘',
        species: 'cat',
        breed: '橘猫',
        age: 2,
        color: '橘色',
        photos: ['https://example.com/photo2.jpg'],
        microchipId: '123456789012346',
        ownerId: 'user_1',
        status: 'active',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({
      success: true,
      data: {
        pets,
        total: pets.length
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

// 获取宠物详情
router.get('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟宠物详情
    const pet = {
      _id: petId,
      name: '小金',
      species: 'dog',
      breed: '金毛',
      age: 3,
      color: '金色',
      weight: 25.5,
      photos: ['https://example.com/photo1.jpg'],
      microchipId: '123456789012345',
      ownerId: 'user_1',
      status: 'active',
      medicalRecords: [
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          type: 'vaccination',
          description: '年度疫苗注射'
        }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };

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

// 添加宠物
router.post('/', async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      age,
      color,
      weight,
      photos = [],
      microchipId
    } = req.body;

    // 基础验证
    if (!name || !species || !breed) {
      return res.status(400).json({
        success: false,
        message: '宠物名称、种类和品种不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟创建宠物
    const pet = {
      _id: `pet_${Date.now()}`,
      name,
      species,
      breed,
      age: age || null,
      color: color || null,
      weight: weight || null,
      photos,
      microchipId: microchipId || null,
      ownerId: 'user_1', // 模拟用户ID
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: '宠物添加成功',
      data: pet,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('添加宠物失败:', error);
    res.status(500).json({
      success: false,
      message: '添加宠物失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新宠物信息
router.put('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const updateData = req.body;

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟更新宠物
    const updatedPet = {
      _id: petId,
      ...updateData,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: '宠物信息更新成功',
      data: updatedPet,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('更新宠物信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新宠物信息失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除宠物
router.delete('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: '宠物ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: '宠物删除成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('删除宠物失败:', error);
    res.status(500).json({
      success: false,
      message: '删除宠物失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
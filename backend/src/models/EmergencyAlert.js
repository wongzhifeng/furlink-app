// FurLink 紧急警报模型
// 简化版本，专注于基础数据结构

export class EmergencyAlert {
  constructor(data) {
    this._id = data._id || `alert_${Date.now()}`;
    this.petId = data.petId;
    this.reporterId = data.reporterId;
    this.alertType = data.alertType;
    this.title = data.title;
    this.description = data.description;
    this.location = data.location;
    this.urgencyLevel = data.urgencyLevel || 'high';
    this.contactInfo = data.contactInfo;
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
    this.responses = data.responses || [];
  }

  // 静态方法用于查找
  static async findById(id) {
    // 模拟数据库查找
    return new EmergencyAlert({
      _id: id,
      petId: 'pet_1',
      alertType: 'lost_pet',
      title: '寻找走失金毛',
      description: '3岁金毛，戴红色项圈',
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市朝阳区'
      },
      urgencyLevel: 'high',
      contactInfo: {
        phone: '138****1234'
      }
    });
  }

  static async findByType(type) {
    // 模拟按类型查找
    return [
      new EmergencyAlert({
        _id: 'alert_1',
        petId: 'pet_1',
        alertType: type,
        title: '测试警报',
        description: '这是一个测试警报',
        location: {
          latitude: 39.9042,
          longitude: 116.4074
        }
      })
    ];
  }

  // 实例方法
  async save() {
    // 模拟保存到数据库
    console.log('Saving emergency alert:', this._id);
    return this;
  }

  toObject() {
    return {
      _id: this._id,
      petId: this.petId,
      reporterId: this.reporterId,
      alertType: this.alertType,
      title: this.title,
      description: this.description,
      location: this.location,
      urgencyLevel: this.urgencyLevel,
      contactInfo: this.contactInfo,
      status: this.status,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      responses: this.responses
    };
  }
}
const fs = require('fs');
const path = require('path');

class StorageService {
  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'uploads');
    this.imageDir = path.join(this.baseDir, 'images');
    this.fileDir = path.join(this.baseDir, 'files');

    this.ensureDirectories();
  }

  // 确保目录存在 - 优化53: 增强错误处理
  ensureDirectories() {
    try {
      [this.baseDir, this.imageDir, this.fileDir].forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    } catch (error) {
      console.error('Error creating directories:', error);
      throw new Error('Failed to create storage directories');
    }
  }

  // 生成文件名 - 优化54: 增强输入验证和安全性
  generateFilename(originalName) {
    try {
      // 优化54: 输入验证
      if (!originalName || typeof originalName !== 'string') {
        throw new Error('Invalid original filename');
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 8);
      const ext = path.extname(originalName) || '';
      
      // 优化54: 安全文件名生成
      const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      return `${timestamp}_${random}_${safeName}${ext}`;
    } catch (error) {
      console.error('Error generating filename:', error);
      return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  getImagePath(filename) {
    return path.join(this.imageDir, filename);
  }

  getFilePath(filename) {
    return path.join(this.fileDir, filename);
  }

  exists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (e) {
      return false;
    }
  }

  delete(filePath) {
    try {
      if (this.exists(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}

module.exports = new StorageService();








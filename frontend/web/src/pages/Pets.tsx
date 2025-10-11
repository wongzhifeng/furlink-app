import React, { memo, useMemo, useCallback } from 'react'
import { Heart, Plus } from 'lucide-react'

// 优化后的Pets组件
export const Pets: React.FC = memo(() => {
  const pets = useMemo(() => [
    {
      id: 1,
      name: '小白',
      breed: '金毛',
      age: 3,
      avatar: '🐕',
      status: 'normal',
      statusText: '正常'
    },
    {
      id: 2,
      name: '咪咪',
      breed: '英短',
      age: 2,
      avatar: '🐱',
      status: 'normal',
      statusText: '正常'
    }
  ], [])

  const handleAddPet = useCallback(() => {
    alert('添加宠物功能开发中')
  }, [])

  const handleViewDetail = useCallback((petId: number) => {
    alert(`查看宠物详情功能开发中 (ID: ${petId})`)
  }, [])

  const renderPetList = useMemo(() => (
    pets.length > 0 ? (
      <div className="grid gap-4">
        {pets.map((pet) => (
          <div key={pet.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetail(pet.id)}>
            <div className="flex items-center">
              <div className="text-4xl mr-4">{pet.avatar}</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">{pet.name}</h3>
                <p className="text-secondary mb-1">{pet.breed}</p>
                <p className="text-sm text-muted">{pet.age}岁</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                pet.status === 'normal' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {pet.statusText}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="card text-center">
        <span className="text-6xl mb-4 block">🐾</span>
        <h3 className="text-xl font-semibold mb-2">还没有添加宠物</h3>
        <p className="text-secondary mb-6">开始添加您的第一个宠物吧</p>
        <button onClick={handleAddPet} className="btn btn-primary">
          ➕ 添加第一个宠物
        </button>
      </div>
    )
  ), [pets, handleViewDetail, handleAddPet])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex-between">
          <div className="flex-center">
            <Heart className="icon text-pink-500" />
            <h1 className="text-2xl font-bold">🐾 我的宠物</h1>
          </div>
          <button onClick={handleAddPet} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            ➕ 添加宠物
          </button>
        </div>
      </div>

      {renderPetList}
    </div>
  )
})

Pets.displayName = 'Pets'

export default Pets
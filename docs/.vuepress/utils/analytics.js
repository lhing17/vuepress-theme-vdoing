import AV from 'leancloud-storage'
import debounce from 'lodash.debounce'

class AnalyticsService {
  constructor() {
    this.isInitialized = false
    this.cache = new Map()
    this.viewedPages = new Set()
    this.lastViewTime = new Map()
    this.updateQueue = []
    this.useLocalStorage = false
    
    // 防抖处理批量更新
    this.debouncedFlush = debounce(this.flushUpdates.bind(this), 2000)
  }

  // 初始化LeanCloud
  async init(config) {
    try {
      if (!config || !config.appId || !config.appKey) {
        throw new Error('LeanCloud config is required')
      }

      AV.init({
        appId: config.appId,
        appKey: config.appKey,
        serverURL: config.serverURL
      })

      // 测试连接
      await this.testConnection()
      this.isInitialized = true
      console.log('Analytics service initialized successfully')
    } catch (error) {
      console.warn('Analytics service init failed, fallback to localStorage:', error)
      this.useLocalStorage = true
    }
  }

  // 测试LeanCloud连接
  async testConnection() {
    const TestObject = AV.Object.extend('Test')
    const testObject = new TestObject()
    await testObject.save({ test: true })
    await testObject.destroy()
  }

  // 记录页面访问
  async recordPageView(url, title = '') {
    if (!this.shouldRecord(url)) {
      return
    }

    try {
      if (this.useLocalStorage) {
        this.recordPageViewLocal(url, title)
      } else {
        await this.recordPageViewRemote(url, title)
      }
      
      // 清除缓存以确保获取最新数据
      this.cache.delete(url)
      
      // 同时记录网站总访问量
      await this.recordSiteView()
    } catch (error) {
      console.error('Failed to record page view:', error)
      // 降级到本地存储
      this.recordPageViewLocal(url, title)
      // 清除缓存以确保获取最新数据
      this.cache.delete(url)
      // 同时记录网站总访问量（本地存储）
      const today = new Date().toISOString().split('T')[0]
      this.recordSiteViewLocal(today)
    }
  }

  // 检查是否应该记录访问
  shouldRecord(url) {
    const now = Date.now()
    const lastTime = this.lastViewTime.get(url) || 0
    
    // 同一页面5分钟内不重复统计
    if (now - lastTime < 5 * 60 * 1000) {
      return false
    }
    
    this.lastViewTime.set(url, now)
    return true
  }

  // 远程记录页面访问
  async recordPageViewRemote(url, title) {
    const PageView = AV.Object.extend('PageView')
    const query = new AV.Query('PageView')
    query.equalTo('url', url)
    
    try {
      const existingView = await query.first()
      
      if (existingView) {
        // 更新现有记录
        existingView.increment('views', 1)
        existingView.set('lastView', new Date())
        existingView.set('title', title)
        await existingView.save()
      } else {
        // 创建新记录
        const pageView = new PageView()
        pageView.set('url', url)
        pageView.set('title', title)
        pageView.set('views', 1)
        pageView.set('lastView', new Date())
        await pageView.save()
      }
    } catch (error) {
      // 如果是数据表不存在的错误，直接创建新记录
      if (error.code === 101 || error.message.includes("doesn't exists")) {
        console.log('PageView table does not exist, creating new record...')
        try {
          const pageView = new PageView()
          pageView.set('url', url)
          pageView.set('title', title)
          pageView.set('views', 1)
          pageView.set('lastView', new Date())
          await pageView.save()
          console.log('PageView record created successfully')
        } catch (createError) {
          console.error('Failed to create PageView record:', createError)
          throw createError
        }
      } else {
        console.error('Failed to record page view remotely:', error)
        throw error
      }
    }
  }

  // 本地记录页面访问
  recordPageViewLocal(url, title) {
    const views = JSON.parse(localStorage.getItem('page_views') || '{}')
    views[url] = {
      count: (views[url]?.count || 0) + 1,
      title: title,
      lastView: new Date().toISOString()
    }
    localStorage.setItem('page_views', JSON.stringify(views))
  }

  // 记录网站总访问
  async recordSiteView() {
    const today = new Date().toISOString().split('T')[0]
    
    if (this.useLocalStorage) {
      this.recordSiteViewLocal(today)
    } else {
      await this.recordSiteViewRemote(today)
    }
  }

  // 远程记录网站访问
  async recordSiteViewRemote(date) {
    const SiteView = AV.Object.extend('SiteView')
    const query = new AV.Query('SiteView')
    query.equalTo('date', date)
    
    try {
      const existingView = await query.first()
      
      if (existingView) {
        existingView.increment('todayViews', 1)
        existingView.increment('totalViews', 1)
        existingView.set('lastUpdate', new Date())
        await existingView.save()
      } else {
        // 获取历史总访问量
        const totalQuery = new AV.Query('SiteView')
        totalQuery.descending('createdAt')
        let previousTotal = 0
        
        try {
          const lastRecord = await totalQuery.first()
          previousTotal = lastRecord ? lastRecord.get('totalViews') : 0
        } catch (queryError) {
          // 如果查询历史记录失败，使用0作为初始值
          if (queryError.code === 101 || queryError.message.includes("doesn't exists")) {
            console.log('No previous SiteView records found, starting from 0')
            previousTotal = 0
          } else {
            throw queryError
          }
        }
        
        // 创建今日记录
        const siteView = new SiteView()
        siteView.set('date', date)
        siteView.set('todayViews', 1)
        siteView.set('totalViews', previousTotal + 1)
        siteView.set('lastUpdate', new Date())
        await siteView.save()
      }
    } catch (error) {
      // 如果是数据表不存在的错误，直接创建新记录
      if (error.code === 101 || error.message.includes("doesn't exists")) {
        console.log('SiteView table does not exist, creating new record...')
        try {
          const siteView = new SiteView()
          siteView.set('date', date)
          siteView.set('todayViews', 1)
          siteView.set('totalViews', 1)
          siteView.set('lastUpdate', new Date())
          await siteView.save()
          console.log('SiteView record created successfully')
        } catch (createError) {
          console.error('Failed to create SiteView record:', createError)
          throw createError
        }
      } else {
        console.error('Failed to record site view remotely:', error)
        throw error
      }
    }
  }

  // 本地记录网站访问
  recordSiteViewLocal(date) {
    const siteViews = JSON.parse(localStorage.getItem('site_views') || '{}')
    
    if (!siteViews[date]) {
      siteViews[date] = { todayViews: 0, totalViews: 0 }
    }
    
    siteViews[date].todayViews += 1
    siteViews[date].totalViews = Object.values(siteViews)
      .reduce((total, day) => total + day.todayViews, 0)
    
    localStorage.setItem('site_views', JSON.stringify(siteViews))
  }

  // 获取页面访问次数
  async getPageViews(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }
    
    let views = 0
    
    try {
      if (this.useLocalStorage) {
        views = this.getPageViewsLocal(url)
      } else {
        views = await this.getPageViewsRemote(url)
      }
    } catch (error) {
      console.error('Failed to get page views:', error)
      views = this.getPageViewsLocal(url)
    }
    
    this.cache.set(url, views)
    return views
  }

  // 远程获取页面访问次数
  async getPageViewsRemote(url) {
    const query = new AV.Query('PageView')
    query.equalTo('url', url)
    
    try {
      const pageView = await query.first()
      return pageView ? pageView.get('views') : 0
    } catch (error) {
      // 如果是数据表不存在的错误，返回0
      if (error.code === 101 || error.message.includes("doesn't exists")) {
        console.log('PageView table does not exist, returning 0 views')
        return 0
      }
      throw error
    }
  }

  // 本地获取页面访问次数
  getPageViewsLocal(url) {
    const views = JSON.parse(localStorage.getItem('page_views') || '{}')
    return views[url]?.count || 0
  }

  // 获取网站总访问次数
  async getSiteViews() {
    try {
      if (this.useLocalStorage) {
        return this.getSiteViewsLocal()
      } else {
        return await this.getSiteViewsRemote()
      }
    } catch (error) {
      console.error('Failed to get site views:', error)
      return this.getSiteViewsLocal()
    }
  }

  // 远程获取网站总访问次数
  async getSiteViewsRemote() {
    const query = new AV.Query('SiteView')
    query.descending('createdAt')
    
    try {
      const latestRecord = await query.first()
      return latestRecord ? latestRecord.get('totalViews') : 0
    } catch (error) {
      // 如果是数据表不存在的错误，尝试创建初始记录
      if (error.code === 101 || error.message.includes("doesn't exists")) {
        console.log('SiteView table does not exist, creating initial record...')
        return await this.createInitialSiteViewRecord()
      }
      throw error
    }
  }

  // 创建初始网站访问记录
  async createInitialSiteViewRecord() {
    try {
      const SiteView = AV.Object.extend('SiteView')
      const today = new Date().toISOString().split('T')[0]
      
      const siteView = new SiteView()
      siteView.set('date', today)
      siteView.set('todayViews', 0)
      siteView.set('totalViews', 0)
      siteView.set('lastUpdate', new Date())
      
      await siteView.save()
      console.log('Initial SiteView record created successfully')
      return 0
    } catch (error) {
      console.error('Failed to create initial SiteView record:', error)
      throw error
    }
  }

  // 本地获取网站总访问次数
  getSiteViewsLocal() {
    const siteViews = JSON.parse(localStorage.getItem('site_views') || '{}')
    return Object.values(siteViews)
      .reduce((total, day) => total + day.todayViews, 0)
  }

  // 批量更新处理
  flushUpdates() {
    // 实现批量更新逻辑
    this.updateQueue = []
  }

  // 格式化数字显示
  formatNumber(num) {
    // if (num >= 10000) {
    //   return (num / 10000).toFixed(1) + 'w'
    // } else if (num >= 1000) {
    //   return (num / 1000).toFixed(1) + 'k'
    // }
    return num.toLocaleString()
  }
}

// 导出单例
export default new AnalyticsService()
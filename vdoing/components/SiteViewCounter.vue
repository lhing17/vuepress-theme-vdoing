<template>
  <div class="site-view-counter" v-if="showViews">
    <div class="stats-item">
      <i class="iconfont icon-eye"></i>
      <span class="label">总访问量</span>
      <span class="count">{{ formattedViews }}</span>
    </div>
  </div>
</template>

<script>
import AnalyticsService from '../util/analytics'

export default {
  name: 'SiteViewCounter',
  data() {
    return {
      totalViews: 0,
      showViews: true
    }
  },
  computed: {
    formattedViews() {
      return AnalyticsService.formatNumber(this.totalViews)
    }
  },
  async mounted() {
    // 检查是否启用统计
    const analyticsConfig = this.$themeConfig.analytics
    if (!analyticsConfig || !analyticsConfig.enable || !analyticsConfig.showSiteViews) {
      this.showViews = false
      return
    }

    await this.loadSiteViews()
  },
  methods: {
    async loadSiteViews() {
      try {
        // 初始化服务
        if (!AnalyticsService.isInitialized) {
          const config = this.$themeConfig.analytics.leancloud
          await AnalyticsService.init(config)
        }

        this.totalViews = await AnalyticsService.getSiteViews()
      } catch (error) {
        console.error('SiteViewCounter error:', error)
        this.showViews = false
      }
    }
  }
}
</script>

<style lang="stylus">
.site-view-counter
  .stats-item
    display flex
    align-items center
    padding 8px 0
    color var(--text-color)
    
    .iconfont
      margin-right 8px
      color var(--accent-color)
      font-size 1.1em
      
    .label
      flex 1
      font-weight 600
      font-size 1em
      
    .count
      font-weight 600
      color var(--accent-color)
      font-size 1em
      margin-right 8px

@media (max-width: $MQMobile)
  .site-view-counter
    .stats-item
      padding 6px 0
      
      .iconfont
        font-size 1em
        
      .label
        font-size 0.85em
        
      .count
        font-size 0.9em
</style>
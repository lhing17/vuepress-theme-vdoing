<template>
  <span title="阅读量" class="iconfont icon-shuben count">{{ formattedViews }} 人阅读</span>
</template>

<script>
import AnalyticsService from '../util/analytics'

export default {
  name: 'PageViewCounter',
  props: {
    url: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      views: 0,
      showViews: true
    }
  },
  computed: {
    formattedViews() {
      return AnalyticsService.formatNumber(this.views)
    }
  },
  async mounted() {
    // 检查是否启用统计
    const analyticsConfig = this.$themeConfig.analytics
    if (!analyticsConfig || !analyticsConfig.enable || !analyticsConfig.showPageViews) {
      this.showViews = false
      return
    }

    await this.initAndRecord()
  },
  methods: {
    async initAndRecord() {
      try {
        // 初始化服务
        if (!AnalyticsService.isInitialized) {
          const config = this.$themeConfig.analytics.leancloud
          await AnalyticsService.init(config)
        }

        // 先获取当前访问次数
        this.views = await AnalyticsService.getPageViews(this.url)
        
        // 记录访问
        await AnalyticsService.recordPageView(this.url, this.title)
        this.views = this.views + 1
      } catch (error) {
        console.error('PageViewCounter error:', error)
        this.showViews = false
      }
    }
  }
}
</script>

<style lang="stylus">
.page-view-counter
  display inline-flex
  align-items center
  color var(--text-color-sub)
  font-size 0.85em
  margin-left 10px
  
  .iconfont
    margin-right 3px
    font-size 1em
    
  .count
    font-weight 500
    color var(--accent-color)

@media (max-width: $MQMobile)
  .page-view-counter
    font-size 0.8em
    margin-left 8px
</style>
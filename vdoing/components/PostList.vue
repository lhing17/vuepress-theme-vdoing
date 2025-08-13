<template>
  <div class="post-list" ref="postList">
    <transition-group tag="div" name="post">
      <div
        class="post card-box"
        :class="item.frontmatter.sticky && 'iconfont icon-zhiding'"
        v-for="item in sortPosts"
        :key="item.key"
      >
        <div class="title-wrapper">
          <h2 style="text-align: center; font-weight: bolder;">
            <router-link :to="item.path">
              {{ item.title }}
              <span class="title-tag" v-if="item.frontmatter.titleTag">{{
                item.frontmatter.titleTag
              }}</span>
            </router-link>
          </h2>
          <div class="article-info">
            <a
              title="作者"
              class="iconfont icon-touxiang"
              target="_blank"
              v-if="item.author && item.author.href"
              :href="item.author.href"
              >{{ item.author.name ? item.author.name : item.author }}</a
            >
            <span
              title="作者"
              class="iconfont icon-touxiang"
              v-else-if="item.author"
              >{{ item.author.name ? item.author.name : item.author }}</span
            >

            <span
              title="创建时间"
              class="iconfont icon-riqi"
              v-if="item.frontmatter.date"
              >{{ item.frontmatter.date.split(' ')[0] }}</span
            >
            <span
              title="分类"
              class="iconfont icon-wenjian"
              v-if="
                $themeConfig.category !== false && item.frontmatter.categories
              "
            >
              <router-link
                :to="`/categories/?category=${encodeURIComponent(c)}`"
                v-for="(c, index) in item.frontmatter.categories"
                :key="index"
                >{{ c }}</router-link
              >
            </span>
            <span title="阅读量" class="iconfont icon-shuben count">{{ getFormattedViews(item.path) }} 人阅读</span>
          </div>
        </div>
        <div class="excerpt-wrapper" v-if="item.excerpt || getPreviewContent(item)">
          <div class="excerpt" v-if="item.excerpt" v-html="item.excerpt"></div>
          <div class="excerpt" v-else>
            {{ getPreviewContent(item) }}
            <span class="ellipsis">...</span>
          </div>
          <router-link
            :to="item.path"
            class="readmore iconfont icon-jiantou-you"
            >阅读全文</router-link
          >
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>

import AnalyticsService from '../util/analytics'

export default {
  props: {
    category: {
      type: String,
      default: ''
    },
    tag: {
      type: String,
      default: ''
    },
    currentPage: {
      type: Number,
      default: 1
    },
    perPage: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      sortPosts: [],
      postListOffsetTop: 0,
      pageViews: {}, // 存储每篇文章的访问量
      analyticsInitialized: false
    }
  },
  created() {
    this.setPosts()
  },
  async mounted() {
    // this.postListOffsetTop = this.getElementToPageTop(this.$refs.postList) - 240
    await this.initAnalytics()
    await this.loadPageViews()
  },
  watch: {
    async currentPage() {
      if (this.$route.query.p != this.currentPage) { // 此判断防止添加相同的路由信息（如浏览器回退时触发的）
        this.$router.push({
          query: {
            ...this.$route.query,
            p: this.currentPage
          }
        })
      }
      // setTimeout(() => {
      //   window.scrollTo({ top: this.postListOffsetTop }) // behavior: 'smooth'
      // },0)
      this.setPosts()
      await this.loadPageViews()
    },
    async category() {
      this.setPosts()
      await this.loadPageViews()
    },
    async tag() {
      this.setPosts()
      await this.loadPageViews()
    }
  },
  methods: {
    async initAnalytics() {
      try {
        // 检查是否启用统计
        const analyticsConfig = this.$themeConfig.analytics
        if (!analyticsConfig || !analyticsConfig.enable) {
          return
        }

        // 初始化服务
        if (!AnalyticsService.isInitialized) {
          const config = analyticsConfig.leancloud
          await AnalyticsService.init(config)
        }
        this.analyticsInitialized = true
      } catch (error) {
        console.error('Analytics initialization failed:', error)
      }
    },
    async loadPageViews() {
      if (!this.analyticsInitialized) {
        return
      }

      try {
        // 为当前页面的所有文章获取访问量
        for (const item of this.sortPosts) {
          if (item.path) {
            const views = await AnalyticsService.getPageViews(item.path)
            this.$set(this.pageViews, item.path, views)
          }
        }
      } catch (error) {
        console.error('Failed to load page views:', error)
      }
    },
    getFormattedViews(path) {
      const views = this.pageViews[path] || 0
      return AnalyticsService.formatNumber(views)
    },
    setPosts() {
      const currentPage = this.currentPage
      const perPage = this.perPage

      let posts = []
      if (this.category) {
        posts = this.$groupPosts.categories[this.category]
      } else if (this.tag) {
        posts = this.$groupPosts.tags[this.tag]
      } else {
        posts = this.$sortPosts
      }

      this.sortPosts = posts.slice((currentPage - 1) * perPage, currentPage * perPage)
    },
    getPreviewContent(item) {
      if (item.excerpt) {
        return item.excerpt;
      }
      
      // 优先使用frontmatter中的description
      if (item.frontmatter && item.frontmatter.description) {
        const desc = item.frontmatter.description;
        return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
      }
      
      // 如果有summary字段
      if (item.frontmatter && item.frontmatter.summary) {
        const summary = item.frontmatter.summary;
        return summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
      }
      
      // 生成基于标题和日期的预览
      const title = item.title || '无标题';
      const date = item.frontmatter && item.frontmatter.date ? 
        new Date(item.frontmatter.date).toLocaleDateString('zh-CN') : '';
      const categories = item.frontmatter && item.frontmatter.categories ? 
        item.frontmatter.categories.join(', ') : '';
      const tags = item.frontmatter && item.frontmatter.tags ? 
        item.frontmatter.tags.slice(0, 3).join(', ') : '';
      
      let preview = `${title}`;
      if (date) preview += ` · ${date}`;
      if (categories) preview += ` · 分类：${categories}`;
      if (tags) preview += ` · 标签：${tags}`;
      
      return preview.length > 150 ? preview.substring(0, 150) + '...' : preview;
    },
    // getElementToPageTop(el) {
    //   if(el && el.parentElement) {
    //     return this.getElementToPageTop(el.parentElement) + el.offsetTop
    //   }
    //   return el.offsetTop
    // }
  }
}
</script>

<style lang='stylus'>
.post-list
  margin-bottom 3rem
  .post
    position relative
    padding 1rem 1.5rem
    margin-bottom 0.8rem
    transition all 0.3s
    // border-bottom 1px solid var(--borderColor)
    &:last-child
      border-bottom none
    &.post-leave-active
      display none
    &.post-enter
      opacity 0
      transform translateX(-20px)
    &::before
      position absolute
      top -1px
      right 0
      font-size 2.5rem
      color $activeColor
      opacity 0.85
    .title-wrapper
      a
        color var(--textColor)
        &:hover
          color $accentColor
      h2
        margin 0.5rem 0
        font-size 1.4rem
        border none
        .title-tag
          height 1.2rem
          line-height 1.2rem
          border 1px solid $activeColor
          color $activeColor
          font-size 0.8rem
          padding 0 0.35rem
          border-radius 0.2rem
          margin-left 0rem
          transform translate(0, -0.15rem)
          display inline-block
        a
          display block
          @media (max-width $MQMobile)
            font-weight 400
      .article-info
        > a, > span
          opacity 0.7
          font-size 0.8rem
          margin-right 1rem
          cursor pointer
          &::before
            margin-right 0.3rem
          a
            margin 0
            &:not(:first-child)
              &::before
                content '/'
        .tags a:not(:first-child)::before
          content '、'
    .excerpt-wrapper
      border-top 1px solid var(--borderColor)
      margin 0.5rem 0
      overflow hidden
      .excerpt
        margin-bottom 0.3rem
        font-size 0.92rem
        h1, h2, h3
          display none
        img
          max-height 280px
          max-width 100% !important
          margin 0 auto
        .ellipsis
          color var(--textColor)
          opacity 0.6
      .readmore
        float right
        margin-right 1rem
        line-height 1rem
        &::before
          float right
          font-size 0.8rem
          margin 0.1rem 0 0 0.2rem
.theme-style-line
  .post-list
    border 1px solid var(--borderColor)
    border-bottom none
    border-radius 5px
    overflow hidden
    .post
      margin-bottom 0
      border none
      border-bottom 1px solid var(--borderColor)
      border-radius 0
</style>

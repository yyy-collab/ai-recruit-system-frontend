<template>
  <div class="role-select">
    <header class="navbar">
      <div class="logo">
        <div class="icon-bg">
          <el-icon :size="20" color="#FFFFFF"><DataAnalysis /></el-icon>
        </div>
        <span>AI-Hire.</span>
      </div>
    </header>

    <div class="hero">
      <div class="hero-left">
        <h1>让AI成为你的<br>最佳招聘猎头</h1>
        <p>利用大规模语言模型与深度语义分析，打破传统关键词筛选的局限。在海量简历中，精准定位那个“对的人”。</p>
        <div class="btn-group">
          <el-button class="role-btn seeker-btn" @click="goToLogin('seeker')">
            <el-icon><User /></el-icon> 我是求职者
          </el-button>
          <el-button class="role-btn hr-btn" @click="goToLogin('hr')">
            <el-icon><Briefcase /></el-icon> 我是HR招聘官
          </el-button>
        </div>
      </div>
      <div class="hero-right">
        <!-- 高质量真实图片 (Unsplash 免费科技招聘主题) - 可替换为您的图片 -->
        <img  :src="heroImage" alt="AI招聘插图" class="hero-image">
      </div>
    </div>

    <div class="core-cards">
      <div class="card">
        <el-icon><Document /></el-icon>
        <h3>AI简历优化</h3>
        <p>不再盲目投递。系统会根据目标岗位，为求职者提供即时的关键词增强建议和技能对标报告。</p>
      </div>
      <div class="card">
        <el-icon><TrendCharts /></el-icon>
        <h3>多维匹配算法</h3>
        <p>跳出文字表面，AI深入分析项目复杂度、行业相关性及技能潜力，生成0-100的精准匹配分。</p>
      </div>
      <div class="card">
        <el-icon><Connection /></el-icon>
        <h3>自动化流程管理</h3>
        <p>一键批量处理简历，AI自动生成候选人摘要，大大缩短HR阅读原始简历的时间。</p>
      </div>
      <div class="card">
        <el-icon><Lock /></el-icon>
        <h3>可信隐私保护</h3>
        <p>基于2026最新的联邦学习架构，确保简历数据在分析过程中保持绝对私密，符合全球数据标准。</p>
      </div>
    </div>

    <div class="copyright">2026 AI-HIRE INC. 保留所有权 | DESIGNED FOR THE FUTURE OF RECRUITMENT</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { User, Briefcase, Document, TrendCharts, Connection, Lock, DataAnalysis } from '@element-plus/icons-vue';
import heroImage from '@/assets/hero.png';

const router = useRouter();
const goToLogin = (role) => {
  router.push({ path: '/login', query: { role } });
};
</script>

<style scoped>
.role-select {
  background: #ffffff;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
}
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
}
.logo span { color: #1E1E2F; }
.icon-bg {
  width: 36px;
  height: 36px;
  background-color: #4F46E5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 60px auto 80px;
  padding: 0 48px;
  gap: 60px;
}
.hero-left {
  flex: 1;
  text-align: left;
}
.hero-left h1 {
  font-size: 52px;
  line-height: 1.2;
  color: #1E1E2F;
  margin-bottom: 24px;
  font-weight: 700;
}
.hero-left p {
  font-size: 18px;
  color: #4A4A6A;
  line-height: 1.5;
  margin-bottom: 32px;
}
.btn-group {
  display: flex;
  gap: 20px;
}
.role-btn {
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 40px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.seeker-btn {
  background-color: #4F46E5;
  border: 1.5px solid #4F46E5;
  color: white;
}
.seeker-btn:hover {
  background-color: #4338ca;
  border-color: #4338ca;
  color: white;
}
.hr-btn {
  background-color: white;
  border: 1.5px solid #4F46E5;
  color: #4F46E5;
}
.hr-btn:hover {
  background-color: #f5f3ff;
  border-color: #4F46E5;
  color: #4F46E5;
}
.hero-right {
  flex: 0.8;
  display: flex;
  justify-content: center;
}
.hero-image {
  width: 600px;
  max-width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);
  object-fit: cover;
}
.core-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  max-width: 1400px;
  margin: 80px auto;
  padding: 0 48px;
}
.card {
  background: #F9F7FF;
  border-radius: 20px;
  padding: 28px 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
  text-align: center;
  border: 1px solid #f0eef7;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 30px -12px rgba(79,70,229,0.15);
  background: #ffffff;
}
.card .el-icon {
  font-size: 40px;
  color: #4F46E5;
  margin-bottom: 20px;
}
.card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1E1E2F;
  margin-bottom: 12px;
}
.card p {
  font-size: 14px;
  color: #4A4A6A;
  line-height: 1.5;
}
.copyright {
  text-align: center;
  padding: 24px 48px 48px;
  color: #6B6B8A;
  font-size: 12px;
  border-top: 1px solid #f0eef7;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
@media (max-width: 1000px) {
  .hero {
    flex-direction: column;
    text-align: center;
  }
  .hero-left {
    text-align: center;
  }
  .btn-group {
    justify-content: center;
  }
  .hero-right {
    margin-top: 30px;
  }
  .core-cards {
    grid-template-columns: repeat(2,1fr);
  }
}
@media (max-width: 700px) {
  .core-cards {
    grid-template-columns: 1fr;
  }
  .navbar {
    justify-content: center;
  }
  .hero-left h1 {
    font-size: 36px;
  }
  .btn-group {
    flex-direction: column;
    align-items: center;
  }
  .role-btn {
    width: 80%;
    justify-content: center;
  }
  .hero-image {
    width: 90%;
  }
}
</style>
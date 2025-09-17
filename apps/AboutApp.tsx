import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// --- 数据配置 ---
// 1. 将静态数据与组件分离，便于维护
const appData = {
  nameKey: 'about_name_value',
  version: '1.0',
  authorKey: 'about_author_value',
  // 2. 使用数组管理功能列表，方便扩展
  features: [
    'about_feature_1',
    'about_feature_2',
    'about_feature_3',
    // 可以轻松添加新功能
    // 'about_feature_4', 
  ],
};

// --- 子组件定义 ---

/**
 * 一个可复用的信息展示组件
 * @param label - 信息的标签 (e.g., "版本")
 * @param value - 信息的值 (e.g., "1.0")
 */
const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <p>
    <strong>{label}:</strong> {value}
  </p>
);

/**
 * 渲染功能列表的组件
 * @param items - 功能点的翻译键数组
 * @param t - 翻译函数
 */
const FeatureList: React.FC<{ items: string[]; t: (key: string) => string }> = ({ items, t }) => (
  <div>
    <h4 className="text-lg font-semibold">{t('about_features')}:</h4>
    <ul className="list-disc list-inside pl-4">
      {/* 3. 动态渲染列表，而不是硬编码 */}
      {items.map((featureKey) => (
        <li key={featureKey}>{t(featureKey)}</li>
      ))}
    </ul>
  </div>
);


// --- 主组件 ---

/**
 * "关于应用"页面主组件
 * 职责：组合数据和子组件来构建最终视图
 */
const AboutApp: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-outline space-y-6"> {/* 增加了垂直间距 */}
      <h2 className="text-2xl font-bold">{t('about_title')}</h2>
      
      {/* 应用基本信息 - 使用了 InfoItem 子组件 */}
      <div>
        <InfoItem label={t('about_name')} value={t(appData.nameKey)} />
        <InfoItem label={t('about_version')} value={appData.version} />
        <InfoItem label={t('about_author')} value={t(appData.authorKey)} />
        {/* 4. 密码已因安全原因被移除 */}
      </div>
      
      {/* 功能列表 - 使用了 FeatureList 子组件 */}
      <FeatureList items={appData.features} t={t} />

      {/* 提示信息 */}
      <p className="mt-4 p-3 bg-yellow-500/10 border-l-4 border-yellow-500/80 rounded-r-lg">
        <strong>{t('about_note')}:</strong> {t('about_note_value')}
      </p>
    </div>
  );
};

export default AboutApp;
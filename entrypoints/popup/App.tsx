import { useState, useEffect } from 'react';
import './App.css';
import { t, getShortcutDisplay } from '../../lib/i18n';
import { getAnalyticsSummary } from '../../lib/analytics';
import { shouldShowReviewPrompt, markAsReviewed, dismissReviewPrompt, openReviewPage } from '../../lib/review';

function App() {
  const shortcut = getShortcutDisplay();
  const [stats, setStats] = useState<{ totalUses: number; daysSinceInstall: number } | null>(null);
  const [showReviewBanner, setShowReviewBanner] = useState(false);

  useEffect(() => {
    getAnalyticsSummary().then(async (summary) => {
      setStats({
        totalUses: summary.totalUses,
        daysSinceInstall: summary.daysSinceInstall,
      });

      // レビュープロンプトを表示すべきか判定
      const shouldShow = await shouldShowReviewPrompt(summary.totalUses);
      setShowReviewBanner(shouldShow);
    });
  }, []);

  const handleReview = async () => {
    await markAsReviewed();
    setShowReviewBanner(false);
    openReviewPage();
  };

  const handleDismiss = async () => {
    await dismissReviewPrompt();
    setShowReviewBanner(false);
  };

  return (
    <div style={{ width: '320px', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>⚡ {t('popupTitle')}</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {t('popupSubtitle')}
        </p>
      </div>

      <div
        style={{
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>
          <strong>Press {shortcut}</strong> {t('popupOpenKord')}
        </p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          {t('popupDescription')}
        </p>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#333' }}>{t('popupFeaturesTitle')}</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
          <li>⚡ {t('popupFeature1')}</li>
          <li>🔖 {t('popupFeature2')}</li>
          <li>🕐 {t('popupFeature3')}</li>
          <li>⌨️ {t('popupFeature4')}</li>
          <li>🎯 {t('popupFeature5')}</li>
        </ul>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>
          {t('popupFooter')}
        </p>
      </div>

      {showReviewBanner && (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '12px',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>
            {t('reviewBannerTitle')}
          </h3>
          <p style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.9 }}>
            {t('reviewBannerMessage')}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={handleReview}
              style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {t('reviewBannerReview')}
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {t('reviewBannerDismiss')}
            </button>
          </div>
        </div>
      )}

      {stats && stats.totalUses > 0 && (
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '12px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
          }}
        >
          <p style={{ marginBottom: '4px' }}>
            {t('statsUsed')}: <strong style={{ color: '#333' }}>{stats.totalUses}</strong> {t('statsTimes')}
          </p>
          <p>
            {t('statsDays')}: <strong style={{ color: '#333' }}>{stats.daysSinceInstall}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;

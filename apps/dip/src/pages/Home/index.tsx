import { Flex } from 'antd'
import clsx from 'clsx'
import { memo, useMemo } from 'react'
import intl from 'react-intl-universal'
import AiPromptInput from '@/components/DipChatKit/components/AiPromptInput'
import { useLanguageStore } from '@/stores/languageStore'
import { useUserInfoStore } from '@/stores/userInfoStore'
import styles from './index.module.less'

const Home = () => {
  const { userInfo } = useUserInfoStore()
  const language = useLanguageStore((state) => state.language)

  const mentionOptions = useMemo(
    () => [
      {
        id: 'plan-collaboration',
        label: intl.get('home.mention.planCollaborationAssistant'),
      },
      {
        id: 'finance-audit',
        label: intl.get('home.mention.financeAuditAssistant'),
      },
      {
        id: 'customer-service',
        label: intl.get('home.mention.customerServiceAudit'),
      },
      {
        id: 'data-compliance',
        label: intl.get('home.mention.dataComplianceAuditor'),
      },
      {
        id: 'logistics-dispatch',
        label: intl.get('home.mention.logisticsDispatchAssistant'),
      },
      {
        id: 'vendor-risk',
        label: intl.get('home.mention.vendorRiskMonitor'),
      },
    ],
    [language],
  )

  const handleSubmit = (data: any) => {
    console.log('data', data)
    // navigate('/studio/home')
  }

  const displayName = userInfo?.vision_name || intl.get('home.defaultName')

  return (
    <div className={clsx('Home', styles.homePage)}>
      <div className={styles.homeContent}>
        <Flex vertical align="center" className={styles.hero}>
          {/* 遵守 AGENTS.md 规范：不使用 Typography.Title，改为原生 h1 标签 */}
          <h1 className={styles.title}>{intl.get('home.title', { name: displayName })}</h1>
          {/* 遵守 AGENTS.md 规范：不使用 Typography.Text，改为原生 div 标签 */}
          <div className={styles.subtitle}>{intl.get('home.subtitle')}</div>
        </Flex>

        <div className={styles.promptSection}>
          <AiPromptInput
            mentionOptions={mentionOptions}
            placeholder={intl.get('home.inputPlaceholder')}
            onSubmit={handleSubmit}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(Home)

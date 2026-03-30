import { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Tabs, Badge as AntBadge } from 'antd';
import { t } from '@/i18n';
import { setSearchParam, getSearchParam } from '@/utils/url-search-params';
import { fetchTodoCount } from '@/api/doc-audit-rest';
import { useAppStore } from '@/store';
import { AuditListMode, type AuditTabKey } from './types';
import AuditList from './AuditList';
import styles from './index.module.less';

const AuditIndex: React.FC = () => {
  const context = useAppStore(s => s.context);
  const [activeTab, setActiveTab] = useState<AuditTabKey>('todo');
  const [todoCount, setTodoCount] = useState(0);

  useEffect(() => {
    const target = getSearchParam('target') as AuditTabKey;
    if (target && ['todo', 'done', 'apply'].includes(target)) {
      setActiveTab(target);
    }
    loadTodoCount();
  }, []);

  const loadTodoCount = async () => {
    try {
      const res = await fetchTodoCount();
      setTodoCount(res.count);
    } catch (error) {
      console.error('Failed to fetch todo count:', error);
    }
  };

  const handleTabChange = (key: string) => {
    const tabKey = key as AuditTabKey;
    setActiveTab(tabKey);
    setSearchParam('target', tabKey);
  };

  const items = [
    {
      key: 'todo',
      label: (
        <span>
          {t('common.tabs.tasks')}
          <AntBadge dot={todoCount > 0} offset={[4, 0]} />
        </span>
      ),
      children: activeTab === 'todo' && <AuditList mode={AuditListMode.Todo} onRefresh={loadTodoCount} />,
    },
    {
      key: 'done',
      label: t('common.tabs.historys'),
      children: activeTab === 'done' && <AuditList mode={AuditListMode.Done} />,
    },
    {
      key: 'apply',
      label: t('common.tabs.applys'),
      children: activeTab === 'apply' && <AuditList mode={AuditListMode.Apply} />,
    },
  ];

  return (
    <div
      className={classNames(
        styles['audit-container'],
        context?.systemType === 'adp' ? styles['audit-container-absolute'] : ''
      )}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} className={styles['audit-tabs']} />
    </div>
  );
};

export default AuditIndex;
